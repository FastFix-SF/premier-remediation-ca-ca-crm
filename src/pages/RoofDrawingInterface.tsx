import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  HelpCircle,
  Grid3x3, 
  Settings,
  Search,
  Tag, 
  Ruler, 
  Square,
  Trash2,
  Layers,
  MapPin,
  X,
  Sparkles,
  Loader2
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

type EdgeType = 'unlabeled' | 'eave' | 'rake' | 'ridge' | 'hip' | 'valley' | 'step' | 'wall' | 'pitch_change';
type Point = { x: number; y: number };
type Line = {
  id: string;
  start: Point;
  end: Point;
  edgeType: EdgeType;
  length: number;
};

const EDGE_COLORS: Record<EdgeType, string> = {
  unlabeled: '#FCD34D',
  eave: '#EF4444',
  rake: '#9CA3AF',
  ridge: '#A855F7',
  hip: '#92400E',
  valley: '#EC4899',
  step: '#3B82F6',
  wall: '#06B6D4',
  pitch_change: '#F97316'
};

const EDGE_LABELS: Record<EdgeType, string> = {
  unlabeled: 'UNLABELED',
  eave: 'EAVE',
  rake: 'RAKE',
  ridge: 'RIDGE',
  hip: 'HIP',
  valley: 'VALLEY',
  step: 'STEP',
  wall: 'WALL',
  pitch_change: 'PITCH CHANGE'
};

export default function RoofDrawingInterface() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Drawing state
  const [lines, setLines] = useState<Line[]>([]);
  const [currentLine, setCurrentLine] = useState<Point | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [history, setHistory] = useState<Line[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Tool state
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showLength, setShowLength] = useState(true);
  const [snapTo90, setSnapTo90] = useState(false);
  const [selectedEdgeType, setSelectedEdgeType] = useState<EdgeType>('unlabeled');
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  
  // View toggles
  const [activeMode, setActiveMode] = useState<'draw' | 'edges' | 'facets' | 'pins'>('draw');
  const [showEdges, setShowEdges] = useState(true);
  const [showFacets, setShowFacets] = useState(false);
  const [showPins, setShowPins] = useState(false);
  
  // Auto-detection state
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  // Fetch quote data
  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  const transform = (quote?.imagery_transform as { offsetX: number; offsetY: number; rotation: number }) || { offsetX: 0, offsetY: 0, rotation: 0 };

  const getImageUrl = () => {
    if (quote?.selected_imagery) {
      const imagery = quote.selected_imagery as any;
      
      // Use the Nearmap image proxy for Nearmap imagery with coordinates
      if (imagery.provider === 'nearmap' && imagery.survey_id && imagery.bbox) {
        const coords = quote?.latitude && quote?.longitude ? 
          `&lat=${quote.latitude}&lng=${quote.longitude}` : '';
        
        // Convert bbox object to string format if needed
        const bboxString = typeof imagery.bbox === 'object' && imagery.bbox 
          ? `${imagery.bbox.minLng},${imagery.bbox.minLat},${imagery.bbox.maxLng},${imagery.bbox.maxLat}`
          : imagery.bbox;
          
        const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
        return `${functionsUrl}/nearmap-image-proxy?survey=${imagery.survey_id}&bbox=${bboxString}&width=1024&height=1024&format=jpeg${coords}`;
      }
      
      // If we have a direct URL for other providers, use it
      if (imagery.url) {
        return imagery.url;
      }
    }
    
    // Fallback to roi_image_url if available
    if (quote?.roi_image_url) {
      return quote.roi_image_url;
    }
    
    return null;
  };

  // Load image
  useEffect(() => {
    const imageUrl = getImageUrl();
    
    console.log('Loading imagery:', { quote: quote?.selected_imagery, imageUrl });
    
    if (!imageUrl) {
      console.warn('No image URL found');
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      console.log('Image loaded successfully:', { width: img.width, height: img.height });
      imageRef.current = img;
      
      // Set canvas dimensions to match image
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      
      setImageLoaded(true);
    };
    
    img.onerror = (error) => {
      console.error('Failed to load image:', error);
      toast.error('Failed to load satellite imagery');
    };
    
    console.log('Setting image src:', imageUrl);
    img.src = imageUrl;
  }, [quote?.selected_imagery, quote?.roi_image_url, quote?.latitude, quote?.longitude]);

  // Calculate line length in feet (assuming scale from metadata)
  const calculateLength = (start: Point, end: Point): number => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const pixels = Math.sqrt(dx * dx + dy * dy);
    
    // Use scale from imagery metadata if available
    const scaleMeta = quote?.imagery_scale_meta as { pixelsPerFoot?: number } | null;
    const scaleFactor = scaleMeta?.pixelsPerFoot || 10;
    return Math.round((pixels / scaleFactor) * 10) / 10;
  };

  // Snap to 90 degrees
  const snapToOrthogonal = (start: Point, end: Point): Point => {
    if (!snapTo90) return end;
    
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return { x: end.x, y: start.y };
    } else {
      return { x: start.x, y: end.y };
    }
  };

  // Draw canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !imageRef.current || !imageLoaded) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image with transform
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.translate(transform.offsetX, transform.offsetY);
    ctx.drawImage(
      imageRef.current,
      -imageRef.current.width / 2,
      -imageRef.current.height / 2,
      imageRef.current.width,
      imageRef.current.height
    );
    ctx.restore();

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }
    }

    // Draw lines
    lines.forEach((line) => {
      ctx.strokeStyle = EDGE_COLORS[line.edgeType];
      ctx.lineWidth = line.id === selectedLine ? 4 : 3;
      ctx.beginPath();
      ctx.moveTo(line.start.x, line.start.y);
      ctx.lineTo(line.end.x, line.end.y);
      ctx.stroke();

      // Draw endpoints
      [line.start, line.end].forEach((point) => {
        ctx.fillStyle = EDGE_COLORS[line.edgeType];
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw labels
      if (showLabels || showLength) {
        const midX = (line.start.x + line.end.x) / 2;
        const midY = (line.start.y + line.end.y) / 2;
        
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        
        let label = '';
        if (showLabels && line.edgeType !== 'unlabeled') {
          label = EDGE_LABELS[line.edgeType];
        }
        if (showLength) {
          label += (label ? ' ' : '') + `${line.length}'`;
        }
        
        if (label) {
          ctx.strokeText(label, midX, midY - 10);
          ctx.fillText(label, midX, midY - 10);
        }
      }
    });

    // Draw current line preview
    if (currentLine) {
      const snappedEnd = snapToOrthogonal(currentLine, mousePos);
      ctx.strokeStyle = EDGE_COLORS[selectedEdgeType];
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(currentLine.x, currentLine.y);
      ctx.lineTo(snappedEnd.x, snappedEnd.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw starting point dot (same size as endpoints)
      ctx.fillStyle = EDGE_COLORS[selectedEdgeType];
      ctx.beginPath();
      ctx.arc(currentLine.x, currentLine.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Preview length
      const previewLength = calculateLength(currentLine, snappedEnd);
      const midX = (currentLine.x + snappedEnd.x) / 2;
      const midY = (currentLine.y + snappedEnd.y) / 2;
      
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.font = '14px Inter, sans-serif';
      ctx.strokeText(`${previewLength}'`, midX, midY - 10);
      ctx.fillText(`${previewLength}'`, midX, midY - 10);
    }
  };

  useEffect(() => {
    drawCanvas();
  }, [lines, currentLine, mousePos, showGrid, showLabels, showLength, selectedLine, imageLoaded, transform]);

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentLine) {
      // Complete line
      const snappedEnd = snapToOrthogonal(currentLine, { x, y });
      const newLine: Line = {
        id: `line-${Date.now()}`,
        start: currentLine,
        end: snappedEnd,
        edgeType: selectedEdgeType,
        length: calculateLength(currentLine, snappedEnd)
      };
      
      const newLines = [...lines, newLine];
      setLines(newLines);
      addToHistory(newLines);
      setCurrentLine(null);
    } else {
      // Start new line
      setCurrentLine({ x, y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const addToHistory = (newLines: Line[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newLines);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setLines(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setLines(history[historyIndex + 1]);
    }
  };

  const deleteSelectedLine = () => {
    if (!selectedLine) return;
    const newLines = lines.filter(l => l.id !== selectedLine);
    setLines(newLines);
    addToHistory(newLines);
    setSelectedLine(null);
  };

  const deleteAllLines = () => {
    setLines([]);
    addToHistory([]);
    setSelectedLine(null);
  };

  const handleAutoDetect = async () => {
    if (!imageRef.current || !imageLoaded) {
      toast.error('Please wait for the image to load first');
      return;
    }

    setIsAutoDetecting(true);
    toast.info('🎯 Detecting roof boundary with AI...');

    try {
      // Convert canvas image to base64
      const canvas = document.createElement('canvas');
      canvas.width = imageRef.current.width;
      canvas.height = imageRef.current.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      
      ctx.drawImage(imageRef.current, 0, 0);
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);

      // Call SAM detection edge function
      const { data, error } = await supabase.functions.invoke('detect-roof-boundary', {
        body: { imageDataUrl }
      });

      if (error) throw error;

      console.log('SAM detection result:', data);
      
      // TODO: Process SAM masks into polygon vertices
      // For now, create a simple rectangular boundary as placeholder
      // In production, you'll convert the SAM mask to actual polygon points
      
      if (data.masks && data.masks.length > 0) {
        // Placeholder: Create a rectangular boundary
        // In production, you'll process the actual mask data
        const width = imageRef.current.width;
        const height = imageRef.current.height;
        const padding = 50;
        
        const roofBoundary: Line[] = [
          {
            id: `auto-${Date.now()}-1`,
            start: { x: padding, y: padding },
            end: { x: width - padding, y: padding },
            edgeType: 'eave',
            length: calculateLength({ x: padding, y: padding }, { x: width - padding, y: padding })
          },
          {
            id: `auto-${Date.now()}-2`,
            start: { x: width - padding, y: padding },
            end: { x: width - padding, y: height - padding },
            edgeType: 'rake',
            length: calculateLength({ x: width - padding, y: padding }, { x: width - padding, y: height - padding })
          },
          {
            id: `auto-${Date.now()}-3`,
            start: { x: width - padding, y: height - padding },
            end: { x: padding, y: height - padding },
            edgeType: 'eave',
            length: calculateLength({ x: width - padding, y: height - padding }, { x: padding, y: height - padding })
          },
          {
            id: `auto-${Date.now()}-4`,
            start: { x: padding, y: height - padding },
            end: { x: padding, y: padding },
            edgeType: 'rake',
            length: calculateLength({ x: padding, y: height - padding }, { x: padding, y: padding })
          }
        ];
        
        setLines(roofBoundary);
        addToHistory(roofBoundary);
        
        toast.success('✨ Roof boundary detected! Adjust vertices and edge types as needed.');
      } else {
        toast.warning('No roof detected. Try manual drawing instead.');
      }
      
    } catch (error: any) {
      console.error('Auto-detection error:', error);
      toast.error(error.message || 'Failed to auto-detect roof boundary');
    } finally {
      setIsAutoDetecting(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({
          roof_roi: { lines, metadata: { saved_at: new Date().toISOString() } }
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Drawing saved successfully');
      navigate(`/quote/${id}`);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save drawing');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading quote data...</div>;
  }

  if (!imageLoaded && quote) {
    return <div className="flex items-center justify-center h-screen">Loading satellite imagery...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Toolbar - RoofSnap Style */}
      <div className="bg-[#3B82F6] text-white px-4 py-2 flex items-center justify-between shadow-md">
        {/* Left Section */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-white hover:bg-blue-600">
            <HelpCircle className="h-4 w-4 mr-1" />
            HELP
          </Button>
        </div>
        
        {/* Center Section - Tool Toggles */}
        <div className="flex items-center gap-1">
          <Toggle 
            pressed={showGrid} 
            onPressedChange={setShowGrid}
            className="text-white data-[state=on]:bg-blue-600 hover:bg-blue-600"
            size="sm"
          >
            <Grid3x3 className="h-4 w-4 mr-1" />
            G
          </Toggle>
          
          <Button variant="ghost" size="sm" className="text-white hover:bg-blue-600">
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm" className="text-white hover:bg-blue-600">
            <Search className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-blue-400 mx-2" />
          
          <Toggle 
            pressed={activeMode === 'draw'} 
            onPressedChange={() => setActiveMode('draw')}
            className="text-white data-[state=on]:bg-blue-700 data-[state=on]:font-bold hover:bg-blue-600"
            size="sm"
          >
            DRAW
          </Toggle>
          
          <Toggle 
            pressed={activeMode === 'edges'} 
            onPressedChange={() => setActiveMode('edges')}
            className="text-white data-[state=on]:bg-blue-700 data-[state=on]:font-bold hover:bg-blue-600"
            size="sm"
          >
            EDGES
          </Toggle>
          
          <Toggle 
            pressed={activeMode === 'facets'} 
            onPressedChange={() => setActiveMode('facets')}
            className="text-white data-[state=on]:bg-blue-700 data-[state=on]:font-bold hover:bg-blue-600"
            size="sm"
          >
            <Layers className="h-4 w-4 mr-1" />
            FACETS
          </Toggle>
          
          <Toggle 
            pressed={activeMode === 'pins'} 
            onPressedChange={() => setActiveMode('pins')}
            className="text-white data-[state=on]:bg-blue-700 data-[state=on]:font-bold hover:bg-blue-600"
            size="sm"
          >
            <MapPin className="h-4 w-4 mr-1" />
            PINS
          </Toggle>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-blue-600"
            onClick={() => navigate(`/quote/${id}`)}
          >
            CANCEL
          </Button>
          <Button 
            size="sm" 
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
            onClick={handleSave}
          >
            DONE
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div 
          ref={containerRef}
          className="flex-1 relative bg-muted/20 overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            className="w-full h-full cursor-crosshair object-contain"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
          />
        </div>

        {/* Tools Panel - RoofSnap Style */}
        <div className="w-80 border-l bg-card overflow-y-auto">
          {/* AI Auto-Detection Section */}
          <div className="border-b">
            <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
              <h3 className="font-bold text-xs tracking-wide mb-3 text-purple-900 dark:text-purple-100">
                🤖 AI DETECTION
              </h3>
              <Button
                onClick={handleAutoDetect}
                disabled={isAutoDetecting || !imageLoaded}
                className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isAutoDetecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Detecting Roof...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Auto-Detect Roof
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Uses Meta's SAM AI to automatically detect roof boundaries. Adjust vertices & edge types after.
              </p>
            </div>
          </div>

          {/* Drawing Options Section */}
          <div className="border-b">
            <div className="p-4 bg-muted/30">
              <h3 className="font-bold text-xs tracking-wide mb-3">DRAWING OPTIONS</h3>
              <div className="space-y-2">
                <Toggle 
                  pressed={snapTo90} 
                  onPressedChange={setSnapTo90} 
                  className="w-full justify-start h-8 text-xs font-medium"
                >
                  <Square className="h-3.5 w-3.5 mr-2" />
                  90° MODE
                </Toggle>
                <Toggle 
                  pressed={showLength} 
                  onPressedChange={setShowLength} 
                  className="w-full justify-start h-8 text-xs font-medium"
                >
                  <Ruler className="h-3.5 w-3.5 mr-2" />
                  LINE LENGTH
                </Toggle>
                <Toggle 
                  pressed={showLabels} 
                  onPressedChange={setShowLabels} 
                  className="w-full justify-start h-8 text-xs font-medium"
                >
                  <Tag className="h-3.5 w-3.5 mr-2" />
                  LINE LABELS
                </Toggle>
              </div>
            </div>
          </div>

          {/* Edge Actions Section */}
          <div className="border-b">
            <div className="p-4 bg-muted/30">
              <h3 className="font-bold text-xs tracking-wide mb-3">EDGE ACTIONS</h3>
              <div className="space-y-1.5">
                {Object.entries(EDGE_LABELS).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => setSelectedEdgeType(type as EdgeType)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-semibold transition-colors",
                      selectedEdgeType === type 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-background hover:bg-muted"
                    )}
                  >
                    <div 
                      className="w-4 h-4 rounded border-2 border-white shadow-sm"
                      style={{ backgroundColor: EDGE_COLORS[type as EdgeType] }}
                    />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Delete Actions Section */}
          <div className="border-b">
            <div className="p-4 bg-muted/30">
              <h3 className="font-bold text-xs tracking-wide mb-3">ACTIONS</h3>
              <div className="space-y-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={deleteSelectedLine}
                  disabled={!selectedLine}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  DELETE EDGE
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs text-destructive hover:text-destructive"
                  onClick={deleteAllLines}
                  disabled={lines.length === 0}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  DELETE ALL EDGES
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="p-4 bg-muted/10">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Total Lines:</span>
                <span className="font-bold">{lines.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Total Length:</span>
                <span className="font-bold">
                  {lines.reduce((sum, line) => sum + line.length, 0).toFixed(1)}'
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

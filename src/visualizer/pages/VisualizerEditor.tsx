import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ColorPalette } from '../components/ColorPalette';
import { DrawingToolbar, type DrawingTool } from '../components/DrawingToolbar';
import { EnhancedDrawingCanvas } from '../components/EnhancedDrawingCanvas';
import { useVisualizerProject } from '../hooks/useVisualizerProject';
import { useRecolorEngine } from '../hooks/useRecolorEngine';
import { supabase } from '@/integrations/supabase/client';
import { McElroyColors, getColorName } from '../utils/mcElroyColors';
import { ArrowLeft, Download, Share2, PaintBucket, Undo2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const VisualizerEditor = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { project, images, masks, loading, loadProject, saveMask, saveVariant } = useVisualizerProject(projectId);
  const { recolorImage, resetToOriginal, setFabricCanvas } = useRecolorEngine();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasInstanceRef = useRef<any>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [originalImageLoaded, setOriginalImageLoaded] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('#4A3A2A'); // Default Dark Bronze
  const [maskPath, setMaskPath] = useState<string>('');
  const [isDrawingMask, setIsDrawingMask] = useState(false);
  const [recolorMethod, setRecolorMethod] = useState<'hsl' | 'dual-blend'>('hsl');
  
  // Enhanced drawing state
  const [activeTool, setActiveTool] = useState<DrawingTool>('select');
  const [brushSize, setBrushSize] = useState(10);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');

  // Load project data
  useEffect(() => {
    if (projectId && !project) {
      loadProject(projectId);
    }
  }, [projectId, project, loadProject]);

  // Load and display the original image
  useEffect(() => {
    if (images.length > 0 && !originalImageLoaded) {
      const image = images[0];
      loadImageFromStorage(image.original_url);
    }
  }, [images, originalImageLoaded]);

  const loadImageFromStorage = async (path: string) => {
    try {
      const { data } = await supabase.storage
        .from('visualizer')
        .createSignedUrl(path, 3600);

      if (data?.signedUrl) {
        setCurrentImageUrl(data.signedUrl);
        
        if (imageRef.current && canvasRef.current) {
          imageRef.current.onload = () => {
            if (canvasRef.current && imageRef.current) {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d')!;
              
              // Set canvas size to match image
              canvas.width = imageRef.current.naturalWidth;
              canvas.height = imageRef.current.naturalHeight;
              
              // Draw the image
              ctx.drawImage(imageRef.current, 0, 0);
              setOriginalImageLoaded(true);
              
              // Load existing mask if available
              if (masks.length > 0) {
                setMaskPath(masks[0].svg_path);
              }
            }
          };
          imageRef.current.src = data.signedUrl;
        }
      }
    } catch (error) {
      console.error('Error loading image:', error);
      toast({
        title: "Error",
        description: "Failed to load image from storage.",
        variant: "destructive"
      });
    }
  };

  const handleColorSelect = async (colorKey: string, hex: string) => {
    setSelectedColor(hex);
    
    if (fabricCanvasInstanceRef.current && maskPath) {
      console.log('Applying color change:', hex, 'to mask:', maskPath);
      // Apply recoloring to the Fabric.js canvas
      recolorImage(fabricCanvasInstanceRef.current, originalImage, maskPath, {
        method: recolorMethod,
        targetColor: hex
      });
      
      // Save variant if we have an image
      if (images.length > 0) {
        try {
          await saveVariant(images[0].id, colorKey, hex);
        } catch (error) {
          console.error('Error saving variant:', error);
        }
      }
    }
  };

  // Enhanced drawing handlers
  const handleMaskComplete = async (svgPath: string) => {
    if (images.length > 0) {
      try {
        await saveMask(images[0].id, svgPath);
        setMaskPath(svgPath);
        setIsDrawingMask(false);
        
        toast({
          title: "Mask saved",
          description: "Your roof outline has been saved successfully."
        });
      } catch (error) {
        console.error('Error saving mask:', error);
        toast({
          title: "Error",
          description: "Failed to save roof outline.",
          variant: "destructive"
        });
      }
    }
  };

  const handleHistoryChange = (canUndoState: boolean, canRedoState: boolean) => {
    setCanUndo(canUndoState);
    setCanRedo(canRedoState);
  };

  const handleStartDrawing = () => {
    setIsDrawingMask(true);
    setActiveTool('polygon');
  };

  const handleCancelDrawing = () => {
    setIsDrawingMask(false);
    setActiveTool('select');
  };

  const handleCompleteDrawing = () => {
    // Generate the mask path from the current drawing
    if (canvasRef.current) {
      // We need to trigger mask generation from the canvas
      // For now, let's set a ref callback to trigger this
      setIsDrawingMask(false);
    }
  };

  // Drawing tool handlers  
  const handleUndo = () => {
    // This will be handled by the drawing canvas component
  };

  const handleRedo = () => {
    // This will be handled by the drawing canvas component
  };

  const handleClear = () => {
    // This will be handled by the drawing canvas component
  };

  const resetImage = () => {
    if (fabricCanvasInstanceRef.current) {
      resetToOriginal(fabricCanvasInstanceRef.current);
    }
  };

  const downloadImage = () => {
    if (fabricCanvasInstanceRef.current) {
      try {
        // Use toDataURL to get the complete canvas including background and drawings
        const dataURL = fabricCanvasInstanceRef.current.toDataURL({
          format: 'jpeg',
          quality: 0.9,
          multiplier: 1
        });
        
        const link = document.createElement('a');
        link.download = `roof-visualization-${getColorName(selectedColor)}.jpg`;
        link.href = dataURL;
        link.click();
        
        toast({
          title: "Download started",
          description: "Your roof visualization is downloading..."
        });
      } catch (error) {
        console.error('Download error:', error);
        toast({
          title: "Download failed", 
          description: "Unable to download the image. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const shareProject = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Project link has been copied to clipboard."
      });
    } catch {
      toast({
        title: "Share project",
        description: url,
      });
    }
  };

  // Handle canvas ready from EnhancedDrawingCanvas
  const handleCanvasReady = (canvas: HTMLCanvasElement) => {
    // Keep the HTML canvas ref for fallback
    canvasRef.current = canvas;
  };

  // Handle fabric canvas ready 
  const handleFabricCanvasReady = (fabricCanvas: any, originalImg?: HTMLImageElement | null) => {
    fabricCanvasInstanceRef.current = fabricCanvas;
    setFabricCanvas(fabricCanvas);
    if (originalImg) {
      setOriginalImage(originalImg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your project...</p>
        </div>
      </div>
    );
  }

  if (!project || images.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project not found</h2>
          <Button onClick={() => navigate('/visualizer')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Visualizer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/visualizer')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{project.title || 'Untitled Project'}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {getColorName(selectedColor)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Method: {recolorMethod === 'hsl' ? 'HSL Colorize' : 'Dual Blend'}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={resetImage}
                disabled={!originalImageLoaded}
              >
                <Undo2 className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={shareProject}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button 
                size="sm"
                onClick={downloadImage}
                disabled={!originalImageLoaded}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Drawing Tools */}
          <div className="lg:col-span-1">
            <DrawingToolbar
              activeTool={activeTool}
              onToolChange={setActiveTool}
              brushSize={brushSize}
              onBrushSizeChange={setBrushSize}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClear={handleClear}
              onComplete={handleCompleteDrawing}
              onCancel={handleCancelDrawing}
              canUndo={canUndo}
              canRedo={canRedo}
              isDrawingMode={isDrawingMask}
              className="sticky top-6"
            />
          </div>

          {/* Canvas Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="relative">
                  {originalImageLoaded && currentImageUrl ? (
                     <EnhancedDrawingCanvas
                      imageUrl={currentImageUrl}
                      activeTool={activeTool}
                      brushSize={brushSize}
                      onMaskComplete={handleMaskComplete}
                      onHistoryChange={handleHistoryChange}
                      onCanvasReady={handleCanvasReady}
                      onFabricCanvasReady={handleFabricCanvasReady}
                      className="w-full"
                    />
                  ) : (
                    <canvas
                      ref={canvasRef}
                      className="max-w-full h-auto border rounded-lg shadow-sm"
                      style={{ maxHeight: '70vh' }}
                    />
                  )}
                  
                  {/* Fallback drawing prompt */}
                  {!maskPath && !isDrawingMask && !originalImageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          Create a roof outline to start coloring
                        </p>
                        <Button 
                          size="sm" 
                          onClick={handleStartDrawing}
                        >
                          <PaintBucket className="h-4 w-4 mr-2" />
                          Draw Roof Outline
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Color Palette */}
          <div className="lg:col-span-1">
            <ColorPalette
              selectedColor={selectedColor}
              onColorSelect={handleColorSelect}
            />
          </div>
        </div>
      </div>

      {/* Hidden image element for loading */}
      <img 
        ref={imageRef} 
        style={{ display: 'none' }} 
        alt="Original"
      />
    </div>
  );
};
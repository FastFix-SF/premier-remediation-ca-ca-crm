import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MousePointer, 
  Plus, 
  Square, 
  Trash2, 
  Move3D, 
  RotateCcw,
  Grid3X3,
  Zap,
  Paintbrush
} from 'lucide-react';
import { Canvas as FabricCanvas, Circle, Line, Polygon, Text } from 'fabric';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DrawTabProps {
  projectId: string;
}

type DrawingTool = 'select' | 'draw' | 'polygon' | 'delete' | 'brush';

export function DrawTab({ projectId }: DrawTabProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>('select');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [snapToPoints, setSnapToPoints] = useState(true);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing facets for this project
  const { data: facets } = useQuery({
    queryKey: ['facets', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facets')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      return data;
    }
  });

  // Save facet mutation
  const saveFacetMutation = useMutation({
    mutationFn: async (polygonData: any) => {
      const { error } = await supabase
        .from('facets')
        .insert({
          project_id: projectId,
          polygon_geojson: {
            type: 'Polygon',
            coordinates: [polygonData.points]
          },
          pitch: 4.0,
          story: 1,
          flags: {}
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facets', projectId] });
      queryClient.invalidateQueries({ queryKey: ['quantities', projectId] });
      toast({
        title: "Facet Saved",
        description: "Polygon has been saved as a roof facet.",
      });
    }
  });

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f8fafc',
      selection: activeTool === 'select'
    });

    // Add grid
    if (snapToGrid) {
      addGrid(canvas);
    }

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [activeTool, snapToGrid]);

  // Load existing facets onto canvas
  useEffect(() => {
    if (!fabricCanvas || !facets) return;

    facets.forEach((facet, index) => {
      const coords = (facet.polygon_geojson as any)?.coordinates?.[0];
      if (!coords) return;

      const points = coords.map((coord: number[]) => ({ x: coord[0], y: coord[1] }));
      const polygon = new Polygon(points, {
        fill: `rgba(59, 130, 246, 0.2)`,
        stroke: '#3b82f6',
        strokeWidth: 2,
        selectable: true,
        hoverCursor: 'pointer',
        moveCursor: 'move'
      });

      fabricCanvas.add(polygon);

      // Add label with 1-based numbering
      const bounds = polygon.getBoundingRect();
      const label = new Text(`${index + 1}`, {
        left: bounds.left + bounds.width / 2,
        top: bounds.top + bounds.height / 2,
        fontSize: 24,
        fill: '#1e40af',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false
      });

      fabricCanvas.add(label);
    });

    fabricCanvas.renderAll();
  }, [fabricCanvas, facets]);

  const addGrid = (canvas: FabricCanvas) => {
    const gridSize = 20;
    const canvasWidth = canvas.width || 800;
    const canvasHeight = canvas.height || 600;

    // Vertical lines
    for (let i = 0; i <= canvasWidth; i += gridSize) {
      const line = new Line([i, 0, i, canvasHeight], {
        stroke: '#94a3b8',
        strokeWidth: 1,
        selectable: false,
        evented: false
      });
      canvas.add(line);
    }

    // Horizontal lines
    for (let i = 0; i <= canvasHeight; i += gridSize) {
      const line = new Line([0, i, canvasWidth, i], {
        stroke: '#94a3b8',
        strokeWidth: 1,
        selectable: false,
        evented: false
      });
      canvas.add(line);
    }
  };

  const handleCanvasClick = (event: any) => {
    if (!fabricCanvas || activeTool !== 'draw') return;

    const pointer = fabricCanvas.getPointer(event.e);
    let x = pointer.x;
    let y = pointer.y;

    // Snap to grid
    if (snapToGrid) {
      const gridSize = 20;
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }

    const newPoints = [...drawingPoints, [x, y] as [number, number]];
    setDrawingPoints(newPoints);

    // Add point marker
    const point = new Circle({
      left: x - 3,
      top: y - 3,
      radius: 3,
      fill: '#3b82f6',
      selectable: false,
      evented: false
    });
    fabricCanvas.add(point);

    // Draw lines between points
    if (newPoints.length > 1) {
      const prevPoint = newPoints[newPoints.length - 2];
      const line = new Line([prevPoint[0], prevPoint[1], x, y], {
        stroke: '#3b82f6',
        strokeWidth: 2,
        selectable: false,
        evented: false
      });
      fabricCanvas.add(line);
    }

    fabricCanvas.renderAll();
  };

  const closePolygon = () => {
    if (drawingPoints.length < 3) {
      toast({
        title: "Invalid Polygon",
        description: "A polygon needs at least 3 points.",
        variant: "destructive"
      });
      return;
    }

    // Create polygon
    const points = drawingPoints.map(([x, y]) => ({ x, y }));
    const polygon = new Polygon(points, {
      fill: 'rgba(59, 130, 246, 0.2)',
      stroke: '#3b82f6',
      strokeWidth: 2,
      selectable: true
    });

    fabricCanvas?.add(polygon);
    fabricCanvas?.renderAll();

    // Save to database
    saveFacetMutation.mutate({ points: drawingPoints });

    // Reset drawing state
    setDrawingPoints([]);
    setActiveTool('select');
  };

  const clearCanvas = () => {
    fabricCanvas?.clear();
    if (snapToGrid && fabricCanvas) {
      addGrid(fabricCanvas);
    }
    setDrawingPoints([]);
  };

  // Set up canvas event listeners
  useEffect(() => {
    if (!fabricCanvas) return;

    if (activeTool === 'draw') {
      fabricCanvas.on('mouse:down', handleCanvasClick);
      fabricCanvas.selection = false;
      fabricCanvas.defaultCursor = 'crosshair';
    } else {
      fabricCanvas.off('mouse:down', handleCanvasClick);
      fabricCanvas.selection = true;
      fabricCanvas.defaultCursor = 'default';
    }

    return () => {
      fabricCanvas.off('mouse:down', handleCanvasClick);
    };
  }, [fabricCanvas, activeTool, drawingPoints, snapToGrid]);

  return (
    <div className="space-y-6">
      {/* Drawing Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Drawing Tools</CardTitle>
          <CardDescription>
            Use these tools to draw roof polygons and shapes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={activeTool === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('select')}
              >
                <MousePointer className="w-4 h-4 mr-2" />
                Select
              </Button>
              <Button
                variant={activeTool === 'draw' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('draw')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Point
              </Button>
              <Button
                variant={activeTool === 'brush' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('brush')}
              >
                <Paintbrush className="w-4 h-4 mr-2" />
                Brush Select Roof
              </Button>
              {drawingPoints.length >= 3 && (
                <Button
                  size="sm"
                  onClick={closePolygon}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Close Shape
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={snapToGrid ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSnapToGrid(!snapToGrid)}
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Snap to Grid
              </Button>
              <Button
                variant={snapToPoints ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSnapToPoints(!snapToPoints)}
              >
                <Zap className="w-4 h-4 mr-2" />
                Snap to Points
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="outline"
                size="sm"
                onClick={clearCanvas}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          {drawingPoints.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Drawing polygon: {drawingPoints.length} points
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDrawingPoints([]);
                      clearCanvas();
                      if (snapToGrid && fabricCanvas) addGrid(fabricCanvas);
                    }}
                  >
                    Cancel
                  </Button>
                  {drawingPoints.length >= 3 && (
                    <Button size="sm" onClick={closePolygon}>
                      Finish Polygon
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card>
        <CardContent className="p-4">
          <div className="border rounded-lg overflow-hidden">
            <canvas ref={canvasRef} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Facets List */}
      {facets && facets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Roof Facets</CardTitle>
            <CardDescription>
              Created roof polygons that will be used for calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {facets.map((facet, index) => (
                <div key={facet.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">Facet {index + 1}</span>
                    <div className="text-sm text-muted-foreground">
                      Pitch: {facet.pitch}/12 • Story: {facet.story}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {(facet.polygon_geojson as any)?.coordinates?.[0]?.length || 0} points
                  </Badge>
                    <Button variant="outline" size="sm">
                      <Move3D className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
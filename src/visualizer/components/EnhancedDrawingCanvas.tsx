import { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas as FabricCanvas, FabricObject, Path, Polygon, Rect, Circle, FabricImage, util } from 'fabric';
import type { DrawingTool } from './DrawingToolbar';
import { useToast } from '@/hooks/use-toast';

interface EnhancedDrawingCanvasProps {
  imageUrl: string;
  activeTool: DrawingTool;
  brushSize: number;
  onMaskComplete: (svgPath: string) => void;
  onHistoryChange: (canUndo: boolean, canRedo: boolean) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  onFabricCanvasReady?: (fabricCanvas: any, originalImage?: HTMLImageElement | null) => void;
  className?: string;
}

export const EnhancedDrawingCanvas = ({
  imageUrl,
  activeTool,
  brushSize,
  onMaskComplete,
  onHistoryChange,
  onCanvasReady,
  onFabricCanvasReady,
  className
}: EnhancedDrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const backgroundImageRef = useRef<HTMLImageElement>(null);
  const previousToolRef = useRef<DrawingTool>('select');
  const [isInitialized, setIsInitialized] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<Array<{ x: number, y: number }>>([]);
  const { toast } = useToast();

  // Generate SVG path from all mask objects
  const generateMaskPath = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const maskObjects = canvas.getObjects().filter((obj: FabricObject) => {
      const customType = obj.get('customType');
      return customType && typeof customType === 'string' && customType.startsWith('mask-');
    });
    
    if (maskObjects.length === 0) return;

    console.log('Generating mask path for objects:', maskObjects.length);

    const pathData = maskObjects.map(obj => {
      if (obj.type === 'polygon') {
        const polygon = obj as Polygon;
        const points = polygon.points || [];
        
        if (points.length === 0) return '';
        
        // Use simple coordinate calculation - get polygon's current position
        const left = polygon.left || 0;
        const top = polygon.top || 0;
        
        // Transform points to absolute canvas coordinates using simple offset
        const transformedPoints = points.map(point => ({
          x: left + point.x,
          y: top + point.y
        }));
        
        let path = `M ${transformedPoints[0].x} ${transformedPoints[0].y}`;
        for (let i = 1; i < transformedPoints.length; i++) {
          path += ` L ${transformedPoints[i].x} ${transformedPoints[i].y}`;
        }
        path += ' Z';
        
        console.log('Generated polygon path:', path.substring(0, 100) + '...');
        console.log('Polygon coordinates:', {
          left, top,
          firstPoint: transformedPoints[0],
          totalPoints: transformedPoints.length
        });
        
        return path;
      } else if (obj.type === 'rect') {
        const rect = obj as Rect;
        const left = rect.left!;
        const top = rect.top!;
        const width = rect.width! * (rect.scaleX || 1);
        const height = rect.height! * (rect.scaleY || 1);
        
        return `M ${left} ${top} L ${left + width} ${top} L ${left + width} ${top + height} L ${left} ${top + height} Z`;
      } else if (obj.type === 'circle') {
        const circle = obj as Circle;
        const centerX = circle.left! + (circle.radius! * (circle.scaleX || 1));
        const centerY = circle.top! + (circle.radius! * (circle.scaleY || 1));
        const radius = circle.radius! * Math.max(circle.scaleX || 1, circle.scaleY || 1);
        
        // Create a circle path using arcs
        return `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 1 1 ${centerX + radius} ${centerY} A ${radius} ${radius} 0 1 1 ${centerX - radius} ${centerY} Z`;
      }
      return '';
    }).filter(Boolean);

    if (pathData.length > 0) {
      const svgPath = pathData.join(' ');
      console.log('Final SVG path:', svgPath);
      onMaskComplete(svgPath);
    }
  }, [onMaskComplete]);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f8f9fa',
      selection: activeTool === 'select',
      isDrawingMode: activeTool === 'freehand' || activeTool === 'eraser',
    });

    // Configure drawing brush - ensure it exists first
    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeTool === 'eraser' ? '#ffffff' : '#3b82f6';
      fabricCanvas.freeDrawingBrush.width = brushSize;
    }

    fabricCanvasRef.current = fabricCanvas;

    return () => {
      fabricCanvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // Load background image
  useEffect(() => {
    if (!imageUrl || !fabricCanvasRef.current) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!fabricCanvasRef.current) return;

      const canvas = fabricCanvasRef.current;
      const canvasAspect = canvas.width! / canvas.height!;
      const imageAspect = img.width / img.height;
      
      let scale: number;
      let left: number;
      let top: number;

      if (imageAspect > canvasAspect) {
        // Image is wider than canvas
        scale = canvas.width! / img.width;
        left = 0;
        top = (canvas.height! - img.height * scale) / 2;
      } else {
        // Image is taller than canvas
        scale = canvas.height! / img.height;
        left = (canvas.width! - img.width * scale) / 2;
        top = 0;
      }

      // Set background image using the correct Fabric.js v6 API
      FabricImage.fromURL(imageUrl).then((fabricImg) => {
        if (!fabricCanvasRef.current) return;
        
        const canvas = fabricCanvasRef.current;
        
        // Calculate how to fit the image maintaining aspect ratio
        const canvasAspect = canvas.width! / canvas.height!;
        const imageAspect = fabricImg.width! / fabricImg.height!;
        
        let scaleX: number, scaleY: number;
        
        if (imageAspect > canvasAspect) {
          // Image is wider - fit to width
          scaleX = canvas.width! / fabricImg.width!;
          scaleY = scaleX;
        } else {
          // Image is taller - fit to height  
          scaleY = canvas.height! / fabricImg.height!;
          scaleX = scaleY;
        }
        
        // Scale and center the image
        fabricImg.scale(scaleX);
        fabricImg.set({
          left: (canvas.width! - fabricImg.width! * scaleX) / 2,
          top: (canvas.height! - fabricImg.height! * scaleY) / 2
        });
        
        canvas.backgroundImage = fabricImg;
        canvas.renderAll();
        setIsInitialized(true);
        
        console.log('Canvas initialized with background image:', {
          canvasSize: { width: canvas.width, height: canvas.height },
          imageSize: { width: fabricImg.width, height: fabricImg.height },
          scale: { x: scaleX, y: scaleY }
        });
        
        // Notify parent that canvas is ready with image loaded
        if (onCanvasReady && canvasRef.current) {
          onCanvasReady(canvasRef.current);
        }
        if (onFabricCanvasReady && fabricCanvasRef.current) {
          onFabricCanvasReady(fabricCanvasRef.current, backgroundImageRef.current);
        }
      });

      backgroundImageRef.current = img;
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Update canvas properties when tool changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    
    canvas.selection = activeTool === 'select';
    canvas.isDrawingMode = activeTool === 'freehand' || activeTool === 'eraser';
    
    // Ensure freeDrawingBrush exists before setting properties
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = activeTool === 'eraser' ? '#ffffff' : '#3b82f6';
      canvas.freeDrawingBrush.width = brushSize;
    }

    // Clear polygon points when switching tools
    if (activeTool !== 'polygon') {
      setPolygonPoints([]);
    }

    // Auto-generate mask when switching to select mode, but prevent infinite loops
    if (activeTool === 'select' && previousToolRef.current !== 'select') {
      // Add event listeners for object modifications when in select mode
      const handleObjectModified = () => {
        console.log('Object modified, regenerating mask...');
        setTimeout(() => generateMaskPath(), 10);
      };
      
      canvas.on('object:modified', handleObjectModified);
      
      // Store cleanup function for when leaving select mode
      return () => {
        canvas.off('object:modified', handleObjectModified);
      };
    }
    
    // Update previous tool for next comparison
    previousToolRef.current = activeTool;
  }, [activeTool, brushSize, onMaskComplete]); // Removed generateMaskPath from dependencies

  // Add shape tools at specific coordinates - define before handleCanvasClick
  const addRectangleAt = useCallback((x: number, y: number) => {
    if (!fabricCanvasRef.current) return;

    const rect = new Rect({
      left: x - 50,
      top: y - 50,
      width: 100,
      height: 100,
      fill: 'rgba(59, 130, 246, 0.3)',
      stroke: '#3b82f6',
      strokeWidth: 2,
      selectable: true
    });
    
    // Store custom properties
    rect.set('customType', 'mask-rectangle');
    
    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.renderAll();
    // Call generateMaskPath after shape is added
    setTimeout(() => generateMaskPath(), 0);
  }, []);

  const addCircleAt = useCallback((x: number, y: number) => {
    if (!fabricCanvasRef.current) return;

    const circle = new Circle({
      left: x - 50,
      top: y - 50,
      radius: 50,
      fill: 'rgba(59, 130, 246, 0.3)',
      stroke: '#3b82f6',
      strokeWidth: 2,
      selectable: true
    });
    
    // Store custom properties
    circle.set('customType', 'mask-circle');
    
    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.renderAll();
    // Call generateMaskPath after shape is added
    setTimeout(() => generateMaskPath(), 0);
  }, []);

  // Handle canvas clicks for different tools
  const handleCanvasClick = useCallback((e: any) => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const pointer = canvas.getPointer(e.e);
    
    if (activeTool === 'polygon') {
      setPolygonPoints(prev => {
        const newPoints = [...prev, { x: pointer.x, y: pointer.y }];
        
        // Visual feedback for polygon points
        const circle = new Circle({
          left: pointer.x - 3,
          top: pointer.y - 3,
          radius: 3,
          fill: '#3b82f6',
          selectable: false,
          evented: false,
          hoverCursor: 'default'
        });
        
        // Store custom properties using set method
        circle.set('customType', 'polygon-point');
        
        canvas.add(circle);
        canvas.renderAll();
        
        return newPoints;
      });
    } else if (activeTool === 'rectangle') {
      addRectangleAt(pointer.x, pointer.y);
    } else if (activeTool === 'circle') {
      addCircleAt(pointer.x, pointer.y);
    }
  }, [activeTool, addRectangleAt, addCircleAt]);


  // Complete polygon drawing
  const completePolygon = useCallback(() => {
    if (!fabricCanvasRef.current || polygonPoints.length < 3) {
      toast({
        title: "Not enough points",
        description: "Please add at least 3 points to create a polygon.",
        variant: "destructive"
      });
      return;
    }

    const canvas = fabricCanvasRef.current;
    
    // Remove polygon point indicators
    const objects = canvas.getObjects().filter((obj: FabricObject) => obj.get('customType') === 'polygon-point');
    objects.forEach(obj => canvas.remove(obj));
    
    // Create polygon
    const polygon = new Polygon(polygonPoints, {
      fill: 'rgba(59, 130, 246, 0.3)',
      stroke: '#3b82f6',
      strokeWidth: 2,
      selectable: true,
      evented: true,
      hoverCursor: 'move',
      moveCursor: 'move'
    });
    
    // Store custom properties
    polygon.set('customType', 'mask-polygon');
    
    canvas.add(polygon);
    canvas.renderAll();
    setPolygonPoints([]);
    
    // Generate SVG path from all mask objects
    generateMaskPath();
  }, [polygonPoints, toast, generateMaskPath]);

  // History management
  const undo = useCallback(() => {
    // Fabric.js doesn't have built-in undo/redo, so we'd need to implement state management
    // For now, this is a placeholder
    toast({
      title: "Undo",
      description: "Undo functionality will be implemented in future versions.",
    });
  }, [toast]);

  const redo = useCallback(() => {
    toast({
      title: "Redo", 
      description: "Redo functionality will be implemented in future versions.",
    });
  }, [toast]);

  const clearAll = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    const maskObjects = canvas.getObjects().filter((obj: FabricObject) => {
      const customType = obj.get('customType');
      return customType && typeof customType === 'string' && 
        (customType.startsWith('mask-') || customType === 'polygon-point');
    });
    
    maskObjects.forEach(obj => canvas.remove(obj));
    canvas.renderAll();
    setPolygonPoints([]);
    
    toast({
      title: "Canvas cleared",
      description: "All drawing objects have been removed."
    });
  }, [toast]);

  // Setup event listeners
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    
    canvas.on('mouse:down', handleCanvasClick);
    
    return () => {
      canvas.off('mouse:down', handleCanvasClick);
    };
  }, [handleCanvasClick]);

  // Expose methods to parent component
  useEffect(() => {
    onHistoryChange(false, false); // For now, always false until we implement proper history
  }, [onHistoryChange]);

  return (
    <div className={`relative ${className}`}>
      <canvas 
        ref={canvasRef}
        className="border rounded-lg shadow-sm max-w-full"
        style={{ maxHeight: '70vh' }}
      />
      
      {/* Instructions overlay */}
      {activeTool === 'polygon' && polygonPoints.length > 0 && (
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">
            Polygon Drawing ({polygonPoints.length} points)
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Click to add points. Need at least 3 points.
          </p>
          <button
            onClick={completePolygon}
            className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs hover:bg-primary/90 transition-colors"
          >
            Complete Polygon
          </button>
        </div>
      )}
      
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading canvas...</p>
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, FabricText, Line, Triangle, Group, Point, FabricImage, Shadow, Circle, Rect, PencilBrush } from 'fabric';
import { ArrowRight, Type, Move, Trash2, Check, X, Palette, Circle as CircleIcon, Square, ZoomIn, ZoomOut, RotateCcw, Loader2, Pencil, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type AnnotationTool = 'select' | 'arrow' | 'text' | 'circle' | 'rectangle' | 'pen' | 'polyline';

interface MobilePhotoEditorProps {
  imageFile: File;
  onSave: (annotatedImageFile: File) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const colors = [
  '#ef4444', // red
  '#f97316', // orange  
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#ffffff', // white
];

export const MobilePhotoEditor: React.FC<MobilePhotoEditorProps> = ({
  imageFile,
  onSave,
  onCancel,
  isSaving = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<AnnotationTool>('select');
  const [activeColor, setActiveColor] = useState('#ef4444');
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [imageUrl, setImageUrl] = useState<string>('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Polyline state
  const [polylinePoints, setPolylinePoints] = useState<{x: number, y: number}[]>([]);
  const polylineObjectsRef = useRef<any[]>([]);
  
  // Zoom and pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [lastTouchCenter, setLastTouchCenter] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  
  // Zoom constants
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.2;

  useEffect(() => {
    // Create image URL from file
    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  useEffect(() => {
    if (!canvasRef.current || !imageUrl) return;

    console.log('Setting up canvas with image:', imageUrl);
    
    const img = new Image();
    img.onload = () => {
      try {
        const containerWidth = window.innerWidth - 32; // Account for padding
        const containerHeight = window.innerHeight * 0.4; // 40% of screen height to leave room for toolbar
        
        const scale = Math.min(
          containerWidth / img.width,
          containerHeight / img.height
        );

        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        console.log('Canvas dimensions:', { scaledWidth, scaledHeight, scale });

        const canvas = new FabricCanvas(canvasRef.current!, {
          width: scaledWidth,
          height: scaledHeight,
          backgroundColor: '#ffffff',
        });

        console.log('Canvas created, setting up image...');

        // Create and add background image as a canvas object (not background)
        FabricImage.fromURL(imageUrl, {
          crossOrigin: 'anonymous'
        }).then((fabricImg) => {
          fabricImg.set({
            left: 0,
            top: 0,
            scaleX: scale,
            scaleY: scale,
            selectable: false,
            evented: false,
            excludeFromExport: false,
          });
          
          // Add image as the bottom layer
          canvas.add(fabricImg);
          canvas.sendObjectToBack(fabricImg);
          
          // Initialize PencilBrush for freehand drawing (required in Fabric.js v6)
          canvas.freeDrawingBrush = new PencilBrush(canvas);
          canvas.freeDrawingBrush.color = activeColor;
          canvas.freeDrawingBrush.width = 4;
          console.log('PencilBrush initialized');
          
          canvas.renderAll();
          console.log('Canvas setup complete');
          setFabricCanvas(canvas);
        }).catch((error) => {
          console.error('Error loading image into canvas:', error);
        });

      } catch (error) {
        console.error('Error setting up canvas:', error);
      }
    };

    img.onerror = (error) => {
      console.error('Error loading image:', error);
    };

    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    return () => {
      if (fabricCanvas) {
        console.log('Disposing canvas');
        fabricCanvas.dispose();
      }
    };
  }, [imageUrl]);

  // Zoom and pan utility functions
  const getTouchDistance = useCallback((touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getTouchCenter = useCallback((touches: React.TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }, []);

  const updateCanvasViewport = useCallback(() => {
    if (!fabricCanvas) return;
    
    const vpt = fabricCanvas.viewportTransform;
    if (vpt) {
      vpt[0] = zoomLevel; // scale x
      vpt[3] = zoomLevel; // scale y
      vpt[4] = panX; // translate x
      vpt[5] = panY; // translate y
      fabricCanvas.setViewportTransform(vpt);
      fabricCanvas.renderAll();
    }
  }, [fabricCanvas, zoomLevel, panX, panY]);

  const constrainZoom = useCallback((newZoom: number) => {
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
  }, []);

  const constrainPan = useCallback((newPanX: number, newPanY: number, zoom: number) => {
    if (!fabricCanvas || !containerRef.current) return { x: newPanX, y: newPanY };
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const canvasWidth = fabricCanvas.width || 0;
    const canvasHeight = fabricCanvas.height || 0;
    
    const scaledWidth = canvasWidth * zoom;
    const scaledHeight = canvasHeight * zoom;
    
    const maxPanX = Math.max(0, (scaledWidth - containerRect.width) / 2);
    const maxPanY = Math.max(0, (scaledHeight - containerRect.height) / 2);
    
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, newPanX)),
      y: Math.max(-maxPanY, Math.min(maxPanY, newPanY))
    };
  }, [fabricCanvas]);

  // Zoom functions
  const handleZoomIn = useCallback(() => {
    const newZoom = constrainZoom(zoomLevel + ZOOM_STEP);
    setZoomLevel(newZoom);
    const constrainedPan = constrainPan(panX, panY, newZoom);
    setPanX(constrainedPan.x);
    setPanY(constrainedPan.y);
  }, [zoomLevel, panX, panY, constrainZoom, constrainPan]);

  const handleZoomOut = useCallback(() => {
    const newZoom = constrainZoom(zoomLevel - ZOOM_STEP);
    setZoomLevel(newZoom);
    const constrainedPan = constrainPan(panX, panY, newZoom);
    setPanX(constrainedPan.x);
    setPanY(constrainedPan.y);
  }, [zoomLevel, panX, panY, constrainZoom, constrainPan]);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  }, []);

  // Touch event handlers for pinch-to-zoom and pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      // Two finger gesture - start zoom
      setIsZooming(true);
      setIsPanning(false);
      const distance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      setLastTouchDistance(distance);
      setLastTouchCenter(center);
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      // Single finger gesture when zoomed in - start pan
      setIsPanning(true);
      setIsZooming(false);
      setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, [getTouchDistance, getTouchCenter, zoomLevel, activeTool]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (isZooming && e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      
      if (lastTouchDistance > 0) {
        const scaleChange = distance / lastTouchDistance;
        const newZoom = constrainZoom(zoomLevel * scaleChange);
        
        // Calculate pan adjustment to zoom towards the center of the pinch
        const zoomDelta = newZoom - zoomLevel;
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const centerX = center.x - rect.left - rect.width / 2;
          const centerY = center.y - rect.top - rect.height / 2;
          const newPanX = panX - centerX * zoomDelta / zoomLevel;
          const newPanY = panY - centerY * zoomDelta / zoomLevel;
          const constrainedPan = constrainPan(newPanX, newPanY, newZoom);
          setPanX(constrainedPan.x);
          setPanY(constrainedPan.y);
        }
        
        setZoomLevel(newZoom);
      }
      
      setLastTouchDistance(distance);
      setLastTouchCenter(center);
    } else if (isPanning && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - lastPanPoint.x;
      const deltaY = e.touches[0].clientY - lastPanPoint.y;
      
      const newPanX = panX + deltaX;
      const newPanY = panY + deltaY;
      const constrainedPan = constrainPan(newPanX, newPanY, zoomLevel);
      
      setPanX(constrainedPan.x);
      setPanY(constrainedPan.y);
      setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, [isZooming, isPanning, lastTouchDistance, lastTouchCenter, lastPanPoint, zoomLevel, panX, panY, getTouchDistance, getTouchCenter, constrainZoom, constrainPan]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsZooming(false);
    setIsPanning(false);
    setLastTouchDistance(0);
  }, [activeTool]);

  // Mouse wheel zoom for desktop testing
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newZoom = constrainZoom(zoomLevel + delta);
    
    // Zoom towards mouse position
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;
      const zoomDelta = newZoom - zoomLevel;
      const newPanX = panX - mouseX * zoomDelta / zoomLevel;
      const newPanY = panY - mouseY * zoomDelta / zoomLevel;
      const constrainedPan = constrainPan(newPanX, newPanY, newZoom);
      setPanX(constrainedPan.x);
      setPanY(constrainedPan.y);
    }
    
    setZoomLevel(newZoom);
  }, [zoomLevel, panX, panY, constrainZoom, constrainPan]);

  // Update canvas viewport when zoom or pan changes
  useEffect(() => {
    updateCanvasViewport();
  }, [updateCanvasViewport]);

  const createArrow = (startPoint: Point, endPoint: Point) => {
    if (!fabricCanvas) return;

    // Calculate angle and distance
    const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
    const distance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
    );

    // Create the main line
    const line = new Line([startPoint.x, startPoint.y, endPoint.x, endPoint.y], {
      stroke: activeColor,
      strokeWidth: 4,
      selectable: false,
      evented: false,
    });

    // Create arrowhead using two lines
    const headLength = Math.min(25, distance * 0.3);
    const headAngle = 0.5; // 30 degrees in radians
    
    // Left side of arrowhead
    const leftHeadX = endPoint.x - headLength * Math.cos(angle - headAngle);
    const leftHeadY = endPoint.y - headLength * Math.sin(angle - headAngle);
    
    // Right side of arrowhead  
    const rightHeadX = endPoint.x - headLength * Math.cos(angle + headAngle);
    const rightHeadY = endPoint.y - headLength * Math.sin(angle + headAngle);
    
    const leftHead = new Line([endPoint.x, endPoint.y, leftHeadX, leftHeadY], {
      stroke: activeColor,
      strokeWidth: 4,
      selectable: false,
      evented: false,
    });
    
    const rightHead = new Line([endPoint.x, endPoint.y, rightHeadX, rightHeadY], {
      stroke: activeColor,
      strokeWidth: 4,
      selectable: false,
      evented: false,
    });

    const arrow = new Group([line, leftHead, rightHead], {
      selectable: true,
      hasControls: true,
      cornerStyle: 'circle',
      cornerSize: 8,
      transparentCorners: false,
      cornerColor: activeColor,
    });

    fabricCanvas.add(arrow);
    fabricCanvas.setActiveObject(arrow);
    fabricCanvas.renderAll();
    setActiveTool('select');
  };

  const handleCanvasClick = (e: any) => {
    if (!fabricCanvas || activeTool === 'select') return;

    const pointer = fabricCanvas.getPointer(e.e);
    console.log('Canvas click:', { tool: activeTool, pointer });

    if (activeTool === 'text') {
      setTextPosition({ x: pointer.x, y: pointer.y });
      setShowTextDialog(true);
    } else if (activeTool === 'circle') {
      const circle = new Circle({
        left: pointer.x - 30,
        top: pointer.y - 30,
        radius: 30,
        fill: 'transparent',
        stroke: activeColor,
        strokeWidth: 3,
        selectable: true,
        hasControls: true,
        cornerStyle: 'circle',
        cornerSize: 8,
        transparentCorners: false,
        cornerColor: activeColor,
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
      fabricCanvas.renderAll();
      setActiveTool('select');
    } else if (activeTool === 'rectangle') {
      const rect = new Rect({
        left: pointer.x - 40,
        top: pointer.y - 25,
        width: 80,
        height: 50,
        fill: 'transparent',
        stroke: activeColor,
        strokeWidth: 3,
        selectable: true,
        hasControls: true,
        cornerStyle: 'circle',
        cornerSize: 8,
        transparentCorners: false,
        cornerColor: activeColor,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
      fabricCanvas.renderAll();
      setActiveTool('select');
    }
  };

  // Handle polyline clicks - add dots connected by lines
  const handlePolylineClick = useCallback((e: any) => {
    if (activeTool !== 'polyline' || !fabricCanvas) return;

    const pointer = fabricCanvas.getPointer(e.e);
    const newPoint = { x: pointer.x, y: pointer.y };
    
    // Add dot marker at click position
    const dot = new Circle({
      left: pointer.x - 5,
      top: pointer.y - 5,
      radius: 5,
      fill: activeColor,
      stroke: '#ffffff',
      strokeWidth: 2,
      selectable: false,
      evented: false,
    });
    fabricCanvas.add(dot);
    polylineObjectsRef.current.push(dot);

    // If we have previous points, draw line from last point to new point
    if (polylinePoints.length > 0) {
      const lastPoint = polylinePoints[polylinePoints.length - 1];
      const line = new Line([lastPoint.x, lastPoint.y, pointer.x, pointer.y], {
        stroke: activeColor,
        strokeWidth: 3,
        selectable: false,
        evented: false,
      });
      fabricCanvas.add(line);
      polylineObjectsRef.current.push(line);
    }

    setPolylinePoints(prev => [...prev, newPoint]);
    fabricCanvas.renderAll();
  }, [activeTool, fabricCanvas, activeColor, polylinePoints]);

  // Finish polyline and group objects
  const finishPolyline = useCallback((closeShape: boolean = false) => {
    if (polylinePoints.length < 2 || !fabricCanvas) return;

    // If closing shape, add final line from last to first point
    if (closeShape && polylinePoints.length >= 3) {
      const first = polylinePoints[0];
      const last = polylinePoints[polylinePoints.length - 1];
      const closingLine = new Line([last.x, last.y, first.x, first.y], {
        stroke: activeColor,
        strokeWidth: 3,
        selectable: false,
        evented: false,
      });
      fabricCanvas.add(closingLine);
      polylineObjectsRef.current.push(closingLine);
    }

    // Group all into a single selectable object
    if (polylineObjectsRef.current.length > 0) {
      const group = new Group(polylineObjectsRef.current, {
        selectable: true,
        hasControls: true,
        cornerStyle: 'circle',
        cornerSize: 8,
        transparentCorners: false,
        cornerColor: activeColor,
      });

      // Remove individual objects and add group
      polylineObjectsRef.current.forEach(obj => fabricCanvas.remove(obj));
      fabricCanvas.add(group);
      fabricCanvas.setActiveObject(group);
      fabricCanvas.renderAll();
    }

    // Reset state
    setPolylinePoints([]);
    polylineObjectsRef.current = [];
    setActiveTool('select');
  }, [polylinePoints, fabricCanvas, activeColor]);

  // Cancel polyline drawing
  const cancelPolyline = useCallback(() => {
    if (!fabricCanvas) return;
    
    polylineObjectsRef.current.forEach(obj => fabricCanvas.remove(obj));
    polylineObjectsRef.current = [];
    setPolylinePoints([]);
    fabricCanvas.renderAll();
  }, [fabricCanvas]);

  const handleArrowStart = (e: any) => {
    if (activeTool !== 'arrow' || !fabricCanvas) return;
    
    console.log('Arrow start');
    const pointer = fabricCanvas.getPointer(e.e);
    const startPoint = new Point(pointer.x, pointer.y);

    let isDrawing = true;
    let tempLine: Line | null = null;

    const onMouseMove = (moveEvent: any) => {
      if (!isDrawing || !fabricCanvas) return;

      const movePointer = fabricCanvas.getPointer(moveEvent.e);
      
      if (tempLine) {
        fabricCanvas.remove(tempLine);
      }

      tempLine = new Line([startPoint.x, startPoint.y, movePointer.x, movePointer.y], {
        stroke: activeColor,
        strokeWidth: 3,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });

      fabricCanvas.add(tempLine);
      fabricCanvas.renderAll();
    };

    const onMouseUp = (upEvent: any) => {
      if (!isDrawing || !fabricCanvas) return;

      isDrawing = false;
      if (tempLine) {
        fabricCanvas.remove(tempLine);
      }

      const endPointer = fabricCanvas.getPointer(upEvent.e);
      const endPoint = new Point(endPointer.x, endPointer.y);

      // Only create arrow if there's significant movement
      const distance = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
      );

      if (distance > 20) {
        createArrow(startPoint, endPoint);
      }

      fabricCanvas.off('mouse:move', onMouseMove);
      fabricCanvas.off('mouse:up', onMouseUp);
    };

    fabricCanvas.on('mouse:move', onMouseMove);
    fabricCanvas.on('mouse:up', onMouseUp);
  };

  useEffect(() => {
    if (!fabricCanvas) return;

    console.log('Setting up canvas for tool:', activeTool);

    // Clear all existing event listeners first
    fabricCanvas.off('mouse:down');
    fabricCanvas.off('mouse:up');
    fabricCanvas.off('mouse:move');

    // Configure canvas based on active tool
    fabricCanvas.selection = activeTool === 'select';
    fabricCanvas.defaultCursor = 'default';

    // Configure pen (freehand drawing) mode
    if (activeTool === 'pen') {
      // Ensure PencilBrush is initialized (in case canvas was recreated)
      if (!fabricCanvas.freeDrawingBrush) {
        fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
      }
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = 4;
      fabricCanvas.isDrawingMode = true;
      fabricCanvas.defaultCursor = 'crosshair';
    } else {
      fabricCanvas.isDrawingMode = false;
    }

    // Set up tool-specific event handlers
    if (activeTool === 'arrow') {
      fabricCanvas.on('mouse:down', handleArrowStart);
      console.log('Arrow tool event handlers attached');
    } else if (activeTool === 'text' || activeTool === 'circle' || activeTool === 'rectangle') {
      fabricCanvas.on('mouse:up', handleCanvasClick);
      console.log('Shape tool event handlers attached for:', activeTool);
    } else if (activeTool === 'polyline') {
      fabricCanvas.on('mouse:up', handlePolylineClick);
      fabricCanvas.defaultCursor = 'crosshair';
      console.log('Polyline tool event handlers attached');
    }

    return () => {
      if (fabricCanvas) {
        fabricCanvas.off('mouse:down');
        fabricCanvas.off('mouse:up');
        fabricCanvas.off('mouse:move');
      }
    };
  }, [fabricCanvas, activeTool, activeColor, handlePolylineClick]);

  const addText = () => {
    if (!fabricCanvas || !textInput.trim()) return;

    const text = new FabricText(textInput, {
      left: textPosition.x - 50, // Offset slightly to center better
      top: textPosition.y - 12,
      fill: activeColor,
      fontSize: 24,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      selectable: true,
      hasControls: true,
      cornerStyle: 'circle',
      cornerSize: 8,
      transparentCorners: false,
      cornerColor: activeColor,
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    
    setTextInput('');
    setShowTextDialog(false);
    setActiveTool('select');
  };

  const clearAll = () => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects();
    // Keep the background image (first object) and remove all annotations
    objects.slice(1).forEach(obj => fabricCanvas.remove(obj));
    fabricCanvas.renderAll();
  };

  const deleteSelected = () => {
    if (!fabricCanvas) return;
    
    const activeObjects = fabricCanvas.getActiveObjects();
    activeObjects.forEach(obj => fabricCanvas.remove(obj));
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
  };

  const handleSave = async () => {
    if (!fabricCanvas) return;

    console.log('[PhotoEditor] Starting save process...');
    
    // Deselect any active objects before export
    fabricCanvas.discardActiveObject();
    
    // Store current viewport transform
    const currentViewport = fabricCanvas.viewportTransform ? [...fabricCanvas.viewportTransform] : null;
    
    // Reset viewport to default (no zoom/pan) for clean export
    fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    fabricCanvas.renderAll();
    
    console.log('[PhotoEditor] Canvas objects count:', fabricCanvas.getObjects().length);
    console.log('[PhotoEditor] Canvas dimensions:', fabricCanvas.width, 'x', fabricCanvas.height);

    try {
      // Export canvas as image with higher quality
      // This flattens ALL layers including background image and annotations
      const dataURL = fabricCanvas.toDataURL({
        format: 'jpeg',
        quality: 0.95,
        multiplier: 2, // Higher resolution for better quality
      });

      console.log('[PhotoEditor] Generated dataURL length:', dataURL.length);

      // Convert to file
      const response = await fetch(dataURL);
      const blob = await response.blob();
      
      console.log('[PhotoEditor] Created blob size:', blob.size, 'bytes');
      
      const annotatedFile = new File([blob], `annotated_${imageFile.name}`, {
        type: 'image/jpeg',
      });

      console.log('[PhotoEditor] Created file:', annotatedFile.name, annotatedFile.size, 'bytes');
      
      // Restore viewport if user cancelled or for any reason
      if (currentViewport) {
        fabricCanvas.setViewportTransform(currentViewport as any);
        fabricCanvas.renderAll();
      }

      onSave(annotatedFile);
    } catch (error) {
      console.error('[PhotoEditor] Save failed:', error);
      
      // Restore viewport on error
      if (currentViewport) {
        fabricCanvas.setViewportTransform(currentViewport as any);
        fabricCanvas.renderAll();
      }
      
      throw error;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background font-sans safe-area-bottom">
      {/* Header - with proper safe area inset for iOS notch/dynamic island */}
      <div 
        className="flex items-center justify-between p-2 sm:p-3 border-b border-border bg-background/95 backdrop-blur-sm shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <Button 
          variant="ghost" 
          size="default" 
          onClick={onCancel} 
          disabled={isSaving} 
          type="button"
          className="min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 touch-manipulation relative z-10"
        >
          <X className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="text-xs sm:text-sm font-normal">Cancel</span>
        </Button>
        <h2 className="text-base sm:text-lg font-normal text-foreground">Edit Photo</h2>
        <Button 
          size="default" 
          onClick={handleSave} 
          disabled={isSaving} 
          type="button"
          className="min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 touch-manipulation relative z-10"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />
              <span className="text-xs sm:text-sm font-normal">Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm font-normal">Done</span>
            </>
          )}
        </Button>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="flex items-center justify-center p-2 sm:p-3 flex-1 min-h-0 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        style={{ touchAction: 'none', contain: 'layout size' }}
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full border border-border rounded-lg shadow-sm"
          style={{
            transform: `scale(${zoomLevel}) translate(${panX / zoomLevel}px, ${panY / zoomLevel}px)`,
            transformOrigin: 'center center',
            transition: isPanning || isZooming ? 'none' : 'transform 0.2s ease-out'
          }}
        />
      </div>

      {/* Toolbar */}
      <div className="p-2 sm:p-3 border-t border-border bg-background/95 backdrop-blur-sm shrink-0" style={{ contain: 'layout' }}>
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          {/* First row - Main tools */}
          <Button
            variant={activeTool === 'select' ? 'default' : 'outline'}
            onClick={() => setActiveTool('select')}
            className="flex flex-col items-center py-2 sm:py-3 h-auto min-h-[44px] sm:min-h-[50px] gap-0.5 sm:gap-1 font-semibold"
          >
            <Move className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs font-semibold leading-tight">Select</span>
          </Button>
          <Button
            variant={activeTool === 'arrow' ? 'default' : 'outline'}
            onClick={() => setActiveTool('arrow')}
            className="flex flex-col items-center py-2 sm:py-3 h-auto min-h-[44px] sm:min-h-[50px] gap-0.5 sm:gap-1 font-semibold"
          >
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs font-semibold leading-tight">Arrow</span>
          </Button>
          <Button
            variant={activeTool === 'text' ? 'default' : 'outline'}
            onClick={() => setActiveTool('text')}
            className="flex flex-col items-center py-2 sm:py-3 h-auto min-h-[44px] sm:min-h-[50px] gap-0.5 sm:gap-1 font-semibold"
          >
            <Type className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs font-semibold leading-tight">Text</span>
          </Button>
          <Button
            variant={activeTool === 'pen' ? 'default' : 'outline'}
            onClick={() => setActiveTool('pen')}
            className="flex flex-col items-center py-2 sm:py-3 h-auto min-h-[44px] sm:min-h-[50px] gap-0.5 sm:gap-1 font-semibold"
          >
            <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs font-semibold leading-tight">Pen</span>
          </Button>
          
          {/* Second row - Shape tools */}
          <Button
            variant={activeTool === 'circle' ? 'default' : 'outline'}
            onClick={() => setActiveTool('circle')}
            className="flex flex-col items-center py-2 sm:py-3 h-auto min-h-[44px] sm:min-h-[50px] gap-0.5 sm:gap-1 font-semibold"
          >
            <CircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs font-semibold leading-tight">Circle</span>
          </Button>
          <Button
            variant={activeTool === 'rectangle' ? 'default' : 'outline'}
            onClick={() => setActiveTool('rectangle')}
            className="flex flex-col items-center py-2 sm:py-3 h-auto min-h-[44px] sm:min-h-[50px] gap-0.5 sm:gap-1 font-semibold"
          >
            <Square className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs font-semibold leading-tight">Rectangle</span>
          </Button>
          <Button
            variant={activeTool === 'polyline' ? 'default' : 'outline'}
            onClick={() => {
              setActiveTool('polyline');
              setPolylinePoints([]);
              polylineObjectsRef.current = [];
            }}
            className="flex flex-col items-center py-2 sm:py-3 h-auto min-h-[44px] sm:min-h-[50px] gap-0.5 sm:gap-1 font-semibold"
          >
            <GitBranch className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs font-semibold leading-tight">Lines</span>
          </Button>
          {/* Empty placeholder for grid balance */}
          <div className="min-h-[44px] sm:min-h-[50px]" />
        </div>
        
        {/* Polyline status bar - fixed height container to prevent layout shift */}
        <div className="h-12 mb-3">
          {activeTool === 'polyline' && polylinePoints.length > 0 ? (
            <div className="p-2 bg-muted rounded-lg flex items-center justify-between h-full">
              <span className="text-xs text-muted-foreground">
                {polylinePoints.length} point{polylinePoints.length !== 1 ? 's' : ''} added
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelPolyline}
                  className="h-8 px-2 text-xs"
                >
                  Cancel
                </Button>
                {polylinePoints.length >= 2 && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => finishPolyline(false)}
                    className="h-8 px-2 text-xs"
                  >
                    Finish Open
                  </Button>
                )}
                {polylinePoints.length >= 3 && (
                  <Button 
                    size="sm" 
                    onClick={() => finishPolyline(true)}
                    className="h-8 px-2 text-xs"
                  >
                    Close Shape
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </div>
        
        {/* Utility buttons */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
          <Button
            variant="outline"
            onClick={handleZoomOut}
            disabled={zoomLevel <= MIN_ZOOM}
            className="flex items-center gap-0.5 sm:gap-1 min-h-[36px] sm:min-h-[40px] px-1.5 sm:px-2 font-normal"
          >
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleZoomReset}
            className="flex items-center gap-0.5 sm:gap-1 min-h-[36px] sm:min-h-[40px] px-1.5 sm:px-2 font-normal"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-xs">{Math.round(zoomLevel * 100)}%</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleZoomIn}
            disabled={zoomLevel >= MAX_ZOOM}
            className="flex items-center gap-0.5 sm:gap-1 min-h-[36px] sm:min-h-[40px] px-1.5 sm:px-2 font-normal"
          >
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-1 sm:gap-2 min-h-[36px] sm:min-h-[40px] px-2 sm:px-3 font-normal"
          >
            <div 
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-border"
              style={{ backgroundColor: activeColor }}
            />
            <span className="text-xs sm:text-sm hidden xs:inline">Color</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={deleteSelected} 
            className="flex items-center gap-1 sm:gap-2 min-h-[36px] sm:min-h-[40px] px-2 sm:px-3 font-normal"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm hidden xs:inline">Delete</span>
          </Button>
        </div>

        {/* Color Picker */}
        {showColorPicker && (
          <Card className="mb-3 sm:mb-4">
            <CardContent className="p-2 sm:p-3">
              <h3 className="text-xs sm:text-sm font-normal text-foreground mb-2">Choose Color</h3>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 transition-all ${
                      activeColor === color ? 'border-primary ring-1 ring-primary/30' : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setActiveColor(color);
                      setShowColorPicker(false);
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <div className="text-center bg-muted/30 rounded px-2 sm:px-3 py-1.5 sm:py-2">
          <p className="text-[10px] sm:text-xs font-normal text-muted-foreground leading-tight">
            {activeTool === 'select' && 'Tap to select • Pinch to zoom • Pan when zoomed'}
            {activeTool === 'arrow' && 'Drag to draw an arrow • Pinch to zoom'}
            {activeTool === 'text' && 'Tap to add text • Pinch to zoom'}
            {activeTool === 'circle' && 'Tap to add a circle • Pinch to zoom'}
            {activeTool === 'rectangle' && 'Tap to add a rectangle • Pinch to zoom'}
            {activeTool === 'pen' && 'Draw freely with your finger • Pinch to zoom'}
            {activeTool === 'polyline' && 'Tap to add points • Tap Finish when done'}
          </p>
        </div>
      </div>

      {/* Text Input Dialog */}
      <Dialog open={showTextDialog} onOpenChange={setShowTextDialog}>
        <DialogContent className="w-[90vw] max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-normal">Add Text</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter your text..."
              autoFocus
              className="text-sm h-10 font-normal"
            />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowTextDialog(false)} 
                className="flex-1 h-10 text-sm font-normal"
              >
                Cancel
              </Button>
              <Button 
                onClick={addText} 
                className="flex-1 h-10 text-sm font-normal" 
                disabled={!textInput.trim()}
              >
                Add Text
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
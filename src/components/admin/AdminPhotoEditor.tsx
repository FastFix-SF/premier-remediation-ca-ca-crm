import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, FabricText, Line, Group, Point, FabricImage, Circle, Rect } from 'fabric';
import { 
  ArrowRight, Type, Move, Trash2, Check, X, Circle as CircleIcon, Square, 
  ZoomIn, ZoomOut, RotateCcw, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AnnotationTool = 'select' | 'arrow' | 'text' | 'circle' | 'rectangle';

interface AdminPhotoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  photo: {
    id: string;
    photo_url: string;
    caption?: string;
    project_id: string;
    photo_tag?: string | null;
  };
  onPhotoUpdated: () => void;
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

const AdminPhotoEditor: React.FC<AdminPhotoEditorProps> = ({
  isOpen,
  onClose,
  photo,
  onPhotoUpdated
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<AnnotationTool>('select');
  const [activeColor, setActiveColor] = useState('#ef4444');
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  
  // Zoom constants
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.2;

  // Initialize canvas when dialog opens - with delay to ensure DOM is ready
  useEffect(() => {
    if (!isOpen || !photo.photo_url) return;

    // Small delay to ensure dialog is mounted and canvas element exists
    const timer = setTimeout(() => {
      if (!canvasRef.current) {
        console.error('Canvas ref not available');
        return;
      }

      console.log('Setting up canvas with image:', photo.photo_url);
      
      const img = new Image();
      img.onload = () => {
        try {
          if (!canvasRef.current) return;
          
          const containerWidth = 800; // Max width for desktop
          const containerHeight = 500; // Max height for desktop
          
          const scale = Math.min(
            containerWidth / img.width,
            containerHeight / img.height
          );

          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;

          console.log('Canvas dimensions:', { scaledWidth, scaledHeight, scale });

          const canvas = new FabricCanvas(canvasRef.current, {
            width: scaledWidth,
            height: scaledHeight,
            backgroundColor: '#ffffff',
          });

          // Create and add background image
          FabricImage.fromURL(photo.photo_url, {
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
            
            canvas.add(fabricImg);
            canvas.sendObjectToBack(fabricImg);
            canvas.renderAll();
            console.log('Canvas setup complete');
            setFabricCanvas(canvas);
            setIsCanvasReady(true);
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
      img.src = photo.photo_url;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (fabricCanvas) {
        console.log('Disposing canvas');
        fabricCanvas.dispose();
        setFabricCanvas(null);
        setIsCanvasReady(false);
      }
    };
  }, [isOpen, photo.photo_url]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen && fabricCanvas) {
      fabricCanvas.dispose();
      setFabricCanvas(null);
      setZoomLevel(1);
      setActiveTool('select');
      setIsCanvasReady(false);
    }
  }, [isOpen]);

  const constrainZoom = useCallback((newZoom: number) => {
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
  }, []);

  const handleZoomIn = useCallback(() => {
    const newZoom = constrainZoom(zoomLevel + ZOOM_STEP);
    setZoomLevel(newZoom);
    if (fabricCanvas) {
      fabricCanvas.setZoom(newZoom);
      fabricCanvas.renderAll();
    }
  }, [zoomLevel, fabricCanvas, constrainZoom]);

  const handleZoomOut = useCallback(() => {
    const newZoom = constrainZoom(zoomLevel - ZOOM_STEP);
    setZoomLevel(newZoom);
    if (fabricCanvas) {
      fabricCanvas.setZoom(newZoom);
      fabricCanvas.renderAll();
    }
  }, [zoomLevel, fabricCanvas, constrainZoom]);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
    if (fabricCanvas) {
      fabricCanvas.setZoom(1);
      fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      fabricCanvas.renderAll();
    }
  }, [fabricCanvas]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newZoom = constrainZoom(zoomLevel + delta);
    setZoomLevel(newZoom);
    if (fabricCanvas) {
      fabricCanvas.setZoom(newZoom);
      fabricCanvas.renderAll();
    }
  }, [zoomLevel, fabricCanvas, constrainZoom]);

  const createArrow = (startPoint: Point, endPoint: Point) => {
    if (!fabricCanvas) return;

    const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
    const distance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
    );

    const line = new Line([startPoint.x, startPoint.y, endPoint.x, endPoint.y], {
      stroke: activeColor,
      strokeWidth: 4,
      selectable: false,
      evented: false,
    });

    const headLength = Math.min(25, distance * 0.3);
    const headAngle = 0.5;
    
    const leftHeadX = endPoint.x - headLength * Math.cos(angle - headAngle);
    const leftHeadY = endPoint.y - headLength * Math.sin(angle - headAngle);
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

  const handleArrowStart = (e: any) => {
    if (activeTool !== 'arrow' || !fabricCanvas) return;
    
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

  // Set up canvas event handlers based on active tool
  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.off('mouse:down');
    fabricCanvas.off('mouse:up');
    fabricCanvas.off('mouse:move');

    fabricCanvas.isDrawingMode = false;
    fabricCanvas.selection = activeTool === 'select';
    fabricCanvas.defaultCursor = 'default';

    if (activeTool === 'arrow') {
      fabricCanvas.on('mouse:down', handleArrowStart);
    } else if (activeTool === 'text' || activeTool === 'circle' || activeTool === 'rectangle') {
      fabricCanvas.on('mouse:up', handleCanvasClick);
    }

    return () => {
      if (fabricCanvas) {
        fabricCanvas.off('mouse:down');
        fabricCanvas.off('mouse:up');
        fabricCanvas.off('mouse:move');
      }
    };
  }, [fabricCanvas, activeTool, activeColor]);

  const addText = () => {
    if (!fabricCanvas || !textInput.trim()) return;

    const text = new FabricText(textInput, {
      left: textPosition.x - 50,
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

  // Save annotated image
  const handleSaveAnnotations = async (keepBoth: boolean = false) => {
    if (!fabricCanvas) return;

    setIsSaving(true);

    try {
      fabricCanvas.discardActiveObject();
      
      // Reset zoom for clean export
      const currentZoom = fabricCanvas.getZoom();
      fabricCanvas.setZoom(1);
      fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      fabricCanvas.renderAll();

      const dataURL = fabricCanvas.toDataURL({
        format: 'jpeg',
        quality: 0.95,
        multiplier: 2,
      });

      const response = await fetch(dataURL);
      const blob = await response.blob();

      const fileName = `${photo.project_id}/annotated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpeg`;

      const { error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-photos')
        .getPublicUrl(fileName);

      if (keepBoth) {
        // Create new photo record
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error: insertError } = await supabase
          .from('project_photos')
          .insert({
            project_id: photo.project_id,
            photo_url: publicUrl,
            caption: photo.caption ? `${photo.caption} (annotated)` : 'Annotated photo',
            is_visible_to_customer: true,
            uploaded_by: user.id,
            display_order: 0,
            photo_tag: photo.photo_tag,
            is_highlighted_before: false,
            is_highlighted_after: false
          });

        if (insertError) throw insertError;
        toast.success('Annotated photo saved as new photo!');
      } else {
        // Update existing photo
        const { error: updateError } = await supabase
          .from('project_photos')
          .update({ 
            photo_url: publicUrl,
            caption: photo.caption ? `${photo.caption} (annotated)` : 'Annotated photo'
          })
          .eq('id', photo.id);

        if (updateError) throw updateError;
        toast.success('Photo updated with annotations!');
      }

      // Restore zoom
      fabricCanvas.setZoom(currentZoom);
      fabricCanvas.renderAll();

      onPhotoUpdated();
      handleClose();
    } catch (error) {
      console.error('Error saving annotated photo:', error);
      toast.error('Failed to save annotated photo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setActiveTool('select');
    setZoomLevel(1);
    setShowColorPicker(false);
    setShowTextDialog(false);
    setTextInput('');
    setIsCanvasReady(false);
    if (fabricCanvas) {
      fabricCanvas.dispose();
      setFabricCanvas(null);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Photo</DialogTitle>
          <DialogDescription>
            Add annotations to mark up your photo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Canvas Container */}
          <div 
            ref={containerRef}
            className="flex items-center justify-center bg-muted/30 rounded-lg p-4 min-h-[400px]"
            onWheel={handleWheel}
          >
            {!isCanvasReady && (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">Loading image...</span>
              </div>
            )}
            <canvas
              ref={canvasRef}
              className={`border border-border rounded-lg shadow-sm ${!isCanvasReady ? 'hidden' : ''}`}
            />
          </div>

          {/* Annotation Toolbar */}
          <div className="space-y-4">
            {/* Tools */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={activeTool === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('select')}
              >
                <Move className="w-4 h-4 mr-1" />
                Select
              </Button>
              <Button
                variant={activeTool === 'arrow' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('arrow')}
              >
                <ArrowRight className="w-4 h-4 mr-1" />
                Arrow
              </Button>
              <Button
                variant={activeTool === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('text')}
              >
                <Type className="w-4 h-4 mr-1" />
                Text
              </Button>
              <Button
                variant={activeTool === 'circle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('circle')}
              >
                <CircleIcon className="w-4 h-4 mr-1" />
                Circle
              </Button>
              <Button
                variant={activeTool === 'rectangle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('rectangle')}
              >
                <Square className="w-4 h-4 mr-1" />
                Rectangle
              </Button>

              <div className="h-6 w-px bg-border mx-2" />

              {/* Zoom Controls */}
              <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoomLevel <= MIN_ZOOM}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomReset}>
                <RotateCcw className="w-4 h-4 mr-1" />
                {Math.round(zoomLevel * 100)}%
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoomLevel >= MAX_ZOOM}>
                <ZoomIn className="w-4 h-4" />
              </Button>

              <div className="h-6 w-px bg-border mx-2" />

              {/* Color Picker */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                >
                  <div 
                    className="w-4 h-4 rounded-full border border-border mr-1"
                    style={{ backgroundColor: activeColor }}
                  />
                  Color
                </Button>
                {showColorPicker && (
                  <Card className="absolute top-full mt-2 z-50">
                    <CardContent className="p-2">
                      <div className="grid grid-cols-4 gap-1">
                        {colors.map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded border-2 transition-all ${
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
              </div>

              {/* Delete */}
              <Button variant="outline" size="sm" onClick={deleteSelected}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            </div>

            {/* Instructions */}
            <div className="text-center bg-muted/30 rounded px-3 py-2">
              <p className="text-xs text-muted-foreground">
                {activeTool === 'select' && 'Click objects to select and move them • Use mouse wheel to zoom'}
                {activeTool === 'arrow' && 'Click and drag to draw an arrow'}
                {activeTool === 'text' && 'Click where you want to add text'}
                {activeTool === 'circle' && 'Click to add a circle highlight'}
                {activeTool === 'rectangle' && 'Click to add a rectangle'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button variant="outline" onClick={() => handleSaveAnnotations(true)} disabled={isSaving}>
                Keep Both
              </Button>
              <Button onClick={() => handleSaveAnnotations(false)} disabled={isSaving}>
                <Check className="w-4 h-4 mr-1" />
                Replace Original
              </Button>
            </div>
          </div>
        </div>

        {/* Text Input Dialog */}
        {showTextDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-80">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">Add Text</h3>
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter text..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addText();
                    if (e.key === 'Escape') {
                      setShowTextDialog(false);
                      setTextInput('');
                    }
                  }}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowTextDialog(false);
                      setTextInput('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={addText}>
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminPhotoEditor;

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Save, RotateCcw, Grid3X3, RotateCw, Undo2, Pen, X, Trash2, RotateCcw as UndoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { RoofDrawingOverlay, type RoofDrawingOverlayRef } from './RoofDrawingOverlay';

interface Line {
  id: string;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  length: number;
}

interface ImageryAlignerProps {
  children: React.ReactNode;
  quoteId?: string;
  initialTransform?: {
    offsetX: number;
    offsetY: number;
    rotation: number;
  };
  onTransformChange?: (transform: { offsetX: number; offsetY: number; rotation: number }) => void;
  initialLines?: Line[];
  onLinesChange?: (lines: Line[]) => void;
  className?: string;
}

export const ImageryAligner: React.FC<ImageryAlignerProps> = ({
  children,
  quoteId,
  initialTransform = { offsetX: 0, offsetY: 0, rotation: 0 },
  onTransformChange,
  initialLines = [],
  onLinesChange,
  className = "w-full h-96"
}) => {
  const [transform, setTransform] = useState(initialTransform);
  const [showGrid, setShowGrid] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lines, setLines] = useState<Line[]>(initialLines);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const drawingRef = useRef<RoofDrawingOverlayRef | null>(null);

  useEffect(() => {
    setTransform(initialTransform);
  }, [initialTransform]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const updateTransform = (newTransform: Partial<typeof transform>) => {
    const updated = { ...transform, ...newTransform };
    setTransform(updated);
    onTransformChange?.(updated);
  };

  // Movement functions
  const moveLeft = () => updateTransform({ offsetX: transform.offsetX - 10 });
  const moveRight = () => updateTransform({ offsetX: transform.offsetX + 10 });
  const moveUp = () => updateTransform({ offsetY: transform.offsetY - 10 });
  const moveDown = () => updateTransform({ offsetY: transform.offsetY + 10 });

  // Rotation functions
  const rotateLeft = () => updateTransform({ rotation: transform.rotation - 1 });
  const rotateRight = () => updateTransform({ rotation: transform.rotation + 1 });

  // Continuous action handlers
  const startContinuousAction = (action: () => void) => {
    action(); // Execute immediately
    intervalRef.current = setInterval(action, 100); // Continue every 100ms
  };

  const stopContinuousAction = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetAlignment = () => {
    const resetTransform = { offsetX: 0, offsetY: 0, rotation: 0 };
    setTransform(resetTransform);
    onTransformChange?.(resetTransform);
    toast.success('Alignment reset');
  };

  const handleLinesChange = (newLines: Line[]) => {
    setLines(newLines);
    onLinesChange?.(newLines);
  };

  const toggleDrawing = () => {
    setIsDrawing(!isDrawing);
    if (isDrawing) {
      toast.success('Drawing mode disabled');
    } else {
      toast.success('Drawing mode enabled - Click to start drawing lines');
    }
  };

  const cancelDrawing = () => {
    if (drawingRef.current?.cancelCurrentLine) {
      drawingRef.current.cancelCurrentLine();
    }
  };

  const clearAllLines = () => {
    if (drawingRef.current?.clearAllLines) {
      drawingRef.current.clearAllLines();
    }
  };

  const deleteLastLine = () => {
    if (drawingRef.current?.deleteLastLine) {
      drawingRef.current.deleteLastLine();
    }
  };

  const saveAlignment = async () => {
    if (!quoteId) {
      toast.error('No quote ID provided');
      return;
    }

    setIsSaving(true);
    try {
      const updateData: any = { imagery_transform: transform };
      
      // Save drawn lines if any exist
      if (lines.length > 0) {
        updateData.drawn_lines = lines;
      }

      const { error } = await supabase
        .from('quote_requests')
        .update(updateData)
        .eq('id', quoteId);

      if (error) throw error;
      
      toast.success('Alignment and drawings saved successfully');
    } catch (error) {
      console.error('Error saving alignment:', error);
      toast.error('Failed to save alignment');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`${className} relative overflow-hidden`}>
      {/* Controls */}
      <div className="absolute top-2 left-2 z-20 flex items-center space-x-2">
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="p-2 flex items-center space-x-1">
            {/* Grid Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              className={`p-1 h-8 w-8 ${showGrid ? 'bg-red-100 text-red-600' : ''}`}
              title="Toggle Grid"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            
            <div className="w-px h-6 bg-border" />
            
            {/* Drawing Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDrawing}
              className={`p-1 h-8 w-8 ${isDrawing ? 'bg-blue-100 text-blue-600' : ''}`}
              title="Toggle Drawing Mode"
            >
              <Pen className="w-4 h-4" />
            </Button>
            
            {isDrawing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelDrawing}
                  className="p-1 h-8 w-8"
                  title="Cancel Current Line"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deleteLastLine}
                  className="p-1 h-8 w-8"
                  title="Delete Last Line"
                >
                  <UndoIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllLines}
                  className="p-1 h-8 w-8 text-red-600"
                  title="Clear All Lines"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
            
            <div className="w-px h-6 bg-border" />
            
            {/* Movement Controls */}
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={() => startContinuousAction(moveUp)}
              onMouseUp={stopContinuousAction}
              onMouseLeave={stopContinuousAction}
              className="p-1 h-8 w-8"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <div className="flex flex-col items-center">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onMouseDown={() => startContinuousAction(moveLeft)}
                  onMouseUp={stopContinuousAction}
                  onMouseLeave={stopContinuousAction}
                  className="p-1 h-8 w-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onMouseDown={() => startContinuousAction(moveRight)}
                  onMouseUp={stopContinuousAction}
                  onMouseLeave={stopContinuousAction}
                  className="p-1 h-8 w-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={() => startContinuousAction(moveDown)}
              onMouseUp={stopContinuousAction}
              onMouseLeave={stopContinuousAction}
              className="p-1 h-8 w-8"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            
            <div className="w-px h-6 bg-border" />
            
            {/* Rotation Controls */}
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={() => startContinuousAction(rotateLeft)}
              onMouseUp={stopContinuousAction}
              onMouseLeave={stopContinuousAction}
              className="p-1 h-8 w-8"
              title="Rotate Left"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={() => startContinuousAction(rotateRight)}
              onMouseUp={stopContinuousAction}
              onMouseLeave={stopContinuousAction}
              className="p-1 h-8 w-8"
              title="Rotate Right"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            
            <div className="w-px h-6 bg-border" />
            
            {/* Reset & Save */}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAlignment}
              className="p-1 h-8 w-8"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            {quoteId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={saveAlignment}
                disabled={isSaving}
                className="p-1 h-8 w-8 text-green-600 hover:bg-green-100"
                title="Save"
              >
                <Save className="w-4 h-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Alignment Info */}
      <div className="absolute top-2 right-2 z-20">
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="p-2 text-xs text-muted-foreground">
            <div>X: {transform.offsetX}px, Y: {transform.offsetY}px</div>
            <div>Rotation: {transform.rotation}°</div>
            {lines.length > 0 && (
              <div className="mt-1 pt-1 border-t border-gray-200">
                Lines: {lines.length}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Imagery Container - Stationary viewport (RoofSnap approach) */}
      <div 
        className="w-full h-full relative flex items-center justify-center"
      >
        {/* Imagery wrapper with both rotation and translation applied directly */}
        <div
          className="absolute"
          style={{
            width: '500%',
            height: '500%',
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${transform.offsetX}px), calc(-50% + ${transform.offsetY}px)) rotate(${transform.rotation}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease-out'
          }}
        >
          {children}
        </div>
      </div>

      {/* Roof Drawing Overlay */}
      <RoofDrawingOverlay
        ref={drawingRef}
        isDrawing={isDrawing}
        onLinesChange={handleLinesChange}
        initialLines={initialLines}
        transform={transform}
      />

      {/* Red Grid Overlay */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {/* Vertical Center Line */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 opacity-80"
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          />
          
          {/* Horizontal Center Line */}
          <div 
            className="absolute left-0 right-0 h-0.5 bg-red-500 opacity-80"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          />
          
          {/* Quarter Grid Lines */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-400 opacity-60"
            style={{ left: '25%', transform: 'translateX(-50%)' }}
          />
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-400 opacity-60"
            style={{ left: '75%', transform: 'translateX(-50%)' }}
          />
          <div 
            className="absolute left-0 right-0 h-0.5 bg-red-400 opacity-60"
            style={{ top: '25%', transform: 'translateY(-50%)' }}
          />
          <div 
            className="absolute left-0 right-0 h-0.5 bg-red-400 opacity-60"
            style={{ top: '75%', transform: 'translateY(-50%)' }}
          />
          
          {/* Edge Lines for Reference */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-300 opacity-40" />
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-300 opacity-40" />
          <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-red-300 opacity-40" />
          <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-red-300 opacity-40" />
        </div>
      )}
    </div>
  );
};
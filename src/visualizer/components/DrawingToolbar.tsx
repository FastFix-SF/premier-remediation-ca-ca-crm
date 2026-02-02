import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  PaintBucket, 
  MousePointer, 
  Pencil, 
  Square, 
  Circle,
  Eraser,
  Undo2,
  Redo2,
  RotateCcw,
  Check,
  X
} from 'lucide-react';

export type DrawingTool = 'select' | 'freehand' | 'polygon' | 'rectangle' | 'circle' | 'eraser';

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onComplete: () => void;
  onCancel: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isDrawingMode: boolean;
  className?: string;
}

const toolConfig = [
  { id: 'select' as DrawingTool, icon: MousePointer, label: 'Select', description: 'Select and move objects' },
  { id: 'freehand' as DrawingTool, icon: Pencil, label: 'Freehand', description: 'Draw freehand lines' },
  { id: 'polygon' as DrawingTool, icon: PaintBucket, label: 'Polygon', description: 'Draw polygon shapes' },
  { id: 'rectangle' as DrawingTool, icon: Square, label: 'Rectangle', description: 'Draw rectangles' },
  { id: 'circle' as DrawingTool, icon: Circle, label: 'Circle', description: 'Draw circles' },
  { id: 'eraser' as DrawingTool, icon: Eraser, label: 'Eraser', description: 'Erase parts of the drawing' },
];

export const DrawingToolbar = ({
  activeTool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  onUndo,
  onRedo,
  onClear,
  onComplete,
  onCancel,
  canUndo,
  canRedo,
  isDrawingMode,
  className
}: DrawingToolbarProps) => {
  return (
    <Card className={`${className} bg-background/95 backdrop-blur-sm shadow-lg`}>
      <CardContent className="p-4 space-y-4">
        {/* Drawing Mode Status */}
        {isDrawingMode && (
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div>
              <h3 className="font-medium text-sm">Drawing Roof Outline</h3>
              <p className="text-xs text-muted-foreground">Use tools to create your mask</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {toolConfig.find(t => t.id === activeTool)?.label}
            </Badge>
          </div>
        )}

        {/* Drawing Tools */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tools</h4>
          <div className="grid grid-cols-3 gap-1">
            {toolConfig.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              
              return (
                <Button
                  key={tool.id}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={`
                    h-12 flex flex-col gap-1 p-2 
                    ${isActive ? 'shadow-sm' : ''}
                  `}
                  onClick={() => onToolChange(tool.id)}
                  title={tool.description}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{tool.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Brush Size Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Brush Size
            </h4>
            <Badge variant="outline" className="text-xs">
              {brushSize}px
            </Badge>
          </div>
          <Slider
            value={[brushSize]}
            onValueChange={(value) => onBrushSizeChange(value[0])}
            min={1}
            max={50}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Fine</span>
            <span>Thick</span>
          </div>
        </div>

        <Separator />

        {/* History Controls */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">History</h4>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="flex-1"
            >
              <Undo2 className="h-4 w-4 mr-1" />
              Undo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="flex-1"
            >
              <Redo2 className="h-4 w-4 mr-1" />
              Redo
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="w-full text-destructive hover:text-destructive"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>

        {/* Action Buttons */}
        {isDrawingMode && (
          <>
            <Separator />
            <div className="flex gap-2">
              <Button
                onClick={onComplete}
                size="sm"
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-1" />
                Complete
              </Button>
              <Button
                onClick={onCancel}
                variant="ghost"
                size="sm"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
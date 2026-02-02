import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface Point {
  x: number;
  y: number;
}

interface Line {
  id: string;
  startPoint: Point;
  endPoint: Point;
  length: number;
}

export interface RoofDrawingOverlayRef {
  clearAllLines: () => void;
  cancelCurrentLine: () => void;
  deleteLastLine: () => void;
}

interface RoofDrawingOverlayProps {
  isDrawing: boolean;
  onLinesChange?: (lines: Line[]) => void;
  initialLines?: Line[];
  transform?: {
    offsetX: number;
    offsetY: number;
    rotation: number;
  };
}

export const RoofDrawingOverlay = React.forwardRef<RoofDrawingOverlayRef, RoofDrawingOverlayProps>(({
  isDrawing,
  onLinesChange,
  initialLines = [],
  transform = { offsetX: 0, offsetY: 0, rotation: 0 }
}, ref) => {
  const [lines, setLines] = useState<Line[]>(initialLines);
  const [currentLine, setCurrentLine] = useState<{ start: Point; end: Point } | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [selectedEndpoint, setSelectedEndpoint] = useState<{ lineId: string; endpoint: 'start' | 'end' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [snap90Mode, setSnap90Mode] = useState(true); // Enabled by default
  const svgRef = useRef<SVGSVGElement>(null);

  const calculateLength = (start: Point, end: Point): number => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    return Math.sqrt(dx * dx + dy * dy); // 1 pixel = 1 foot for now
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const getMousePosition = (event: React.MouseEvent<SVGSVGElement>): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const snapTo90Degrees = (start: Point, end: Point): Point => {
    if (!snap90Mode) return end;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // If very close to start point, don't snap yet
    if (absDx < 5 && absDy < 5) return end;

    // Find the last completed line to determine perpendicular angles
    const lastLine = lines.length > 0 ? lines[lines.length - 1] : null;
    
    let snapAngles: number[] = [0, 90, 180, 270]; // Default: horizontal and vertical

    if (lastLine) {
      // Calculate angle of last line
      const lastDx = lastLine.endPoint.x - lastLine.startPoint.x;
      const lastDy = lastLine.endPoint.y - lastLine.startPoint.y;
      const lastAngle = Math.atan2(lastDy, lastDx) * (180 / Math.PI);
      
      // Add perpendicular angles (±90 degrees from last line)
      const perpAngle1 = (lastAngle + 90) % 360;
      const perpAngle2 = (lastAngle - 90 + 360) % 360;
      
      snapAngles = [0, 90, 180, 270, perpAngle1, perpAngle2];
    }

    // Calculate current angle
    const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    const normalizedAngle = (currentAngle + 360) % 360;

    // Find closest snap angle
    let closestAngle = snapAngles[0];
    let minDiff = Math.abs(normalizedAngle - closestAngle);

    for (const snapAngle of snapAngles) {
      const diff = Math.min(
        Math.abs(normalizedAngle - snapAngle),
        Math.abs(normalizedAngle - snapAngle + 360),
        Math.abs(normalizedAngle - snapAngle - 360)
      );
      
      if (diff < minDiff) {
        minDiff = diff;
        closestAngle = snapAngle;
      }
    }

    // Snap threshold: 15 degrees
    if (minDiff > 15) {
      // If horizontal/vertical is within threshold, prefer those
      const horizontalDiff = Math.min(Math.abs(normalizedAngle), Math.abs(normalizedAngle - 180));
      const verticalDiff = Math.min(Math.abs(normalizedAngle - 90), Math.abs(normalizedAngle - 270));
      
      if (horizontalDiff < 15) {
        closestAngle = absDx > absDy ? (dx > 0 ? 0 : 180) : closestAngle;
      } else if (verticalDiff < 15) {
        closestAngle = absDy > absDx ? (dy > 0 ? 90 : 270) : closestAngle;
      } else {
        return end; // Too far from any snap angle
      }
    }

    // Calculate distance to maintain
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Convert angle back to radians and calculate snapped point
    const snapRadians = closestAngle * (Math.PI / 180);
    
    return {
      x: start.x + distance * Math.cos(snapRadians),
      y: start.y + distance * Math.sin(snapRadians)
    };
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const pos = getMousePosition(event);
    setMousePos(pos);

    if (isDragging && selectedEndpoint) {
      const updatedLines = lines.map(line => {
        if (line.id === selectedEndpoint.lineId) {
          const newLine = { ...line };
          if (selectedEndpoint.endpoint === 'start') {
            newLine.startPoint = pos;
          } else {
            newLine.endPoint = pos;
          }
          newLine.length = calculateLength(newLine.startPoint, newLine.endPoint);
          return newLine;
        }
        return line;
      });
      setLines(updatedLines);
      onLinesChange?.(updatedLines);
    }
  };

  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || isDragging) return;

    const pos = getMousePosition(event);

    if (!currentLine) {
      // Start new line
      setCurrentLine({ start: pos, end: pos });
    } else {
      // Complete line with snapped endpoint
      const snappedEnd = snapTo90Degrees(currentLine.start, pos);
      const newLine: Line = {
        id: generateId(),
        startPoint: currentLine.start,
        endPoint: snappedEnd,
        length: calculateLength(currentLine.start, snappedEnd)
      };

      const updatedLines = [...lines, newLine];
      setLines(updatedLines);
      onLinesChange?.(updatedLines);
      setCurrentLine(null);
      
      toast.success(`Line added: ${Math.round(newLine.length)}ft`);
    }
  };

  const handleEndpointMouseDown = (lineId: string, endpoint: 'start' | 'end', event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedEndpoint({ lineId, endpoint });
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setSelectedEndpoint(null);
  };

  const handleDoubleClick = () => {
    if (currentLine) {
      setCurrentLine(null);
      toast.info('Drawing cancelled');
    }
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore keyboard shortcuts if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      if (event.key === 'Delete' && lines.length > 0) {
        const updatedLines = lines.slice(0, -1);
        setLines(updatedLines);
        onLinesChange?.(updatedLines);
        toast.success('Last line deleted');
      } else if (event.key === 'Escape' && currentLine) {
        setCurrentLine(null);
        toast.info('Drawing cancelled');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [lines, currentLine, onLinesChange]);

  // Update preview line end point as mouse moves
  useEffect(() => {
    if (currentLine && isDrawing) {
      const snappedEnd = snapTo90Degrees(currentLine.start, mousePos);
      setCurrentLine(prev => prev ? { ...prev, end: snappedEnd } : null);
    }
  }, [mousePos, isDrawing, currentLine?.start, snap90Mode, lines]);

  const clearAllLines = () => {
    setLines([]);
    setCurrentLine(null);
    onLinesChange?.([]);
    toast.success('All lines cleared');
  };

  const cancelCurrentLine = () => {
    setCurrentLine(null);
    toast.info('Current line cancelled');
  };

  const deleteLastLine = () => {
    if (lines.length > 0) {
      const updatedLines = lines.slice(0, -1);
      setLines(updatedLines);
      onLinesChange?.(updatedLines);
      toast.success('Last line deleted');
    }
  };

  // Expose methods for parent component
  React.useImperativeHandle(ref, () => ({
    clearAllLines,
    cancelCurrentLine,
    deleteLastLine
  }));

  return (
    <>
      <svg
        ref={svgRef}
        className={`absolute inset-0 w-full h-full z-30 ${isDrawing ? 'pointer-events-auto' : 'pointer-events-none'}`}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
      >
        {/* Completed Lines */}
        {lines.map((line) => (
          <g key={line.id}>
            {/* Line */}
            <line
              x1={line.startPoint.x}
              y1={line.startPoint.y}
              x2={line.endPoint.x}
              y2={line.endPoint.y}
              stroke="#ef4444"
              strokeWidth="2"
              className="pointer-events-none"
            />
            
            {/* Start Endpoint */}
            <circle
              cx={line.startPoint.x}
              cy={line.startPoint.y}
              r="4"
              fill="#ef4444"
              stroke="white"
              strokeWidth="2"
              className="cursor-move hover:fill-red-600"
              onMouseDown={(e) => handleEndpointMouseDown(line.id, 'start', e)}
            />
            
            {/* End Endpoint */}
            <circle
              cx={line.endPoint.x}
              cy={line.endPoint.y}
              r="4"
              fill="#ef4444"
              stroke="white"
              strokeWidth="2"
              className="cursor-move hover:fill-red-600"
              onMouseDown={(e) => handleEndpointMouseDown(line.id, 'end', e)}
            />

            {/* Measurement Label */}
            <text
              x={(line.startPoint.x + line.endPoint.x) / 2}
              y={(line.startPoint.y + line.endPoint.y) / 2 - 8}
              fill="#ef4444"
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
              className="pointer-events-none select-none"
              style={{ 
                filter: 'drop-shadow(1px 1px 1px rgba(255,255,255,0.8))',
              }}
            >
              {Math.round(line.length)}ft
            </text>
          </g>
        ))}

        {/* Current Drawing Line (Preview) */}
        {currentLine && isDrawing && (
          <g>
            <line
              x1={currentLine.start.x}
              y1={currentLine.start.y}
              x2={currentLine.end.x}
              y2={currentLine.end.y}
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="pointer-events-none"
            />
            <circle
              cx={currentLine.start.x}
              cy={currentLine.start.y}
              r="4"
              fill="#ef4444"
              stroke="white"
              strokeWidth="2"
              className="pointer-events-none"
            />
            
            {/* Preview measurement */}
            <text
              x={(currentLine.start.x + currentLine.end.x) / 2}
              y={(currentLine.start.y + currentLine.end.y) / 2 - 8}
              fill="#ef4444"
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
              className="pointer-events-none select-none"
              style={{ 
                filter: 'drop-shadow(1px 1px 1px rgba(255,255,255,0.8))',
              }}
            >
              {Math.round(calculateLength(currentLine.start, currentLine.end))}ft
            </text>
          </g>
        )}
      </svg>

      {/* Drawing Status */}
      {isDrawing && (
        <div className="absolute top-16 left-2 z-40 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="text-sm font-medium text-gray-700">
              {currentLine ? 'Click to complete line' : 'Click to start drawing'}
            </div>
            <button
              onClick={() => setSnap90Mode(!snap90Mode)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                snap90Mode 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              90° {snap90Mode ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="text-xs text-gray-500">
            {currentLine ? 'Double-click or Esc to cancel' : 'Press Delete to remove last line'}
          </div>
        </div>
      )}
    </>
  );
});

RoofDrawingOverlay.displayName = 'RoofDrawingOverlay';
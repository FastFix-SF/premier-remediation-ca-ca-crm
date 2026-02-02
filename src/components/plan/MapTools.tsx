import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RotateCcw, Compass, Home } from 'lucide-react';
import { MapCanvasGLHandle } from './MapCanvasGL';
interface MapToolsProps {
  mapRef: React.RefObject<MapCanvasGLHandle>;
  quoteCenter: [number, number];
  defaultZoom?: number;
  className?: string;
}
export function MapTools({
  mapRef,
  quoteCenter,
  defaultZoom = 19,
  className
}: MapToolsProps) {
  const [bearing, setBearing] = useState(0);
  const [zoom, setZoom] = useState(defaultZoom);
  useEffect(() => {
    // Update local state when map moves
    const updateState = () => {
      const state = mapRef.current?.getState();
      if (state) {
        setBearing(Math.round(state.bearing));
        setZoom(Math.round(state.zoom * 10) / 10);
      }
    };
    const interval = setInterval(updateState, 100);
    return () => clearInterval(interval);
  }, [mapRef]);
  const resetNorth = () => {
    mapRef.current?.setBearing(0);
    setBearing(0);
  };
  const recenter = () => {
    mapRef.current?.setCenter(quoteCenter);
    mapRef.current?.setZoom(defaultZoom);
    mapRef.current?.setBearing(0);
    setBearing(0);
    setZoom(defaultZoom);
  };
  return (
    <div className={className}>
      <div className="hidden bg-background/95 backdrop-blur-sm border rounded-lg p-4 space-y-4 shadow-lg">
        {/* Zoom Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Zoom</label>
            <span className="text-sm text-muted-foreground">{zoom.toFixed(1)}</span>
          </div>
          <Slider
            value={[zoom]}
            min={10}
            max={22}
            step={0.1}
            onValueChange={([value]) => {
              mapRef.current?.setZoom(value);
              setZoom(value);
            }}
            className="w-full"
          />
        </div>

        {/* Bearing Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Bearing</label>
            <span className="text-sm text-muted-foreground">{bearing}°</span>
          </div>
          <div className="flex items-center justify-center py-2">
            <Compass 
              className="h-8 w-8 text-primary transition-transform duration-200" 
              style={{ transform: `rotate(${bearing}deg)` }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-col gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={resetNorth}
            className="w-full justify-start"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset North
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={recenter}
            className="w-full justify-start"
          >
            <Home className="h-4 w-4 mr-2" />
            Recenter Map
          </Button>
        </div>
      </div>
    </div>
  );
}
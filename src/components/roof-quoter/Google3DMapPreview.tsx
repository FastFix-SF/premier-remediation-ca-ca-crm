import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RotateCw, Compass, Home, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Google3DMapPreviewProps {
  latitude: number;
  longitude: number;
}

export function Google3DMapPreview({ latitude, longitude }: Google3DMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerContainerRef = useRef<HTMLDivElement | null>(null);
  const map3DRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tilt, setTilt] = useState(60);
  const [heading, setHeading] = useState(0);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const orbitIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init3DMap = async () => {
      if (!containerRef.current) return;

      try {
        // Fetch API key from edge function
        const response = await supabase.functions.invoke('get-google-maps-key');
        
        if (response.error) {
          throw new Error('Failed to fetch Google Maps API key');
        }

        const { apiKey } = response.data;

        if (!apiKey) {
          throw new Error('Google Maps API key not configured');
        }

        const loader = new Loader({
          apiKey,
          version: 'alpha',
          libraries: ['maps3d'],
        });

        await loader.load();

        if (!isMounted || !containerRef.current) return;

        // @ts-ignore - Google Maps 3D API types
        const { Map3DElement } = await google.maps.importLibrary('maps3d');

        if (!isMounted || !containerRef.current) return;

        // Create the 3D map element
        const map3D = new Map3DElement({
          center: { 
            lat: latitude, 
            lng: longitude, 
            altitude: 100 
          },
          range: 200,
          tilt: tilt,
          heading: heading,
        });

        // Create inner container if it doesn't exist (isolate from React's DOM reconciliation)
        if (!innerContainerRef.current) {
          innerContainerRef.current = document.createElement('div');
          innerContainerRef.current.style.width = '100%';
          innerContainerRef.current.style.height = '100%';
          containerRef.current.appendChild(innerContainerRef.current);
        }

        // Clear and append to inner container (not React's container)
        innerContainerRef.current.innerHTML = '';
        innerContainerRef.current.appendChild(map3D);
        map3DRef.current = map3D;

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing 3D map:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load 3D map');
          setIsLoading(false);
        }
      }
    };

    init3DMap();

    return () => {
      isMounted = false;
      if (orbitIntervalRef.current) {
        clearInterval(orbitIntervalRef.current);
      }
      // Clean up inner container before React tries to reconcile
      if (innerContainerRef.current && containerRef.current?.contains(innerContainerRef.current)) {
        try {
          containerRef.current.removeChild(innerContainerRef.current);
        } catch (e) {
          // Ignore if already removed
        }
        innerContainerRef.current = null;
      }
      map3DRef.current = null;
    };
  }, [latitude, longitude]);

  // Update tilt when slider changes
  useEffect(() => {
    if (map3DRef.current) {
      map3DRef.current.tilt = tilt;
    }
  }, [tilt]);

  // Update heading when slider changes
  useEffect(() => {
    if (map3DRef.current) {
      map3DRef.current.heading = heading;
    }
  }, [heading]);

  const handlePresetView = (direction: 'N' | 'E' | 'S' | 'W') => {
    const headingMap = { N: 0, E: 90, S: 180, W: 270 };
    setHeading(headingMap[direction]);
  };

  const handleResetView = () => {
    setTilt(60);
    setHeading(0);
    if (map3DRef.current) {
      map3DRef.current.range = 200;
      map3DRef.current.center = { lat: latitude, lng: longitude, altitude: 100 };
    }
  };

  const toggleOrbit = () => {
    if (isOrbiting) {
      if (orbitIntervalRef.current) {
        clearInterval(orbitIntervalRef.current);
        orbitIntervalRef.current = null;
      }
      setIsOrbiting(false);
    } else {
      setIsOrbiting(true);
      orbitIntervalRef.current = window.setInterval(() => {
        setHeading((prev) => (prev + 1) % 360);
      }, 50);
    }
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center p-6">
          <p className="text-destructive font-medium mb-2">Failed to load 3D view</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 3D Map Container */}
      <div 
        ref={containerRef}
        className="flex-1 bg-muted rounded-lg overflow-hidden relative min-h-[400px]"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Loading 3D view...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {!isLoading && !error && (
        <div className="mt-4 space-y-4 p-4 bg-muted/50 rounded-lg">
          {/* Tilt Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Tilt Angle</Label>
              <span className="text-sm text-muted-foreground">{tilt}°</span>
            </div>
            <Slider
              value={[tilt]}
              onValueChange={(values) => setTilt(values[0])}
              min={0}
              max={67}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">0° = Top-down, 67° = Oblique view</p>
          </div>

          {/* Heading Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Heading / Bearing</Label>
              <span className="text-sm text-muted-foreground">{heading}°</span>
            </div>
            <Slider
              value={[heading]}
              onValueChange={(values) => setHeading(values[0])}
              min={0}
              max={359}
              step={1}
              className="w-full"
            />
          </div>

          {/* Quick View Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetView('N')}
                className="w-10"
              >
                N
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetView('E')}
                className="w-10"
              >
                E
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetView('S')}
                className="w-10"
              >
                S
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetView('W')}
                className="w-10"
              >
                W
              </Button>
            </div>

            <div className="flex-1" />

            <Button
              variant="outline"
              size="sm"
              onClick={toggleOrbit}
              className={isOrbiting ? 'bg-primary text-primary-foreground' : ''}
            >
              <RotateCw className={`w-4 h-4 mr-2 ${isOrbiting ? 'animate-spin' : ''}`} />
              {isOrbiting ? 'Stop' : 'Orbit'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetView}
            >
              <Home className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Usage Tips */}
          <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded">
            <p className="font-medium mb-1">💡 Navigation Tips:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Click and drag to rotate the view</li>
              <li>Scroll to zoom in/out</li>
              <li>Use N/E/S/W buttons for compass directions</li>
              <li>Orbit mode auto-rotates around the property</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

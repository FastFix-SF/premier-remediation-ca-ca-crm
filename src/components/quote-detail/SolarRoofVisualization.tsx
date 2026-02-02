import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2 } from 'lucide-react';

interface SolarSegment {
  segmentId: string;
  areaSqFt: number;
  areaSquares: number;
  pitch: string;
  pitchDegrees: number;
  azimuth: number;
  orientation: string;
  center: { latitude: number; longitude: number };
  boundingBox: {
    sw: { latitude: number; longitude: number };
    ne: { latitude: number; longitude: number };
  };
  perimeter: number;
  heightAtCenter: number;
  polygon?: { latitude: number; longitude: number }[];
}

interface SolarRoofVisualizationProps {
  segments: SolarSegment[];
  center: { latitude: number; longitude: number };
  apiKey: string;
  isFullscreen?: boolean;
}

const SEGMENT_COLORS = [
  '#FF6B35', // Orange
  '#FFD23F', // Yellow
  '#00D9FF', // Cyan
  '#7B68EE', // Purple
  '#FF1744', // Red
  '#00E676', // Green
  '#FFC400', // Amber
  '#00B0FF', // Blue
];

export function SolarRoofVisualization({ segments, center, apiKey, isFullscreen = false }: SolarRoofVisualizationProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);

  useEffect(() => {
    if (!mapRef.current || !apiKey || segments.length === 0) return;

    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['geometry', 'drawing'],
        });

        const { Map } = await loader.importLibrary('maps');
        const { Polygon } = await loader.importLibrary('maps');

        const map = new Map(mapRef.current!, {
          center: { lat: center.latitude, lng: center.longitude },
          zoom: 20,
          mapTypeId: 'satellite',
          tilt: 0,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        // Store map instance
        mapInstanceRef.current = map;

        // Draw each roof segment
        segments.forEach((segment, index) => {
          let paths: google.maps.LatLngLiteral[];
          
          // Use precise polygon if available, otherwise fallback to bounding box
          if (segment.polygon && segment.polygon.length >= 4) {
            paths = segment.polygon.map(p => ({ lat: p.latitude, lng: p.longitude }));
            console.log(`Using precise polygon for segment ${index + 1} with ${paths.length} points`);
          } else {
            const { sw, ne } = segment.boundingBox;
            paths = [
              { lat: sw.latitude, lng: sw.longitude },
              { lat: ne.latitude, lng: sw.longitude },
              { lat: ne.latitude, lng: ne.longitude },
              { lat: sw.latitude, lng: ne.longitude },
            ];
            console.log(`Using bounding box fallback for segment ${index + 1}`);
          }

          const polygon = new Polygon({
            paths: paths,
            strokeColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
            strokeOpacity: 1,
            strokeWeight: 3,
            fillColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
            fillOpacity: 0.4,
            map: map,
          });

          // Add click listener for segment info
          polygon.addListener('click', () => {
            setSelectedSegment(index);
          });

          polygon.addListener('mouseover', () => {
            polygon.setOptions({
              strokeWeight: 4,
              fillOpacity: 0.6,
            });
          });

          polygon.addListener('mouseout', () => {
            polygon.setOptions({
              strokeWeight: 3,
              fillOpacity: 0.4,
            });
          });

          // Add label at segment center
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 180px;">
                <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">Segment ${index + 1}</h3>
                <div style="font-size: 12px; line-height: 1.6;">
                  <div><strong>Area:</strong> ${segment.areaSqFt.toFixed(0)} ft²</div>
                  <div><strong>Pitch:</strong> ${segment.pitch}</div>
                  <div><strong>Orientation:</strong> ${segment.orientation}</div>
                  <div><strong>Azimuth:</strong> ${segment.azimuth}°</div>
                </div>
              </div>
            `,
            position: { lat: segment.center.latitude, lng: segment.center.longitude },
          });

          // Add marker at center
          const marker = new google.maps.Marker({
            position: { lat: segment.center.latitude, lng: segment.center.longitude },
            map: map,
            label: {
              text: `${index + 1}`,
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 'bold',
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading map:', error);
        setIsLoading(false);
      }
    };

    initMap();

    // Cleanup function
    return () => {
      mapInstanceRef.current = null;
    };
  }, [segments, center, apiKey]);

  return (
    <Card className="overflow-hidden">
      <div 
        ref={mapRef} 
        className={isFullscreen ? 'w-full h-full' : 'w-full h-[600px]'}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      
      {selectedSegment !== null && segments[selectedSegment] && (
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-4 h-4 rounded" 
              style={{ backgroundColor: SEGMENT_COLORS[selectedSegment % SEGMENT_COLORS.length] }}
            />
            <h4 className="font-semibold">Segment {selectedSegment + 1}</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Area:</span>
              <div className="font-medium">{segments[selectedSegment].areaSqFt.toFixed(0)} ft²</div>
            </div>
            <div>
              <span className="text-muted-foreground">Squares:</span>
              <div className="font-medium">{segments[selectedSegment].areaSquares.toFixed(1)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Pitch:</span>
              <div className="font-medium">{segments[selectedSegment].pitch}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Orientation:</span>
              <div className="font-medium">{segments[selectedSegment].orientation}</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

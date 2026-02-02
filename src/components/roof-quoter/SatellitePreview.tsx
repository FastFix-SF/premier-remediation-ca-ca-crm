import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface SatellitePreviewProps {
  latitude: number;
  longitude: number;
  tileUrl: string;
  vendorName: string;
  isSingleImage?: boolean;
  roofOutline?: number[][];
  onMapReady?: (map: maplibregl.Map) => void;
  enhancedImageUrl?: string | null;
}

export function SatellitePreview({ latitude, longitude, tileUrl, vendorName, isSingleImage = false, roofOutline, onMapReady, enhancedImageUrl }: SatellitePreviewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // For single image sources (like NASA), display the image directly
    if (isSingleImage) {
      setIsLoaded(true);
      return;
    }

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 512,
            maxzoom: 20,
          },
          'osm-overlay': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'satellite-layer',
            type: 'raster',
            source: 'satellite',
          },
          {
            id: 'streets-overlay',
            type: 'raster',
            source: 'osm-overlay',
            paint: {
              'raster-opacity': 0.35
            }
          }
        ],
      },
      center: [longitude, latitude],
      zoom: 19,
      maxZoom: 20,
      attributionControl: false,
    });

    map.current.on('load', () => {
      setIsLoaded(true);
      // Add a marker at the address location
      if (map.current) {
        // Add a pulsing highlight circle around the property
        map.current.addSource('property-highlight', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            }
          }
        });

        // Outer pulsing ring
        map.current.addLayer({
          id: 'property-highlight-pulse',
          type: 'circle',
          source: 'property-highlight',
          paint: {
            'circle-radius': 50,
            'circle-color': '#3b82f6',
            'circle-opacity': 0.15,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#2563eb',
            'circle-stroke-opacity': 0.4
          }
        });

        // Inner highlight circle
        map.current.addLayer({
          id: 'property-highlight-inner',
          type: 'circle',
          source: 'property-highlight',
          paint: {
            'circle-radius': 25,
            'circle-color': '#3b82f6',
            'circle-opacity': 0.25,
            'circle-stroke-width': 3,
            'circle-stroke-color': '#1d4ed8',
            'circle-stroke-opacity': 0.8
          }
        });

        // Create custom marker element with pulsing animation
        const markerEl = document.createElement('div');
        markerEl.className = 'property-marker-container';
        markerEl.innerHTML = `
          <div style="position: relative; width: 40px; height: 40px;">
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 60px;
              height: 60px;
              border-radius: 50%;
              background: rgba(59, 130, 246, 0.3);
              animation: pulse-ring 2s ease-out infinite;
            "></div>
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 40px;
              height: 40px;
              background: linear-gradient(135deg, #3b82f6, #1d4ed8);
              border-radius: 50% 50% 50% 0;
              transform: translate(-50%, -50%) rotate(-45deg);
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
              border: 3px solid white;
            ">
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(45deg);
                font-size: 16px;
              ">🏠</div>
            </div>
          </div>
        `;

        // Add CSS animation via style tag
        if (!document.getElementById('property-marker-styles')) {
          const styleTag = document.createElement('style');
          styleTag.id = 'property-marker-styles';
          styleTag.textContent = `
            @keyframes pulse-ring {
              0% {
                transform: translate(-50%, -50%) scale(0.8);
                opacity: 1;
              }
              100% {
                transform: translate(-50%, -50%) scale(2);
                opacity: 0;
              }
            }
          `;
          document.head.appendChild(styleTag);
        }

        // Create popup with property info
        const popup = new maplibregl.Popup({ 
          offset: [0, -25], 
          closeButton: true,
          closeOnClick: false,
          className: 'property-popup'
        }).setHTML(`
          <div style="padding: 8px; text-align: center;">
            <div style="font-weight: 600; font-size: 14px; color: #1e40af; margin-bottom: 4px;">
              📍 Target Property
            </div>
            <div style="font-size: 12px; color: #6b7280;">
              This is the address you entered
            </div>
          </div>
        `);

        // Add marker with popup
        const marker = new maplibregl.Marker({ element: markerEl })
          .setLngLat([longitude, latitude])
          .setPopup(popup)
          .addTo(map.current);

        // Open popup by default
        marker.togglePopup();

        // Draw roof outline if available
        if (roofOutline && roofOutline.length > 0) {
          map.current.addSource('roof-outline', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Polygon',
                coordinates: [roofOutline]
              }
            }
          });

          map.current.addLayer({
            id: 'roof-outline-fill',
            type: 'fill',
            source: 'roof-outline',
            paint: {
              'fill-color': '#3b82f6',
              'fill-opacity': 0.3
            }
          });

          map.current.addLayer({
            id: 'roof-outline-line',
            type: 'line',
            source: 'roof-outline',
            paint: {
              'line-color': '#2563eb',
              'line-width': 2
            }
          });
        }
      }
    });

    // Wait for map to be fully idle (all tiles loaded)
    map.current.on('idle', () => {
      if (map.current && onMapReady) {
        onMapReady(map.current);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [latitude, longitude, tileUrl, isSingleImage]);

  // Add enhanced image overlay when available
  useEffect(() => {
    if (!map.current || !enhancedImageUrl || !map.current.loaded()) return;

    const mapInstance = map.current;
    const sourceId = 'enhanced-overlay';
    const layerId = 'enhanced-overlay-layer';

    // Remove existing overlay if present
    if (mapInstance.getLayer(layerId)) {
      mapInstance.removeLayer(layerId);
    }
    if (mapInstance.getSource(sourceId)) {
      mapInstance.removeSource(sourceId);
    }

    // Get map bounds for the overlay coordinates
    const bounds = mapInstance.getBounds();
    const coordinates: [[number, number], [number, number], [number, number], [number, number]] = [
      [bounds.getWest(), bounds.getNorth()],
      [bounds.getEast(), bounds.getNorth()],
      [bounds.getEast(), bounds.getSouth()],
      [bounds.getWest(), bounds.getSouth()]
    ];

    // Add the enhanced image as an overlay
    mapInstance.addSource(sourceId, {
      type: 'image',
      url: enhancedImageUrl,
      coordinates: coordinates
    });

    mapInstance.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: {
        'raster-opacity': 0.75,
        'raster-fade-duration': 300
      }
    });

    console.log('Enhanced image overlay added to map');
  }, [enhancedImageUrl]);

  return (
    <div className="relative w-full h-full">
      {isSingleImage ? (
        <img 
          src={tileUrl} 
          alt={`${vendorName} satellite view`}
          className="w-full h-full object-cover rounded-lg"
          onLoad={() => {
            console.log(`${vendorName} image loaded successfully`);
            setIsLoaded(true);
          }}
          onError={(e) => {
            console.error(`${vendorName} image failed to load:`, e);
            setError(`Failed to load ${vendorName} imagery`);
            setIsLoaded(true);
          }}
        />
      ) : (
        <div ref={mapContainer} className="w-full h-full rounded-lg" />
      )}
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">Loading {vendorName}...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
          <div className="text-center text-sm text-destructive">
            <p>{error}</p>
            <p className="text-xs mt-2 text-muted-foreground">Check console for details</p>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import maplibregl, { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { GOOGLE_SATELLITE_TILE_URL } from "@/lib/tiles";
import { EdgeItem } from "@/config/edgeActions";
import { Button } from "../ui/button";
import { RotateCw, Lock, Unlock, Move } from "lucide-react";
import { detectPolygons } from "@/lib/polygonDetection";
import * as turf from "@turf/turf";
import { toast } from "sonner";

type LngLat = [number, number]; // [lng, lat]

export interface MapCanvasGLHandle {
  setCenter: (lngLat: LngLat) => void;
  setZoom: (z: number) => void;
  setBearing: (deg: number) => void;
  getState: () => { center: LngLat; zoom: number; bearing: number };
  project: (lngLat: LngLat) => { x: number; y: number };
  unproject: (pt: { x: number; y: number }) => LngLat;
  resize: () => void;
}

export interface Line {
  id: string;
  coords: LngLat[];
  edgeLabel: string;
  edgeLabels?: string[]; // Multiple labels for multi-select
  edgeColor: string;
  length: number;
}

export interface PlacedPin {
  id: string;
  position: LngLat;
  imageUrl: string;
  name: string;
  total?: number;
  unit?: string;
  category?: string;
  labor_cost?: number;
  material_cost?: number;
  coverage?: number;
  factor?: number;
}

export interface MapCanvasGLProps {
  initialCenter: LngLat;
  initialZoom?: number;
  initialBearing?: number;
  selectedEdgeAction?: EdgeItem | null;
  selectedLabels?: string[];
  lines?: Line[];
  mode?: 'draw' | 'edges' | 'facets' | 'pins';
  selectedFacet?: string | null;
  selectedFacetValue?: string | null;
  selectedPin?: any | null;
  initialFacets?: Record<number, string[]>;
  initialPitches?: Record<number, string>;
  initialPins?: any[];
  isDeleteMode?: boolean;
  isVertexDragMode?: boolean;
  isBrushMode?: boolean;
  onBrushStroke?: (strokes: Array<{x: number, y: number}>) => void;
  onLineClick?: (lineId: string) => void;
  onDeleteModeCancel?: () => void;
  solarSegments?: Array<{
    segmentId: string;
    boundingBox: {
      sw: { latitude: number; longitude: number };
      ne: { latitude: number; longitude: number };
    };
    pitch: string;
    orientation: string;
  }>;
  onMove?: (state: { center: LngLat; zoom: number; bearing: number }) => void;
  onLinesChange?: (lines: Line[]) => void;
  onMapClick?: (event: maplibregl.MapMouseEvent) => void;
  onStateChange?: (state: { facets?: Record<number, string[]>; pitches?: Record<number, string>; pins?: any[] }) => void;
  showGrid?: boolean;
  showLabels?: boolean;
  showLength?: boolean;
  showDebug?: boolean;
  isLocked?: boolean;
  onLockChange?: (locked: boolean) => void;
  onVertexMoveActiveChange?: (active: boolean) => void;
  className?: string;
  backgroundImageUrl?: string | null; // Enhanced imagery URL
  backgroundImageBounds?: { north: number; south: number; east: number; west: number } | null; // Saved bounds for accurate overlay
}

const MapCanvasGL = forwardRef<MapCanvasGLHandle, MapCanvasGLProps>(function MapCanvasGL(
  {
    initialCenter,
    initialZoom = 19,
    initialBearing = 0,
    selectedEdgeAction,
    selectedLabels = [],
    lines: externalLines,
    mode = 'draw',
    selectedFacet,
    selectedFacetValue,
    selectedPin,
    initialFacets = {},
    initialPitches = {},
    initialPins = [],
    isDeleteMode = false,
    isVertexDragMode = false,
    isBrushMode = false,
    onBrushStroke,
    onLineClick,
    onDeleteModeCancel,
    solarSegments,
    onMove,
    onLinesChange,
    onMapClick,
    onStateChange,
    showGrid = true,
    showLabels = true,
    showLength = true,
    showDebug = false,
    isLocked = false,
    onLockChange,
    onVertexMoveActiveChange,
    className,
    backgroundImageUrl,
    backgroundImageBounds,
  },
  ref
) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  const [bearing, setBearing] = useState(initialBearing);
  const [zoom, setZoom] = useState(initialZoom);
  const [brushStrokes, setBrushStrokes] = useState<Array<{x: number, y: number}>>([]);
  const [isBrushing, setIsBrushing] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isPanMode, setIsPanMode] = useState(false); // Separate pan mode that works even when locked
  const [isRightClickPanning, setIsRightClickPanning] = useState(false); // Track right-click pan state

  // Drawing state - Two-click segment mode (RoofSnap style)
  const [drawingActive, setDrawingActive] = useState(false);
  const [currentPath, setCurrentPath] = useState<LngLat[]>([]); // 0 or 1 point (start point)
  const [previewPoint, setPreviewPoint] = useState<LngLat | null>(null);
  const [snap90Mode, setSnap90Mode] = useState(true); // 90-degree snapping enabled by default
  const [lines, setLines] = useState<Line[]>([]);
  const [detectedPolygons, setDetectedPolygons] = useState<any[]>([]); // Auto-detected from lines
  const [dormerPolygonIndices, setDormerPolygonIndices] = useState<Set<number>>(new Set()); // Track which polygons are dormers
  const [polygonFacets, setPolygonFacets] = useState<Record<number, string[]>>(initialFacets); // Facet labels array (DM, RM, etc.)
  const [polygonPitches, setPolygonPitches] = useState<Record<number, string>>(initialPitches); // Pitch numbers (3, 4, etc.)
  const [placedPins, setPlacedPins] = useState<PlacedPin[]>(initialPins); // Track placed pin stickers
  const [pinImages, setPinImages] = useState<Record<string, HTMLImageElement>>({}); // Preloaded pin images
  const pinCounterRef = useRef(1); // Counter for numbering pins
  
  // Track dragging to prevent drawing during map rotation/pan
  const [isDragging, setIsDragging] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const mapMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track vertex dragging
  const [draggedVertex, setDraggedVertex] = useState<{ position: LngLat; lineIndices: number[] } | null>(null);
  const [originalVertexPosition, setOriginalVertexPosition] = useState<LngLat | null>(null);
  const [snapTarget, setSnapTarget] = useState<{ position: LngLat; lineIndices: number[] } | null>(null);
  const cancelCooldownRef = useRef<boolean>(false);

  // Notify parent when vertex move mode is active (for crosshair overlay)
  useEffect(() => {
    onVertexMoveActiveChange?.(Boolean(draggedVertex));
  }, [draggedVertex, onVertexMoveActiveChange]);


  // Track whether state was initialized from props to prevent calling onStateChange during initial sync
  const isInitialized = useRef(false);
  // Separate refs: one for tracking incoming props, one for tracking outgoing state
  const incomingFacetsRef = useRef(initialFacets);
  const incomingPitchesRef = useRef(initialPitches);
  const incomingPinsRef = useRef(initialPins);
  const outgoingFacetsRef = useRef(initialFacets);
  const outgoingPitchesRef = useRef(initialPitches);
  const outgoingPinsRef = useRef(initialPins);
  
  // Mark as initialized after first render
  useEffect(() => {
    isInitialized.current = true;
  }, []);

  // Sync from parent (for undo/redo) - only update if truly different from what we have
  useEffect(() => {
    const propsChanged = JSON.stringify(initialFacets) !== JSON.stringify(incomingFacetsRef.current);
    const notOurOwnEcho = JSON.stringify(initialFacets) !== JSON.stringify(outgoingFacetsRef.current);
    
    // Only sync if props changed AND it's not just an echo of our own change
    if (propsChanged && notOurOwnEcho) {
      console.log('📥 Syncing facets from parent (undo/redo):', initialFacets);
      incomingFacetsRef.current = initialFacets;
      outgoingFacetsRef.current = initialFacets; // Also update outgoing to match
      setPolygonFacets(initialFacets);
    } else if (propsChanged) {
      // Just update the ref without triggering state change (it's our own echo)
      incomingFacetsRef.current = initialFacets;
    }
  }, [initialFacets]);

  useEffect(() => {
    const propsChanged = JSON.stringify(initialPitches) !== JSON.stringify(incomingPitchesRef.current);
    const notOurOwnEcho = JSON.stringify(initialPitches) !== JSON.stringify(outgoingPitchesRef.current);
    
    if (propsChanged && notOurOwnEcho) {
      console.log('📥 Syncing pitches from parent (undo/redo):', initialPitches);
      incomingPitchesRef.current = initialPitches;
      outgoingPitchesRef.current = initialPitches;
      setPolygonPitches(initialPitches);
    } else if (propsChanged) {
      incomingPitchesRef.current = initialPitches;
    }
  }, [initialPitches]);

  useEffect(() => {
    const propsChanged = JSON.stringify(initialPins) !== JSON.stringify(incomingPinsRef.current);
    const notOurOwnEcho = JSON.stringify(initialPins) !== JSON.stringify(outgoingPinsRef.current);
    
    if (propsChanged && notOurOwnEcho) {
      console.log('📥 Syncing pins from parent (undo/redo):', initialPins);
      incomingPinsRef.current = initialPins;
      outgoingPinsRef.current = initialPins;
      setPlacedPins(initialPins);
    } else if (propsChanged) {
      incomingPinsRef.current = initialPins;
    }
  }, [initialPins]);

  // Only notify parent when state changes due to user interaction (not prop sync)
  useEffect(() => {
    if (isInitialized.current && JSON.stringify(polygonFacets) !== JSON.stringify(outgoingFacetsRef.current)) {
      console.log('📤 Notifying parent of facets change:', polygonFacets);
      outgoingFacetsRef.current = polygonFacets;
      onStateChange?.({ facets: polygonFacets });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polygonFacets]);

  useEffect(() => {
    if (isInitialized.current && JSON.stringify(polygonPitches) !== JSON.stringify(outgoingPitchesRef.current)) {
      console.log('📤 Notifying parent of pitches change:', polygonPitches);
      outgoingPitchesRef.current = polygonPitches;
      onStateChange?.({ pitches: polygonPitches });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polygonPitches]);

  useEffect(() => {
    if (isInitialized.current && JSON.stringify(placedPins) !== JSON.stringify(outgoingPinsRef.current)) {
      console.log('📤 Notifying parent of pins change:', placedPins);
      outgoingPinsRef.current = placedPins;
      onStateChange?.({ pins: placedPins });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placedPins]);

  // Sync lines with external prop (for undo/redo functionality)
  useEffect(() => {
    if (externalLines !== undefined) {
      setLines(externalLines);
    }
  }, [externalLines]);

  // Preload pin image when selected
  useEffect(() => {
    if (selectedPin?.picture && !pinImages[selectedPin.picture]) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setPinImages(prev => ({ ...prev, [selectedPin.picture]: img }));
      };
      img.src = selectedPin.picture;
    }
  }, [selectedPin, pinImages]);

  // Auto-detect polygons when in facets mode
  useEffect(() => {
    if (mode === 'facets' && lines.length >= 3) {
      console.log('Detecting polygons from', lines.length, 'lines');
      
      // Helper function to check if a point is connected to other lines
      const isPointConnected = (coord: LngLat, allLines: typeof lines): boolean => {
        let count = 0;
        allLines.forEach(l => {
          const isStartMatch = Math.abs(l.coords[0][0] - coord[0]) < 0.00000001 && 
                                Math.abs(l.coords[0][1] - coord[1]) < 0.00000001;
          const isEndMatch = Math.abs(l.coords[l.coords.length - 1][0] - coord[0]) < 0.00000001 && 
                             Math.abs(l.coords[l.coords.length - 1][1] - coord[1]) < 0.00000001;
          if (isStartMatch || isEndMatch) count++;
        });
        return count > 1; // Connected if more than one line uses this point
      };
      
      // Filter out lines with unconnected endpoints (red dots) - only use fully connected lines for polygon detection
      const fullyConnectedLines = lines.filter(line => {
        const startConnected = isPointConnected(line.coords[0], lines);
        const endConnected = isPointConnected(line.coords[line.coords.length - 1], lines);
        return startConnected && endConnected;
      });
      
      console.log(`Filtered to ${fullyConnectedLines.length} fully connected lines (from ${lines.length} total)`);
      
      const polygons = detectPolygons(fullyConnectedLines);
      console.log('Detected polygons:', polygons);
      setDetectedPolygons(polygons);
    } else {
      setDetectedPolygons([]);
    }
  }, [mode, lines]);

  // Calculate geodesic distance using Haversine formula
  const calculateGeoDistance = useCallback((points: LngLat[]): number => {
    if (points.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const [lng1, lat1] = points[i - 1];
      const [lng2, lat2] = points[i];
      
      const R = 6371000; // Earth radius in meters
      const lat1Rad = lat1 * Math.PI / 180;
      const lat2Rad = lat2 * Math.PI / 180;
      const deltaLat = (lat2 - lat1) * Math.PI / 180;
      const deltaLng = (lng2 - lng1) * Math.PI / 180;
      
      const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      
      totalDistance += R * c; // meters
    }
    
    return totalDistance * 3.28084; // Convert to feet
  }, []);

  // Helper: resize canvas to exactly cover the map
  const resizeCanvas = useCallback(() => {
    const c = canvasRef.current;
    const wrap = wrapRef.current;
    if (!c || !wrap) return;
    
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    const newWidth = Math.max(1, Math.round(rect.width * dpr));
    const newHeight = Math.max(1, Math.round(rect.height * dpr));
    
    if (c.width !== newWidth || c.height !== newHeight) {
      c.width = newWidth;
      c.height = newHeight;
      c.style.width = rect.width + "px";
      c.style.height = rect.height + "px";
      const ctx = c.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    drawAll();
  }, []);

  // Map init ONCE
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const style = {
      version: 8,
      sources: {
        'google-satellite': {
          type: "raster",
          tiles: [GOOGLE_SATELLITE_TILE_URL],
          tileSize: 256,
          maxzoom: 22,
          attribution: "© Google",
        },
      },
      layers: [{ 
        id: "satellite", 
        type: "raster", 
        source: "google-satellite",
        paint: {
          "raster-opacity": 1,
          "raster-brightness-min": 0,
          "raster-brightness-max": 1,
          "raster-contrast": 0,
          "raster-saturation": 0,
        }
      }],
    } as maplibregl.StyleSpecification;

    const map = new maplibregl.Map({
      container: mapDivRef.current,
      style,
      center: initialCenter,
      zoom: initialZoom,
      bearing: initialBearing,
      pitch: 0,
      dragRotate: true,
      pitchWithRotate: false,
      cooperativeGestures: false,
      attributionControl: false,
      bearingSnap: 0,
      preserveDrawingBuffer: true, // Required for canvas screenshots
    });

    // Store map reference immediately
    mapRef.current = map;
    
    // Explicitly enable rotation
    map.touchZoomRotate.enableRotation();
    map.dragRotate.enable();

    // NavigationControl removed - using custom rotation buttons

    map.on("load", () => {
      resizeCanvas();
      
      // Load background image if provided (AI-enhanced imagery)
      if (backgroundImageUrl) {
        console.log('🖼️ Loading background image:', backgroundImageUrl);
        
        // Reset to flat top-down view for enhanced imagery
        map.easeTo({
          pitch: 0,
          bearing: 0,
          duration: 500
        });
        console.log('📐 Reset to flat top-down view');
        
        try {
          const bounds = map.getBounds();
          const sourceId = 'enhanced-background';
          const layerId = 'enhanced-background-layer';
          
          // Hide satellite tiles when using enhanced background
          if (map.getLayer('satellite')) {
            map.setPaintProperty('satellite', 'raster-opacity', 0);
            console.log('🙈 Hidden satellite tiles for enhanced background');
          }
          
          // Add background image source
          const coordinates: [[number, number], [number, number], [number, number], [number, number]] = [
            [bounds.getWest(), bounds.getNorth()],
            [bounds.getEast(), bounds.getNorth()],
            [bounds.getEast(), bounds.getSouth()],
            [bounds.getWest(), bounds.getSouth()]
          ];
          
          map.addSource(sourceId, {
            type: 'image',
            url: backgroundImageUrl,
            coordinates: coordinates
          });
          
          // Add background layer on top of satellite
          map.addLayer({
            id: layerId,
            type: 'raster',
            source: sourceId,
            paint: {
              'raster-opacity': 1,
              'raster-fade-duration': 0
            }
          });
          
          console.log('✅ Enhanced background image loaded successfully');
        } catch (error) {
          console.error('❌ Error loading background image:', error);
        }
      }
      
      if (onMove) {
        onMove({ 
          center: [map.getCenter().lng, map.getCenter().lat], 
          zoom: map.getZoom(), 
          bearing: map.getBearing() 
        });
      }
    });

    const onAnyMove = () => {
      const newBearing = map.getBearing();
      const newZoom = map.getZoom();
      setBearing(newBearing);
      setZoom(newZoom);
      
      // Set map moving flag and clear preview during movement
      setIsMapMoving(true);
      setPreviewPoint(null);
      
      // Clear any existing timeout
      if (mapMoveTimeoutRef.current) {
        clearTimeout(mapMoveTimeoutRef.current);
      }
      
      // Reset moving flag after movement stops
      mapMoveTimeoutRef.current = setTimeout(() => {
        setIsMapMoving(false);
      }, 100);
      
      drawAll();
      if (onMove) {
        onMove({ 
          center: [map.getCenter().lng, map.getCenter().lat], 
          zoom: newZoom, 
          bearing: newBearing 
        });
      }
    };

    map.on("move", onAnyMove);
    map.on("zoom", onAnyMove);
    map.on("rotate", onAnyMove);
    map.on("resize", () => { resizeCanvas(); });

    return () => {
      map.remove();
      mapRef.current = null;
      // Clean up timeout
      if (mapMoveTimeoutRef.current) {
        clearTimeout(mapMoveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only initialize once on mount - initial values should not trigger re-init

  useEffect(() => {
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // Handle background image changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;
    
    const sourceId = 'enhanced-background';
    const layerId = 'enhanced-background-layer';
    
    // Remove existing background
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
    
    if (backgroundImageUrl) {
      console.log('🔄 Updating background image:', backgroundImageUrl);
      
      // Reset to flat top-down view for enhanced imagery
      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 500
      });
      console.log('📐 Reset to flat top-down view');
      
      try {
        const bounds = map.getBounds();
        
        // Hide satellite tiles when using enhanced background
        if (map.getLayer('satellite')) {
          map.setPaintProperty('satellite', 'raster-opacity', 0);
        }
        
        // Add background image source
        // Use saved bounds if available, otherwise use current map bounds
        const coordinates: [[number, number], [number, number], [number, number], [number, number]] = backgroundImageBounds 
          ? [
              [backgroundImageBounds.west, backgroundImageBounds.north],
              [backgroundImageBounds.east, backgroundImageBounds.north],
              [backgroundImageBounds.east, backgroundImageBounds.south],
              [backgroundImageBounds.west, backgroundImageBounds.south]
            ]
          : [
              [bounds.getWest(), bounds.getNorth()],
              [bounds.getEast(), bounds.getNorth()],
              [bounds.getEast(), bounds.getSouth()],
              [bounds.getWest(), bounds.getSouth()]
            ];
        
        map.addSource(sourceId, {
          type: 'image',
          url: backgroundImageUrl,
          coordinates: coordinates
        });
        
        // Add background layer
        map.addLayer({
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: {
            'raster-opacity': 1,
            'raster-fade-duration': 0
          }
        });
        
        console.log('✅ Background image updated successfully');
      } catch (error) {
        console.error('❌ Error updating background image:', error);
      }
    } else {
      // Restore satellite tiles if no background image
      if (map.getLayer('satellite')) {
        map.setPaintProperty('satellite', 'raster-opacity', 1);
        console.log('👁️ Restored satellite tiles');
      }
    }
  }, [backgroundImageUrl, backgroundImageBounds]);

  // Expose handle methods
  useImperativeHandle(ref, () => ({
    setCenter(lngLat: LngLat) { 
      mapRef.current?.setCenter(lngLat); 
    },
    setZoom(z: number) { 
      mapRef.current?.setZoom(z); 
    },
    setBearing(deg: number) { 
      mapRef.current?.setBearing(deg); 
    },
    getState() {
      const m = mapRef.current!;
      const c = m.getCenter();
      return { 
        center: [c.lng, c.lat], 
        zoom: m.getZoom(), 
        bearing: m.getBearing() 
      };
    },
    project(lngLat: LngLat) {
      const p = mapRef.current!.project({ lng: lngLat[0], lat: lngLat[1] });
      return { x: p.x, y: p.y };
    },
    unproject(pt: { x: number; y: number }) {
      const ll = mapRef.current!.unproject([pt.x, pt.y]);
      return [ll.lng, ll.lat];
    },
    resize() {
      mapRef.current?.resize();
      resizeCanvas();
    },
  }));

  // ResizeObserver to automatically resize map when container size changes (e.g., fullscreen toggle)
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const handleResize = () => {
      // Use requestAnimationFrame for smoother resize handling
      requestAnimationFrame(() => {
        mapRef.current?.resize();
        resizeCanvas();
      });
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(wrap);

    return () => {
      observer.disconnect();
    };
  }, [resizeCanvas]);

  // Project helpers
  const project = (lnglat: LngLat) => {
    if (!mapRef.current) return { x: 0, y: 0 };
    return mapRef.current.project({ lng: lnglat[0], lat: lnglat[1] });
  };

  const unproject = useCallback((pt: { x: number; y: number }): LngLat => {
    if (!mapRef.current) return initialCenter;
    const ll = mapRef.current.unproject([pt.x, pt.y]);
    return [ll.lng, ll.lat];
  }, [initialCenter]);

  // 45° angle snapping helper
  const snap45 = (angleDeg: number): number => {
    return Math.round(angleDeg / 45) * 45;
  };

  // 90° snapping helper for drawing straight lines
  const snapTo90Degrees = useCallback((start: LngLat, end: LngLat): LngLat => {
    if (!snap90Mode) return end;

    // Project to screen coordinates for angle calculation
    const startPt = project(start);
    const endPt = project(end);
    
    const dx = endPt.x - startPt.x;
    const dy = endPt.y - startPt.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // If very close to start point, don't snap yet
    if (absDx < 5 && absDy < 5) return end;

    // Find the last completed line to determine perpendicular angles
    const lastLine = lines.length > 0 ? lines[lines.length - 1] : null;
    
    let snapAngles: number[] = [0, 90, 180, 270]; // Default: horizontal and vertical

    if (lastLine && lastLine.coords.length === 2) {
      // Calculate angle of last line in screen coordinates
      const lastStartPt = project(lastLine.coords[0]);
      const lastEndPt = project(lastLine.coords[1]);
      const lastDx = lastEndPt.x - lastStartPt.x;
      const lastDy = lastEndPt.y - lastStartPt.y;
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
    
    const snappedScreenPt = {
      x: startPt.x + distance * Math.cos(snapRadians),
      y: startPt.y + distance * Math.sin(snapRadians)
    };

    // Convert back to geo coordinates
    return unproject(snappedScreenPt);
  }, [snap90Mode, lines, project, unproject]);

  // Helper function to calculate adjusted area for a polygon (subtracting dormers)
  const getAdjustedArea = useCallback((polygonIndex: number): number => {
    const polygon = detectedPolygons[polygonIndex];
    if (!polygon || !polygon.area) return 0;
    
    let adjustedArea = polygon.area;
    
    // Check if this polygon contains any dormers and subtract their areas
    dormerPolygonIndices.forEach(dormerIndex => {
      if (dormerIndex === polygonIndex) return; // Skip if checking a dormer itself
      
      const dormerPolygon = detectedPolygons[dormerIndex];
      if (!dormerPolygon) return;
      
      // Check if this polygon (polygonIndex) contains the dormer
      try {
        const coords1 = [...polygon.coords.map(c => Array.isArray(c) ? [c[0], c[1]] : [(c as any).lng, (c as any).lat]), 
                         Array.isArray(polygon.coords[0]) ? [polygon.coords[0][0], polygon.coords[0][1]] : [(polygon.coords[0] as any).lng, (polygon.coords[0] as any).lat]];
        const coords2 = [...dormerPolygon.coords.map(c => Array.isArray(c) ? [c[0], c[1]] : [(c as any).lng, (c as any).lat]), 
                         Array.isArray(dormerPolygon.coords[0]) ? [dormerPolygon.coords[0][0], dormerPolygon.coords[0][1]] : [(dormerPolygon.coords[0] as any).lng, (dormerPolygon.coords[0] as any).lat]];
        
        const turfPoly1 = turf.polygon([coords1]);
        const turfPoly2 = turf.polygon([coords2]);
        
        // If this polygon contains the dormer, subtract the dormer's area
        if (turf.booleanWithin(turfPoly2, turfPoly1)) {
          adjustedArea -= dormerPolygon.area;
        }
      } catch (error) {
        console.warn('Error calculating adjusted area:', error);
      }
    });
    
    return Math.max(0, adjustedArea); // Ensure non-negative
  }, [detectedPolygons, dormerPolygonIndices]);

  // Drawing
  const drawAll = useCallback(() => {
    const c = canvasRef.current;
    if (!c || !mapRef.current) return;
    
    const ctx = c.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, c.width, c.height);

    // Save context state
    ctx.save();
    
    // Create clipping region that excludes the bottom 80px (metrics bar area)
    const metricsBarHeight = 80;
    const clipHeight = c.height - metricsBarHeight;
    ctx.beginPath();
    ctx.rect(0, 0, c.width, clipHeight);
    ctx.clip();

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      
      for (let i = 0; i <= c.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, c.height);
        ctx.stroke();
      }
      
      for (let i = 0; i <= c.height; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(c.width, i);
        ctx.stroke();
      }
    }

    // Draw Solar API segments overlay
    if (solarSegments && solarSegments.length > 0) {
      solarSegments.forEach((segment, index) => {
        const sw: LngLat = [segment.boundingBox.sw.longitude, segment.boundingBox.sw.latitude];
        const ne: LngLat = [segment.boundingBox.ne.longitude, segment.boundingBox.ne.latitude];
        const nw: LngLat = [sw[0], ne[1]];
        const se: LngLat = [ne[0], sw[1]];
        
        const swPt = project(sw);
        const nePt = project(ne);
        const nwPt = project(nw);
        const sePt = project(se);
        
        // Draw semi-transparent rectangle
        ctx.fillStyle = 'rgba(255, 200, 0, 0.15)'; // Yellow overlay
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.8)'; // Yellow border
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        
        ctx.beginPath();
        ctx.moveTo(swPt.x, swPt.y);
        ctx.lineTo(sePt.x, sePt.y);
        ctx.lineTo(nePt.x, nePt.y);
        ctx.lineTo(nwPt.x, nwPt.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw label with segment info
        const centerX = (swPt.x + nePt.x) / 2;
        const centerY = (swPt.y + nePt.y) / 2;
        
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw background for text
        const text = `${segment.pitch} • ${segment.orientation}`;
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width + 8;
        const textHeight = 20;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(
          centerX - textWidth / 2,
          centerY - textHeight / 2,
          textWidth,
          textHeight
        );
        
        // Draw text
        ctx.fillStyle = '#FFD700'; // Gold color
        ctx.fillText(text, centerX, centerY);
      });
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw detected polygons in facets mode
    if (mode === 'facets' && detectedPolygons.length > 0) {
      console.log('Drawing', detectedPolygons.length, 'polygons');
      
      // First pass: Draw all polygons in light sky blue
      detectedPolygons.forEach((polygon, index) => {
        if (!polygon.coords || polygon.coords.length < 3) return;
        
        console.log('Polygon', index, 'has', polygon.coords.length, 'coords');
        const projectedCoords = polygon.coords.map((coord: LngLat) => project(coord));
        
        // Check if this polygon has a facet or pitch label
        const polygonFacetValue = polygonFacets[index];
        const currentFacets = Array.isArray(polygonFacetValue) ? polygonFacetValue : (polygonFacetValue ? [polygonFacetValue] : []);
        const isRemoved = currentFacets.includes('RM');
        
        // Draw all polygons in light sky blue by default
        if (isRemoved) {
          ctx.fillStyle = 'transparent';
          ctx.strokeStyle = 'rgba(96, 165, 250, 0.8)';
        } else {
          ctx.fillStyle = 'rgba(191, 219, 254, 0.3)';
          ctx.strokeStyle = 'rgba(96, 165, 250, 0.8)';
        }
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.moveTo(projectedCoords[0].x, projectedCoords[0].y);
        for (let i = 1; i < projectedCoords.length; i++) {
          ctx.lineTo(projectedCoords[i].x, projectedCoords[i].y);
        }
        ctx.closePath();
        if (!isRemoved) {
          ctx.fill(); // Only fill if not removed
        }
        ctx.stroke();
      });
      
      // Helper function to check if two polygons share a complete edge
      const shareEdge = (poly1: any, poly2: any): boolean => {
        const pointsEqual = (p1: any, p2: any, tolerance = 0.000001): boolean => {
          const lng1 = Array.isArray(p1) ? p1[0] : p1.lng;
          const lat1 = Array.isArray(p1) ? p1[1] : p1.lat;
          const lng2 = Array.isArray(p2) ? p2[0] : p2.lng;
          const lat2 = Array.isArray(p2) ? p2[1] : p2.lat;
          return Math.abs(lng1 - lng2) < tolerance && Math.abs(lat1 - lat2) < tolerance;
        };

        // Check if any edge from poly1 matches any edge from poly2
        for (let i = 0; i < poly1.coords.length; i++) {
          const p1a = poly1.coords[i];
          const p1b = poly1.coords[(i + 1) % poly1.coords.length];
          
          for (let j = 0; j < poly2.coords.length; j++) {
            const p2a = poly2.coords[j];
            const p2b = poly2.coords[(j + 1) % poly2.coords.length];
            
            // Check if edges match (in either direction)
            if ((pointsEqual(p1a, p2a) && pointsEqual(p1b, p2b)) ||
                (pointsEqual(p1a, p2b) && pointsEqual(p1b, p2a))) {
              return true;
            }
          }
        }
        return false;
      };

      // Third pass: Draw intersection areas between polygons (actual overlaps only)
      for (let i = 0; i < detectedPolygons.length; i++) {
        const poly1 = detectedPolygons[i];
        if (!poly1.coords || poly1.coords.length < 3) continue;
        
        const facetValue1 = polygonFacets[i];
        const currentFacets1 = Array.isArray(facetValue1) ? facetValue1 : (facetValue1 ? [facetValue1] : []);
        const isRemoved1 = currentFacets1.includes('RM');
        if (isRemoved1) continue;
        
        for (let j = i + 1; j < detectedPolygons.length; j++) {
          const poly2 = detectedPolygons[j];
          if (!poly2.coords || poly2.coords.length < 3) continue;
          
          const facetValue2 = polygonFacets[j];
          const currentFacets2 = Array.isArray(facetValue2) ? facetValue2 : (facetValue2 ? [facetValue2] : []);
          const isRemoved2 = currentFacets2.includes('RM');
          if (isRemoved2) continue;
          
          // Skip if polygons only share an edge (adjacent, not overlapping)
          if (shareEdge(poly1, poly2)) {
            continue; // Let them be colored skyblue by normal rendering
          }
          
          try {
            const coords1 = [...poly1.coords.map(c => Array.isArray(c) ? [c[0], c[1]] : [(c as any).lng, (c as any).lat]), 
                             Array.isArray(poly1.coords[0]) ? [poly1.coords[0][0], poly1.coords[0][1]] : [(poly1.coords[0] as any).lng, (poly1.coords[0] as any).lat]];
            const coords2 = [...poly2.coords.map(c => Array.isArray(c) ? [c[0], c[1]] : [(c as any).lng, (c as any).lat]), 
                             Array.isArray(poly2.coords[0]) ? [poly2.coords[0][0], poly2.coords[0][1]] : [(poly2.coords[0] as any).lng, (poly2.coords[0] as any).lat]];
            
            const turfPoly1 = turf.polygon([coords1]);
            const turfPoly2 = turf.polygon([coords2]);
            
            const intersection = turf.intersect(turf.featureCollection([turfPoly1, turfPoly2]));
            
            // Only process Polygon intersections (real overlaps)
            if (intersection && intersection.geometry.type === 'Polygon') {
              const intersectionCoords = intersection.geometry.coordinates[0];
              const projectedIntersection = intersectionCoords.map((coord: number[]) => 
                project([coord[0], coord[1]])
              );
              
              if (projectedIntersection.length >= 3) {
                ctx.fillStyle = 'rgba(29, 78, 216, 0.75)';
                ctx.strokeStyle = 'rgba(30, 64, 175, 0.85)';
                ctx.lineWidth = 2;
                
                ctx.beginPath();
                ctx.moveTo(projectedIntersection[0].x, projectedIntersection[0].y);
                for (let k = 1; k < projectedIntersection.length; k++) {
                  ctx.lineTo(projectedIntersection[k].x, projectedIntersection[k].y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
              }
            }
          } catch (error) {
            // Ignore intersection errors
          }
        }
      }
      
      // Third pass: Draw overhangs (only if explicitly marked with OH facet)
      for (let i = 0; i < detectedPolygons.length; i++) {
        const facetValue = polygonFacets[i];
        const currentFacets = Array.isArray(facetValue) ? facetValue : (facetValue ? [facetValue] : []);
        
        // Only apply overhang shading if explicitly marked as OH (overhang)
        if (currentFacets.includes('OH')) {
          const polygon = detectedPolygons[i];
          if (!polygon.coords || polygon.coords.length < 3) continue;
          
          const projectedCoords = polygon.coords.map((coord: LngLat) => project(coord));
          
          // Draw with darker blue for overhangs
          ctx.fillStyle = 'rgba(29, 78, 216, 0.75)'; // Darker blue for overhangs
          ctx.strokeStyle = 'rgba(30, 64, 175, 0.85)'; // Darker blue outline
          ctx.lineWidth = 2;
          
          ctx.beginPath();
          ctx.moveTo(projectedCoords[0].x, projectedCoords[0].y);
          for (let k = 1; k < projectedCoords.length; k++) {
            ctx.lineTo(projectedCoords[k].x, projectedCoords[k].y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
      
      // Fourth pass: Draw vertices and labels on top
      // First, detect parent polygons that contain other polygons (divided by lines)
      const parentPolygons = new Set<number>();
      for (let i = 0; i < detectedPolygons.length; i++) {
        const poly1 = detectedPolygons[i];
        if (!poly1.coords || poly1.coords.length < 3) continue;
        
        for (let j = 0; j < detectedPolygons.length; j++) {
          if (i === j) continue;
          
          const poly2 = detectedPolygons[j];
          if (!poly2.coords || poly2.coords.length < 3) continue;
          
          try {
            const coords1 = [...poly1.coords.map(c => Array.isArray(c) ? [c[0], c[1]] : [(c as any).lng, (c as any).lat]), 
                             Array.isArray(poly1.coords[0]) ? [poly1.coords[0][0], poly1.coords[0][1]] : [(poly1.coords[0] as any).lng, (poly1.coords[0] as any).lat]];
            const coords2 = [...poly2.coords.map(c => Array.isArray(c) ? [c[0], c[1]] : [(c as any).lng, (c as any).lat]), 
                             Array.isArray(poly2.coords[0]) ? [poly2.coords[0][0], poly2.coords[0][1]] : [(poly2.coords[0] as any).lng, (poly2.coords[0] as any).lat]];
            
            const turfPoly1 = turf.polygon([coords1]);
            const turfPoly2 = turf.polygon([coords2]);
            
            // If poly1 contains poly2, then poly1 is a parent
            if (turf.booleanWithin(turfPoly2, turfPoly1)) {
              parentPolygons.add(i);
            }
          } catch (error) {
            // Ignore geometry errors
          }
        }
      }
      
      detectedPolygons.forEach((polygon, index) => {
        if (!polygon.coords || polygon.coords.length < 3) return;
        
        const projectedCoords = polygon.coords.map((coord: LngLat) => project(coord));
        const polygonFacetValue = polygonFacets[index];
        const currentFacets = Array.isArray(polygonFacetValue) ? polygonFacetValue : (polygonFacetValue ? [polygonFacetValue] : []);
        const isRemoved = currentFacets.includes('RM');
        
        // Draw green circles at vertices
        projectedCoords.forEach((pt) => {
          ctx.fillStyle = 'rgba(34, 197, 94, 0.9)'; // Green
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
        
        // Skip drawing label if this is a parent polygon (contains other polygons)
        if (parentPolygons.has(index)) {
          return;
        }
        
        // Draw label at centroid
        const centroidPt = project(polygon.centroid);
        const facetValue = polygonFacets[index];
        // Ensure facetLabels is always an array
        const facetLabels = Array.isArray(facetValue) ? facetValue : (facetValue ? [facetValue] : []);
        const pitchLabel = polygonPitches[index];
        
        // If removed, only show a small X in the center
        if (isRemoved) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // Red X
          ctx.lineWidth = 3;
          const xSize = 12;
          
          // Draw X
          ctx.beginPath();
          ctx.moveTo(centroidPt.x - xSize, centroidPt.y - xSize);
          ctx.lineTo(centroidPt.x + xSize, centroidPt.y + xSize);
          ctx.moveTo(centroidPt.x + xSize, centroidPt.y - xSize);
          ctx.lineTo(centroidPt.x - xSize, centroidPt.y + xSize);
          ctx.stroke();
        } else {
          // Normal rendering for non-removed polygons
          ctx.font = 'bold 14px Inter, sans-serif';
          ctx.textAlign = 'center';
          
          // Determine what number to show: pitch value or default 0
          const displayNumber = pitchLabel || "0";
          
          if (facetLabels.length > 0) {
            // Show facet abbreviations above the number (joined with commas)
            const facetsText = facetLabels.join(', ');
            ctx.textBaseline = 'bottom';
            
            // Black outline for abbreviation
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2.5;
            ctx.strokeText(facetsText, centroidPt.x, centroidPt.y - 1);
            
            // White fill for abbreviation
            ctx.fillStyle = 'white';
            ctx.fillText(facetsText, centroidPt.x, centroidPt.y - 1);
            
            // Draw number below (pitch or index)
            ctx.textBaseline = 'top';
            
            // Black outline for number
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2.5;
            ctx.strokeText(displayNumber, centroidPt.x, centroidPt.y + 1);
            
            // White fill for number
            ctx.fillStyle = 'white';
            ctx.fillText(displayNumber, centroidPt.x, centroidPt.y + 1);
          } else if (pitchLabel) {
            // Just pitch, no facet - show pitch in center
            ctx.textBaseline = 'middle';
            
            // Black outline for number
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2.5;
            ctx.strokeText(pitchLabel, centroidPt.x, centroidPt.y);
            
            // White fill for number
            ctx.fillStyle = 'white';
            ctx.fillText(pitchLabel, centroidPt.x, centroidPt.y);
          } else {
            // Just draw default 0 in the center
            ctx.textBaseline = 'middle';
            
            // Black outline for better visibility
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2.5;
            ctx.strokeText("0", centroidPt.x, centroidPt.y);
            
            // White fill
            ctx.fillStyle = 'white';
            ctx.fillText("0", centroidPt.x, centroidPt.y);
          }
        }
      });
    }

    // Draw saved lines - straight 2-point segments only (hide in pins mode)
    if (mode !== 'pins') {
      lines.forEach((line) => {
      if (line.coords.length !== 2) return;
      
      // If dragging a vertex, replace the original position with the dragged position for rendering
      let renderCoords = line.coords;
      if (draggedVertex && originalVertexPosition) {
        renderCoords = line.coords.map(coord => {
          const matches = Math.abs(coord[0] - originalVertexPosition[0]) < 0.00000001 &&
                         Math.abs(coord[1] - originalVertexPosition[1]) < 0.00000001;
          return matches ? draggedVertex.position : coord;
        }) as [LngLat, LngLat];
      }
      
      const startPt = project(renderCoords[0]);
      const endPt = project(renderCoords[1]);
      
      // Draw line
      ctx.strokeStyle = line.edgeColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      ctx.lineTo(endPt.x, endPt.y);
      ctx.stroke();

      // Helper function to check if a point is connected to other lines
      const isPointConnected = (coord: LngLat): boolean => {
        let count = 0;
        lines.forEach(l => {
          const isStartMatch = Math.abs(l.coords[0][0] - coord[0]) < 0.00000001 && 
                                Math.abs(l.coords[0][1] - coord[1]) < 0.00000001;
          const isEndMatch = Math.abs(l.coords[l.coords.length - 1][0] - coord[0]) < 0.00000001 && 
                             Math.abs(l.coords[l.coords.length - 1][1] - coord[1]) < 0.00000001;
          if (isStartMatch || isEndMatch) count++;
        });
        return count > 1; // Connected if more than one line uses this point
      };

      // Draw endpoint dots with conditional coloring
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      
      // Start point dot
      const startConnected = isPointConnected(renderCoords[0]);
      ctx.fillStyle = startConnected ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)'; // Green or red
      ctx.beginPath();
      ctx.arc(startPt.x, startPt.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // End point dot
      const endConnected = isPointConnected(renderCoords[1]);
      ctx.fillStyle = endConnected ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)'; // Green or red
      ctx.beginPath();
      ctx.arc(endPt.x, endPt.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw label at midpoint with 3-letter abbreviations
      // Hide labels and lengths in facets mode
      if ((showLabels || showLength) && mode !== 'facets') {
        const midX = (startPt.x + endPt.x) / 2;
        const midY = (startPt.y + endPt.y) / 2;
        
        // Use edgeLabels if available, otherwise fall back to edgeLabel
        const labels = line.edgeLabels && line.edgeLabels.length > 0 
          ? line.edgeLabels 
          : [line.edgeLabel];
        
        // Create 3-letter abbreviations
        const abbreviations = labels.map(label => {
          const cleaned = label.trim();
          if (cleaned.length === 0) return '';
          return cleaned.substring(0, 1).toUpperCase() + cleaned.substring(1, 3).toLowerCase();
        }).filter(a => a);
        
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        
        // Draw length on top
        if (showLength) {
          const lengthText = `${calculateGeoDistance(renderCoords).toFixed(1)}ft`;
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.strokeText(lengthText, midX, midY - 18);
          ctx.fillStyle = 'white';
          ctx.fillText(lengthText, midX, midY - 18);
        }
        
        // Draw abbreviated labels below (only in edges mode)
        if (showLabels && abbreviations.length > 0 && mode === 'edges') {
          const labelText = abbreviations.join(',');
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.strokeText(labelText, midX, midY - 2);
          ctx.fillStyle = 'white';
          ctx.fillText(labelText, midX, midY - 2);
        }
      }
    });
    }
    
    // Draw snap target indicator if exists (hide in pins mode)
    if (mode !== 'pins' && snapTarget) {
      const snapPt = project(snapTarget.position);
      ctx.strokeStyle = 'rgba(255, 200, 0, 0.9)'; // Yellow
      ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(snapPt.x, snapPt.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Draw current start point (if one click made)
    if (currentPath.length > 0 && mode !== 'facets' && mode !== 'pins') {
      const pt = currentPath[0];
      const projPt = project(pt);
      ctx.fillStyle = selectedEdgeAction?.color || '#EF4444';
      ctx.beginPath();
      ctx.arc(projPt.x, projPt.y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(projPt.x, projPt.y, 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw preview line from start point to cursor (with 45° snapping)
    if (currentPath.length === 1 && previewPoint && mode !== 'facets' && mode !== 'pins') {
      const startPoint = currentPath[0];
      const startPt = project(startPoint);
      const endPt = project(previewPoint);
      
      const previewColor = selectedEdgeAction?.color || '#EF4444';
      
      ctx.strokeStyle = previewColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      ctx.lineTo(endPt.x, endPt.y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Show preview length
      const distance = calculateGeoDistance([startPoint, previewPoint]);
      const midX = (startPt.x + endPt.x) / 2;
      const midY = (startPt.y + endPt.y) / 2;
      
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.strokeText(`${distance.toFixed(1)}'`, midX, midY - 10);
      ctx.fillStyle = 'white';
      ctx.fillText(`${distance.toFixed(1)}'`, midX, midY - 10);
    }

    // Draw placed pin stickers
    placedPins.forEach((pin, index) => {
      const pinPt = project(pin.position);
      const img = pinImages[pin.imageUrl];
      
      if (img && img.complete) {
        // Draw pin image (small sticker size)
        const pinSize = 40;
        ctx.drawImage(img, pinPt.x - pinSize / 2, pinPt.y - pinSize / 2, pinSize, pinSize);
        
        // Draw white circle with number below the pin
        const numberY = pinPt.y + pinSize / 2 + 12;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(pinPt.x, numberY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pinPt.x, numberY, 10, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw number
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'black';
        ctx.fillText((index + 1).toString(), pinPt.x, numberY);
      }
    });
    
    // Draw brush strokes if in brush mode
    if (isBrushMode && brushStrokes.length > 0 && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)'; // Green brush color
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      brushStrokes.forEach((stroke, i) => {
        const x = stroke.x * rect.width;
        const y = stroke.y * rect.height;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      
      // Draw dots at stroke points for better visibility
      ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
      brushStrokes.forEach(stroke => {
        const x = stroke.x * rect.width;
        const y = stroke.y * rect.height;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Restore context state after all drawing
    ctx.restore();
    
  }, [lines, detectedPolygons, polygonFacets, polygonPitches, currentPath, previewPoint, showGrid, showLabels, showLength, selectedEdgeAction, calculateGeoDistance, mode, placedPins, pinImages, project, solarSegments, isBrushMode, brushStrokes, draggedVertex, originalVertexPosition, snapTarget]);

  // Redraw when lines or view options change - immediate for facets/pitches
  useEffect(() => {
    // Immediate redraw for facets and pitches to show instant feedback
    drawAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, detectedPolygons, polygonFacets, polygonPitches, currentPath, previewPoint, bearing, zoom, placedPins, pinImages, brushStrokes, draggedVertex, originalVertexPosition, snapTarget]);

  const pointerToPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // Check if point is inside polygon using ray casting algorithm
  const isPointInPolygon = (pt: { x: number; y: number }, coords: LngLat[]): boolean => {
    const projected = coords.map(coord => project(coord));
    let inside = false;
    
    for (let i = 0, j = projected.length - 1; i < projected.length; j = i++) {
      const xi = projected[i].x, yi = projected[i].y;
      const xj = projected[j].x, yj = projected[j].y;
      
      const intersect = ((yi > pt.y) !== (yj > pt.y))
        && (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  };

  // Check if a point is near a line
  const isNearLine = (clickPt: { x: number; y: number }, line: Line, threshold = 10) => {
    const start = project(line.coords[0]);
    const end = project(line.coords[line.coords.length - 1]);
    
    // Calculate distance from point to line segment
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    
    if (lengthSquared === 0) {
      // Line is actually a point
      const dist = Math.sqrt((clickPt.x - start.x) ** 2 + (clickPt.y - start.y) ** 2);
      return dist <= threshold;
    }
    
    // Calculate projection factor
    const t = Math.max(0, Math.min(1, ((clickPt.x - start.x) * dx + (clickPt.y - start.y) * dy) / lengthSquared));
    const projX = start.x + t * dx;
    const projY = start.y + t * dy;
    
    const dist = Math.sqrt((clickPt.x - projX) ** 2 + (clickPt.y - projY) ** 2);
    return dist <= threshold;
  };

  // Find nearest endpoint from existing lines to snap to
  const findNearestEndpoint = (clickPt: { x: number; y: number }, threshold = 15): LngLat | null => {
    let nearestPoint: LngLat | null = null;
    let minDistance = threshold;

    lines.forEach(line => {
      // Check both endpoints of each line
      [line.coords[0], line.coords[line.coords.length - 1]].forEach(endpoint => {
        const endpointPt = project(endpoint);
        const dist = Math.sqrt(
          (clickPt.x - endpointPt.x) ** 2 + 
          (clickPt.y - endpointPt.y) ** 2
        );
        
        if (dist < minDistance) {
          minDistance = dist;
          nearestPoint = endpoint;
        }
      });
    });

    return nearestPoint;
  };

  // Find vertex at click position and all connected lines
  const findVertexAtPoint = (clickPt: { x: number; y: number }, threshold = 12): { position: LngLat; lineIndices: number[] } | null => {
    const vertexMap: Record<string, { position: LngLat; lineIndices: number[] }> = {};
    
    lines.forEach((line, lineIndex) => {
      [line.coords[0], line.coords[line.coords.length - 1]].forEach(endpoint => {
        const key = `${endpoint[0].toFixed(8)},${endpoint[1].toFixed(8)}`;
        if (!vertexMap[key]) {
          vertexMap[key] = { position: endpoint, lineIndices: [] };
        }
        vertexMap[key].lineIndices.push(lineIndex);
      });
    });
    
    // Find closest vertex
    let closestVertex: { position: LngLat; lineIndices: number[] } | null = null;
    let minDist = threshold;
    
    Object.values(vertexMap).forEach((vertex) => {
      const pt = project(vertex.position);
      const dist = Math.sqrt((clickPt.x - pt.x) ** 2 + (clickPt.y - pt.y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closestVertex = vertex;
      }
    });
    
    return closestVertex;
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = pointerToPoint(e);
    
    // Right-click behavior
    if (e.button === 2) {
      e.preventDefault();
      e.stopPropagation();
      
      // If we're already moving a vertex, cancel and restore original position
      if (draggedVertex && originalVertexPosition) {
        // Since lines aren't modified during movement, just clear the state
        setDraggedVertex(null);
        setOriginalVertexPosition(null);
        setSnapTarget(null);
        toast.info('Move cancelled', { duration: 1000 });
        // Set cooldown to prevent immediately re-entering move mode
        cancelCooldownRef.current = true;
        setTimeout(() => {
          cancelCooldownRef.current = false;
        }, 200);
        // Force immediate redraw to clear the dragged vertex visualization
        requestAnimationFrame(() => drawAll());
        return;
      }
      
      // Check if right-clicking on a vertex/endpoint to start moving it
      if (lines.length > 0 && !cancelCooldownRef.current) {
        const vertex = findVertexAtPoint(pt);
        if (vertex) {
          // Start moving this vertex - prevent event from reaching edge action buttons
          setDraggedVertex(vertex);
          setOriginalVertexPosition(vertex.position);
          setIsDragging(false);
          toast.info('Move vertex • Left-click: confirm • Right-click: cancel', { duration: 2000 });
          console.log('🎯 Right-click on vertex - click-to-move mode activated');
          return;
        }
      }
      
      // If not on a vertex, enable right-click panning
      console.log('🎮 Right-click pan started - not on vertex');
      setIsRightClickPanning(true);
      if (mapRef.current) {
        mapRef.current.dragPan.enable();
        mapRef.current.dragRotate.enable();
      }
      
      // Cancel drawing/delete mode
      setCurrentPath([]);
      setPreviewPoint(null);
      setDrawingActive(false);
      
      // Cancel delete mode
      if (isDeleteMode && onDeleteModeCancel) {
        onDeleteModeCancel();
      }
      return;
    }
    
    if (!mapRef.current) return;
    
    // Handle brush mode
    if (isBrushMode) {
      setIsBrushing(true);
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const normalizedX = pt.x / rect.width;
        const normalizedY = pt.y / rect.height;
        setBrushStrokes([{ x: normalizedX, y: normalizedY }]);
      }
      return;
    }
    
    // Check if clicking on a vertex in vertex drag mode
    if (isVertexDragMode && lines.length > 0) {
      const vertex = findVertexAtPoint(pt);
      if (vertex) {
        e.stopPropagation(); // Prevent affecting tool selection
        setDraggedVertex(vertex);
        setIsDragging(false);
        return;
      }
    }
    
    // Track pointer down position to detect dragging
    dragStartPos.current = pt;
    setIsDragging(false);
  };

  const onMovePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Track cursor coordinates for display
    const pt = pointerToPoint(e);
    const geoCoords = unproject(pt);
    setCursorCoords({ lat: geoCoords[1], lng: geoCoords[0] });
    
    // Handle brush mode stroke collection
    if (isBrushMode && isBrushing && e.buttons === 1) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const normalizedX = pt.x / rect.width;
        const normalizedY = pt.y / rect.height;
        setBrushStrokes(prev => [...prev, { x: normalizedX, y: normalizedY }]);
      }
      return;
    }
    
    // Handle vertex movement (click-to-move mode - no button press needed)
    if (draggedVertex) {
      const newPosition = unproject(pt);
      
      // Check for nearby vertices to snap to (excluding the dragged vertex)
      const snapThreshold = 12; // pixels
      let snappedVertex: { position: LngLat; lineIndices: number[] } | null = null;
      let minSnapDist = snapThreshold;
      
      const vertexMap: Record<string, { position: LngLat; lineIndices: number[] }> = {};
      lines.forEach((line, lineIndex) => {
        [line.coords[0], line.coords[line.coords.length - 1]].forEach(endpoint => {
          const key = `${endpoint[0].toFixed(8)},${endpoint[1].toFixed(8)}`;
          if (!vertexMap[key]) {
            vertexMap[key] = { position: endpoint, lineIndices: [] };
          }
          vertexMap[key].lineIndices.push(lineIndex);
        });
      });
      
      // Find closest vertex (excluding the dragged one)
      Object.values(vertexMap).forEach((vertex) => {
        // Skip if this is the dragged vertex itself (comparing with original position)
        const isDraggedVertex = originalVertexPosition && 
                                Math.abs(vertex.position[0] - originalVertexPosition[0]) < 0.00000001 &&
                                Math.abs(vertex.position[1] - originalVertexPosition[1]) < 0.00000001;
        if (isDraggedVertex) return;
        
        const vertexPt = project(vertex.position);
        const dist = Math.sqrt((pt.x - vertexPt.x) ** 2 + (pt.y - vertexPt.y) ** 2);
        if (dist < minSnapDist) {
          minSnapDist = dist;
          snappedVertex = vertex;
        }
      });
      
      // Store snap target for visual feedback but don't update lines yet
      setSnapTarget(snappedVertex);
      
      // Just update the dragged vertex position for rendering, don't modify lines
      setDraggedVertex(prev => prev ? { ...prev, position: newPosition } : null);
      return;
    }
    
    // Don't update preview if map is moving or rotating
    if (isMapMoving) {
      return;
    }
    
    // Detect if user is dragging (for rotation/pan)
    if (dragStartPos.current && e.buttons === 1) {
      const dx = pt.x - dragStartPos.current.x;
      const dy = pt.y - dragStartPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If moved more than 3 pixels, consider it a drag
      if (distance > 3) {
        setIsDragging(true);
        // Clear preview while dragging
        setPreviewPoint(null);
        return;
      }
    }
    
    // Only update preview if not dragging, map not moving, and in drawing mode
    if (!isDragging && !isMapMoving && currentPath.length > 0) {
      const geoPoint = unproject(pt);
      const snappedPoint = snapTo90Degrees(currentPath[0], geoPoint);
      setPreviewPoint(snappedPoint);
    }
  };

  const onLeave = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Send brush strokes if in brush mode
    if (isBrushMode && isBrushing && brushStrokes.length > 0) {
      onBrushStroke?.(brushStrokes);
      setIsBrushing(false);
    }
    
    // Reset all drawing state when cursor leaves canvas
    // If vertex was being moved, cancel it
    if (draggedVertex && originalVertexPosition) {
      // Since lines aren't modified during movement, just clear the state
      setDraggedVertex(null);
      setOriginalVertexPosition(null);
      setSnapTarget(null);
      // Force immediate redraw to clear visualization
      requestAnimationFrame(() => drawAll());
    }
    
    setCurrentPath([]);
    setPreviewPoint(null);
    setDrawingActive(false);
    setDraggedVertex(null);
    setOriginalVertexPosition(null);
    dragStartPos.current = null;
    setIsDragging(false);
    setCursorCoords(null);
    
    // Also disable right-click panning if active
    if (isRightClickPanning) {
      console.log('🎮 Right-click pan ended (mouse left canvas) - restoring lock state');
      setIsRightClickPanning(false);
      
      // Restore the locked/disabled state
      if (mapRef.current) {
        const shouldDisableDrag = (isLocked || (mode === 'facets' && selectedFacet)) && !isPanMode;
        if (shouldDisableDrag) {
          mapRef.current.dragPan.disable();
          mapRef.current.dragRotate.disable();
        }
      }
    }
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Left-click while moving a vertex: confirm the new position (snap if near another vertex)
    if (e.button === 0 && draggedVertex && originalVertexPosition) {
      let finalPosition = draggedVertex.position;
      
      // If there's a snap target, use its position
      if (snapTarget) {
        finalPosition = snapTarget.position;
      }
      
      // Update all lines connected to this vertex with the final position
      setLines(prevLines => {
        const newLines = prevLines.map((line, index) => {
          if (!draggedVertex.lineIndices.includes(index)) return line;
          
          const newCoords = line.coords.map(coord => {
            // Check if this coordinate matches the original vertex position
            const matches = Math.abs(coord[0] - originalVertexPosition[0]) < 0.00000001 &&
                           Math.abs(coord[1] - originalVertexPosition[1]) < 0.00000001;
            return matches ? finalPosition : coord;
          });
          
          return {
            ...line,
            coords: newCoords as [LngLat, LngLat],
            length: calculateGeoDistance(newCoords)
          };
        });
        onLinesChange?.(newLines);
        return newLines;
      });
      
      setDraggedVertex(null);
      setOriginalVertexPosition(null);
      setSnapTarget(null);
      toast.success(snapTarget ? 'Vertex snapped' : 'Vertex moved', { duration: 1000 });
      return;
    }
    
    // Right-clicks are handled in onDown for vertex movement
    if (e.button === 2) {
      // Disable right-click panning and restore lock state
      if (isRightClickPanning) {
        console.log('🎮 Right-click pan ended - restoring lock state');
        setIsRightClickPanning(false);
        
        // Restore the locked/disabled state
        if (mapRef.current) {
          const shouldDisableDrag = (isLocked || (mode === 'facets' && selectedFacet)) && !isPanMode;
          if (shouldDisableDrag) {
            mapRef.current.dragPan.disable();
            mapRef.current.dragRotate.disable();
          }
        }
      }
      return;
    }
    
    // Handle brush mode completion
    if (isBrushMode && isBrushing) {
      if (brushStrokes.length > 0) {
        onBrushStroke?.(brushStrokes);
      }
      setIsBrushing(false);
      return;
    }
    
    // If this was a drag OR map was moving, don't process as a click
    if (isDragging || isMapMoving) {
      dragStartPos.current = null;
      setIsDragging(false);
      return;
    }
    
    // Reset drag tracking
    dragStartPos.current = null;
    setIsDragging(false);
    
    // Process the click
    if (!mapRef.current) return;
    
    const pt = pointerToPoint(e);
    const clickedPoint = unproject(pt);
    
    // Call onMapClick if provided (for smart select mode, etc.)
    if (onMapClick) {
      // Create a mock MapMouseEvent-like object with the clicked point
      const mockEvent = {
        lngLat: { lng: clickedPoint[0], lat: clickedPoint[1] },
        point: { x: pt.x, y: pt.y },
        originalEvent: e.nativeEvent,
      } as any;
      onMapClick(mockEvent);
      return; // Don't process other click handlers when onMapClick is provided
    }
    
    // Handle delete mode
    if (isDeleteMode) {
      // Check if clicking on a pin first (pins take priority)
      if (mode === 'pins') {
        const clickRadius = 20; // pixels - pin hit area
        const clickedPinIndex = placedPins.findIndex((pin) => {
          const pinPt = project(pin.position);
          const distance = Math.sqrt(
            Math.pow(pt.x - pinPt.x, 2) + Math.pow(pt.y - pinPt.y, 2)
          );
          return distance <= clickRadius;
        });
        
        if (clickedPinIndex !== -1) {
          const deletedPin = placedPins[clickedPinIndex];
          const updatedPins = placedPins.filter((_, index) => index !== clickedPinIndex);
          setPlacedPins(updatedPins);
          onStateChange?.({ pins: updatedPins });
          toast.success(`Deleted: ${deletedPin.name}`);
          return;
        }
      }
      
      // Check for lines to delete
      if (onLineClick) {
        const clickedLine = lines.find(line => isNearLine(pt, line));
        if (clickedLine) {
          onLineClick(clickedLine.id);
          return;
        }
      }
    }
    
    // In facets mode, handle polygon clicks
    if (mode === 'facets') {
      if (!selectedFacet) {
        return;
      }
      
      // Check if click is near the "0" label at polygon centroid (not anywhere in polygon)
      const clickRadius = 25; // pixels - larger hit area for easier clicking
      const clickedPolygonIndex = detectedPolygons.findIndex((polygon) => {
        if (!polygon.coords || polygon.coords.length < 3) {
          return false;
        }
        // Project the centroid to screen coordinates
        const centroidPt = project(polygon.centroid);
        // Check if click is within radius of the centroid
        const distance = Math.sqrt(
          Math.pow(pt.x - centroidPt.x, 2) + Math.pow(pt.y - centroidPt.y, 2)
        );
        return distance <= clickRadius;
      });
      
      if (clickedPolygonIndex !== -1) {
        // Determine if this is a pitch or a facet
        const isPitch = selectedFacet === 'pitch';
        
        if (isPitch && selectedFacetValue) {
          // Handle pitch separately
          const pitchNumber = selectedFacetValue.split('/')[0];
          
          console.log('✅ Applying pitch:', pitchNumber, 'to polygon', clickedPolygonIndex);
          
          setPolygonPitches(prev => {
            const currentPitch = prev[clickedPolygonIndex];
            
            // Toggle: if clicking the same polygon with same pitch, remove it
            const willRemove = currentPitch === pitchNumber;
            
            if (willRemove) {
              const updated = { ...prev };
              delete updated[clickedPolygonIndex];
              console.log('✅ Removed pitch from polygon', clickedPolygonIndex);
              
              // Immediately update ref to prevent echo
              outgoingPitchesRef.current = updated;
              
              // Show toast notification
              import('sonner').then(({ toast }) => {
                toast.success(`Removed pitch ${selectedFacetValue} from facet #${clickedPolygonIndex + 1}`, { duration: 2000 });
              });
              
              return updated;
            }
            
            // Otherwise, apply the new pitch
            const updated = {
              ...prev,
              [clickedPolygonIndex]: pitchNumber
            };
            console.log('✅ Updated polygonPitches state:', updated);
            
            // Immediately update ref to prevent echo
            outgoingPitchesRef.current = updated;
            
            // Show toast notification
            import('sonner').then(({ toast }) => {
              toast.success(`Applied pitch ${selectedFacetValue} to facet #${clickedPolygonIndex + 1}`, { duration: 2000 });
            });
            
            return updated;
          });
        } else {
          // Handle other facets
          const facetAbbreviations: Record<string, string> = {
            'dormer': 'DM',
            'remove': 'RM',
            '2-story': '2S',
            'two-layer': '2L',
            'low-slope': 'LS',
          };
          const abbreviation = facetAbbreviations[selectedFacet] || selectedFacet.substring(0, 2).toUpperCase();
          
          console.log('✅ Applying facet:', abbreviation, 'to polygon', clickedPolygonIndex);
          
          // Simple toggle logic - just update state
          setPolygonFacets(prev => {
            const existingValue = prev[clickedPolygonIndex];
            const currentFacets = Array.isArray(existingValue) ? existingValue : (existingValue ? [existingValue] : []);
            
            // Toggle: if facet already exists, remove it; otherwise add it
            const willRemove = currentFacets.includes(abbreviation);
            
            if (willRemove) {
              const filtered = currentFacets.filter(f => f !== abbreviation);
              const updated = { ...prev, [clickedPolygonIndex]: filtered };
              // If no facets left, remove the entry
              if (filtered.length === 0) {
                delete updated[clickedPolygonIndex];
              }
              console.log('✅ Removed facet', abbreviation, 'from polygon', clickedPolygonIndex);
              
              // Immediately update ref to prevent echo
              outgoingFacetsRef.current = updated;
              
              // Show toast notification
              const facetNames: Record<string, string> = {
                'DM': 'DORMER',
                'RM': 'REMOVE',
                '2S': '2 STORY',
                '2L': 'TWO LAYER',
                'LS': 'LOW SLOPE',
              };
              const facetName = facetNames[abbreviation] || abbreviation;
              import('sonner').then(({ toast }) => {
                toast.success(`Removed ${facetName} from facet #${clickedPolygonIndex + 1}`, { duration: 2000 });
              });
              
              return updated;
            } else {
              const updated = {
                ...prev,
                [clickedPolygonIndex]: [...currentFacets, abbreviation]
              };
              console.log('✅ Added facet', abbreviation, 'to polygon', clickedPolygonIndex);
              
              // Immediately update ref to prevent echo
              outgoingFacetsRef.current = updated;
              
              // Show toast notification
              const facetNames: Record<string, string> = {
                'DM': 'DORMER',
                'RM': 'REMOVE',
                '2S': '2 STORY',
                '2L': 'TWO LAYER',
                'LS': 'LOW SLOPE',
              };
              const facetName = facetNames[abbreviation] || abbreviation;
              import('sonner').then(({ toast }) => {
                toast.success(`Applied ${facetName} to facet #${clickedPolygonIndex + 1}`, { duration: 2000 });
              });
              
              return updated;
            }
          });
        }
      } else {
        console.log('Click was not inside any polygon');
      }
      return;
    }

    // In pins mode, place pin stickers
    if (mode === 'pins') {
      if (!selectedPin) return;
      
      const newPin: PlacedPin = {
        id: `pin-${Date.now()}-${Math.random()}`,
        position: clickedPoint,
        imageUrl: selectedPin.picture,
        name: selectedPin.name,
        total: selectedPin.total,
        unit: selectedPin.unit,
        category: selectedPin.category,
        labor_cost: selectedPin.labor_cost,
        material_cost: selectedPin.material_cost,
        coverage: selectedPin.coverage,
        factor: selectedPin.factor
      };
      
      setPlacedPins(prev => [...prev, newPin]);
      console.log('✅ Placed pin:', newPin.name, 'at', clickedPoint);
      
      // Notify parent of state change
      onStateChange?.({ pins: [...placedPins, newPin] });
      
      // Force a redraw
      setTimeout(() => drawAll(), 0);
      return;
    }
    
    if (!selectedEdgeAction) return;
    
    // FIRST: Check if left-clicking on an existing endpoint ONLY when NOT already drawing
    const nearestEndpoint = findNearestEndpoint(pt);
    if (nearestEndpoint && mode === 'draw' && currentPath.length === 0) {
      // Start a new line from this dot (only when not already drawing)
      setCurrentPath([nearestEndpoint]);
      setDrawingActive(true);
      setPreviewPoint(null);
      console.log('🎯 Starting new line from existing dot');
      return;
    }
    
    // In EDGES mode, recolor existing lines instead of drawing
    if (mode === 'edges') {
      // Check for clicking on existing endpoint first in edges mode too (only when not drawing)
      if (nearestEndpoint && currentPath.length === 0) {
        setCurrentPath([nearestEndpoint]);
        setDrawingActive(true);
        setPreviewPoint(null);
        console.log('🎯 Starting new line from existing dot (edges mode)');
        return;
      }
      
      // Find any line that was clicked, not just unlabeled ones
      const clickedLine = lines.find(line => isNearLine(pt, line));
      
      if (clickedLine) {
        // Determine what to apply
        let newLabel = '';
        let newLabels: string[] = [];
        let newColor = '';
        
        if (selectedLabels.length > 0) {
          // Use multi-select labels
          newLabel = selectedLabels[0];
          newLabels = selectedLabels;
          newColor = selectedLabels.length > 0 && selectedEdgeAction ? selectedEdgeAction.color : clickedLine.edgeColor;
        } else if (selectedEdgeAction) {
          // Use single selected action
          newLabel = selectedEdgeAction.label;
          newLabels = [selectedEdgeAction.label];
          newColor = selectedEdgeAction.color;
        } else {
          return; // Nothing selected
        }
        
        setLines(prevLines => {
          const newLines = prevLines.map(line =>
            line.id === clickedLine.id
              ? { 
                  ...line, 
                  edgeLabel: newLabel,
                  edgeLabels: newLabels, 
                  edgeColor: newColor
                }
              : line
          );
          onLinesChange?.(newLines);
          return newLines;
        });
      }
      return;
    }
    
    // In DRAW mode, allow drawing with any edge type
    
    if (currentPath.length === 0) {
      // First click - set start point, snap to nearby endpoint if available
      const nearestEndpoint = findNearestEndpoint(pt);
      const startPoint = nearestEndpoint || clickedPoint;
      setCurrentPath([startPoint]);
      setDrawingActive(true);
    } else if (currentPath.length === 1) {
      // Second click - complete the line, snap to nearby endpoint if available
      const nearestEndpoint = findNearestEndpoint(pt);
      const endPoint = nearestEndpoint || clickedPoint;
      
      const newLine: Line = {
        id: `line-${Date.now()}`,
        coords: [currentPath[0], endPoint],
        edgeLabel: selectedEdgeAction.label,
        edgeColor: selectedEdgeAction.color,
        length: calculateGeoDistance([currentPath[0], endPoint]),
      };

      // Add to lines array
      setLines(prevLines => {
        const newLines = [...prevLines, newLine];
        onLinesChange?.(newLines);
        return newLines;
      });
      
      // Start next line from this endpoint (continuous drawing)
      setCurrentPath([endPoint]);
      setPreviewPoint(null);
      // Keep drawingActive true for continuous drawing
    }
  };


  // Rotation controls
  const nudge = (deg: number) => {
    if (!mapRef.current) return;
    const currentBearing = mapRef.current.getBearing();
    const newBearing = currentBearing + deg;
    mapRef.current.setBearing(newBearing);
  };
  
  const resetNorth = () => mapRef.current?.setBearing(0);

  // Undo last saved line
  const undoLastLine = useCallback(() => {
    if (lines.length === 0) return;
    const newLines = lines.slice(0, -1);
    setLines(newLines);
    onLinesChange?.(newLines);
  }, [lines, onLinesChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard shortcuts if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      // Escape cancels current drawing or vertex movement
      if (e.key === 'Escape') {
        e.preventDefault();
        
        // Cancel vertex movement and restore original position
        if (draggedVertex && originalVertexPosition) {
          // Since lines aren't modified during movement, just clear the state
          setDraggedVertex(null);
          setOriginalVertexPosition(null);
          setSnapTarget(null);
          toast.info('Move cancelled', { duration: 1000 });
          // Force immediate redraw to clear visualization
          requestAnimationFrame(() => drawAll());
        }
        
        // Cancel drawing
        if (drawingActive) {
          setCurrentPath([]);
          setPreviewPoint(null);
          setDrawingActive(false);
        }
      }
      
      // Z or Backspace undoes last saved line
      if ((e.key === 'z' || e.key === 'Z' || e.key === 'Backspace') && !drawingActive && lines.length > 0) {
        e.preventDefault();
        undoLastLine();
      }
      
      // L key toggles lock
      if ((e.key === 'l' || e.key === 'L') && !drawingActive) {
        e.preventDefault();
        onLockChange?.(!isLocked);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingActive, lines, draggedVertex, originalVertexPosition, undoLastLine, isLocked, onLockChange, onLinesChange]);

  // Handle map lock/unlock - done once on mount and updated as needed
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Wait for map to be ready before toggling interactions
    const updateMapInteractions = () => {
      // Disable map dragging when locked or in facets mode with a facet selected
      // BUT allow dragging if pan mode is active
      const shouldDisableDrag = (isLocked || (mode === 'facets' && selectedFacet)) && !isPanMode;

      if (shouldDisableDrag) {
        // Disable interactions but keep zoom enabled
        map.scrollZoom.enable(); // Keep zoom enabled even when locked
        map.dragPan.disable();
        map.dragRotate.disable();
        map.touchZoomRotate.disable();
      } else {
        // Enable interactions - force re-enable
        map.scrollZoom.enable();
        map.dragPan.enable();
        map.dragRotate.enable();
        map.touchZoomRotate.enable();
        map.touchZoomRotate.enableRotation();
      }
    };

    if (map.loaded()) {
      updateMapInteractions();
    } else {
      map.once('load', updateMapInteractions);
    }
  }, [isLocked, mode, selectedFacet, isPanMode]);

  return (
    <div ref={wrapRef} className={`map-wrap ${className ?? ""}`} style={{ position: 'relative' }}>
      <div ref={mapDivRef} className="map-base" />
      
      {/* Rotate Left Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          nudge(-5);
        }}
        disabled={isLocked}
        className="absolute left-3 top-3 z-[1000] h-10 w-10 rounded-lg bg-slate-900/80 text-white grid place-items-center shadow-lg hover:bg-slate-800 transition-colors text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ pointerEvents: 'auto' }}
        title="Rotate -5°"
      >
        ⟲
      </button>

      {/* Zoom In Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          const currentZoom = mapRef.current?.getZoom() ?? initialZoom;
          mapRef.current?.easeTo({
            zoom: Math.min(currentZoom + 0.5, 22),
            duration: 200,
          });
        }}
        disabled={isLocked}
        className="absolute left-3 top-[4.5rem] z-[1000] h-10 w-10 rounded-lg bg-slate-900/80 text-white grid place-items-center shadow-lg hover:bg-slate-800 transition-colors text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ pointerEvents: 'auto' }}
        title="Zoom In"
      >
        +
      </button>

      {/* Zoom Out Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          const currentZoom = mapRef.current?.getZoom() ?? initialZoom;
          mapRef.current?.easeTo({
            zoom: Math.max(currentZoom - 0.5, 10),
            duration: 200,
          });
        }}
        disabled={isLocked}
        className="absolute left-3 top-[7.5rem] z-[1000] h-10 w-10 rounded-lg bg-slate-900/80 text-white grid place-items-center shadow-lg hover:bg-slate-800 transition-colors text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ pointerEvents: 'auto' }}
        title="Zoom Out"
      >
        −
      </button>

      {/* Pan/Move Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          const newPanMode = !isPanMode;
          console.log('🎮 Pan mode toggled:', newPanMode);
          setIsPanMode(newPanMode);
          toast.success(newPanMode ? 'Pan mode enabled - Drag the map in any direction' : 'Pan mode disabled - Back to drawing');
        }}
        className={`absolute left-3 top-[10.5rem] z-[1000] h-10 w-10 rounded-lg ${
          isPanMode 
            ? 'bg-primary/90 hover:bg-primary' 
            : 'bg-slate-900/80 hover:bg-slate-800'
        } text-white grid place-items-center shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        style={{ pointerEvents: 'auto' }}
        title={isPanMode ? 'Pan mode active - Click to return to drawing' : 'Click to enable pan mode'}
      >
        <Move size={20} />
      </button>

      {/* 90° Snap Toggle - Show when drawing is active */}
      {drawingActive && currentPath.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSnap90Mode(!snap90Mode);
            toast.info(`90° snap ${!snap90Mode ? 'enabled' : 'disabled'}`, { duration: 1500 });
          }}
          className={`absolute left-3 top-[13.5rem] z-[1000] px-3 py-2 rounded-lg shadow-lg transition-colors text-xs font-medium ${
            snap90Mode 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
          }`}
          style={{ pointerEvents: 'auto' }}
          title={snap90Mode ? "90° snap ON - Click to disable" : "90° snap OFF - Click to enable"}
        >
          90° {snap90Mode ? 'ON' : 'OFF'}
        </button>
      )}

      {/* Rotate Right Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          nudge(5);
        }}
        disabled={isLocked}
        className="absolute right-3 top-3 z-[1000] h-10 w-10 rounded-lg bg-slate-900/80 text-white grid place-items-center shadow-lg hover:bg-slate-800 transition-colors text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ pointerEvents: 'auto' }}
        title="Rotate +5°"
      >
        ⟳
      </button>
      
      <canvas
        ref={canvasRef}
        className="draw-overlay absolute inset-0 z-[500]"
        style={{ 
          cursor: isBrushMode 
            ? 'crosshair'
            : (onMapClick || draggedVertex || isVertexDragMode || isDeleteMode || (mode === 'facets' && selectedFacet) || (mode === 'pins' && selectedPin) || selectedEdgeAction) && !isMapMoving
            ? (draggedVertex ? 'grabbing' : isVertexDragMode ? 'grab' : isDeleteMode ? 'pointer' : onMapClick ? 'crosshair' : (mode === 'facets' && selectedFacet) ? 'pointer' : (mode === 'pins' && selectedPin) ? 'crosshair' : 'crosshair')
            : 'default',
          pointerEvents: (isBrushMode || onMapClick || draggedVertex || isVertexDragMode || isDeleteMode || (mode === 'facets' && selectedFacet) || (mode === 'pins' && selectedPin) || selectedEdgeAction) && !isMapMoving ? 'auto' : 'none',
          touchAction: 'none'
        }}
        onPointerDown={onDown}
        onPointerMove={onMovePointer}
        onPointerUp={onUp}
        onPointerLeave={onLeave}
        onPointerCancel={onLeave}
        onContextMenu={(e) => e.preventDefault()}
      />

      {showDebug && (
        <div className="absolute right-3 bottom-3 bg-black/60 text-white px-3 py-1.5 rounded-md text-xs font-medium pointer-events-none z-[700]">
          Nearmap • MapLibre GL • z {zoom.toFixed(1)} • {Math.round(bearing)}° • Points: {currentPath.length}
        </div>
      )}
      
      {cursorCoords && (
        <div className="absolute left-3 bottom-20 bg-background/95 backdrop-blur-sm border rounded-lg px-3 py-2 pointer-events-none z-[700] shadow-lg">
          <div className="text-xs font-medium text-muted-foreground mb-1">Coordinates</div>
          <div className="space-y-0.5">
            <div className="text-xs font-mono">
              <span className="text-muted-foreground">Lat:</span>{' '}
              <span className="text-foreground font-semibold">{cursorCoords.lat.toFixed(6)}</span>
            </div>
            <div className="text-xs font-mono">
              <span className="text-muted-foreground">Lng:</span>{' '}
              <span className="text-foreground font-semibold">{cursorCoords.lng.toFixed(6)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default MapCanvasGL;

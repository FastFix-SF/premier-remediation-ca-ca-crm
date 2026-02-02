
import React, { useEffect, useRef, useState } from "react";
import mapboxgl, { Map } from "mapbox-gl";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminStatus } from "@/hooks/useAdminStatus";

type RoofPolygon = {
  type: "Polygon";
  coordinates: number[][][]; // [ [ [lng, lat], ... ] ]
};

interface RoiSelectorProps {
  quoteRequestId: string;
  latitude?: number | null;
  longitude?: number | null;
  existingROI?: RoofPolygon | null;
  onSaved?: (roi: RoofPolygon) => void;
  propertyAddress?: string | null;
  selectedImagery?: any | null;
  enableMultiStructure?: boolean;
  height?: string;
}

const RoiSelector: React.FC<RoiSelectorProps> = ({ 
  quoteRequestId, 
  latitude, 
  longitude, 
  existingROI, 
  onSaved, 
  propertyAddress, 
  selectedImagery,
  enableMultiStructure = false,
  height
}) => {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [saving, setSaving] = useState(false);
  const [outlining, setOutlining] = useState(false);
  const [cropMeta, setCropMeta] = useState<any | null>(null);
  const [debug, setDebug] = useState(false);
  const [seed, setSeed] = useState<{ type: 'Point'; coordinates: [number, number] } | null>(null);
  const [paddingFeet, setPaddingFeet] = useState<number>(15);
  const [justAutoOutlined, setJustAutoOutlined] = useState(false);
  const { data: admin } = useAdminStatus();
  const isAdmin = !!admin?.isAdmin;

  useEffect(() => {
    if (!containerRef.current || justAutoOutlined) return;

    const init = async () => {
      try {
        const center: [number, number] = [
          typeof longitude === "number" ? Number(longitude) : -122.4194,
          typeof latitude === "number" ? Number(latitude) : 37.7749,
        ];

        // Fetch Mapbox public token from edge function
        const { data: cfg, error: cfgErr } = await supabase.functions.invoke("map-config");
        if (cfgErr) {
          console.error("map-config error", cfgErr);
          toast.error("Developer Alert: map-config failed. Using limited map mode.");
        }
        if (cfg?.mapboxPublicToken) {
          (mapboxgl as any).accessToken = cfg.mapboxPublicToken;
        }

        const map = new mapboxgl.Map({
          container: containerRef.current!,
          style: "mapbox://styles/mapbox/satellite-v9",
          center,
          zoom: 20,
          attributionControl: false,
        });
        mapRef.current = map as any;

        const Draw = MapboxDraw as any;
        // Subtle polygon styles
        const drawStyles = [
          {
            id: "gl-draw-polygon-fill",
            type: "fill",
            filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
            paint: {
              "fill-color": "#00a2ff",
              "fill-opacity": 0.25,
            },
          },
          {
            id: "gl-draw-polygon-stroke-active",
            type: "line",
            filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": "#00a2ff", "line-width": 2 },
          },
          {
            id: "gl-draw-polygon-and-line-vertex-halo-active",
            type: "circle",
            filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
            paint: { "circle-radius": 5, "circle-color": "#fff" },
          },
          {
            id: "gl-draw-polygon-and-line-vertex-active",
            type: "circle",
            filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
            paint: { "circle-radius": 3, "circle-color": "#00a2ff" },
          },
        ];

        drawRef.current = new Draw({
          displayControlsDefault: false,
          controls: { polygon: true, trash: true },
          defaultMode: "draw_polygon",
          styles: drawStyles,
        });
        map.addControl(drawRef.current, "top-right");
        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "top-right");

        map.on("load", () => {
          // Load existing ROI or create default rectangle
          if (existingROI && existingROI.type === "Polygon") {
            drawRef.current?.add({
              id: "roof",
              type: "Feature",
              geometry: existingROI as any,
              properties: {},
            });
          } else {
            const rect = createDefaultRectangle(center[0], center[1], 0.00015, 0.00012);
            drawRef.current?.add({
              id: "roof",
              type: "Feature",
              geometry: rect as any,
              properties: {},
            });
          }
        });
      } catch (e) {
        console.error("ROI map init error", e);
        toast.error("Developer Alert: ROI map failed to initialize.");
      }
    };

    init();

    return () => {
      try { mapRef.current?.remove(); } catch {}
    };
  }, [latitude, longitude, existingROI]);

  const createDefaultRectangle = (lng: number, lat: number, lngSpan: number, latSpan: number): RoofPolygon => {
    const poly: RoofPolygon = {
      type: "Polygon",
      coordinates: [[
        [lng - lngSpan, lat - latSpan],
        [lng + lngSpan, lat - latSpan],
        [lng + lngSpan, lat + latSpan],
        [lng - lngSpan, lat + latSpan],
        [lng - lngSpan, lat - latSpan],
      ]],
    };
    return poly;
  };

  const getDrawnPolygon = (): RoofPolygon | null => {
    const data = drawRef.current?.getAll();
    if (!data || !data.features || data.features.length === 0) return null;
    const first = data.features.find((f: any) => f.geometry?.type === "Polygon");
    if (!first) return null;
    return first.geometry as RoofPolygon;
  };
  const handleSave = async () => {
    const poly = getDrawnPolygon();
    if (!poly) {
      toast.error("Please draw a polygon for the roof ROI.");
      return;
    }
    const ring = poly.coordinates?.[0] || [];
    if (ring.length < 4) { // closed polygon repeats first point
      toast.error("Please draw a polygon with at least 3 points.");
      return;
    }

    try {
      setSaving(true);
      const { error } = await (supabase as any)
        .from("quote_requests")
        .update({ roof_roi: poly, roi_image_url: null, ai_measurements_status: "idle" })
        .eq("id", quoteRequestId);
      if (error) throw error;

      toast.success("Roof ROI saved");
      onSaved?.(poly);
    } catch (e) {
      console.error("Save ROI failed", e);
      toast.error("Failed to save ROI");
    } finally {
      setSaving(false);
    }
  };

  const updateRoofOverlay = (poly: RoofPolygon) => {
    const map = mapRef.current as any;
    if (!map || !poly?.coordinates?.[0]) return;

    const ids = {
      perimSrc: 'roof-perimeter-src',
      perimLayer: 'roof-perimeter-line',
      labelsSrc: 'roof-edge-labels-src',
      labelsLayer: 'roof-edge-labels-layer',
    };

    // Remove existing
    try { if (map.getLayer(ids.perimLayer)) map.removeLayer(ids.perimLayer); } catch {}
    try { if (map.getSource(ids.perimSrc)) map.removeSource(ids.perimSrc); } catch {}
    try { if (map.getLayer(ids.labelsLayer)) map.removeLayer(ids.labelsLayer); } catch {}
    try { if (map.getSource(ids.labelsSrc)) map.removeSource(ids.labelsSrc); } catch {}

    const ring = poly.coordinates[0];
    map.addSource(ids.perimSrc, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: ring }, properties: {} }],
      },
    });
    map.addLayer({
      id: ids.perimLayer,
      type: 'line',
      source: ids.perimSrc,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#ff3b3b', 'line-width': 2 },
    });

    const labels = (poly as any)?.properties?.edge_labels as Array<{ midpoint:[number,number]; text:string }> | undefined;
    if (labels && labels.length) {
      const features = labels.map((l) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: l.midpoint }, properties: { text: l.text } }));
      map.addSource(ids.labelsSrc, { type: 'geojson', data: { type: 'FeatureCollection', features } });
      map.addLayer({
        id: ids.labelsLayer,
        type: 'symbol',
        source: ids.labelsSrc,
        layout: {
          'text-field': ['concat', ['get', 'text'], ' ft'],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 11,
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#ff3b3b',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
      });
    }
  };

  const replacePolygonOnMap = (poly: RoofPolygon) => {
    try {
      const data = drawRef.current?.getAll();
      if (data && data.features) {
        for (const f of data.features) {
          if ((f as any).id) drawRef.current?.delete((f as any).id);
        }
      }
      drawRef.current?.add({ id: 'roof', type: 'Feature', geometry: poly as any, properties: {} });

      // Fit bounds to polygon
      const ring = poly.coordinates?.[0] || [];
      if (ring.length > 1 && mapRef.current) {
        let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
        for (const [lng, lat] of ring) {
          if (lng < minLng) minLng = lng;
          if (lat < minLat) minLat = lat;
          if (lng > maxLng) maxLng = lng;
          if (lat > maxLat) maxLat = lat;
        }
        (mapRef.current as any).fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 14, duration: 600 });
      }

      // Update styled overlay + labels
      updateRoofOverlay(poly);
    } catch (e) {
      console.warn('Failed to replace polygon on map', e);
    }
  };

  const handleAutoOutline = async () => {
    try {
      setOutlining(true);

      // Preflight: need bbox and either coords or address for geocoding
      const needsCoords = !(typeof latitude === "number" && typeof longitude === "number");
      const hasAddress = !!propertyAddress;
      const hasBbox = !!(selectedImagery && (selectedImagery as any).bbox);

      if (!hasBbox) {
        toast.error("Developer Alert: selected_imagery.bbox missing. Acquire imagery first.");
        return;
      }

      if (needsCoords && hasAddress) {
        const geo = await supabase.functions.invoke("geocode-address", { body: { quote_request_id: quoteRequestId, address: propertyAddress } });
        if (geo.error) {
          console.error("geocode-address failed", geo.error);
          toast.error(`Developer Alert: geocode-address failed: ${geo.error.status || ''}. ${geo.error.message || ''}`);
          return;
        }
      } else if (needsCoords && !hasAddress) {
        toast.error("Developer Alert: Coordinates/address missing. Set address to enable auto-outline.");
        return;
      }

      // Ensure ROI image exists with padding 0.06, retry 0.12 on failure, and FORCE image creation when needed
      const gen1 = await supabase.functions.invoke("generate-roi-image", { body: { quote_request_id: quoteRequestId, paddingRatio: 0.06, force: true } });
      if (gen1.error) {
        console.error("generate-roi-image (0.06) failed", gen1.error);
        const gen2 = await supabase.functions.invoke("generate-roi-image", { body: { quote_request_id: quoteRequestId, paddingRatio: 0.12, force: true } });
        if (gen2.error) {
          console.error("generate-roi-image (0.12) failed", gen2.error);
          toast.error(`Developer Alert: generate-roi-image failed: ${gen2.error.status || ''}. ${gen2.error.message || ''}`);
          return;
        } else {
          setCropMeta((gen2.data as any)?.crop_meta || null);
        }
      } else {
        setCropMeta((gen1.data as any)?.crop_meta || null);
      }

      const res = await supabase.functions.invoke("auto-outline-roof", { body: { quote_request_id: quoteRequestId, precision: 'high' } });
      if (res.error) {
        console.error("auto-outline-roof failed", res.error);
        let step: string = "unknown";
        let status: any = (res.error as any)?.status || (res.error as any)?.code || res.error?.status || "";
        let message: string = res.error?.message || "";
        let details: any = undefined;
        try {
          const ctx: any = (res.error as any)?.context;
          if (ctx?.response && typeof ctx.response.clone === 'function') {
            try {
              const j = await ctx.response.clone().json();
              step = j?.step || step;
              status = j?.status || status;
              message = j?.message || message;
              details = j?.details || j?.error || undefined;
            } catch {
              try {
                const t = await ctx.response.clone().text();
                const j = JSON.parse(t);
                step = j?.step || step;
                status = j?.status || status;
                message = j?.message || message;
                details = j?.details || undefined;
              } catch {}
            }
          } else if (ctx?.body) {
            try {
              const j = typeof ctx.body === 'string' ? JSON.parse(ctx.body) : ctx.body;
              step = j?.step || step;
              status = j?.status || status;
              message = j?.message || message;
              details = j?.details || undefined;
            } catch {}
          }
        } catch (parseErr) {
          console.warn('Failed to parse error context', parseErr);
        }

        const base = `auto-outline-roof failed: ${status}. ${message} (step: ${step})`;
        if (step === 'secrets') {
          toast.error(`${base}. Missing OPENAI_API_KEY in Supabase Edge Function secrets.`);
        } else if (step === 'assistant-config') {
          toast.error(`${base}. OPENAI_ASSISTANT_ID missing/invalid in secrets.`);
        } else if (step === 'openai') {
          toast.error(`${base}. OpenAI auth/config error.`);
        } else {
          toast.error(`Developer Alert: ${base}`);
        }
        if (details) console.debug('auto-outline details:', details);
        return;
      }

      // Handle new enhanced auto-outline format
      const resultData = res.data as any;
      
      // Check for multiple structures format (new enhanced version)
      if (resultData?.features && Array.isArray(resultData.features) && resultData.features.length > 0) {
        if (enableMultiStructure && resultData.features.length > 1) {
          // Save multiple structures to database
          for (let i = 0; i < resultData.features.length; i++) {
            const feature = resultData.features[i];
            if (feature?.geometry?.type === "Polygon") {
              const structureId = String.fromCharCode(65 + i); // A, B, C, etc.
              
              // Save to roof_structures table
              const { error: structureError } = await supabase
                .from('roof_structures')
                .upsert({
                  quote_request_id: quoteRequestId,
                  structure_id: structureId,
                  geometry: feature.geometry,
                  area_sq_ft: feature.properties?.area_sq_ft || 0,
                  perimeter_ft: feature.properties?.perimeter_ft || 0,
                  confidence: feature.properties?.confidence || 0.8,
                  is_included: true
                });
                
              if (structureError) {
                console.error(`Error saving structure ${structureId}:`, structureError);
              }
            }
          }
          
          toast.success(`Detected and saved ${resultData.features.length} roof structures (A-${String.fromCharCode(64 + resultData.features.length)})`);
        }
        
        // Use the first feature (polygon) for display
        const firstFeature = resultData.features[0];
        if (firstFeature?.geometry?.type === "Polygon") {
          const roi: RoofPolygon = {
            type: "Polygon",
            coordinates: firstFeature.geometry.coordinates
          };
          replacePolygonOnMap(roi);
          setCropMeta(resultData?.crop_meta || cropMeta);
          
          // Prevent map reinitialization
          setJustAutoOutlined(true);
          setTimeout(() => setJustAutoOutlined(false), 1000);
          
          if (!enableMultiStructure) {
            if (resultData.features.length > 1) {
              toast.success(`Roof outline updated. Detected ${resultData.features.length} structures, showing the first one.`);
            } else {
              toast.success("Roof outline updated.");
            }
          }
          onSaved?.(roi);
        } else {
          toast.error("Developer Alert: auto-outline returned invalid polygon structure");
        }
      }
      // Check for legacy single polygon format
      else if (resultData?.roof_roi?.type === "Polygon") {
        const roi = resultData.roof_roi as RoofPolygon;
        replacePolygonOnMap(roi);
        setCropMeta(resultData?.crop_meta || cropMeta);
        
        // Prevent map reinitialization
        setJustAutoOutlined(true);
        setTimeout(() => setJustAutoOutlined(false), 1000);
        
        toast.success("Roof outline updated.");
        onSaved?.(roi);
      }
      // Handle manual mode or no polygons found
      else if (resultData?.method === 'manual_needed') {
        toast.info("Auto-detection failed. Please use manual editing tools or try the Enhanced Roof Outline component.");
      } else {
        toast.error("Developer Alert: auto-outline returned no polygon");
      }
    } catch (e: any) {
      console.error("auto-outline error", e);
      toast.error("Developer Alert: auto-outline-roof failed. See console.");
    } finally {
      setOutlining(false);
    }
  };

  // Admin debug overlay to visualize center and bbox corners
  useEffect(() => {
    const map = mapRef.current as any;
    const ids = {
      centerSrc: 'roi-debug-center-src',
      centerLayer: 'roi-debug-center-layer',
      bboxSrc: 'roi-debug-bbox-src',
      bboxLayer: 'roi-debug-bbox-layer',
    };
    const removeLayers = () => {
      try { if (map?.getLayer(ids.centerLayer)) map.removeLayer(ids.centerLayer); } catch {}
      try { if (map?.getLayer(ids.bboxLayer)) map.removeLayer(ids.bboxLayer); } catch {}
      try { if (map?.getSource(ids.centerSrc)) map.removeSource(ids.centerSrc); } catch {}
      try { if (map?.getSource(ids.bboxSrc)) map.removeSource(ids.bboxSrc); } catch {}
    };
    if (!map || !debug || !cropMeta) { removeLayers(); return; }
    const ensure = () => {
      removeLayers();
      const center = (cropMeta as any).center_used;
      const bbox = (cropMeta as any).bbox_lonlat;
      if (!center || !bbox) return;
      map.addSource(ids.centerSrc, { type: 'geojson', data: { type: 'FeatureCollection', features: [ { type: 'Feature', geometry: { type: 'Point', coordinates: [center.lng, center.lat] } } ] } });
      map.addLayer({ id: ids.centerLayer, type: 'circle', source: ids.centerSrc, paint: { 'circle-radius': 5, 'circle-color': '#ff3b3b', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1 } });
      const ring = [ [bbox.minLng, bbox.minLat], [bbox.maxLng, bbox.minLat], [bbox.maxLng, bbox.maxLat], [bbox.minLng, bbox.maxLat], [bbox.minLng, bbox.minLat] ];
      map.addSource(ids.bboxSrc, { type: 'geojson', data: { type: 'FeatureCollection', features: [ { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] } } ] } });
      map.addLayer({ id: ids.bboxLayer, type: 'line', source: ids.bboxSrc, paint: { 'line-color': '#ff3b3b', 'line-width': 2, 'line-dasharray': [1.5, 1.5] } });
    };
    if (map?.isStyleLoaded()) ensure(); else map?.once('load', ensure);
    return removeLayers;
  }, [debug, cropMeta]);

  return (
    <div className="space-y-2">
      <div 
        className={`relative w-full rounded-md border overflow-hidden ${height ? '' : 'h-56'}`}
        style={height ? { height } : undefined}
      >
        <div ref={containerRef} className="absolute inset-0 w-full min-w-0" />
        {/* Center crosshair */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border border-primary/60 rounded-sm" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="default" onClick={handleAutoOutline} disabled={outlining || !(selectedImagery && (selectedImagery as any).bbox)} title={!(selectedImagery && (selectedImagery as any).bbox) ? 'Select imagery first to enable Auto-Outline' : undefined}>
          {outlining ? "Outlining..." : "Auto-Outline Roof"}
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save ROI"}
        </Button>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={() => setDebug((v) => !v)}>
            {debug ? "Debug On" : "Debug"}
          </Button>
        )}
        <span className="text-xs text-muted-foreground">
          Draw or let AI outline the roof, then click Save ROI or run measurements.
        </span>
      </div>
      {cropMeta && (
        <div className="text-[10px] text-muted-foreground/80">
          source: {(cropMeta as any).source} · bbox locked
        </div>
      )}
    </div>
  );
};

export default RoiSelector;

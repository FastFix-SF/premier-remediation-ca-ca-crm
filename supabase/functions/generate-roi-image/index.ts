import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RoofPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const NEARMAP_API_KEY = Deno.env.get("NEARMAP_API_KEY");
const MAPBOX_PUBLIC_TOKEN = Deno.env.get("MAPBOX_PUBLIC_TOKEN");

function bboxFromPolygon(poly: RoofPolygon) {
  const ring = poly.coordinates[0] || [];
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const [lng, lat] of ring) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLng, minLat, maxLng, maxLat };
}

function expandBbox(bbox: {minLng:number;minLat:number;maxLng:number;maxLat:number}, paddingRatio = 0.10) {
  const width = bbox.maxLng - bbox.minLng;
  const height = bbox.maxLat - bbox.minLat;
  const padLng = width * paddingRatio;
  const padLat = height * paddingRatio;
  return {
    minLng: bbox.minLng - padLng,
    minLat: bbox.minLat - padLat,
    maxLng: bbox.maxLng + padLng,
    maxLat: bbox.maxLat + padLat,
  };
}

async function tryNearmapImage(bbox: {minLng:number;minLat:number;maxLng:number;maxLat:number}) {
  if (!NEARMAP_API_KEY) throw new Error("NEARMAP_API_KEY not configured");
  const url = new URL("https://api.nearmap.com/maps/v3/StaticMap");
  url.searchParams.set("layer", "Vert");
  url.searchParams.set("format", "jpg");
  url.searchParams.set("nmarks", "0");
  url.searchParams.set("size", `1024x1024`);
  url.searchParams.set("bbox", `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`);
  url.searchParams.set("zoom", "20");
  url.searchParams.set("apikey", NEARMAP_API_KEY);
  const res = await fetch(url.toString());
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Nearmap fetch failed: ${res.status} ${t}`);
  }
  const ab = await res.arrayBuffer();
  return new Uint8Array(ab);
}

async function mapboxStaticByBbox(bbox: {minLng:number;minLat:number;maxLng:number;maxLat:number}, size = { w: 1024, h: 1024 }) {
  if (!MAPBOX_PUBLIC_TOKEN) throw new Error("MAPBOX_PUBLIC_TOKEN not configured for fallback");
  // Compute center and zoom to tightly fit bbox in given pixel size using Web Mercator math
  const R = 6378137;
  const toMercX = (lng: number) => (lng * Math.PI / 180) * R;
  const toMercY = (lat: number) => {
    const rad = lat * Math.PI / 180;
    return R * Math.log(Math.tan(Math.PI / 4 + rad / 2));
  };
  const minX = toMercX(bbox.minLng), maxX = toMercX(bbox.maxLng);
  const minY = toMercY(bbox.minLat), maxY = toMercY(bbox.maxLat);
  const widthM = Math.max(1, Math.abs(maxX - minX));
  const heightM = Math.max(1, Math.abs(maxY - minY));
  const centerLng = (bbox.minLng + bbox.maxLng) / 2;
  const centerLat = (bbox.minLat + bbox.maxLat) / 2;
  // World size for 512px tiles in Web Mercator
  const TILE = 512;
  const fitZoom = (wPx: number, hPx: number) => {
    const worldSizeAtZ = (z: number) => TILE * Math.pow(2, z);
    // meters per pixel at latitude center for spherical mercator
    // Using approximation: metersPerPixel = cos(lat) * 2 * PI * R / worldSize
    const metersPerPixelAt = (z: number) => (Math.cos(centerLat * Math.PI / 180) * 2 * Math.PI * R) / worldSizeAtZ(z);
    // Find z such that bbox fits
    for (let z = 22; z >= 0; z--) {
      const mpp = metersPerPixelAt(z);
      if (widthM / mpp <= wPx && heightM / mpp <= hPx) return z;
    }
    return 0;
  };
  const z = fitZoom(size.w, size.h);
  const url = new URL("https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static");
  url.pathname += `/${centerLng},${centerLat},${z}/${size.w}x${size.h}`;
  url.searchParams.set("access_token", MAPBOX_PUBLIC_TOKEN);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Mapbox static failed: ${res.status} ${await res.text()}`);
  const ab = await res.arrayBuffer();
  return new Uint8Array(ab);
}

async function uploadBytes(supabase: any, quoteRequestId: string, bytes: Uint8Array) {
  const path = `${quoteRequestId}/roi_${Date.now()}.jpg`;
  const { error: upErr } = await supabase.storage.from("roi-images").upload(path, bytes, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (upErr) throw upErr;
  const { data: pub } = supabase.storage.from("roi-images").getPublicUrl(path);
  if (!pub?.publicUrl) throw new Error("Failed to get public URL for ROI image");
  return pub.publicUrl;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAuthed = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const supabaseSR = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    // Auth: admin only
    const { data: auth } = await supabaseAuthed.auth.getUser();
    if (!auth?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: adminRow } = await supabaseSR
      .from("admin_users")
      .select("id")
      .eq("user_id", auth.user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (!adminRow) return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const quoteRequestId: string = body?.quote_request_id || body?.quoteRequestId;
    const incomingSeed: any = body?.seed || null; // GeoJSON Point or tiny Polygon
    const incomingPaddingFeet: number | null = typeof body?.paddingFeet === 'number' ? body.paddingFeet : null;
    const paddingRatio: number = typeof body?.paddingRatio === "number" ? body.paddingRatio : 0.06; // legacy support
    const force: boolean = !!body?.force;
    if (!quoteRequestId) return new Response(JSON.stringify({ success: false, step: "input", status: 400, message: "quote_request_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Load request
    const { data: qr, error: qrErr } = await supabaseSR
      .from("quote_requests")
      .select("id, roof_roi, roof_seed, latitude, longitude, selected_imagery, crop_meta, roi_image_url")
      .eq("id", quoteRequestId)
      .maybeSingle();
    if (qrErr || !qr) return new Response(JSON.stringify({ success: false, step: "load", status: 404, message: "Quote request not found", details: qrErr }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Upsert seed if provided
    if (incomingSeed) {
      await supabaseSR.from('quote_requests').update({ roof_seed: incomingSeed }).eq('id', quoteRequestId);
    }

    const seed = incomingSeed || (qr as any).roof_seed || null;
    const roofROI = qr.roof_roi as RoofPolygon | null;
    const sel = (qr as any).selected_imagery || null;

    // Determine center_used precedence: seed centroid -> roof_roi centroid -> selected_imagery center
    const centroidOf = (geom: any): { lat:number; lng:number } | null => {
      try {
        if (!geom) return null;
        if (geom.type === 'Point') {
          const [lng, lat] = geom.coordinates;
          return { lat, lng };
        }
        if (geom.type === 'Polygon') {
          const ring: number[][] = geom.coordinates?.[0] || [];
          if (ring.length < 3) return null;
          let x=0,y=0,z=0; const n = ring.length - 1;
          for (let i=0;i<n;i++){ const [lng,lat]=ring[i]; const lr=lat*Math.PI/180; const gr=lng*Math.PI/180; x+=Math.cos(lr)*Math.cos(gr); y+=Math.cos(lr)*Math.sin(gr); z+=Math.sin(lr);} 
          x/=n; y/=n; z/=n; const gr=Math.atan2(y,x); const hyp=Math.sqrt(x*x + y*y); const lr=Math.atan2(z,hyp);
          return { lat: lr*180/Math.PI, lng: gr*180/Math.PI };
        }
      } catch {}
      return null;
    };

    const centerFromSel = () => {
      if (sel?.bbox) {
        const b = sel.bbox;
        return { lat: (b.minLat + b.maxLat)/2, lng: (b.minLng + b.maxLng)/2 };
      }
      if (typeof qr.latitude === 'number' && typeof qr.longitude === 'number') return { lat: Number(qr.latitude), lng: Number(qr.longitude) };
      return null;
    };

    const center_used = centroidOf(seed) || centroidOf(roofROI) || centerFromSel();
    if (!center_used) {
      return new Response(JSON.stringify({ success: false, step: 'validate', status: 400, message: 'Unable to determine center_used. Provide a seed or ROI.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Drift guard: if existing ROI centroid >20m from center_used, abort
    if (roofROI && roofROI.type === 'Polygon') {
      const roiC = centroidOf(roofROI)!;
      const haversineM = (a:{lat:number;lng:number}, b:{lat:number;lng:number}) => {
        const R = 6371000; const dLat=(b.lat-a.lat)*Math.PI/180; const dLng=(b.lng-a.lng)*Math.PI/180; const la1=a.lat*Math.PI/180, la2=b.lat*Math.PI/180;
        const s1=Math.sin(dLat/2), s2=Math.sin(dLng/2); const h=s1*s1 + Math.cos(la1)*Math.cos(la2)*s2*s2; return 2*R*Math.asin(Math.min(1, Math.sqrt(h)));
      };
      const drift = haversineM(center_used, roiC);
      if (drift > 20) {
        return new Response(JSON.stringify({ success:false, step:'validation', status:400, message:'Drift from seed >20 m', driftM: Number(drift.toFixed(2)), center_used, roi_centroid: roiC }), { status:400, headers: { ...corsHeaders, 'Content-Type':'application/json' } });
      }
    }

    // Padding feet: default 15, clamp 10-20; allow legacy paddingRatio if explicitly provided and no paddingFeet
    const paddingFeet = Math.max(10, Math.min(20, incomingPaddingFeet ?? Math.round((paddingRatio || 0.06) * 1000) / 100));

    // Build bbox around center_used using paddingFeet
    const meters = paddingFeet * 0.3048;
    const degLat = meters / 111320;
    const degLng = meters / (Math.cos(center_used.lat * Math.PI/180) * 111320);
    const bbox = { minLng: center_used.lng - degLng, minLat: center_used.lat - degLat, maxLng: center_used.lng + degLng, maxLat: center_used.lat + degLat };

    const image = { width: 1024, height: 1024 };
    const validCenter = center_used.lat > -90 && center_used.lat < 90 && center_used.lng > -180 && center_used.lng < 180;
    const validBbox = bbox.minLng < bbox.maxLng && bbox.minLat < bbox.maxLat;
    if (!validCenter || !validBbox) {
      return new Response(JSON.stringify({ success:false, step:'assert', status:422, message:'Invalid center/bbox', center_used, bbox_lonlat: bbox }), { status:422, headers: { ...corsHeaders, 'Content-Type':'application/json' } });
    }

    let bytes: Uint8Array | null = null;
    let source: 'nearmap' | 'mapbox-fallback' = 'nearmap';
    try { bytes = await tryNearmapImage(bbox); source = 'nearmap'; } catch (e) { console.error('Nearmap failed, falling back to Mapbox static', e); bytes = await mapboxStaticByBbox(bbox, { w: image.width, h: image.height }); source = 'mapbox-fallback'; }

    const url = await uploadBytes(supabaseSR, quoteRequestId, bytes!);

    // Mercator bbox
    const R = 6378137; const toMercX = (lng:number)=> (lng*Math.PI/180)*R; const toMercY=(lat:number)=>{ const r=lat*Math.PI/180; return R*Math.log(Math.tan(Math.PI/4 + r/2)); };
    const bbox_mercator = { minX: toMercX(bbox.minLng), minY: toMercY(bbox.minLat), maxX: toMercX(bbox.maxLng), maxY: toMercY(bbox.maxLat), srs:'EPSG:3857' };

    const crop_meta = { center_used, bbox_lonlat: bbox, bbox_mercator, paddingFeet, source, image };
    console.log('sot', { center_used, bbox_lonlat: bbox, image });

    await supabaseSR.from('quote_requests').update({ roi_image_url: url, crop_meta }).eq('id', quoteRequestId);

    return new Response(JSON.stringify({ success: true, roi_image_url: url, crop_meta, paddingFeet }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-roi-image error", e);
    return new Response(
      JSON.stringify({ success: false, step: "generate-roi-image", status: 500, message: e?.message || String(e), details: e?.stack || e }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

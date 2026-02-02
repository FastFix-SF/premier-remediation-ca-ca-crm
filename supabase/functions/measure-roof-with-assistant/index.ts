
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RoofPolygon = {
  type: "Polygon";
  coordinates: number[][][]; // [ [ [lng, lat], ... ] ]
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const OPENAI_ASSISTANT_ID = Deno.env.get("OPENAI_ASSISTANT_ID") || "asst_YCYlnhKDCgLUJ6QCo2aLnfHS";
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

async function fetchNearmapImage(bbox: {minLng:number;minLat:number;maxLng:number;maxLat:number}, size = { w: 1024, h: 1024 }) {
  if (!NEARMAP_API_KEY) {
    throw new Error("NEARMAP_API_KEY not configured");
  }
  // Static map with bbox; Nearmap StaticMap-like endpoint
  const url = new URL("https://api.nearmap.com/maps/v3/StaticMap");
  url.searchParams.set("layer", "Vert");
  url.searchParams.set("format", "jpg");
  url.searchParams.set("nmarks", "0");
  url.searchParams.set("size", `${size.w}x${size.h}`);
  url.searchParams.set("bbox", `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`);
  url.searchParams.set("apikey", NEARMAP_API_KEY);
  // Note: If your account requires date/zoom, set defaults here:
  url.searchParams.set("zoom", "20");
  // Fetch image
  const res = await fetch(url.toString());
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Nearmap fetch failed: ${res.status} ${t}`);
  }
  const ab = await res.arrayBuffer();
  return new Uint8Array(ab);
}

async function uploadROIImage(supabase: any, quoteRequestId: string, bytes: Uint8Array) {
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

const SCHEMA_TEXT = `Return ONLY valid JSON matching this exact schema (LF = linear feet):

{
  "area": {
    "total_sq_ft": 0,
    "total_squares": 0,
    "area_by_plane": [{ "plane_id": "A", "sq_ft": 0 }],
    "waste_factor_percent": 0
  },
  "linear": {
    "eave_edge_lf": 0,
    "rake_edge_lf": 0,
    "drip_edge_eave_lf": 0,
    "drip_edge_rake_lf": 0,
    "ridges_lf": 0,
    "hips_lf": 0,
    "valleys_lf": 0,
    "pitch_break_lf": 0,
    "step_flashing_lf": 0,
    "wall_flashing_lf": 0,
    "side_wall_lf": 0,
    "head_wall_lf": 0,
    "return_walls_lf": 0
  },
  "features": {
    "chimneys": [{ "count": 0, "width_ft": 0, "length_ft": 0 }],
    "vents": [{ "type": "pipe|box|turbine|ridge", "count": 0 }],
    "skylights": [{ "count": 0, "width_ft": 0, "length_ft": 0 }],
    "dormers": [{ "count": 0 }],
    "satellite_dishes": [{ "count": 0 }],
    "hvac_units": [{ "count": 0 }]
  },
  "pitch": {
    "primary": "0/12",
    "by_plane": [{ "plane_id": "A", "pitch": "0/12" }],
    "average": "0/12",
    "range": ["0/12","0/12"]
  },
  "derived": {
    "total_planes": 0,
    "total_perimeter_lf": 0,
    "complexity": "low|medium|high",
    "estimated_waste_percent": 0,
    "confidence": 0
  },
  "notes": ""
}`;

async function runAssistant(roiImageUrl: string, roofROI: RoofPolygon, address?: string | null, coords?: {lat?: number|null; lng?: number|null}, pitchSchema?: any, selectedImagery?: any) {
  const firstSentence = "Follow this workflow: unlabeled trace → label edges (eave/rake/ridge/hip/valley/step/wall) → assign pitch (default 4/12 unless per-plane specified) → compute area and linear totals.";
  const instruction = `${firstSentence}\n\nUse the attached near-vertical aerial image and the provided roof polygon (GeoJSON). If something is uncertain, estimate conservatively and include a confidence score (0–1). Use imperial units. 1 square = 100 sq ft.\n\nRoof ROI (GeoJSON):\n${JSON.stringify(roofROI)}\n\nEdge labels (if any): ${JSON.stringify((roofROI as any)?.properties?.segments || [])}\n\nPitch schema: ${JSON.stringify(pitchSchema || {})}\n\nSelected imagery metadata: ${JSON.stringify(selectedImagery || {})}\n\n${address ? `Property address: ${address}` : ""}${coords?.lat && coords?.lng ? `\nCoordinates: ${coords.lat}, ${coords.lng}` : ""}\n\n${SCHEMA_TEXT}`;

  // Create thread
  const threadResp = await fetch("https://api.openai.com/v1/threads", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2",
    },
    body: JSON.stringify({}),
  });
  if (!threadResp.ok) throw new Error(`OpenAI create thread failed: ${await threadResp.text()}`);
  const thread = await threadResp.json();

  // Post message with image and instruction
  const msgResp = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2",
    },
    body: JSON.stringify({
      role: "user",
  content: [
    { type: "text", text: instruction },
    { type: "image_url", image_url: { url: roiImageUrl } },
  ],
    }),
  });
  if (!msgResp.ok) throw new Error(`OpenAI post message failed: ${await msgResp.text()}`);

  // Run assistant
  const runResp = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2",
    },
    body: JSON.stringify({ assistant_id: OPENAI_ASSISTANT_ID }),
  });
  if (!runResp.ok) throw new Error(`OpenAI start run failed: ${await runResp.text()}`);
  const run = await runResp.json();

  // Poll
  let status = run;
  let attempts = 0;
  while ((status.status === "queued" || status.status === "in_progress") && attempts < 90) {
    await new Promise((r) => setTimeout(r, 500));
    const statResp = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
      },
    });
    status = await statResp.json();
    attempts++;
  }
  if (status.status !== "completed") {
    throw new Error(`Assistant run not completed: ${status.status}`);
  }

  // Get messages
  const msgsResp = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "OpenAI-Beta": "assistants=v2",
    },
  });
  const msgs = await msgsResp.json();
  const assistantMsg = msgs.data?.find((m: any) => m.role === "assistant") || msgs.data?.[0];
  const contentItem = assistantMsg?.content?.find((c: any) => c.type === "output_text" || c.type === "text");
  const textValue = contentItem?.text?.value || contentItem?.value || "";

  // Extract JSON
  const match = textValue.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in assistant output");
  const parsed = JSON.parse(match[0]);
  return parsed;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate required secrets first
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not configured");
      return new Response(JSON.stringify({ 
        step: "config", 
        status: 500, 
        error: "OpenAI API key not configured in secrets" 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    if (!OPENAI_ASSISTANT_ID) {
      console.error("OPENAI_ASSISTANT_ID not configured");
      return new Response(JSON.stringify({ 
        step: "config", 
        status: 500, 
        error: "OpenAI Assistant ID not configured in secrets" 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseAuthed = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseSR = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Auth - more robust error handling
    const { data: authData, error: authError } = await supabaseAuthed.auth.getUser();
    if (authError || !authData?.user) {
      console.error("Authentication failed:", authError);
      return new Response(JSON.stringify({ 
        step: "auth", 
        status: 401, 
        error: "Authentication required" 
      }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const { data: adminRow, error: adminError } = await supabaseSR
      .from("admin_users")
      .select("id")
      .eq("user_id", authData.user.id)
      .eq("is_active", true)
      .maybeSingle();
    
    if (adminError || !adminRow) {
      console.error("Admin check failed:", adminError);
      return new Response(JSON.stringify({ 
        step: "auth", 
        status: 403, 
        error: "Admin access required" 
      }), { 
        status: 403, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const body = await req.json();
    const quoteRequestId: string = body?.quote_request_id || body?.quoteRequestId;
    const rerun: boolean = !!body?.rerun;
    const paddingRatio: number = typeof body?.paddingRatio === "number" ? body.paddingRatio : 0.10;

    if (!quoteRequestId) {
      return new Response(JSON.stringify({ error: "quote_request_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load quote request
    const { data: qr, error: qrErr } = await supabaseSR
      .from("quote_requests")
      .select("id, property_address, latitude, longitude, roof_roi, roi_image_url, ai_measurements_status, selected_imagery, pitch_schema")
      .eq("id", quoteRequestId)
      .maybeSingle();
    if (qrErr || !qr) {
      return new Response(JSON.stringify({ error: "Quote request not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const roofROI = qr.roof_roi as RoofPolygon | null;
    if (!roofROI || roofROI.type !== "Polygon") {
      return new Response(JSON.stringify({ error: "roof_roi is missing; please select/draw ROI first" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Mark processing
    await supabaseSR.from("quote_requests").update({ ai_measurements_status: "processing" }).eq("id", quoteRequestId);

    // Prepare or regenerate ROI image
    let roiUrl: string | null = rerun ? null : (qr.roi_image_url || null);

    const makeImage = async (padRatio: number) => {
      const baseBbox = bboxFromPolygon(roofROI);
      const bbox = expandBbox(baseBbox, padRatio);
      const bytes = await fetchNearmapImage(bbox);
      const url = await uploadROIImage(supabaseSR, quoteRequestId, bytes);
      await supabaseSR.from("quote_requests").update({ roi_image_url: url }).eq("id", quoteRequestId);
      return url;
    };

    if (!roiUrl) {
      roiUrl = await makeImage(paddingRatio);
    }

    let resultJson: any;
    let attempt = 0;
    let success = false;
    let lastError: string | null = null;

    while (attempt < 2 && !success) {
      try {
        // If first attempt failed or we want larger bbox on retry
        if (attempt === 1) {
          roiUrl = await makeImage(Math.max(paddingRatio * 2.0, 0.20));
        }
        resultJson = await runAssistant(roiUrl!, roofROI, qr.property_address, { lat: qr.latitude, lng: qr.longitude });
        success = true;
      } catch (e: any) {
        lastError = e?.message || String(e);
        attempt++;
      }
    }

    if (!success) {
      await supabaseSR.from("quote_requests").update({
        ai_measurements_status: "error",
        ai_measurements: { error: lastError || "Assistant failed to return JSON" },
        ai_measurements_updated_at: new Date().toISOString(),
      }).eq("id", quoteRequestId);

      return new Response(JSON.stringify({ success: false, error: lastError }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Save results
    const { error: upErr } = await supabaseSR.from("quote_requests").update({
      ai_measurements: resultJson,
      ai_measurements_status: "ready",
      ai_measurements_updated_at: new Date().toISOString(),
    }).eq("id", quoteRequestId);
    if (upErr) {
      throw upErr;
    }

    return new Response(JSON.stringify({ success: true, ai_measurements: resultJson, roi_image_url: roiUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("measure-roof-with-assistant error", err);
    return new Response(
      JSON.stringify({ step: "measure-roof-with-assistant", status: 500, error: err?.message ?? "Unexpected error", details: err?.stack || err }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

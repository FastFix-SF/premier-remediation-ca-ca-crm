import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { quoteRequestId } = await req.json();
    console.log("convert-quote-request called with:", { quoteRequestId });

    if (!quoteRequestId) {
      return new Response(JSON.stringify({ error: "quoteRequestId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a client that forwards the user's auth header to identify who is calling
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the caller is authenticated and an active admin
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      console.warn("Unauthorized convert attempt", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!adminRow) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load the quote request
    const { data: qr, error: qrErr } = await supabase
      .from("quote_requests")
      .select("*")
      .eq("id", quoteRequestId)
      .single();

    if (qrErr || !qr) {
      console.error("Failed to load quote request", qrErr);
      return new Response(JSON.stringify({ error: "Quote request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If already converted and measurements exist, return early
    if (qr.status === "Project" && qr.measurements && Object.keys(qr.measurements || {}).length > 0) {
      return new Response(
        JSON.stringify({ success: true, updatedRequest: qr, message: "Already converted with measurements" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find latest aerial image for this quote request
    const { data: aerialImage } = await supabase
      .from("aerial_images")
      .select("image_url, latitude, longitude")
      .eq("quote_request_id", quoteRequestId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let imageUrl: string | undefined = aerialImage?.image_url;
    let lat: number | undefined = qr.latitude ?? aerialImage?.latitude ?? undefined;
    let lng: number | undefined = qr.longitude ?? aerialImage?.longitude ?? undefined;

    // Fallback: attempt to acquire aerial image now if we don't have one yet
    if (!imageUrl && qr.property_address) {
      console.log("No aerial image found; invoking acquire-aerial-imagery...");
      const { data: acquireData, error: acquireErr } = await supabase.functions.invoke(
        "acquire-aerial-imagery",
        { body: { quoteRequestId, propertyAddress: qr.property_address } }
      );
      if (!acquireErr && acquireData?.images?.[0]?.image_url) {
        imageUrl = acquireData.images[0].image_url;
        lat = lat ?? acquireData.coordinates?.lat;
        lng = lng ?? acquireData.coordinates?.lng;
      }
    }

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No aerial image available for measurement" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the AI request with image + context
    const prompt = `Analyze the roof in the provided overhead image and return a concise JSON object only.
Include: area (total_sq_ft, total_squares, waste_factor_percent),
linear (ridges_lf, hips_lf, valleys_lf, eave_edge_lf, rake_edge_lf),
pitch (primary, average, range),
derived (total_planes, total_perimeter_lf, complexity, estimated_waste_percent),
features (vents, skylights, chimneys counts),
confidence (0-1), and short notes.
Respond with ONLY valid JSON.`;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a precise roof measurement assistant. Output strict JSON only." },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } },
              ...(qr.property_address ? [{ type: "text", text: `Property address: ${qr.property_address}` }] : []),
              ...(lat && lng ? [{ type: "text", text: `Coordinates: ${lat}, ${lng}` }] : []),
            ],
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("OpenAI error:", errText);
      return new Response(JSON.stringify({ error: "AI measurement failed", details: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let aiJson;
    try {
      aiJson = await aiRes.json();
    } catch (jsonError) {
      console.error('Failed to parse OpenAI response as JSON:', jsonError);
      throw new Error('Invalid JSON response from AI service');
    }
    let content: string = aiJson?.choices?.[0]?.message?.content ?? "{}";

    // Try to parse JSON content; handle code fences if present
    let measurements: any = {};
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      measurements = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (e) {
      console.warn("Failed to parse AI JSON; defaulting to empty object", e);
      measurements = {};
    }

    // Update quote request with status + measurements
    const updates: any = {
      status: "Project",
      converted_to_project_at: new Date().toISOString(),
      measurements,
    };
    if (typeof lat === "number") updates.latitude = lat;
    if (typeof lng === "number") updates.longitude = lng;

    const { data: updated, error: upErr } = await supabase
      .from("quote_requests")
      .update(updates)
      .eq("id", quoteRequestId)
      .select("*")
      .single();

    if (upErr) {
      console.error("Failed updating quote request with measurements", upErr);
      return new Response(JSON.stringify({ error: "Failed to save measurements" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, updatedRequest: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("convert-quote-request error", err);
    return new Response(JSON.stringify({ error: err?.message ?? "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
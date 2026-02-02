import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });

  try {
    // Auth: admin only
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", auth.user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (!adminRow) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const quoteRequestId: string = body?.quote_request_id || body?.quoteRequestId;
    const address: string = body?.address;

    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(JSON.stringify({ error: "GOOGLE_MAPS_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!quoteRequestId || !address) {
      return new Response(JSON.stringify({ error: "quote_request_id and address are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

    const res = await fetch(url.toString());
    const data = await res.json();
    if (data.status !== "OK" || !data.results?.[0]?.geometry?.location) {
      return new Response(JSON.stringify({ error: `Geocoding failed: ${data.status}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const loc = data.results[0].geometry.location; // { lat, lng }

    const { error: upErr } = await supabase
      .from("quote_requests")
      .update({ latitude: loc.lat, longitude: loc.lng })
      .eq("id", quoteRequestId);
    if (upErr) throw upErr;

    return new Response(JSON.stringify({ success: true, latitude: loc.lat, longitude: loc.lng }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("geocode-address error", e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { latitude, longitude } = body;

    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(JSON.stringify({ error: "GOOGLE_MAPS_API_KEY not configured" }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    if (!latitude || !longitude) {
      return new Response(JSON.stringify({ error: "latitude and longitude are required" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${latitude},${longitude}`);
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

    const res = await fetch(url.toString());
    const data = await res.json();
    
    if (data.status !== "OK" || !data.results?.[0]) {
      return new Response(JSON.stringify({ error: `Reverse geocoding failed: ${data.status}` }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const address = data.results[0].formatted_address;

    return new Response(JSON.stringify({ success: true, address }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("reverse-geocode error", e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
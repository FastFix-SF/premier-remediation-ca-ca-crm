import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NASA_API_KEY = Deno.env.get("NASA_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get("lat");
    const lon = url.searchParams.get("lon");
    const date = url.searchParams.get("date") || new Date().toISOString().split('T')[0];

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: "Missing latitude or longitude" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!NASA_API_KEY) {
      console.error("NASA_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "NASA API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching NASA imagery for lat: ${lat}, lon: ${lon}, date: ${date}`);

    // Fetch NASA Earth Imagery
    const nasaUrl = `https://api.nasa.gov/planetary/earth/imagery?lon=${lon}&lat=${lat}&date=${date}&dim=0.15&api_key=${NASA_API_KEY}`;
    
    const response = await fetch(nasaUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NASA API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch NASA imagery", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the image with CORS headers
    const imageBlob = await response.blob();
    return new Response(imageBlob, {
      headers: {
        ...corsHeaders,
        "Content-Type": response.headers.get("Content-Type") || "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });

  } catch (error) {
    console.error("Error in nasa-image-proxy:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

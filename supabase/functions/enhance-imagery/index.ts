import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");

async function waitForPrediction(predictionId: string, apiKey: string): Promise<any> {
  const maxAttempts = 60; // Wait up to 60 seconds
  const delayMs = 1000; // Check every second
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to check prediction status: ${response.statusText}`);
    }
    
    const prediction = await response.json();
    console.log(`Prediction status (attempt ${i + 1}): ${prediction.status}`);
    
    if (prediction.status === "succeeded") {
      return prediction;
    }
    
    if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(`Enhancement failed: ${prediction.error || prediction.status}`);
    }
    
    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  throw new Error("Enhancement timed out after 60 seconds");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Missing imageUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!REPLICATE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "REPLICATE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting Real-ESRGAN image enhancement...");
    console.log("Image URL:", imageUrl);

    // Start the Replicate prediction
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
        input: {
          image: imageUrl,
          scale: 2,
          face_enhance: false
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Replicate API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to start enhancement" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prediction = await response.json();
    console.log("Prediction started:", prediction.id);

    // Wait for the prediction to complete
    const completedPrediction = await waitForPrediction(prediction.id, REPLICATE_API_KEY);
    
    const enhancedImageUrl = completedPrediction.output;

    if (!enhancedImageUrl) {
      console.error("No enhanced image in response");
      return new Response(
        JSON.stringify({ error: "No enhanced image generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Enhancement completed successfully");
    console.log("Enhanced URL:", enhancedImageUrl);

    // Download the enhanced image and convert to base64
    console.log("Downloading enhanced image...");
    const enhancedResponse = await fetch(enhancedImageUrl);
    
    if (!enhancedResponse.ok) {
      throw new Error(`Failed to download enhanced image: ${enhancedResponse.statusText}`);
    }
    
    const arrayBuffer = await enhancedResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to binary string byte-by-byte
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    
    const base64 = btoa(binary);
    const contentType = enhancedResponse.headers.get('content-type') || 'image/png';
    const base64DataUrl = `data:${contentType};base64,${base64}`;
    
    console.log("Enhanced image converted to base64");

    return new Response(
      JSON.stringify({ 
        enhancedUrl: base64DataUrl,
        originalUrl: imageUrl 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in enhance-imagery:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

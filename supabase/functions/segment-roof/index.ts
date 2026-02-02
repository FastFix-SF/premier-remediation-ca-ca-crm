import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageDataUrl, clickX, clickY } = await req.json();

    if (!imageDataUrl || clickX === undefined || clickY === undefined) {
      throw new Error('Missing required parameters: imageDataUrl, clickX, clickY');
    }

    console.log('SAM 2 segmentation request - click position:', { clickX, clickY });

    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY not configured');
    }

    // Validate input to avoid wasting credits
    if (clickX < 0 || clickX > 1 || clickY < 0 || clickY > 1) {
      throw new Error('Invalid click coordinates - must be between 0 and 1');
    }

    console.log('Calling Replicate SAM 2 for single object segmentation...');
    
    // Use point prompt with multimask output (like Canva Magic Edit)
    // SAM 2 returns 3 masks ranked by quality - we'll pick the smallest/most specific one
    // This ensures we get ONLY the clicked object, not adjacent objects
    
    console.log('Calling SAM 2 with multimask output for best single-object selection...');
    
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'cbd95fb76192174268b6b303aeeb7a736e8dab0cbc38177f09db79b2299da30b',
        input: {
          image: imageDataUrl,
          point_coords: [[clickX, clickY]],
          point_labels: [1],  // 1 = foreground point
          multimask_output: true  // Get 3 ranked masks to pick the best one
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate API error:', response.status, errorText);
      
      // Parse error details
      let errorMessage = `SAM 2 API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) {
          errorMessage = errorJson.detail;
        }
      } catch {
        // If parsing fails, use the raw error text
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const prediction = await response.json();
    console.log('SAM 2 prediction created:', prediction.id);

    // Wait for the prediction to complete (efficient polling with longer timeout)
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes max (SAM 2 can take time when queue is busy)
    
    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      // Progressive backoff: 1s for first 20 attempts, then 1.5s
      const delay = attempts < 20 ? 1000 : 1500;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_KEY}`,
        },
      });
      
      result = await statusResponse.json();
      attempts++;
      
      // More frequent logging to track progress
      if (attempts % 3 === 0 || result.status === 'succeeded' || result.status === 'failed') {
        console.log(`SAM 2 status [${attempts}/${maxAttempts}]:`, result.status, `(${Math.round(attempts * delay / 1000)}s elapsed)`);
      }
    }

    if (result.status !== 'succeeded') {
      const errorDetails = result.error || result.logs || 'No additional details';
      console.error('SAM 2 prediction details:', { status: result.status, error: errorDetails, attempts });
      throw new Error(`SAM 2 prediction failed or timed out after ${attempts} attempts. Status: ${result.status}`);
    }

    console.log('SAM 2 segmentation completed');

    // Debug: Log the entire output structure
    console.log('SAM 2 output keys:', Object.keys(result.output || {}));
    console.log('SAM 2 output type:', typeof result.output);
    console.log('Full output structure:', JSON.stringify(result.output, null, 2));

    // SAM 2 returns individual_masks (array) when multimask_output is true
    const individualMasks = result.output?.individual_masks;
    
    console.log('individual_masks value:', individualMasks);
    console.log('individual_masks type:', typeof individualMasks);
    console.log('Is array?', Array.isArray(individualMasks));
    console.log('Length:', individualMasks?.length);
    
    if (!individualMasks || !Array.isArray(individualMasks) || individualMasks.length === 0) {
      console.error('FAILED: No valid individual_masks array found');
      console.error('Full result object:', JSON.stringify(result, null, 2));
      throw new Error('No mask data returned from SAM 2');
    }

    console.log(`✓ Received ${individualMasks.length} masks from SAM 2`);
    
    // Only return top 5 masks to avoid timeout - SAM 2 returns them ranked by quality
    const topMasks = individualMasks.slice(0, 5);
    console.log(`Returning top ${topMasks.length} masks for client-side selection`);

    return new Response(
      JSON.stringify({
        roofDetected: true,
        masks: topMasks,
        confidence: 0.95,
        roofShape: 'detected',
        message: `Top ${topMasks.length} masks generated - client will select best match`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in segment-roof:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

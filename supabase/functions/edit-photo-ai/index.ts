import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  try {
    console.log(`Downloading image from: ${imageUrl}`);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    
    console.log(`Successfully downloaded image, size: ${arrayBuffer.byteLength} bytes`);
    return base64;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw new Error(`Failed to download image: ${error instanceof Error ? error.message : String(error)}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured. Please contact your administrator.',
          success: false,
          errorType: 'config'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { imageUrl, isAutoCleanup } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ 
          error: 'No image URL provided',
          success: false,
          errorType: 'validation'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Starting OpenAI auto-cleanup for image: ${imageUrl.substring(0, 100)}...`);
    console.log(`Auto cleanup mode: ${isAutoCleanup}`);

    // Download the original image
    const originalBase64 = await downloadImageAsBase64(imageUrl);
    
    // Step 1: Analyze the image with GPT-4o Vision
    console.log('Analyzing image with GPT-4o Vision...');
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Describe this image in detail, focusing on the main subject, lighting, perspective, colors, and composition. Note any imperfections like workers, tools, debris, trash, shadows from tools/workers, or unwanted objects that should be removed for a clean architectural/construction photo.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${originalBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('OpenAI Vision API error:', errorText);
      throw new Error(`Vision analysis failed: ${errorText}`);
    }

    const analysisData = await analysisResponse.json();
    const imageDescription = analysisData.choices[0].message.content;
    console.log('Image analysis completed:', imageDescription.substring(0, 200) + '...');

    // Step 2: Generate cleaned image with gpt-image-1
    console.log('Generating cleaned image with gpt-image-1...');
    const cleanupPrompt = `Generate an image that recreates this scene exactly: ${imageDescription}. 

Remove all imperfections including:
- People and workers
- Tools and equipment 
- Debris and trash
- Shadows from tools or workers
- Any visual distractions

Maintain the exact same:
- Lighting and perspective
- Colors and composition  
- Architectural details
- Overall quality and realism

Create a pristine, professional version of this scene.`;

    const generationResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: cleanupPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'high'
      }),
    });

    if (!generationResponse.ok) {
      const errorText = await generationResponse.text();
      console.error('OpenAI Image Generation API error:', errorText);
      
      let errorMessage = 'Failed to generate cleaned image';
      let errorType = 'unknown';
      
      if (generationResponse.status === 401) {
        errorType = 'config';
        errorMessage = 'Invalid OpenAI API key. Please check your configuration.';
      } else if (generationResponse.status === 429) {
        errorType = 'quota';
        errorMessage = 'OpenAI API rate limit exceeded. Please try again later.';
      } else if (generationResponse.status === 400) {
        errorType = 'validation';
        errorMessage = 'Invalid request to OpenAI. Please try with a different image.';
      }

      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          success: false,
          errorType,
          details: { status: generationResponse.status, response: errorText }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const generationData = await generationResponse.json();
    
    if (!generationData.data || generationData.data.length === 0) {
      console.error('No image data returned from OpenAI');
      return new Response(
        JSON.stringify({ 
          error: 'No cleaned image returned from OpenAI. Please try again.',
          success: false,
          errorType: 'api'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const editedImageBase64 = generationData.data[0].b64_json;
    const editedImageDataUrl = `data:image/png;base64,${editedImageBase64}`;

    console.log('OpenAI auto-cleanup completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        editedImage: editedImageDataUrl,
        message: 'Imperfections removed successfully using OpenAI!'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in edit-photo-ai function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while editing the image';
    const isConfigError = errorMessage.includes('API key');
    const isQuotaError = errorMessage.includes('rate limit') || errorMessage.includes('quota');
    const isNetworkError = errorMessage.includes('network') || errorMessage.includes('fetch');
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false,
        errorType: isConfigError ? 'config' : isQuotaError ? 'quota' : isNetworkError ? 'network' : 'unknown',
        details: {
          timestamp: new Date().toISOString(),
          stack: error instanceof Error ? error.stack : undefined
        }
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
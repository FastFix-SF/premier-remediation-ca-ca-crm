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
    const { currentImageUrl, roofType, roofColor, roofingDetails } = await req.json();
    
    if (!currentImageUrl) {
      return new Response(
        JSON.stringify({ error: 'Current image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!roofType || !roofColor) {
      return new Response(
        JSON.stringify({ error: 'Roof type and color are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating proposed roof image with type:', roofType, 'and color:', roofColor);

    // Format the roof type for display
    const roofTypeDisplay = roofType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Create a detailed prompt for the AI to transform the house
    const prompt = `Transform this house image by replacing the existing roof with a new ${roofTypeDisplay} roof in ${roofColor} color. 
    
Requirements:
- Replace ONLY the roof, keep everything else exactly the same
- The new roof should be ${roofTypeDisplay} material
- The roof color must be ${roofColor}
- Maintain the exact same roof structure, pitch, and dimensions
- Keep all other aspects of the house (walls, windows, landscaping, etc.) completely unchanged
- Make the roof look realistic and professionally installed
${roofingDetails ? `- Additional details: ${roofingDetails}` : ''}

The result should look like a professional architectural visualization showing what this house would look like with the new roof installed.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: currentImageUrl
                }
              }
            ]
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageUrl) {
      throw new Error('No image generated in response');
    }

    console.log('Successfully generated proposed roof image');

    return new Response(
      JSON.stringify({ proposedImageUrl: generatedImageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-proposed-image:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate proposed image' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

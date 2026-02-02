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
    const { imageDataUrl, clickX, clickY, bounds, clickLat, clickLng, metersPerPixel } = await req.json();

    if (!imageDataUrl || clickX === undefined || clickY === undefined) {
      throw new Error('Missing required parameters: imageDataUrl, clickX, clickY');
    }

    console.log('Smart select request - click position:', { clickX, clickY, clickLat, clickLng, bounds, metersPerPixel });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build geographic context if available
    let geoContext = '';
    if (bounds && clickLat && clickLng && metersPerPixel) {
      const widthMeters = Math.abs(bounds.east - bounds.west) * 111320 * Math.cos(clickLat * Math.PI / 180);
      const heightMeters = Math.abs(bounds.north - bounds.south) * 111320;
      
      geoContext = `

GEOGRAPHIC CONTEXT:
- Click Location: ${clickLat.toFixed(6)}°N, ${Math.abs(clickLng).toFixed(6)}°${clickLng >= 0 ? 'E' : 'W'}
- Image Bounds: N:${bounds.north.toFixed(6)}°, S:${bounds.south.toFixed(6)}°, E:${bounds.east.toFixed(6)}°, W:${bounds.west.toFixed(6)}°
- Image Coverage: ${widthMeters.toFixed(1)}m × ${heightMeters.toFixed(1)}m (real-world dimensions)
- Scale: ${metersPerPixel.toFixed(3)} meters/pixel
- Use this scale to validate roof dimensions (typical residential roofs: 10-30m per side, 50-400m² area)`;
    }

    // Call Lovable AI Gateway with Gemini 2.5 Flash Vision
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a precision ROOF SEGMENTATION AI for roofing contractors. Analyze this satellite image.

USER CLICKED at coordinates (${clickX.toFixed(3)}, ${clickY.toFixed(3)}) where 0,0 = top-left corner, 1,1 = bottom-right corner.${geoContext}

MISSION: Detect ONLY the building roof structure at the clicked location.

STRICT DETECTION RULES:
1. ✅ DETECT: Building roofs with shingles, tiles, metal, or flat roofing material
2. ❌ REJECT: Cars, driveways, concrete, asphalt, trees, grass, pools, patios, sidewalks
3. ❌ REJECT: Property boundaries or lot lines
4. Focus on a SMALL area (roughly 30-50 feet radius) around the click point
5. Trace ONLY the roof outline where it meets the sky/surroundings

POLYGON REQUIREMENTS:
- Return 4-12 corner points that follow the ROOF EDGE precisely
- Points must be in clockwise order starting from top-left corner
- Each point represents where roof edges meet (corners, ridge lines, valleys)
- Do NOT trace property boundaries - trace the building roof only
- Keep points tight to the actual roof structure

RESPONSE FORMAT (JSON only, no markdown):
{
  "roofDetected": boolean,
  "confidence": number (0-1),
  "roofShape": "rectangular" | "L-shaped" | "hip" | "gable" | "complex",
  "boundingBox": {
    "centerX": number (0-1),
    "centerY": number (0-1),
    "width": number (0-1, should be small - typically 0.1-0.3),
    "height": number (0-1, should be small - typically 0.1-0.3)
  },
  "polygonPoints": [
    {"x": 0.xxx, "y": 0.xxx},
    ... (4-12 points clockwise from top-left)
  ]
}

REJECT EXAMPLES (return roofDetected: false):
- Click lands on vehicle/driveway → false
- Click lands on trees/landscaping → false  
- Click lands on ground/grass → false
- No building roof visible at click location → false

ONLY return roofDetected: true when the click is directly on a building's rooftop surface.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API failed: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData, null, 2));

    const messageContent = aiData.choices?.[0]?.message?.content;
    if (!messageContent) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let roofData;
    try {
      const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        roofData = JSON.parse(jsonMatch[0]);
      } else {
        roofData = JSON.parse(messageContent);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', messageContent);
      throw new Error('Invalid JSON response from AI');
    }

    console.log('Parsed roof data:', roofData);

    return new Response(
      JSON.stringify({ roofData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in smart-select-roof:', error);
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

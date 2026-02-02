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
    const { aerialImageUrl, maskImageUrl, bounds, centerLat, centerLng, metersPerPixel } = await req.json();
    
    console.log('AI Roof Analysis request:', { bounds, centerLat, centerLng, metersPerPixel });

    if (!aerialImageUrl || !maskImageUrl || !bounds) {
      throw new Error('Missing required parameters: aerialImageUrl, maskImageUrl, bounds');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Calculate real-world dimensions
    const widthMeters = Math.abs(bounds.east - bounds.west) * 111320 * Math.cos(centerLat * Math.PI / 180);
    const heightMeters = Math.abs(bounds.north - bounds.south) * 111320;

    const prompt = `You are an expert roofing contractor AI analyzing aerial imagery with GEOGRAPHIC PRECISION.

GEOGRAPHIC CONTEXT:
- Location: ${centerLat.toFixed(6)}°N, ${Math.abs(centerLng).toFixed(6)}°${centerLng >= 0 ? 'E' : 'W'}
- Image bounds: N:${bounds.north.toFixed(6)}°, S:${bounds.south.toFixed(6)}°, E:${bounds.east.toFixed(6)}°, W:${bounds.west.toFixed(6)}°
- Real-world coverage: ${widthMeters.toFixed(1)}m × ${heightMeters.toFixed(1)}m
- Scale: ${metersPerPixel.toFixed(3)} meters/pixel

IMAGES PROVIDED:
1. Aerial satellite image (full context)
2. Purple mask overlay showing the EXACT roof boundary detected by SAM 2 AI

YOUR MISSION:
Analyze the roof structure shown in the purple mask and identify ALL roof edges with their correct classifications.

EDGE CLASSIFICATION RULES:
- EAVE: Bottom/lower edges where water drains off (horizontal at roof base)
- RAKE: Sloped side edges along gable ends
- RIDGE: Top peak line where two roof planes meet
- HIP: Diagonal line where two sloping roof planes meet externally
- VALLEY: Diagonal line where two sloping roof planes meet internally (forms a V)
- STEP: Edges along chimneys, dormers, or roof level changes
- WALL: Edges where roof meets a vertical wall

ROOF TYPE PATTERNS:
- GABLE: Two sloping planes meeting at a ridge, with triangular ends (rakes)
- HIP: Four sloping planes, hips converge at corners, ridges at top
- COMPLEX: Multiple roof planes, valleys, dormers, or irregular shapes

COMPLEX ROOF STRUCTURES TO RECOGNIZE:
- DORMERS (all types):
  * GABLED DORMER: Protruding structure with its own gable roof and triangular front
  * HIPPED DORMER: Dormer with hipped roof on sides and front
  * SHED DORMER: Long, flat-roofed protrusion with single slope
- OVERHANGS & RETURNS:
  * HIPPED CORNICE RETURN: Small hipped section at gable ends
  * SHED CORNICE RETURN: Flat extension at gable ends
- MANSARD ROOFS: Double-sloped roof with steep lower slope and flatter upper slope
- TURRETS & TOWERS: Circular or polygonal roof structures
- MULTIPLE BUILDING SECTIONS: Attached structures with different roof heights and planes
- COMPLEX VALLEYS: Where multiple roof sections intersect

FACET DETECTION - CRITICAL:
Each distinct roof plane/section is a separate FACET that must be identified:
- Main roof planes (primary structure)
- Dormer roofs (front, sides, top)
- Attached garage or addition roofs
- Porches and covered entries
- Each side of a hip or gable
- Upper and lower sections of mansard roofs
Mark ALL facets even if small - dormers, returns, and overhangs are important!

CRITICAL REQUIREMENTS:
1. Use the purple mask boundary as your PRIMARY guide for the roof outline
2. Return edges in GEOGRAPHIC COORDINATES (lng, lat) based on the image bounds
3. Each edge must have start/end points as [lng, lat] arrays
4. Calculate lengths in FEET using the geographic scale (1 degree ≈ 111km at equator)
5. Identify ALL significant edges visible in the mask - perimeter edges AND internal ridge/hip/valley lines
6. Typical residential roof edges: 15-100 feet per edge
7. Be thorough - capture the complete roof structure

RESPONSE FORMAT (valid JSON only, no markdown):
{
  "roofType": "GABLE" | "HIP" | "COMPLEX",
  "confidence": 0.0-1.0,
  "edges": [
    {
      "edgeType": "EAVE" | "RAKE" | "RIDGE" | "HIP" | "VALLEY" | "STEP" | "WALL",
      "start": [lng, lat],
      "end": [lng, lat],
      "lengthFeet": number,
      "description": "brief description of this edge"
    }
  ],
  "estimatedAreaSqFt": number,
  "notes": "overall roof structure description"
}

Be PRECISE with coordinates - they must fall within the image bounds. Use the mask to guide edge placement.`;

    console.log('Calling Gemini 2.5 Flash for roof analysis...');

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
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: aerialImageUrl } },
              { type: 'image_url', image_url: { url: maskImageUrl } }
            ]
          }
        ],
        max_tokens: 2000
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const messageContent = aiData.choices?.[0]?.message?.content;
    
    if (!messageContent) {
      throw new Error('No content in AI response');
    }

    console.log('AI response received, parsing...');

    // Parse JSON from response
    let analysisData;
    try {
      const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        analysisData = JSON.parse(messageContent);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', messageContent);
      throw new Error('Invalid JSON response from AI');
    }

    console.log(`✅ Analysis complete: ${analysisData.edges?.length || 0} edges detected`);
    console.log(`Roof type: ${analysisData.roofType}, confidence: ${analysisData.confidence}`);

    return new Response(
      JSON.stringify({ analysis: analysisData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in ai-roof-analysis:', error);
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

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🎯 AI Roof Boundary Detection with Gemini 2.5 Flash');

  try {
    const { imageDataUrl } = await req.json();
    
    if (!imageDataUrl) {
      throw new Error('Image data is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('📸 Analyzing aerial image with Gemini 2.5 Flash Vision...');

    const prompt = `Analyze this aerial/satellite roof image and identify the roof boundary.

TASK: Detect the main roof structure and provide its approximate boundary as a simple polygon.

RETURN: A JSON object with:
{
  "roofDetected": true/false,
  "boundingBox": {
    "centerX": 0.5 (0-1, relative to image width),
    "centerY": 0.5 (0-1, relative to image height), 
    "width": 0.3 (0-1, relative to image width),
    "height": 0.2 (0-1, relative to image height)
  },
  "confidence": 0.85,
  "roofShape": "rectangular" or "complex" or "L-shaped" etc,
  "notes": "Brief description of roof structure"
}

Focus on the PRIMARY roof structure (main building roof). Ignore smaller structures, trees, or shadows.`;

    // Call Lovable AI Gateway with Gemini 2.5 Flash (vision-enabled)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
              { type: 'image_url', image_url: { url: imageDataUrl } }
            ]
          }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI credits depleted. Please add credits to your workspace.');
      }
      
      throw new Error(`AI API failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content || '';
    
    console.log('AI Response:', aiResponse);

    // Parse JSON from AI response
    let roofData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
      roofData = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      throw new Error('AI returned invalid JSON format');
    }

    console.log('✅ Roof boundary detected:', roofData);

    return new Response(
      JSON.stringify({
        success: true,
        roofData,
        message: 'Roof boundary detected successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('❌ Detection error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to detect roof boundary',
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

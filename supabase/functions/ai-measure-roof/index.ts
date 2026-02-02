import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, imageUrl, address, lat, lng, bounds, fallbackPitch = "6/12" } = await req.json();

    console.log(`Starting roof measurement for project: ${projectId}`);
    console.log(`Image bounds:`, bounds);

    // Create supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If imageUrl is a base64 data URL, upload it to storage first
    let finalImageUrl = imageUrl;
    if (imageUrl.startsWith('data:image/')) {
      console.log('Converting base64 image to storage URL...');
      
      // Extract base64 data
      const matches = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (matches) {
        const [, extension, base64Data] = matches;
        
        // Convert base64 to binary
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Upload to storage
        const fileName = `${projectId}/measurement-${Date.now()}.${extension}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('roi-images')
          .upload(fileName, bytes, {
            contentType: `image/${extension}`,
            upsert: true
          });
        
        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('roi-images')
          .getPublicUrl(fileName);
        
        finalImageUrl = publicUrl;
        console.log('Image uploaded to storage:', publicUrl);
      }
    }

    const systemPrompt = `You are a professional roof measurement analyst. Analyze the provided aerial roof image and return precise measurements in JSON format.

Return ONLY valid JSON matching this exact schema (LF = linear feet):

{
  "area": {
    "total_squares": 0,
    "total_sq_ft": 0,
    "planes": [{"id":"P1","sq_ft":0}],
    "waste_factor_percent": 10
  },
  "linear": {
    "eave_edge_lf": 0,
    "rake_edge_lf": 0,
    "drip_edge_eave_lf": 0,
    "drip_edge_rake_lf": 0,
    "ridges_lf": 0,
    "hips_lf": 0,
    "valleys_lf": 0,
    "pitch_break_lf": 0,
    "step_flashing_lf": 0,
    "wall_flashing_apron_lf": 0,
    "side_wall_lf": 0,
    "head_wall_lf": 0,
    "return_walls_lf": 0
  },
  "features": {
    "chimneys":[{"count":0,"sizes":["0x0"]}],
    "vents":{"pipe_boots":0,"box_vents":0,"turbine_vents":0,"ridge_vents_lf":0},
    "skylights":[{"count":0,"sizes":["0x0"]}],
    "dormers":0,
    "satellite_dishes":0,
    "hvac_units":0
  },
  "pitch": {
    "primary":"${fallbackPitch}",
    "by_plane":[{"id":"P1","pitch":"${fallbackPitch}"}],
    "average":"${fallbackPitch}",
    "range":"${fallbackPitch}"
  },
  "materials": {
    "shingles_squares": 0,
    "panels_sheets": 0,
    "underlayment_sq_ft": 0,
    "ice_water_lf": 0,
    "flashing_step_lf": 0,
    "flashing_apron_lf": 0,
    "ridge_caps_lf": 0,
    "hip_ridge_shingles_lf": 0,
    "starter_strip_lf": 0,
    "valley_liner_lf": 0,
    "gutters_lf": 0,
    "downspouts_count": 0,
    "gutter_guards_lf": 0
  },
  "derived": {
    "total_planes": 0,
    "total_perimeter_lf": 0,
    "complexity": "low",
    "estimated_waste_percent": 10
  },
  "confidence": 0.0,
  "notes": "short reasoning or caveats"
}

Instructions:
- Analyze shadows to infer pitch if possible; otherwise use fallback: ${fallbackPitch}
- Convert areas to sq ft and squares (1 square = 100 sq ft)
- Return ONLY the JSON object, no prose
- If a field is unknown, return 0 or [] and note uncertainty in notes`;

    // Calculate scale information from bounds if provided
    let scaleInfo = '';
    if (bounds && bounds.north && bounds.south && bounds.east && bounds.west) {
      // Calculate dimensions in feet
      const latDiff = bounds.north - bounds.south;
      const lngDiff = bounds.east - bounds.west;
      
      // Convert to feet (approximate)
      // 1 degree latitude = ~364,000 feet
      // 1 degree longitude = ~288,000 feet at 38° latitude (varies by latitude)
      const heightFt = Math.abs(latDiff * 364000);
      const widthFt = Math.abs(lngDiff * 288000);
      
      scaleInfo = `\n\nIMAGE SCALE REFERENCE:
- This image shows approximately ${widthFt.toFixed(0)} feet (width) × ${heightFt.toFixed(0)} feet (height)
- Geographic bounds: N:${bounds.north.toFixed(6)}, S:${bounds.south.toFixed(6)}, E:${bounds.east.toFixed(6)}, W:${bounds.west.toFixed(6)}
- Use this scale to calculate actual roof dimensions in square feet and linear feet`;
    }

    const userPrompt = `Analyze this roof image and return measurements.

Project Details:
- Address: ${address || 'Not provided'}
- Coordinates: ${lat && lng ? `${lat}, ${lng}` : 'Not provided'}${scaleInfo}

Return measurements in the JSON schema provided.`;

    console.log('Calling Lovable AI (Gemini) with image URL:', finalImageUrl.substring(0, 100) + '...');

    // Call Lovable AI Gateway with Gemini (better for vision)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: finalImageUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Lovable AI error:', errorData);
      throw new Error(`AI API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const responseText = data.choices[0].message.content;
    console.log('Assistant response:', responseText);

    // Parse JSON from response
    let measurementData;
    try {
      // Look for JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        measurementData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.error('Response text:', responseText);
      throw new Error('Unable to parse JSON from AI response');
    }

    // Store in database (upsert by project_id)
    const { data: existingMeasurement } = await supabase
      .from('roof_measurements')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    const measurementPayload = {
      project_id: projectId,
      assistant_thread_id: null,
      assistant_run_id: null,
      data: measurementData,
      confidence_score: measurementData.confidence || 0.0,
      analysis_notes: measurementData.notes || null
    };

    let result;
    if (existingMeasurement) {
      const { data, error } = await supabase
        .from('roof_measurements')
        .update(measurementPayload)
        .eq('project_id', projectId)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('roof_measurements')
        .insert(measurementPayload)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    console.log(`Roof measurement completed for project: ${projectId}`);

    return new Response(JSON.stringify({
      success: true,
      data: result.data,
      confidence: result.confidence_score,
      notes: result.analysis_notes
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ai-measure-roof function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

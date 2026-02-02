import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { aerialImageId, imageUrl, propertyAddress } = await req.json();

    console.log(`Starting roof analysis for image: ${aerialImageId}`);

    // Create initial analysis record
    const { data: analysis, error: insertError } = await supabase
      .from('roof_analyses')
      .insert({
        aerial_image_id: aerialImageId,
        analysis_status: 'processing'
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create analysis record: ${insertError.message}`);
    }

    // Analyze the image with OpenAI Vision
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are an expert roof analyst. Analyze aerial/satellite images to detect comprehensive roof structures, features, and measurements. 

CRITICAL: You must respond with ONLY a valid JSON object with this exact structure:
{
  "roof_outline_coordinates": [[x1,y1], [x2,y2], ...],
  "roof_planes": [
    {
      "coordinates": [[x1,y1], [x2,y2], ...],
      "plane_type": "primary|secondary|dormer",
      "estimated_area_percentage": number
    }
  ],
  "roof_features": [
    {
      "feature_type": "chimney|vent|skylight|gutter|downspout|dormer|valley|ridge",
      "coordinates": [[x1,y1], [x2,y2], ...],
      "dimensions": {"width": number, "height": number, "area": number},
      "confidence": number,
      "count": number
    }
  ],
  "total_area_estimate": number,
  "complexity_score": number,
  "confidence_score": number,
  "penetration_count": number,
  "chimney_count": number,
  "vent_count": number,
  "skylight_count": number,
  "gutter_length_ft": number,
  "downspout_count": number,
  "roof_pitch_degrees": number,
  "dormer_count": number,
  "valley_count": number,
  "ridge_length_ft": number,
  "analysis_notes": "string"
}

Detection Guidelines:
PENETRATIONS:
- Count all chimneys (brick/metal stacks protruding from roof)
- Identify vents (small circular/square openings, bath vents, kitchen vents)
- Detect skylights (rectangular glass features on roof surface)
- Mark all penetrations for flashing requirements

ROOF ACCESSORIES:
- Trace gutters along roof edges and estimate total length in feet
- Count downspouts (vertical drain connections)
- Identify ridge vents and caps along roof peaks
- Mark flashing locations at valleys and penetrations

ROOF GEOMETRY:
- Count dormers (windowed roof projections)
- Identify valleys (internal roof intersections) 
- Measure ridge lines (roof peaks) total length in feet
- Detect hip lines and complex geometry

PITCH ANALYSIS:
- Use shadow analysis to estimate roof slope in degrees
- Analyze shadow length vs building height ratios
- Consider sun angle and image capture time
- Validate against architectural standards (typical 15-45 degrees)

MEASUREMENTS:
- All coordinates in pixel values relative to image dimensions
- Area estimates in square feet using typical residential scaling
- Length measurements in feet for gutters, ridges
- Confidence scores 0.0-1.0 for each detection

Focus on accuracy for material estimation and installation planning.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this aerial image of a roof at ${propertyAddress}. Identify the roof outline, individual roof planes, and estimate the total roof area. Focus on accuracy and provide detailed coordinate mappings for the roof structure.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    let aiResponse;
    try {
      aiResponse = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse OpenAI response as JSON:', jsonError);
      throw new Error('Invalid JSON response from AI service');
    }
    const aiContent = aiResponse.choices[0].message.content;

    console.log('AI Response:', aiContent);

    // Parse AI response
    let analysisData;
    try {
      // Clean the response in case it has markdown formatting
      const cleanContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      analysisData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    // Validate required fields
    if (!analysisData.roof_outline_coordinates || !analysisData.total_area_estimate) {
      throw new Error('AI response missing required fields');
    }

    // Update analysis record with enhanced feature data
    const { error: updateError } = await supabase
      .from('roof_analyses')
      .update({
        analysis_status: 'completed',
        roof_outline_coordinates: analysisData.roof_outline_coordinates,
        roof_planes_data: analysisData.roof_planes || [],
        total_roof_area: analysisData.total_area_estimate,
        roof_complexity_score: analysisData.complexity_score || 5,
        ai_confidence_score: analysisData.confidence_score || 0.8,
        penetration_count: analysisData.penetration_count || 0,
        chimney_count: analysisData.chimney_count || 0,
        vent_count: analysisData.vent_count || 0,
        skylight_count: analysisData.skylight_count || 0,
        gutter_length_ft: analysisData.gutter_length_ft || 0,
        downspout_count: analysisData.downspout_count || 0,
        roof_pitch_degrees: analysisData.roof_pitch_degrees || 0,
        dormer_count: analysisData.dormer_count || 0,
        valley_count: analysisData.valley_count || 0,
        ridge_length_ft: analysisData.ridge_length_ft || 0,
        ai_response_data: {
          raw_response: aiContent,
          analysis_notes: analysisData.analysis_notes
        }
      })
      .eq('id', analysis.id);

    if (updateError) {
      throw new Error(`Failed to update analysis: ${updateError.message}`);
    }

    // Create roof plane records
    if (analysisData.roof_planes && analysisData.roof_planes.length > 0) {
      const roofPlanes = analysisData.roof_planes.map((plane: any) => ({
        roof_analysis_id: analysis.id,
        plane_coordinates: plane.coordinates,
        area_sqft: (analysisData.total_area_estimate * (plane.estimated_area_percentage || 100) / 100),
        plane_type: plane.plane_type || 'primary'
      }));

      const { error: planesError } = await supabase
        .from('roof_planes')
        .insert(roofPlanes);

      if (planesError) {
        console.error('Failed to insert roof planes:', planesError);
      }
    }

    // Create roof feature records
    if (analysisData.roof_features && analysisData.roof_features.length > 0) {
      const roofFeatures = analysisData.roof_features.map((feature: any) => ({
        roof_analysis_id: analysis.id,
        feature_type: feature.feature_type,
        feature_coordinates: feature.coordinates,
        dimensions: feature.dimensions || {},
        feature_count: feature.count || 1,
        confidence_score: feature.confidence || 0.8,
        measurements: feature.measurements || {}
      }));

      const { error: featuresError } = await supabase
        .from('roof_features')
        .insert(roofFeatures);

      if (featuresError) {
        console.error('Failed to insert roof features:', featuresError);
      }
    }

    console.log(`Roof analysis completed for image: ${aerialImageId}`);

    return new Response(JSON.stringify({
      success: true,
      analysisId: analysis.id,
      totalArea: analysisData.total_area_estimate,
      confidence: analysisData.confidence_score,
      complexity: analysisData.complexity_score
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in roof analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze roof';
    
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
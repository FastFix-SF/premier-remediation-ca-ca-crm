import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, quoteId, existingLines, extractTrainingOnly, imageUrl, useVision } = await req.json();
    
    // For training extraction, we don't need lat/lon validation
    if (!extractTrainingOnly && (!latitude || !longitude)) {
      throw new Error('Latitude and longitude are required');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Fetch training data for context
    const { data: trainingData } = await supabaseClient
      .from('edge_training_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    // Fetch project training context from uploaded documents
    let projectContext = '';
    if (quoteId) {
      try {
        // Directly query the training documents instead of calling another function
        const { data: trainingDocs, error: docsError } = await supabaseClient
          .from('project_training_documents')
          .select('*')
          .eq('quote_request_id', quoteId)
          .in('document_category', ['sketch_report', 'estimate', 'material_order', 'labor_report'])
          .eq('processing_status', 'completed')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (docsError) {
          console.warn('Could not fetch training docs:', docsError);
        } else if (trainingDocs && trainingDocs.length > 0) {
          // Build context from training documents
          projectContext = trainingDocs.map(doc => {
            const data = doc.extracted_data || {};
            return `[${doc.document_category?.toUpperCase()}] ${doc.file_name}\nMeasurements: ${JSON.stringify(data.measurements || data)}\n`;
          }).join('\n');
          console.log(`📚 Using ${trainingDocs.length} project documents for additional context`);
        }
      } catch (err) {
        console.warn('Error fetching project context:', err);
      }
    }

    console.log(`🧠 Using ${trainingData?.length || 0} edge training examples + project documents`);

    // If vision mode is requested and we have an image, use vision analysis
    if (useVision && imageUrl) {
      console.log('👁️ Vision mode: calling vision-roof-analysis function...');
      
      const { data: visionData, error: visionError } = await supabaseClient.functions.invoke(
        'vision-roof-analysis',
        {
          body: { imageUrl, latitude, longitude, quoteId }
        }
      );

      if (visionError) {
        console.error('Vision analysis failed:', visionError);
        // Fall back to statistical prediction
        console.log('⚠️ Falling back to statistical prediction');
      } else if (visionData?.success && visionData?.analysis) {
        console.log(`✅ Vision analysis successful: ${visionData.analysis.edges.length} edges detected`);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            lines: visionData.analysis.edges,
            visionAnalysis: visionData.analysis,
            method: 'computer-vision',
            confidenceScore: visionData.analysis.confidenceScore
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fallback: Use AI to predict based on training data patterns (no vision)
    let aiPrompt: string;
    let systemPrompt: string;
    
    // Build AI prompt based on training data only
    systemPrompt = "You are a roof measurement expert. Use training data patterns to predict roof edges.";
    aiPrompt = buildAIPrompt(trainingData || [], existingLines || [], projectContext, latitude, longitude);
    
    const aiMessages: any[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: aiPrompt }
    ];

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: aiMessages,
        tools: [{
          type: "function",
          function: {
            name: "predict_roof_lines",
            description: "Predict roof edge lines based on analysis",
            parameters: {
              type: "object",
              properties: {
                lines: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      start: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
                      end: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
                      edgeType: { type: "string", enum: ["EAVE", "RAKE", "RIDGE", "VALLEY", "HIP"] },
                      length: { type: "number" }
                    },
                    required: ["start", "end", "edgeType", "length"]
                  }
                }
              },
              required: ["lines"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "predict_roof_lines" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No AI predictions generated');
    }

    const predictedLines = JSON.parse(toolCall.function.arguments).lines;
    console.log(`✅ AI predicted ${predictedLines.length} roof lines`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        lines: predictedLines,
        aiAnalysis: aiResult.choices?.[0]?.message?.content || 'Statistical analysis complete',
        method: 'statistical-learning',
        confidenceScore: 0.7 // Statistical predictions have moderate confidence
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-roof-prediction:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildAIPrompt(trainingData: any[], existingLines: any[], projectContext: string = '', latitude?: number, longitude?: number): string {
  const edgeStats = analyzeEdgeStatistics(trainingData);
  
  // Calculate approximate roof bounds (typically 20-40m for residential)
  const metersPerDegree = 111320;
  const roofSizeMeters = 30; // Typical residential roof ~30m x 30m
  const latDelta = roofSizeMeters / metersPerDegree;
  const lonDelta = roofSizeMeters / (metersPerDegree * Math.cos((latitude || 0) * Math.PI / 180));
  
  const roofBounds = latitude && longitude ? {
    north: latitude + latDelta,
    south: latitude - latDelta,
    east: longitude + lonDelta,
    west: longitude - lonDelta,
    centerLat: latitude,
    centerLng: longitude
  } : null;
  
  let prompt = `You are a roof measurement expert. Predict roof edge lines for this property using training data patterns.

🌍 PROPERTY LOCATION:
${latitude && longitude ? `
- Center: [${longitude}, ${latitude}]
- Roof bounds: 
  * North: ${roofBounds!.north}
  * South: ${roofBounds!.south}
  * East: ${roofBounds!.east}
  * West: ${roofBounds!.west}
` : 'No coordinates provided'}

📊 TRAINING CONTEXT from ${trainingData.length} examples:
- Average EAVE length: ${edgeStats.avgEave}ft (horizontal edges at roof bottom/top)
- Average RAKE length: ${edgeStats.avgRake}ft (sloped edges on sides)
- Average RIDGE length: ${edgeStats.avgRidge}ft (peak lines)
- Average VALLEY length: ${edgeStats.avgValley}ft (internal corners)
- Average HIP length: ${edgeStats.avgHip}ft (external corners)
- Common angles: ${edgeStats.commonAngles.join(', ')}°

🏠 ROOF TYPES LEARNED:
${edgeStats.roofTypes.join(', ')}

`;

  // Add project-specific training context if available
  if (projectContext) {
    prompt += `\n📚 PROJECT TRAINING KNOWLEDGE:\n${projectContext}\n\n`;
  }

  if (existingLines.length > 0) {
    prompt += `\nUSER STARTED DRAWING (complete the rest of the roof):\n`;
    existingLines.forEach((line: any, i: number) => {
      const coords = line.coords || [];
      if (coords.length >= 2) {
        prompt += `Line ${i + 1}: ${line.edgeLabel || line.edgeType} from [${coords[0][0]}, ${coords[0][1]}] to [${coords[coords.length-1][0]}, ${coords[coords.length-1][1]}], length: ${Math.round(line.length || 0)}ft\n`;
      }
    });
    prompt += `\n\nBased on the user's drawn line(s), predict the remaining roof edges to complete the structure. Use the training patterns to infer:
- Roof type (gable, hip, etc.) from the existing edge pattern
- Typical dimensions from similar roofs in training data
- Symmetry and geometric patterns`;
  } else {
    prompt += `\n\nNo existing lines. Predict a complete typical roof structure based on training data.
Start with the most common roof type (gable or hip) and use average dimensions from training.`;
  }

  prompt += `\n\n⚠️ CRITICAL COORDINATE REQUIREMENTS:
${roofBounds ? `
✅ USE ACTUAL GEOGRAPHIC COORDINATES (decimal degrees):
- ALL coordinates MUST be [longitude, latitude] format
- ALL coordinates MUST be WITHIN the roof bounds specified above
- Center is at [${roofBounds.centerLng}, ${roofBounds.centerLat}]
- Example edge: start at [${roofBounds.west}, ${roofBounds.north}], end at [${roofBounds.east}, ${roofBounds.north}]

❌ DO NOT USE:
- Abstract coordinates like [0, 0] or [20, 30]
- Pixel coordinates
- Relative offsets without converting to real lat/lng
- Coordinates outside the roof bounds

🎯 CALCULATION HELP:
- For a 40ft (12m) horizontal edge from west to east:
  Start: [${roofBounds.west}, ${roofBounds.centerLat}]
  End: [${roofBounds.east}, ${roofBounds.centerLat}]
- For a 30ft (9m) vertical edge from south to north:
  Start: [${roofBounds.centerLng}, ${roofBounds.south}]
  End: [${roofBounds.centerLng}, ${roofBounds.north}]
` : '- Coordinates should be [longitude, latitude] pairs'}

📐 OUTPUT REQUIREMENTS:
- Use average lengths from training (${edgeStats.avgEave}ft eaves, ${edgeStats.avgRake}ft rakes, ${edgeStats.avgRidge}ft ridges)
- Use common angles from training (${edgeStats.commonAngles.join(', ')}°)
- Each line needs: start [lng, lat], end [lng, lat], edgeType (EAVE/RAKE/RIDGE/VALLEY/HIP), length (feet)
- Create a geometrically sound roof structure that matches typical residential roofs`;

  return prompt;
}

function analyzeEdgeStatistics(data: any[]) {
  const eaves: number[] = [];
  const rakes: number[] = [];
  const ridges: number[] = [];
  const valleys: number[] = [];
  const hips: number[] = [];
  const angles: number[] = [];
  const roofTypes = new Set<string>();

  data.forEach(item => {
    const edgeType = (item.edge_type || '').toUpperCase();
    const length = item.length_ft || 0;
    const angle = item.angle_degrees || 0;

    if (length > 0) {
      if (edgeType.includes('EAVE')) eaves.push(length);
      else if (edgeType.includes('RAKE')) rakes.push(length);
      else if (edgeType.includes('RIDGE')) ridges.push(length);
      else if (edgeType.includes('VALLEY')) valleys.push(length);
      else if (edgeType.includes('HIP')) hips.push(length);
      
      angles.push(angle);
    }

    // Extract roof type from notes or metadata if available
    if (item.notes) {
      const roofTypeMatch = item.notes.match(/(hip|gable|flat|shed|gambrel|mansard)/i);
      if (roofTypeMatch) roofTypes.add(roofTypeMatch[1].toLowerCase());
    }
  });

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  return {
    avgEave: avg(eaves) || 40,
    avgRake: avg(rakes) || 30,
    avgRidge: avg(ridges) || 35,
    avgValley: avg(valleys) || 25,
    avgHip: avg(hips) || 28,
    commonAngles: [...new Set(angles.map(a => Math.round(a / 15) * 15))].slice(0, 6),
    roofTypes: Array.from(roofTypes).length > 0 ? Array.from(roofTypes) : ['gable', 'hip']
  };
}


import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestStart = Date.now();
  console.log('🚀 [0s] Vision Roof Analysis STARTED');

  try {
    console.log(`⏱️ [${((Date.now() - requestStart) / 1000).toFixed(1)}s] Parsing request body...`);
    const { imageDataUrl, latitude, longitude, quoteId, maskImageUrl, maskBounds, internalEdgesOnly } = await req.json();
    console.log(`✅ [${((Date.now() - requestStart) / 1000).toFixed(1)}s] Request parsed`);
    
    console.log('📥 Request data:', { 
      hasImage: !!imageDataUrl,
      imageSize: imageDataUrl ? imageDataUrl.length : 0,
      hasMask: !!maskImageUrl,
      maskSize: maskImageUrl ? maskImageUrl.length : 0,
      hasMaskBounds: !!maskBounds,
      internalEdgesOnly: !!internalEdgesOnly,
      latitude, 
      longitude, 
      quoteId 
    });
    
    if (!imageDataUrl) {
      throw new Error('Image data is required for vision analysis');
    }
    
    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required for vision analysis');
    }

    console.log(`⏱️ [${((Date.now() - requestStart) / 1000).toFixed(1)}s] Creating Supabase client...`);
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }
    
    console.log(`✅ [${((Date.now() - requestStart) / 1000).toFixed(1)}s] Ready to analyze`);

    // SKIP training data fetch for speed - it's adding unnecessary database calls
    console.log(`⏱️ [${((Date.now() - requestStart) / 1000).toFixed(1)}s] Skipping training data for speed...`);
    const trainingData: any[] = [];
    const successfulPredictions: any[] = [];
    const recentCorrections: any[] = [];
    
    console.log(`✅ [${((Date.now() - requestStart) / 1000).toFixed(1)}s] Skipped training data - faster mode`);

    // Build minimal context for speed
    const edgeStats = { totalSamples: 0, avgEave: 35, avgRake: 28, avgRidge: 32, commonRoofTypes: ['gable', 'hip'] };
    const successPatterns = { successRate: 0, keyPatterns: [] };
    const correctionLearnings = { totalCorrections: 0, examples: [], avgLatShift: 0, avgLngShift: 0, commonIssue: '' };

    // Calculate TIGHT roof bounds for coordinate accuracy
    // Residential roofs are typically 15-30m, so use smaller bounds for precision
    const metersPerDegree = 111320; // approximate at equator
    const roofSizeMeters = 25; // Typical residential roof ~25m x 25m (more accurate than 100m)
    const latDelta = roofSizeMeters / metersPerDegree;
    const lonDelta = roofSizeMeters / (metersPerDegree * Math.cos(latitude * Math.PI / 180));
    
    const roofBounds = {
      north: latitude + latDelta,
      south: latitude - latDelta,
      east: longitude + lonDelta,
      west: longitude - lonDelta,
      center: { lat: latitude, lng: longitude }
    };

    console.log(`⏱️ [${((Date.now() - requestStart) / 1000).toFixed(1)}s] Building simplified prompt...`);
    
    // Build prompt based on mode (internal only or full analysis)
    const visionPrompt = buildSimplifiedPrompt(latitude, longitude, roofBounds, maskBounds, internalEdgesOnly);
    
    console.log(`✅ [${((Date.now() - requestStart) / 1000).toFixed(1)}s] Prompt ready (${visionPrompt.length} chars)`);
    console.log(`⏱️ [${((Date.now() - requestStart) / 1000).toFixed(1)}s] Calling Gemini AI...`);
    
    // Build the content array - Include BOTH images with FULL mask data
    console.log('📸 Satellite image:', imageDataUrl.length, 'chars');
    
    const contentArray: any[] = [
      {
        type: "text",
        text: visionPrompt
      },
      {
        type: "image_url",
        image_url: {
          url: imageDataUrl // Satellite/aerial image
        }
      }
    ];
    
    // CRITICAL: Load mask image and convert to base64 for AI
    if (maskImageUrl) {
      console.log(`⏱️ [${((Date.now() - requestStart) / 1000).toFixed(1)}s] Loading mask image...`);
      
      // Fetch the mask image and convert to base64
      const maskResponse = await fetch(maskImageUrl);
      if (!maskResponse.ok) {
        throw new Error('Failed to fetch mask image');
      }
      
      const maskBlob = await maskResponse.blob();
      const maskArrayBuffer = await maskBlob.arrayBuffer();
      const maskBase64 = base64Encode(new Uint8Array(maskArrayBuffer));
      const maskDataUrl = `data:image/png;base64,${maskBase64}`;
      
      console.log('🎭 Mask image loaded and converted:', maskDataUrl.length, 'chars');
      
      contentArray.push({
        type: "image_url",
        image_url: {
          url: maskDataUrl // Purple mask as base64
        }
      });
    }
    
    console.log(`📤 [${((Date.now() - requestStart) / 1000).toFixed(1)}s] Sending ${contentArray.length} images to Gemini...`);

    const aiCallStart = Date.now();
    // Image is already in data URL format from the browser
    const visionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', // More accurate than flash-lite for vision
        messages: [
          {
            role: "user",
            content: contentArray
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_roof_edges",
            description: "Detect only roof edges (eaves, rakes, ridges, valleys, hips) from aerial imagery",
            parameters: {
              type: "object",
              properties: {
                roofType: {
                  type: "string",
                  enum: ["gable", "hip", "flat", "gambrel", "mansard", "shed", "complex"],
                  description: "Primary roof type detected"
                },
                confidenceScore: {
                  type: "number",
                  minimum: 0,
                  maximum: 1,
                  description: "Overall confidence in the analysis (0-1)"
                },
                edges: {
                  type: "array",
                  description: "Detected roof edges with coordinates",
                  items: {
                    type: "object",
                    properties: {
                      start: {
                        type: "array",
                        items: { type: "number" },
                        minItems: 2,
                        maxItems: 2,
                        description: "[longitude, latitude] of start point"
                      },
                      end: {
                        type: "array",
                        items: { type: "number" },
                        minItems: 2,
                        maxItems: 2,
                        description: "[longitude, latitude] of end point"
                      },
                      edgeType: {
                        type: "string",
                        enum: ["EAVE", "RAKE", "RIDGE", "VALLEY", "HIP"],
                        description: "Type of roof edge"
                      },
                      length: {
                        type: "number",
                        description: "Length in feet"
                      },
                      confidence: {
                        type: "number",
                        minimum: 0,
                        maximum: 1,
                        description: "Confidence for this specific edge"
                      }
                    },
                    required: ["start", "end", "edgeType", "length", "confidence"]
                  }
                },
                analysisNotes: {
                  type: "string",
                  description: "Key observations about the roof edges and any challenges"
                }
              },
              required: ["roofType", "confidenceScore", "edges", "analysisNotes"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "analyze_roof_edges" } }
      }),
     });

    const aiCallDuration = ((Date.now() - aiCallStart) / 1000).toFixed(1);
    console.log(`⏱️ [${((Date.now() - requestStart) / 1000).toFixed(1)}s] AI responded after ${aiCallDuration}s`);

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('❌ Vision AI error:', visionResponse.status, errorText);
      console.error('Request had', contentArray.length, 'images');
      
      // If 502, likely too large - suggest reducing images
      if (visionResponse.status === 502) {
        throw new Error('Images too large for AI analysis. Try using lower zoom level when capturing.');
      }
      
      throw new Error(`Vision AI error: ${visionResponse.status} - ${errorText.substring(0, 200)}`);
    }

    console.log(`⏱️ [${((Date.now() - requestStart) / 1000).toFixed(1)}s] Parsing AI response...`);
    const visionResult = await visionResponse.json();
    const toolCall = visionResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No vision analysis generated');
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    
    const totalTime = ((Date.now() - requestStart) / 1000).toFixed(1);
    console.log(`✅ [${totalTime}s] COMPLETE: ${analysis.roofType} roof, ${analysis.edges.length} edges`);
    console.log(`📊 Confidence: ${(analysis.confidenceScore * 100).toFixed(1)}%`);

    // Store the vision analysis for future training
    if (quoteId) {
      await supabaseClient
        .from('roof_vision_analyses')
        .insert({
          quote_request_id: quoteId,
          image_url: 'browser-captured',
          roof_type: analysis.roofType,
          confidence_score: analysis.confidenceScore,
          detected_edges: analysis.edges,
          analysis_notes: analysis.analysisNotes,
          model_used: 'google/gemini-2.5-flash'
        });
      
      console.log('💾 Vision analysis stored for training');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis,
        trainingContext: {
          samplesUsed: trainingData?.length || 0,
          successPatterns: successPatterns.length,
          edgeStats
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in vision-roof-analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// SMART PROMPT - Optimized for internal-only or full detection
function buildSimplifiedPrompt(
  latitude?: number, 
  longitude?: number, 
  imageBounds?: any,
  maskBounds?: any,
  internalEdgesOnly?: boolean
): string {
  if (internalEdgesOnly) {
    // MODE 1: Only detect internal roof structure (RIDGE/HIP/VALLEY)
    return `You are a roof structure detection AI. The roof PERIMETER has already been traced from the purple mask.

IMAGE 1: Aerial satellite view of the property
IMAGE 2: Purple mask showing roof boundary (already traced - IGNORE perimeter)

LOCATION: ${latitude}, ${longitude}
ROOF BOUNDS: N:${maskBounds?.north} S:${maskBounds?.south} E:${maskBounds?.east} W:${maskBounds?.west}

YOUR TASK: Detect ONLY INTERNAL roof structure edges that define FACETS (0-20 edges):
- RIDGE: Peak lines running along the top of the roof
- HIP: Diagonal lines from corners to ridge (external diagonal corners)
- VALLEY: Internal diagonal corners where two roof slopes meet

COMPLEX STRUCTURES TO IDENTIFY:
When detecting internal edges, look for these common complex roof features:
- DORMERS (Gabled, Hipped, Shed): Each dormer creates additional ridges, hips, and valleys
- CORNICE RETURNS (Hipped, Shed): Small returns at gable ends create additional hips
- MANSARD ROOFS: Creates ridges at the transition between steep and flat sections
- MULTIPLE ROOF SECTIONS: Attached structures create valleys and ridges at intersections
- TURRETS/TOWERS: Circular or polygonal structures with radial hips

FACET-FOCUSED DETECTION:
Each edge you detect helps define a separate FACET (roof plane):
- Main roof ridges separate primary facets
- Dormer ridges/hips separate dormer facets from main roof
- Valleys separate intersecting roof sections
- Complex roofs with many dormers/sections will have MANY internal edges (10-20+)

CRITICAL RULES:
1. DO NOT detect perimeter edges (EAVE/RAKE) - they're already traced
2. ONLY detect RIDGE, HIP, and VALLEY edges
3. BE THOROUGH - detect ALL internal structure lines, even small ones from dormers
4. All edges must be INSIDE the purple mask area
5. Return 0 edges only if truly no internal structure is visible
6. Complex properties may have 10-20+ internal edges - that's normal!

OUTPUT FORMAT:
- Use [longitude, latitude] coordinates
- Each edge: start point, end point, edge type (RIDGE/HIP/VALLEY only), length in feet
- Simple roofs: 0-4 internal edges
- Complex roofs with dormers/sections: 8-20+ internal edges

Return ALL internal structural edges that define roof facets.`;
  }

  // MODE 2: Full roof analysis (when perimeter is not traced)
  return `You are a roof edge detection AI. Analyze these 2 images to detect ALL roof edges including complex structures.

IMAGE 1: Aerial satellite view showing the property
IMAGE 2: Purple/pink mask overlay showing EXACT ROOF BOUNDARY (created by SAM 2 AI)

LOCATION: ${latitude}, ${longitude}
ROOF BOUNDS: N:${maskBounds?.north} S:${maskBounds?.south} E:${maskBounds?.east} W:${maskBounds?.west}

CRITICAL RULES:
1. The purple mask in IMAGE 2 shows the EXACT roof boundary
2. ALL edges MUST be INSIDE or ON the purple mask boundary
3. DO NOT draw edges outside the purple area
4. Detect ALL structural edges including small features (dormers, returns, etc.)
5. The purple mask is the GROUND TRUTH - stay within it

TASK - Detect ALL roof edges (4-30+ edges depending on complexity):
PERIMETER EDGES:
- EAVE: Bottom horizontal edges (where roof meets walls)
- RAKE: Sloped side edges (gable ends)

INTERNAL STRUCTURE EDGES:
- RIDGE: Peak lines at the top
- HIP: External diagonal corners
- VALLEY: Internal diagonal corners where two slopes meet

COMPLEX STRUCTURES TO IDENTIFY:
- DORMERS (all types):
  * GABLED DORMER: Has its own ridge, rakes, and eave
  * HIPPED DORMER: Has hips on sides, ridge at top
  * SHED DORMER: Has single sloped plane with rake edges
- CORNICE RETURNS: Small hipped or shed sections at gable ends
- MANSARD ROOFS: Detect both upper and lower section edges and ridges
- MULTIPLE BUILDING SECTIONS: Detect valleys and ridges where sections meet
- TURRETS/TOWERS: Detect radial hips and circular ridges

FACET DETECTION FOCUS:
Each roof plane/section is a FACET. Your edges define these facets:
- Main roof planes (each side of hip/gable)
- Each dormer surface (front, sides, top)
- Attached structure roofs
- Porch/entry roofs
- Returns and overhangs
Complex properties with many dormers may have 20-30+ edges - detect them ALL!

OUTPUT FORMAT:
- Use [longitude, latitude] coordinates
- Each edge needs: start point, end point, edge type, length in feet
- Edges should follow ALL structures visible in IMAGE 1
- All coordinates must be within the purple mask area shown in IMAGE 2
- Simple roof: 4-8 edges
- Complex roof with dormers: 15-30+ edges

Return ALL edges that define the complete roof structure and all its facets.`;
}

function analyzeTrainingPatterns(data: any[]) {
  const eaves: number[] = [];
  const rakes: number[] = [];
  const ridges: number[] = [];
  const roofTypes = new Set<string>();

  data.forEach(item => {
    const edgeType = (item.edge_type || '').toUpperCase();
    const length = item.length_ft || 0;

    if (length > 0) {
      if (edgeType.includes('EAVE')) eaves.push(length);
      else if (edgeType.includes('RAKE')) rakes.push(length);
      else if (edgeType.includes('RIDGE')) ridges.push(length);
    }

    if (item.notes) {
      const roofTypeMatch = item.notes.match(/(hip|gable|flat|shed|gambrel|mansard|complex)/i);
      if (roofTypeMatch) roofTypes.add(roofTypeMatch[1].toLowerCase());
    }
  });

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  return {
    totalSamples: data.length,
    avgEave: avg(eaves) || 35,
    avgRake: avg(rakes) || 28,
    avgRidge: avg(ridges) || 32,
    commonRoofTypes: Array.from(roofTypes).slice(0, 3)
  };
}

function analyzeSuccessPatterns(successData: any[]) {
  if (successData.length === 0) {
    return {
      successRate: 0,
      keyPatterns: ['No successful predictions yet - building initial learning data']
    };
  }

  const patterns: string[] = [];
  const edgeTypeCounts: Record<string, number> = {};

  successData.forEach(item => {
    const edgeType = item.edge_type || 'UNKNOWN';
    edgeTypeCounts[edgeType] = (edgeTypeCounts[edgeType] || 0) + 1;
  });

  // Extract key patterns
  Object.entries(edgeTypeCounts).forEach(([type, count]) => {
    patterns.push(`${type} edges: ${count} successful predictions`);
  });

  return {
    successRate: Math.min(95, 60 + (successData.length * 2)), // Simulated improvement
    keyPatterns: patterns.slice(0, 5)
  };
}

function analyzeCorrectionPatterns(corrections: any[]) {
  if (!corrections || corrections.length === 0) {
    return {
      totalCorrections: 0,
      examples: [],
      avgLatShift: 0,
      avgLngShift: 0,
      commonIssue: 'No correction data yet'
    };
  }

  // Calculate aggregate statistics
  let totalLatShift = 0;
  let totalLngShift = 0;
  let validShiftCount = 0;

  corrections.forEach(correction => {
    if (correction.adjustment_summary) {
      totalLatShift += correction.adjustment_summary.avg_lat_shift || 0;
      totalLngShift += correction.adjustment_summary.avg_lng_shift || 0;
      validShiftCount++;
    }
  });

  // Prepare examples for the prompt (top 5 most recent)
  const examples = corrections.slice(0, 5).map(c => ({
    roof_type: c.roof_type,
    original_vertices: c.original_vertices,
    corrected_vertices: c.corrected_vertices,
    adjustment_summary: c.adjustment_summary,
    correction_notes: c.correction_notes
  }));

  return {
    totalCorrections: corrections.length,
    examples,
    avgLatShift: validShiftCount > 0 ? (totalLatShift / validShiftCount).toFixed(8) : 0,
    avgLngShift: validShiftCount > 0 ? (totalLngShift / validShiftCount).toFixed(8) : 0,
    commonIssue: corrections[0]?.correction_notes || 'Vertices need adjustment to fit actual roof boundaries'
  };
}

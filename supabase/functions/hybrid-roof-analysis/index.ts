import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Point {
  x: number;
  y: number;
}

interface GeometricPrediction {
  edges: Array<{
    start: [number, number];
    end: [number, number];
    edgeType: string;
    length: number;
    confidence: number;
  }>;
  roofType: string;
  geometricConfidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { perimeter, latitude, longitude, quoteId, imageUrl } = await req.json();
    
    if (!perimeter || !Array.isArray(perimeter) || perimeter.length < 3) {
      throw new Error('Valid perimeter polygon is required (minimum 3 points)');
    }

    console.log(`🔬 Starting hybrid analysis with ${perimeter.length} perimeter points`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Step 1: Run geometric analysis to get initial predictions
    console.log('📐 Step 1: Running geometric analysis...');
    const geometricPredictions = runGeometricAnalysis(perimeter);
    console.log(`✅ Geometric analysis complete: ${geometricPredictions.edges.length} edges detected`);
    console.log(`   Roof type: ${geometricPredictions.roofType} (confidence: ${geometricPredictions.geometricConfidence})`);

    // Step 2: Fetch training data for AI context
    const { data: trainingData } = await supabaseClient
      .from('edge_training_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    // Step 3: Use AI to validate and refine geometric predictions
    console.log('🤖 Step 2: AI validation and refinement...');
    const aiValidationPrompt = buildValidationPrompt(
      geometricPredictions,
      trainingData || [],
      latitude,
      longitude,
      imageUrl
    );

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
            role: "system", 
            content: "You are a roof measurement expert. Validate and refine geometric predictions using AI analysis." 
          },
          { role: "user", content: aiValidationPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "validate_and_refine_edges",
            description: "Validate geometric predictions and provide refinements",
            parameters: {
              type: "object",
              properties: {
                validatedEdges: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      start: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
                      end: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
                      edgeType: { type: "string", enum: ["EAVE", "RAKE", "RIDGE", "VALLEY", "HIP", "WALL"] },
                      length: { type: "number" },
                      aiConfidence: { type: "number", minimum: 0, maximum: 1 },
                      adjustmentReason: { type: "string" }
                    },
                    required: ["start", "end", "edgeType", "length", "aiConfidence"]
                  }
                },
                roofTypeConfirmed: { type: "string" },
                overallConfidence: { type: "number", minimum: 0, maximum: 1 }
              },
              required: ["validatedEdges", "roofTypeConfirmed", "overallConfidence"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "validate_and_refine_edges" } }
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI validation failed:', aiResponse.status);
      // Return geometric predictions as fallback
      return new Response(
        JSON.stringify({
          success: true,
          edges: geometricPredictions.edges,
          roofType: geometricPredictions.roofType,
          method: 'geometric-only',
          confidence: geometricPredictions.geometricConfidence,
          note: 'AI validation unavailable, using geometric analysis only'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No AI validation results generated');
    }

    const validationResult = JSON.parse(toolCall.function.arguments);
    console.log(`✅ AI validation complete: ${validationResult.validatedEdges.length} edges validated`);

    // Step 4: Calculate multi-method confidence scores
    console.log('📊 Step 3: Computing confidence scores...');
    const finalEdges = computeConfidenceScores(
      geometricPredictions.edges,
      validationResult.validatedEdges,
      trainingData || []
    );

    // Step 5: Store results if quote ID provided
    if (quoteId) {
      console.log('💾 Saving hybrid analysis results...');
      const { error: saveError } = await supabaseClient
        .from('roof_analysis')
        .insert({
          quote_request_id: quoteId,
          analysis_method: 'hybrid-geometric-ai',
          roof_type: validationResult.roofTypeConfirmed,
          confidence_score: validationResult.overallConfidence,
          edges_detected: finalEdges,
          geometric_prediction: geometricPredictions,
          ai_validation: validationResult
        });

      if (saveError) {
        console.warn('Failed to save analysis:', saveError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        edges: finalEdges,
        roofType: validationResult.roofTypeConfirmed,
        method: 'hybrid-geometric-ai',
        confidence: validationResult.overallConfidence,
        analysis: {
          geometric: geometricPredictions,
          aiValidation: validationResult,
          edgeCount: finalEdges.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in hybrid-roof-analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Run geometric analysis on perimeter to generate initial predictions
 */
function runGeometricAnalysis(perimeter: Array<{x: number, y: number}>): GeometricPrediction {
  const roofType = detectRoofType(perimeter);
  const edges: GeometricPrediction['edges'] = [];
  
  // Analyze perimeter edges
  for (let i = 0; i < perimeter.length; i++) {
    const start = perimeter[i];
    const end = perimeter[(i + 1) % perimeter.length];
    
    const length = haversineDistance(
      [start.x, start.y],
      [end.x, end.y]
    ) * 3.28084; // Convert to feet
    
    // Classify edge based on roof type and orientation
    let edgeType = 'EAVE';
    let confidence = 0.7;
    
    if (roofType === 'gable') {
      // Simple heuristic: longer edges are eaves, shorter are rakes
      const avgLength = perimeter.reduce((sum, _, idx) => {
        const p1 = perimeter[idx];
        const p2 = perimeter[(idx + 1) % perimeter.length];
        return sum + haversineDistance([p1.x, p1.y], [p2.x, p2.y]);
      }, 0) / perimeter.length;
      
      edgeType = length > avgLength * 3.28084 ? 'EAVE' : 'RAKE';
      confidence = 0.75;
    } else if (roofType === 'hip') {
      edgeType = 'EAVE';
      confidence = 0.8;
    }
    
    edges.push({
      start: [start.x, start.y],
      end: [end.x, end.y],
      edgeType,
      length: Math.round(length),
      confidence
    });
  }
  
  // Add ridge/hip lines based on roof type
  if (roofType === 'gable') {
    // Add ridge line (simplified: connect midpoints of shorter edges)
    const centroid = calculateCentroid(perimeter);
    edges.push({
      start: [centroid.x - 0.00005, centroid.y],
      end: [centroid.x + 0.00005, centroid.y],
      edgeType: 'RIDGE',
      length: 30, // Approximate
      confidence: 0.6
    });
  } else if (roofType === 'hip') {
    // Add hip lines from centroid to corners
    const centroid = calculateCentroid(perimeter);
    const corners = detectCorners(perimeter);
    
    corners.forEach(corner => {
      const hipLength = haversineDistance(
        [centroid.x, centroid.y],
        [corner.x, corner.y]
      ) * 3.28084;
      
      edges.push({
        start: [centroid.x, centroid.y],
        end: [corner.x, corner.y],
        edgeType: 'HIP',
        length: Math.round(hipLength),
        confidence: 0.65
      });
    });
  }
  
  return {
    edges,
    roofType,
    geometricConfidence: roofType === 'hip' ? 0.8 : roofType === 'gable' ? 0.75 : 0.6
  };
}

/**
 * Detect roof type from perimeter shape
 */
function detectRoofType(perimeter: Point[]): string {
  const n = perimeter.length;
  
  if (n === 4) {
    // Check aspect ratio
    const lengths = [];
    for (let i = 0; i < n; i++) {
      const p1 = perimeter[i];
      const p2 = perimeter[(i + 1) % n];
      lengths.push(haversineDistance([p1.x, p1.y], [p2.x, p2.y]));
    }
    const maxLen = Math.max(...lengths);
    const minLen = Math.min(...lengths);
    const aspectRatio = maxLen / minLen;
    
    return aspectRatio > 1.5 ? 'gable' : 'hip';
  } else if (n >= 5 && n <= 8) {
    return 'hip';
  } else if (n > 8) {
    return 'complex';
  }
  
  return 'flat';
}

/**
 * Build AI validation prompt with geometric predictions
 */
function buildValidationPrompt(
  geometric: GeometricPrediction,
  trainingData: any[],
  latitude?: number,
  longitude?: number,
  imageUrl?: string
): string {
  const edgeStats = analyzeTrainingStats(trainingData);
  
  let prompt = `🔬 HYBRID ROOF ANALYSIS - AI VALIDATION PHASE

📐 GEOMETRIC ANALYSIS RESULTS:
Roof Type Detected: ${geometric.roofType.toUpperCase()}
Geometric Confidence: ${(geometric.geometricConfidence * 100).toFixed(0)}%
Edges Detected: ${geometric.edges.length}

GEOMETRIC PREDICTIONS TO VALIDATE:
${geometric.edges.map((edge, i) => `
${i + 1}. ${edge.edgeType}
   Start: [${edge.start[0].toFixed(6)}, ${edge.start[1].toFixed(6)}]
   End: [${edge.end[0].toFixed(6)}, ${edge.end[1].toFixed(6)}]
   Length: ${edge.length}ft
   Geometric Confidence: ${(edge.confidence * 100).toFixed(0)}%
`).join('')}

📊 TRAINING DATA CONTEXT (${trainingData.length} examples):
- Average EAVE: ${edgeStats.avgEave}ft
- Average RAKE: ${edgeStats.avgRake}ft  
- Average RIDGE: ${edgeStats.avgRidge}ft
- Average HIP: ${edgeStats.avgHip}ft
- Common roof types: ${edgeStats.commonRoofTypes.join(', ')}

${latitude && longitude ? `
🌍 LOCATION:
Latitude: ${latitude}
Longitude: ${longitude}
` : ''}

${imageUrl ? '📷 Aerial imagery available for reference' : ''}

🎯 YOUR TASK:
1. **Validate each geometric prediction** against training patterns and typical roof structures
2. **Refine coordinates** if geometric analysis appears inaccurate (e.g., edges too long/short, wrong angles)
3. **Adjust edge types** if geometric classification seems incorrect
4. **Add missing edges** if geometric analysis missed important structural elements
5. **Remove invalid edges** if they don't match roof structure patterns
6. **Provide confidence scores** for each validated edge (0-1 scale)
7. **Explain adjustments** briefly when you modify geometric predictions

⚠️ VALIDATION RULES:
- Geometric predictions are usually accurate for perimeter edges
- Ridge/hip predictions may need refinement based on training patterns
- Edge lengths should match training data averages (±30%)
- Roof type should align with edge pattern and count
- All coordinates must stay within realistic geographic bounds
- Confidence > 0.8 means high certainty, < 0.5 means uncertain

Return validated and refined edge predictions with your confidence assessments.`;

  return prompt;
}

/**
 * Compute multi-method confidence scores
 */
function computeConfidenceScores(
  geometricEdges: GeometricPrediction['edges'],
  aiEdges: any[],
  trainingData: any[]
): any[] {
  console.log('Computing confidence scores from multiple methods...');
  
  return aiEdges.map((aiEdge, index) => {
    // Find corresponding geometric edge (if exists)
    const geometricEdge = geometricEdges[index];
    
    // Base confidence from AI
    const aiConfidence = aiEdge.aiConfidence || 0.5;
    
    // Geometric confidence (if edge existed in geometric analysis)
    const geometricConfidence = geometricEdge?.confidence || 0;
    
    // Training data confidence (how well this matches historical patterns)
    const trainingConfidence = calculateTrainingConfidence(aiEdge, trainingData);
    
    // Multi-method weighted average
    const weights = {
      ai: 0.5,
      geometric: 0.3,
      training: 0.2
    };
    
    const finalConfidence = 
      (aiConfidence * weights.ai) +
      (geometricConfidence * weights.geometric) +
      (trainingConfidence * weights.training);
    
    return {
      ...aiEdge,
      confidence: Math.round(finalConfidence * 100) / 100,
      confidenceBreakdown: {
        ai: aiConfidence,
        geometric: geometricConfidence,
        training: trainingConfidence,
        method: 'hybrid-multi-source'
      }
    };
  });
}

/**
 * Calculate confidence based on training data patterns
 */
function calculateTrainingConfidence(edge: any, trainingData: any[]): number {
  const edgeType = edge.edgeType?.toUpperCase();
  const length = edge.length;
  
  // Find similar edges in training data
  const similarEdges = trainingData.filter(t => 
    (t.edge_type || '').toUpperCase().includes(edgeType)
  );
  
  if (similarEdges.length === 0) return 0.5; // No training data, moderate confidence
  
  // Calculate average length from training
  const avgLength = similarEdges.reduce((sum, e) => sum + (e.length_ft || 0), 0) / similarEdges.length;
  
  // Confidence based on how close this edge is to training average
  const lengthDiff = Math.abs(length - avgLength);
  const lengthPercent = avgLength > 0 ? lengthDiff / avgLength : 1;
  
  // High confidence if within 20% of average, decreases linearly
  if (lengthPercent < 0.2) return 0.9;
  if (lengthPercent < 0.4) return 0.7;
  if (lengthPercent < 0.6) return 0.5;
  return 0.3;
}

/**
 * Analyze training data statistics
 */
function analyzeTrainingStats(data: any[]) {
  const eaves: number[] = [];
  const rakes: number[] = [];
  const ridges: number[] = [];
  const hips: number[] = [];
  const roofTypes = new Set<string>();

  data.forEach(item => {
    const edgeType = (item.edge_type || '').toUpperCase();
    const length = item.length_ft || 0;

    if (length > 0) {
      if (edgeType.includes('EAVE')) eaves.push(length);
      else if (edgeType.includes('RAKE')) rakes.push(length);
      else if (edgeType.includes('RIDGE')) ridges.push(length);
      else if (edgeType.includes('HIP')) hips.push(length);
    }

    if (item.notes) {
      const match = item.notes.match(/(hip|gable|flat|shed)/i);
      if (match) roofTypes.add(match[1].toLowerCase());
    }
  });

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  return {
    avgEave: avg(eaves) || 40,
    avgRake: avg(rakes) || 30,
    avgRidge: avg(ridges) || 35,
    avgHip: avg(hips) || 28,
    commonRoofTypes: Array.from(roofTypes)
  };
}

/**
 * Calculate centroid of polygon
 */
function calculateCentroid(points: Point[]): Point {
  const sum = points.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );
  return {
    x: sum.x / points.length,
    y: sum.y / points.length
  };
}

/**
 * Detect corners (significant vertices) in polygon
 */
function detectCorners(points: Point[]): Point[] {
  // For simplicity, return all vertices as potential corners
  // In production, would use angle detection
  return points;
}

/**
 * Calculate haversine distance between two points
 */
function haversineDistance(coord1: [number, number], coord2: [number, number]): number {
  const R = 6371000; // Earth's radius in meters
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

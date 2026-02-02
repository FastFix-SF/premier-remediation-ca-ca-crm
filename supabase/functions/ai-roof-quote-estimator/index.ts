import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RoofFeature {
  type: 'vent' | 'chimney' | 'skylight' | 'solar_panel' | 'hvac' | 'other';
  position: { x: number; y: number };
  confidence: number;
  dimensions?: { width: number; height: number };
}

interface Edge {
  start: [number, number];
  end: [number, number];
  edgeType: 'eave' | 'rake' | 'ridge' | 'valley' | 'hip';
  length: number;
  confidence: number;
}

interface QuoteEstimate {
  roofArea: {
    planArea: number;
    surfaceArea: number;
    pitch: string;
    pitchFactor: number;
    squares: number;
  };
  edges: {
    type: string;
    length: number;
    linearFeet: number;
  }[];
  features: {
    type: string;
    count: number;
    unitCost: number;
    totalCost: number;
  }[];
  pricing: {
    roofingMaterial: number;
    labor: number;
    edgeMaterials: number;
    features: number;
    subtotal: number;
    contingency: number;
    total: number;
  };
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      maskPolygon, 
      imageUrl, 
      pitch = '4/12',
      quoteId,
      pricingConfig = {}
    } = await req.json();

    console.log('🏠 AI Roof Quote Estimator started', {
      polygonPoints: maskPolygon?.length,
      hasPitch: !!pitch,
      quoteId
    });

    // Step 1: Analyze roof geometry with hybrid analysis
    const { data: hybridData, error: hybridError } = await supabase.functions.invoke(
      'hybrid-roof-analysis',
      {
        body: {
          perimeter: maskPolygon,
          imageUrl,
          quoteId
        }
      }
    );

    if (hybridError) {
      throw new Error(`Hybrid analysis failed: ${hybridError.message}`);
    }

    const edges: Edge[] = hybridData.edges || [];
    const roofType = hybridData.roofType || 'gable';

    console.log('✅ Hybrid analysis complete:', {
      edgesDetected: edges.length,
      roofType
    });

    // Step 2: Detect roof features using AI
    console.log('🔍 Detecting roof features...');
    const features = await detectRoofFeatures(imageUrl, maskPolygon);
    console.log('✅ Features detected:', features.length);

    // Step 3: Calculate areas
    const planArea = calculatePolygonArea(maskPolygon);
    const pitchData = parsePitch(pitch);
    const surfaceArea = planArea * pitchData.factor;
    const squares = surfaceArea / 100;

    console.log('📐 Area calculations:', {
      planArea: planArea.toFixed(2),
      pitch,
      pitchFactor: pitchData.factor.toFixed(2),
      surfaceArea: surfaceArea.toFixed(2),
      squares: squares.toFixed(2)
    });

    // Step 4: Calculate edge totals
    const edgeTotals = calculateEdgeTotals(edges, pitchData.factor);

    // Step 5: Group features and calculate costs
    const featureCosts = calculateFeatureCosts(features, pricingConfig);

    // Step 6: Generate quote
    const pricing = calculateQuotePricing(
      squares,
      edgeTotals,
      featureCosts,
      pricingConfig
    );

    const estimate: QuoteEstimate = {
      roofArea: {
        planArea,
        surfaceArea,
        pitch,
        pitchFactor: pitchData.factor,
        squares
      },
      edges: edgeTotals,
      features: featureCosts,
      pricing,
      confidence: hybridData.confidence || 0.85
    };

    // Step 7: Save to database if quoteId provided
    if (quoteId) {
      await supabase
        .from('quote_requests')
        .update({
          ai_measurements: {
            estimate,
            analyzedAt: new Date().toISOString(),
            roofType,
            edges: edges.length,
            features: features.length
          }
        })
        .eq('id', quoteId);
    }

    console.log('✅ Quote estimate generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        estimate,
        roofType,
        edges,
        features
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Quote estimator error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function detectRoofFeatures(
  imageUrl: string,
  maskPolygon: Array<{ x: number; y: number }>
): Promise<RoofFeature[]> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) {
    console.warn('⚠️ LOVABLE_API_KEY not configured, skipping feature detection');
    return [];
  }

  try {
    const prompt = `Analyze this roof image and detect all visible roof features. Identify and locate:
- Vents (roof vents, plumbing vents, turbine vents)
- Chimneys (brick, metal, prefab)
- Skylights (fixed, tubular, dome)
- HVAC units
- Solar panels
- Other roof penetrations

For each feature, provide:
1. Type of feature
2. Approximate position (x, y coordinates normalized 0-1)
3. Confidence score (0-1)
4. Approximate dimensions if visible

Return as JSON array with structure: [{ type, position: { x, y }, confidence, dimensions: { width, height } }]`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'report_roof_features',
            description: 'Report detected roof features with locations and confidence',
            parameters: {
              type: 'object',
              properties: {
                features: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['vent', 'chimney', 'skylight', 'solar_panel', 'hvac', 'other'] },
                      position: {
                        type: 'object',
                        properties: {
                          x: { type: 'number' },
                          y: { type: 'number' }
                        }
                      },
                      confidence: { type: 'number' },
                      dimensions: {
                        type: 'object',
                        properties: {
                          width: { type: 'number' },
                          height: { type: 'number' }
                        }
                      }
                    },
                    required: ['type', 'position', 'confidence']
                  }
                }
              },
              required: ['features']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'report_roof_features' } }
      })
    });

    if (!response.ok) {
      console.error('AI feature detection failed:', response.status);
      return [];
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return parsed.features || [];
    }

    return [];
  } catch (error) {
    console.error('Feature detection error:', error);
    return [];
  }
}

function calculatePolygonArea(polygon: Array<{ x: number; y: number }>): number {
  // Shoelace formula for polygon area
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }
  return Math.abs(area / 2);
}

function parsePitch(pitchStr: string): { rise: number; run: number; factor: number; angle: number } {
  const normalized = pitchStr.trim().replace(':', '/');
  let rise = 4, run = 12;

  if (normalized.includes('/')) {
    const parts = normalized.split('/');
    rise = parseFloat(parts[0]) || 4;
    run = parseFloat(parts[1]) || 12;
  } else {
    rise = parseFloat(normalized) || 4;
  }

  const slope = rise / run;
  const factor = Math.sqrt(1 + (slope * slope));
  const angle = Math.atan(slope) * 180 / Math.PI;

  return { rise, run, factor, angle };
}

function calculateEdgeTotals(edges: Edge[], pitchFactor: number) {
  const edgeMap = new Map<string, number>();

  edges.forEach(edge => {
    const type = edge.edgeType;
    const length = edge.length;
    const current = edgeMap.get(type) || 0;
    edgeMap.set(type, current + length);
  });

  return Array.from(edgeMap.entries()).map(([type, length]) => ({
    type,
    length,
    linearFeet: type === 'eave' || type === 'rake' ? length * pitchFactor : length
  }));
}

function calculateFeatureCosts(features: RoofFeature[], pricingConfig: any) {
  const featureMap = new Map<string, number>();
  
  features.forEach(feature => {
    const count = featureMap.get(feature.type) || 0;
    featureMap.set(feature.type, count + 1);
  });

  const defaultCosts: Record<string, number> = {
    vent: 150,
    chimney: 800,
    skylight: 1200,
    solar_panel: 0,
    hvac: 500,
    other: 200
  };

  return Array.from(featureMap.entries()).map(([type, count]) => {
    const unitCost = pricingConfig[`${type}Cost`] || defaultCosts[type] || 200;
    return {
      type,
      count,
      unitCost,
      totalCost: count * unitCost
    };
  });
}

function calculateQuotePricing(
  squares: number,
  edgeTotals: any[],
  featureCosts: any[],
  pricingConfig: any
) {
  const costPerSquare = pricingConfig.costPerSquare || 350;
  const laborPerSquare = pricingConfig.laborPerSquare || 150;
  const edgeCostPerFoot = pricingConfig.edgeCostPerFoot || 8;

  const roofingMaterial = squares * costPerSquare;
  const labor = squares * laborPerSquare;
  
  const edgeMaterials = edgeTotals.reduce((sum, edge) => {
    return sum + (edge.linearFeet * edgeCostPerFoot);
  }, 0);

  const features = featureCosts.reduce((sum, feature) => sum + feature.totalCost, 0);

  const subtotal = roofingMaterial + labor + edgeMaterials + features;
  const contingency = subtotal * 0.10; // 10% contingency
  const total = subtotal + contingency;

  return {
    roofingMaterial: Math.round(roofingMaterial),
    labor: Math.round(labor),
    edgeMaterials: Math.round(edgeMaterials),
    features: Math.round(features),
    subtotal: Math.round(subtotal),
    contingency: Math.round(contingency),
    total: Math.round(total)
  };
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

interface QuoteData {
  id: string;
  project_type: string | null;
  property_type: string | null;
  facets: any;
  edges: any[];
  pins: any[];
  rf_items: any[];
  shingles_items: any[];
  services_items: any[];
  measurements: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request to ai-quote-builder');
    
    const requestBody = await req.text();
    console.log('Request body:', requestBody);
    
    if (!requestBody || requestBody.trim() === '') {
      throw new Error('Empty request body');
    }
    
    const { quoteId } = JSON.parse(requestBody);

    if (!quoteId) {
      console.error('Missing quoteId in request');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing quoteId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing quote:', quoteId);

    // Fetch quote data
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch RAG training context
    console.log('🧠 Fetching training context...');
    const { data: trainingDocs } = await supabaseClient
      .from('project_training_documents')
      .select('*')
      .eq('quote_request_id', quoteId)
      .eq('processing_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5);

    const trainingContext = buildTrainingContext(trainingDocs || []);
    console.log(`✅ Loaded ${trainingDocs?.length || 0} training documents`);

    const { data: quoteData, error: quoteError } = await supabaseClient
      .from('quote_requests')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError) {
      console.error('Error fetching quote:', quoteError);
      throw quoteError;
    }
    
    console.log('Quote data fetched successfully');

    // Fetch solar analysis data for total area
    const { data: solarData } = await supabaseClient
      .from('solar_analyses')
      .select('parsed_roof_data')
      .eq('quote_id', quoteId)
      .single();

    // Get total area from solar API or fallback to facets calculation
    let totalArea = 0;
    if (solarData?.parsed_roof_data?.totalAreaSqFt) {
      totalArea = solarData.parsed_roof_data.totalAreaSqFt;
      console.log('Using solar API total area:', totalArea);
    } else {
      // Fallback to facets calculation
      const facets = quoteData.facets || {};
      totalArea = Object.values(facets).reduce((sum: number, facet: any) => {
        return sum + (facet.area || 0);
      }, 0);
      console.log('Using facets calculated area:', totalArea);
    }

    // Get edge measurements from plan viewer
    const edges = quoteData.edges || [];
    const edgeStats = {
      eave: edges.filter((e: any) => e.edgeLabel === 'EAVE').reduce((sum, e) => sum + (e.length || 0), 0),
      rake: edges.filter((e: any) => e.edgeLabel === 'RAKE').reduce((sum, e) => sum + (e.length || 0), 0),
      ridge: edges.filter((e: any) => e.edgeLabel === 'RIDGE').reduce((sum, e) => sum + (e.length || 0), 0),
      valley: edges.filter((e: any) => e.edgeLabel === 'VALLEY').reduce((sum, e) => sum + (e.length || 0), 0),
      hip: edges.filter((e: any) => e.edgeLabel === 'HIP').reduce((sum, e) => sum + (e.length || 0), 0),
    };

    const pins = quoteData.pins || [];
    const pinCounts = pins.reduce((acc: any, pin: any) => {
      acc[pin.type] = (acc[pin.type] || 0) + 1;
      return acc;
    }, {});

    // Build AI prompt with RAG context
    const prompt = `You are an expert roofing contractor providing accurate material and labor estimates.

${trainingContext ? `🧠 HISTORICAL PROJECT DATA (Learn from this company's actual experience):
${trainingContext}

Use the above historical data to inform your estimates - actual material costs, labor rates, and measurements from similar past projects.

---

` : ''}
PROJECT DETAILS:
- Project Type: ${quoteData.project_type || 'Roof replacement'}
- Property Type: ${quoteData.property_type || 'Residential'}
- Current Condition: Shingles roof being replaced with Metal roof

MEASUREMENTS:
- Total Roof Area: ${totalArea.toFixed(2)} sq ft (${(totalArea / 100).toFixed(2)} squares)
- Eave Length: ${edgeStats.eave.toFixed(2)} linear feet
- Rake Length: ${edgeStats.rake.toFixed(2)} linear feet
- Ridge Length: ${edgeStats.ridge.toFixed(2)} linear feet
- Valley Length: ${edgeStats.valley.toFixed(2)} linear feet
- Hip Length: ${edgeStats.hip.toFixed(2)} linear feet

SPECIAL FEATURES IDENTIFIED (Pins):
${Object.entries(pinCounts).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

Based on this data, provide a comprehensive quote breakdown with:

1. SHINGLES/METAL ROOF MATERIALS:
   - Main roofing material (Metal panels/Standing seam)
   - Underlayment requirements
   - Ice & water shield
   - Fasteners/screws for metal
   - Hip & ridge caps for metal
   - Valley flashing
   - Drip edge (eave and rake)
   - Any other metal-specific materials

2. SERVICES:
   - Remove existing shingles (include disposal)
   - Roof deck inspection/repair allowance
   - Metal roof installation labor
   - Flashing installation
   - Cleanup and disposal
   - Any specialty work for identified features

3. OTHER MATERIALS:
   - Based on identified pins (vents, skylights, chimneys, etc.)
   - Additional flashings
   - Sealants and accessories
   - Safety equipment rentals

For each item, provide:
- Item name
- Quantity (based on measurements)
- Unit type (sq, lf, ea, roll, etc.)
- Unit cost (market rate)
- Labor cost per unit
- Total cost
- Brief justification

Format as JSON with this structure:
{
  "shingles_items": [{"name": "...", "quantity": 0, "unit": "$/Sq.", "coverage": 0, "labor": 0, "material": 0, "category": "...", "justification": "..."}],
  "services_items": [{"name": "...", "quantity": 0, "unit": "$/Sq.", "coverage": 1, "labor": 0, "material": 0, "category": "...", "justification": "..."}],
  "rf_items": [{"name": "...", "quantity": 0, "unit": "$/Ea.", "coverage": 0, "labor": 0, "material": 0, "category": "...", "justification": "..."}],
  "summary": {
    "total_materials": 0,
    "total_labor": 0,
    "grand_total": 0,
    "key_considerations": ["..."]
  }
}

Use standard industry pricing and coverage rates. Be thorough but realistic.`;

    console.log('Calling AI API...');
    
    // Call AI API
    const aiResponse = await fetch(AI_GATEWAY_URL, {
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
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');
    const aiContent = aiData.choices?.[0]?.message?.content || '';

    // Extract JSON from response
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('AI response content:', aiContent);
      throw new Error('Failed to extract JSON from AI response');
    }

    const quoteEstimate = JSON.parse(jsonMatch[0]);
    console.log('Quote estimate generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        estimate: quoteEstimate,
        measurements: {
          totalArea,
          squares: totalArea / 100,
          edges: edgeStats,
          pins: pinCounts
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in AI quote builder:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildTrainingContext(docs: any[]): string {
  if (!docs || docs.length === 0) return '';

  const contextParts = docs.map(doc => {
    const category = doc.document_category;
    const data = doc.extracted_data || {};
    const fileName = doc.file_name;

    switch (category) {
      case 'sketch_report':
        return `📐 SKETCH REPORT (${fileName}):
- Measurements: ${JSON.stringify(data.measurements || {})}
- Pitch: ${data.pitch || 'N/A'}
- Geometry: ${JSON.stringify(data.geometry || {})}
- Materials Called Out: ${JSON.stringify(data.materials || {})}`;

      case 'estimate':
        return `💰 PAST ESTIMATE (${fileName}):
- Total Cost: $${data.total_cost || 'N/A'}
- Labor Cost: $${data.labor_cost || 'N/A'}
- Materials: ${JSON.stringify(data.materials || [])}
- Line Items: ${data.line_items?.length || 0} items
${data.line_items ? data.line_items.slice(0, 3).map((item: any) => 
  `  • ${item.description || item.name}: ${item.quantity} ${item.unit} @ $${item.unit_price || item.price}`
).join('\n') : ''}`;

      case 'material_order':
        return `📦 MATERIAL ORDER (${fileName}):
- Materials Ordered: ${JSON.stringify(data.materials || [])}
- Specifications: ${JSON.stringify(data.specifications || {})}`;

      case 'labor_report':
        return `👷 LABOR REPORT (${fileName}):
- Total Hours: ${data.hours || 'N/A'}
- Tasks: ${JSON.stringify(data.tasks || [])}
- Workers: ${data.workers?.length || 'N/A'} crew members`;

      case 'contract':
        return `📄 CONTRACT (${fileName}):
- Scope: ${data.scope || 'N/A'}
- Pricing: ${data.pricing || 'N/A'}
- Timeline: ${data.timeline || 'N/A'}`;

      default:
        return `📎 ${category.toUpperCase()} (${fileName}):
${JSON.stringify(data, null, 2)}`;
    }
  });

  return contextParts.join('\n\n');
}

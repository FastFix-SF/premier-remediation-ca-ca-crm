import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteId, templateName, useTemplateMatching } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch quote data
    const { data: quoteData, error: quoteError } = await supabaseClient
      .from('quote_requests')
      .select('project_type, property_type, edges, facets, pins')
      .eq('id', quoteId)
      .single();

    if (quoteError) throw quoteError;

    // Fetch solar analysis for total area
    const { data: solarData } = await supabaseClient
      .from('solar_analyses')
      .select('total_area_sqft, total_area_squares')
      .eq('quote_request_id', quoteId)
      .maybeSingle();

    // Get materials from the materials tab of this quote
    const { data: quoteMaterials, error: quoteMaterialsError } = await supabaseClient
      .from('quote_requests')
      .select('rf_items, shingles_items, services_items')
      .eq('id', quoteId)
      .single();

    if (quoteMaterialsError) throw quoteMaterialsError;

    // Combine all materials from the different tabs
    const availableMaterials = [
      ...(Array.isArray(quoteMaterials?.rf_items) ? quoteMaterials.rf_items : []),
      ...(Array.isArray(quoteMaterials?.shingles_items) ? quoteMaterials.shingles_items : []),
      ...(Array.isArray(quoteMaterials?.services_items) ? quoteMaterials.services_items : [])
    ];

    // Calculate measurements
    const edges = (quoteData?.edges as any[]) || [];
    const edgeStats = {
      eave: edges.filter((e: any) => e.edgeLabel === 'EAVE').reduce((sum: number, e: any) => sum + (e.length || 0), 0),
      rake: edges.filter((e: any) => e.edgeLabel === 'RAKE').reduce((sum: number, e: any) => sum + (e.length || 0), 0),
      ridge: edges.filter((e: any) => e.edgeLabel === 'RIDGE').reduce((sum: number, e: any) => sum + (e.length || 0), 0),
      valley: edges.filter((e: any) => e.edgeLabel === 'VALLEY').reduce((sum: number, e: any) => sum + (e.length || 0), 0),
      hip: edges.filter((e: any) => e.edgeLabel === 'HIP').reduce((sum: number, e: any) => sum + (e.length || 0), 0),
    };

    const totalArea = solarData?.total_area_sqft || 0;
    const squares = totalArea / 100;

    // Build AI prompt based on mode
    let prompt = '';
    
    // Detect if this is a low-slope/flat roofing template
    const isLowSlopeTemplate = templateName && (
      templateName.toLowerCase().includes('torch down') ||
      templateName.toLowerCase().includes('tpo') ||
      templateName.toLowerCase().includes('epdm') ||
      templateName.toLowerCase().includes('pvc') ||
      templateName.toLowerCase().includes('built-up') ||
      templateName.toLowerCase().includes('tar & gravel') ||
      templateName.toLowerCase().includes('modified bitumen')
    );
    
    if (useTemplateMatching && templateName) {
      prompt = `You are a roofing materials expert. Select materials from the AVAILABLE MATERIALS list for "${templateName}".

PROJECT MEASUREMENTS:
- Total Area: ${totalArea.toFixed(2)} sq ft (${squares.toFixed(2)} squares)
- Eave: ${edgeStats.eave.toFixed(0)} lf
- Rake: ${edgeStats.rake.toFixed(0)} lf
- Ridge: ${edgeStats.ridge.toFixed(0)} lf
- Valley: ${edgeStats.valley.toFixed(0)} lf
- Hip: ${edgeStats.hip.toFixed(0)} lf

AVAILABLE MATERIALS (select ONLY from this list):
${availableMaterials.map((m: any, idx: number) => 
  `${idx + 1}. ${m.name} (ID: ${m.id}, Category: ${m.category}, Unit: ${m.unit})`
).join('\n')}

ROOFING TEMPLATE: "${templateName}"
ROOF TYPE: ${isLowSlopeTemplate ? 'LOW-SLOPE/FLAT ROOFING' : 'STEEP-SLOPE ROOFING'}

YOU ARE A PROFESSIONAL ROOFING CONTRACTOR specializing in ${isLowSlopeTemplate ? 'LOW-SLOPE/FLAT' : 'STEEP-SLOPE'} roofing. Build a COMPLETE roofing system by selecting ALL necessary materials from the AVAILABLE MATERIALS list following this sequence:

${isLowSlopeTemplate ? `
LOW-SLOPE/FLAT ROOFING WORKFLOW - SELECT ALL MATERIALS NEEDED:

STEP 1 - REMOVE EXISTING ROOF:
- Select materials for removing/disposing existing membrane or built-up roof
- Look for: "remove", "tear off", "dispose" in names
- Quantity: ${squares.toFixed(2)} SQ
- Include disposal/cleanup if available

STEP 2 - ROOF DECK PREP (if needed):
- Select materials for roof deck/substrate if template requires it
- Look for: "deck", "cover board", "substrate" in names
- Quantity: ${squares.toFixed(2)} SQ
- Include if template requires deck replacement

STEP 3 - INSULATION:
- Select appropriate insulation board materials for flat roofs
- Look for: "insulation", "ISO", "polyiso", "XPS", "EPS" in names
- Quantity: ${squares.toFixed(2)} SQ
- Include all insulation layers needed

STEP 4 - PRIMARY MEMBRANE:
- Based on template "${templateName}", select appropriate membrane(s):
  * If "TPO": Select TPO membrane material(s)
  * If "EPDM": Select EPDM rubber membrane material(s)
  * If "Torch Down" or "Modified Bitumen": Select torch-down/modified bitumen material(s)
  * If "PVC": Select PVC membrane material(s)
  * If "Built-Up": Select built-up roofing material(s)
- Quantity: ${(squares * 1.05).toFixed(2)} SQ (includes 5% waste)
- Include primer/adhesive if available

STEP 5 - FLASHINGS & ACCESSORIES:
- Select edge metal/coping materials
- Quantity: ${(edgeStats.eave + edgeStats.rake).toFixed(0)} LF
- Select fastener/plate systems for flat roofs
- Select membrane adhesive/primer
- Select caulking/sealants if available
- Include ALL accessories needed for complete installation

IMPORTANT:
1. This is a FLAT/LOW-SLOPE roof - do NOT select steep-slope materials like shingles, ridge caps, or drip edge
2. Include ALL materials for a complete installation, not just one per category
3. Match the target membrane type from the template name
4. Use exact IDs from AVAILABLE MATERIALS list
` : `
STEEP-SLOPE ROOFING WORKFLOW - SELECT ALL MATERIALS NEEDED:

STEP 1 - TEAR OFF & DISPOSAL:
- Select materials for removing/disposing the existing roof
- Look for: "remove", "tear off", "dispose", "disposal" in names
- Quantity: ${squares.toFixed(2)} SQ
- Include cleanup materials if available

STEP 2 - ROOF DECK (if needed for this template):
- Select materials for roof decking if template requires it
- Look for: "deck", "decking", "plywood", "OSB", "sheathing" in names  
- Quantity: ${squares.toFixed(2)} SQ (only if template requires deck replacement)
- Include if template requires deck replacement

STEP 3 - UNDERLAYMENT SYSTEM:
- Select primary underlayment material(s)
- Look for: "underlayment", "synthetic", "felt", "tiger paw", "feltbuster" in names
- Quantity: ${squares.toFixed(2)} SQ
- Select ice & water shield for critical areas
- Look for: "ice", "water shield", "leak barrier", "stormguard" in names
- Quantity: ${((edgeStats.valley + edgeStats.eave) / 100).toFixed(2)} SQ
- Include ALL underlayment materials needed

STEP 4 - PRIMARY ROOFING MATERIAL:
- Based on template name "${templateName}", identify and select the target roofing materials
- If "Comp" or "HDZ" or "Premium": Select appropriate architectural shingle product(s)
- If "Standing Seam": Select standing seam metal product(s) and accessories
- If "R-Panel": Select R-panel metal product(s) and accessories
- If "Stone-Coated Steel": Select stone-coated steel product(s) and accessories
- Look for the NEW roofing material type in the material names
- Quantity: ${(squares * 1.1).toFixed(2)} SQ (includes 10% waste)
- Include ALL components of the roofing system

STEP 5 - FLASHINGS & ACCESSORIES:
- Select drip edge materials for eaves/rakes
- Quantity: ${(edgeStats.eave + edgeStats.rake).toFixed(0)} LF
- Select valley flashing (if valleys > 0)
- Quantity: ${edgeStats.valley.toFixed(0)} LF
- Select ridge cap / hip & ridge materials
- Quantity: ${((edgeStats.ridge + edgeStats.hip) / 100).toFixed(2)} SQ
- Select starter strip materials
- Quantity: ${(edgeStats.eave / 100).toFixed(2)} SQ
- Select fastener/nail materials
- Quantity: ${(squares * 3).toFixed(0)} LBS (approximately 3 lbs per square)
- Include step flashing if available
- Include any other accessories (vents, pipe boots, etc.)

CRITICAL RULES - READ CAREFULLY:
1. Include ALL materials needed for a COMPLETE roofing installation
2. Select every item from the workflow steps that exists in the available materials
3. Do NOT select duplicate items (e.g., two different brands of the same shingle type)
4. Use exact IDs from the AVAILABLE MATERIALS list
5. If a material doesn't exist for a step, SKIP that step entirely
6. Match materials intelligently by reading their full names and categories
7. Your response MUST be a complete roofing system with ALL necessary components
8. Think like a contractor ordering materials - include everything needed from start to finish
`}

Return ONLY a JSON array with materials from the list:
[
  {
    "id": "exact_id_from_available_materials",
    "name": "exact_name_from_available_materials",
    "category": "exact_category_from_available_materials",
    "unit": "exact_unit_from_available_materials",
    "total": calculated_quantity_based_on_measurements,
    "picture": "",
    "image_url": ""
  }
]

If no suitable materials exist in the list, return an empty array []`;
    } else {
      prompt = `You are a roofing materials expert analyzing a project.

PROJECT DETAILS:
- Project Type: ${quoteData.project_type}
- Property Type: ${quoteData.property_type}
- Total Area: ${totalArea.toFixed(2)} sq ft (${squares.toFixed(2)} squares)

EDGE MEASUREMENTS:
- Eave: ${edgeStats.eave.toFixed(0)} lf
- Rake: ${edgeStats.rake.toFixed(0)} lf
- Ridge: ${edgeStats.ridge.toFixed(0)} lf
- Valley: ${edgeStats.valley.toFixed(0)} lf
- Hip: ${edgeStats.hip.toFixed(0)} lf

AVAILABLE MATERIALS:
${availableMaterials.map((m: any) => `- ${m.name} (${m.category}, $${m.material || m.unit_cost}/${m.unit})`).join('\n')}

Recommend 5-10 materials for this project with quantities and justification.

Return JSON:
{
  "recommendations": [
    {
      "material_name": "string",
      "quantity": number,
      "unit": "string",
      "justification": "string"
    }
  ]
}`;
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    console.log('Calling Lovable AI Gateway with model: google/gemini-2.5-pro');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert roofing contractor with 20+ years of experience. You understand complete roofing systems and select materials following proper installation sequences. You know that a roofing job requires: tear-off, deck repair, underlayment, ice/water shield, new roofing material, flashings, and accessories. You NEVER select multiple similar items - only ONE per category. Always respond with valid JSON arrays only.'
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    console.log('AI Gateway response status:', aiResponse.status);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      // Handle specific error cases
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (aiResponse.status === 402) {
        throw new Error('Lovable AI credits exhausted. Please add credits to your workspace.');
      } else if (aiResponse.status === 503) {
        throw new Error('AI service temporarily unavailable. Please try again in a few seconds.');
      }
      
      throw new Error(`AI Gateway error (${aiResponse.status}): ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Parse JSON from response
    let parsedData;
    if (useTemplateMatching) {
      // For template matching, expect an array
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      parsedData = arrayMatch ? JSON.parse(arrayMatch[0]) : [];
      
      // Enrich with actual image URLs from available materials
      parsedData = parsedData.map((aiMaterial: any) => {
        const matchedMaterial = availableMaterials.find((m: any) => 
          m.id === aiMaterial.id || m.name === aiMaterial.name
        );
        
        if (matchedMaterial) {
          return {
            ...aiMaterial,
            picture: matchedMaterial.picture || aiMaterial.picture,
            image_url: matchedMaterial.image_url || aiMaterial.image_url
          };
        }
        return aiMaterial;
      });
    } else {
      // For general recommendations, expect object with recommendations array
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsedData = jsonMatch ? JSON.parse(jsonMatch[0]).recommendations : [];
    }

    return new Response(JSON.stringify({ 
      success: true, 
      materials: parsedData,
      recommendations: parsedData // Keep for backward compatibility
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-materials-expert:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

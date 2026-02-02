import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { fileUrl, fileType, category, fileName, quoteId } = await req.json();
    
    console.log('Processing file:', { fileName, fileType, category });

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let extractedData: any = {};

    // Analyze the image using Lovable AI with vision
    const analysisPrompt = buildAnalysisPrompt(category);
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing roofing documents and photos. Extract measurements, materials, pricing, roof features, and technical details. Always return valid JSON.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: analysisPrompt
              },
              {
                type: 'image_url',
                image_url: { url: fileUrl }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const extractedText = aiData.choices[0].message.content;
    
    // Clean up markdown code blocks if present
    let cleanedText = extractedText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    try {
      extractedData = JSON.parse(cleanedText);
    } catch (e) {
      console.warn('Failed to parse JSON, storing as raw text:', e);
      extractedData = { raw_analysis: cleanedText };
    }

    // Save extracted data to training database
    const { error: insertError } = await supabaseClient
      .from('project_training_documents')
      .insert({
        quote_request_id: quoteId,
        source_file_url: fileUrl,
        source_file_type: fileType,
        document_category: category,
        extracted_data: extractedData,
        file_name: fileName,
        processing_status: 'completed'
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    console.log('Successfully processed:', fileName);

    return new Response(
      JSON.stringify({ 
        success: true, 
        extractedData,
        category,
        fileName 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error processing file:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function buildAnalysisPrompt(category: string): string {
  const prompts: Record<string, string> = {
    sketch_report: `Extract from this Sketch Report:
- **Property Address** (CRITICAL: Look for street address, city, state, zip - usually at the top of the document)
- Roof measurements (area, perimeter, ridge lengths, valley lengths, hip lengths)
- Pitch/slope for each section
- Roof geometry (shapes, planes, facets)
- Material callouts
- Any drawn lines or annotations
Return as JSON with keys: property_address, measurements, pitch, geometry, materials, annotations`,
    
    estimate: `Extract from this Estimate:
- **Property Address** (CRITICAL: Look for street address, city, state, zip - usually at the top)
- Line items with descriptions, quantities, unit prices, totals
- Material types and brands
- Labor costs
- Total project cost
Return as JSON with keys: property_address, line_items[], materials[], labor_cost, total_cost`,
    
    material_order: `Extract from this Material Order:
- **Property Address** (CRITICAL: Look for delivery/job site address)
- Ordered materials with quantities
- Material specifications (color, type, brand)
- Delivery information
Return as JSON with keys: property_address, materials[], specifications, delivery_info`,
    
    labor_report: `Extract from this Labor Report:
- **Property Address** (CRITICAL: Look for job site address)
- Tasks performed with time spent
- Workers/crew information
- Dates and hours
Return as JSON with keys: property_address, tasks[], workers[], hours, dates`,
    
    contract: `Extract from this Contract:
- **Property Address** (CRITICAL: Look for property/project address)
- Project scope
- Pricing
- Timeline
- Terms
Return as JSON with keys: property_address, scope, pricing, timeline, terms`,
    
    roof_photo: `Extract from this Roof Photo:
- **Property Address** (if visible in the image or metadata)
- Visible roof conditions
- Material types visible
- Notable features or damage
Return as JSON with keys: property_address, conditions, visible_materials, features`,
    
    other: `Extract all relevant roofing data from this document:
- **Property Address** (CRITICAL: Always look for the property/job site address first)
- Measurements
- Materials
- Costs
- Technical details
Return as structured JSON with property_address as the first key`
  };

  return prompts[category] || prompts.other;
}

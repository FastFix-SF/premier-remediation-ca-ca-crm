import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawText } = await req.json();

    if (!rawText || typeof rawText !== 'string') {
      return new Response(
        JSON.stringify({ error: 'rawText is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('[parse-labor-pdf] Received text length:', rawText.length);
    console.log('[parse-labor-pdf] First 500 chars:', rawText.substring(0, 500));

    const systemPrompt = `You are a labor report parser for roofing projects. Extract all work line items from the provided text.

For each line item, extract:
- qty: the quantity (a number)
- unit: the unit type (one of: Count, Sq, Ft, LF, SF, EA, or similar)
- description: what work is being done (e.g., "Flash Existing 2x4 Skylight up to 4x4")

IMPORTANT RULES:
- IGNORE section headers like "All Project Labor", "Roof removal Labor", "Standing Seam Labor"
- IGNORE totals and subtotals
- IGNORE price information (we only need qty, unit, description)
- Focus on extracting individual work items only
- If qty is missing, use 1 as default
- If unit is missing, use "Count" as default
- Clean up descriptions to be readable

Example input:
"3.0 Count $125.00 Flash Existing 2x4 Skylight up to 4x4 $375.00"

Example output item:
{ "qty": 3, "unit": "Count", "description": "Flash Existing 2x4 Skylight up to 4x4" }`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Parse this labor report and extract all work items:\n\n${rawText}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_labor_items',
              description: 'Extract structured labor items from the report',
              parameters: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    description: 'List of extracted labor items',
                    items: {
                      type: 'object',
                      properties: {
                        qty: { type: 'number', description: 'Quantity of work' },
                        unit: { type: 'string', description: 'Unit type (Count, Sq, Ft, LF, SF, EA)' },
                        description: { type: 'string', description: 'Description of the work' }
                      },
                      required: ['qty', 'unit', 'description'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['items'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_labor_items' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[parse-labor-pdf] AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please try the paste method instead.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[parse-labor-pdf] AI response:', JSON.stringify(data, null, 2));

    // Extract items from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function?.name !== 'extract_labor_items') {
      console.error('[parse-labor-pdf] No valid tool call in response');
      throw new Error('Failed to extract items from AI response');
    }

    const parsedArgs = JSON.parse(toolCall.function.arguments);
    const items = parsedArgs.items || [];

    console.log('[parse-labor-pdf] Extracted items:', items.length);

    return new Response(
      JSON.stringify({ items }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[parse-labor-pdf] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

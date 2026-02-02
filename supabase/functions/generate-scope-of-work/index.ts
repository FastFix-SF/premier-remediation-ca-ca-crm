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

    const systemPrompt = `You are a professional roofing scope of work formatter. Your job is to convert raw quote/invoice data into a professionally formatted scope of work document.

Input format typically contains: Qty, Unit, Description organized by categories (may be unstructured).

Output format requirements:
- Group items by logical categories (e.g., Roof Removal, Installation, Sheet Metal, Gutters, Plumbing Vents, Other)
- Use markdown formatting with ## for main headers and ### for category headers
- Each item should be a bullet point with the description and quantity in parentheses
- Use professional, clear language
- Organize logically from tear-off to installation to finishing work
- Include all items from the input, don't skip anything
- Keep quantities and units accurate

Example output format:
## Scope of Work

### Roof Removal
- Remove and haul away existing flat roof (39.5 Sq.)

### Low Slope Installation
- Apply one layer of CertainTeed SA Flintlastic granulated cap sheet (39.5 Sq.)
- Install one layer of Fiberglass Base Sheet mechanically attached to roof deck (39.5 Sq.)

### Sheet Metal Work
- Install 2"x3"x10' galvanized gravel stop at edge of flat roof (246.6 Ft.)

### Plumbing Roof Vents
- Install 4" 025 Assembly (10 Count)

### Other
- Job site clean up (1 Sq.)
- Travel (1 Count)

Now convert the following raw data into a properly formatted scope of work:`;

    console.log('Calling Lovable AI to generate scope of work...');

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
          { role: 'user', content: rawText }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedScope = data.choices?.[0]?.message?.content;

    if (!generatedScope) {
      throw new Error('No content generated from AI');
    }

    console.log('Successfully generated scope of work');

    return new Response(
      JSON.stringify({ scopeOfWork: generatedScope }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-scope-of-work:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

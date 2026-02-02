import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const extractionTools = [
  {
    type: "function",
    function: {
      name: "extract_items",
      description: "Extract tasks, feedback, ideas, and follow-up items from a meeting transcript",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["task", "feedback", "idea", "follow_up"],
                  description: "The type of item extracted"
                },
                title: {
                  type: "string",
                  description: "A concise title for the item"
                },
                description: {
                  type: "string",
                  description: "A more detailed description if needed"
                },
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high"],
                  description: "Priority level for tasks"
                },
                sentiment: {
                  type: "string",
                  enum: ["positive", "negative", "neutral"],
                  description: "Sentiment for feedback items"
                },
                assignee_hint: {
                  type: "string",
                  description: "Name or role mentioned as responsible, if any"
                }
              },
              required: ["type", "title"]
            }
          }
        },
        required: ["items"]
      }
    }
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { transcript } = await req.json();

    if (!transcript || transcript.length < 20) {
      return new Response(
        JSON.stringify({ items: [], message: 'Transcript too short' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ items: [], error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracting items from transcript, length:', transcript.length);

    const systemPrompt = `You are an assistant that analyzes meeting transcripts and extracts actionable items.

Extract the following types of items:
1. **Tasks**: Action items that need to be done. Include priority if mentioned.
2. **Feedback**: Comments about work, processes, or people. Note the sentiment.
3. **Ideas**: Suggestions or proposals for improvements.
4. **Follow-ups**: Items that need to be revisited or checked on later.

Be concise but specific. Only extract items that are clearly mentioned or implied in the transcript.
If someone is mentioned as responsible for something, note their name in assignee_hint.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please analyze this meeting transcript and extract all relevant items:\n\n${transcript}` }
        ],
        tools: extractionTools,
        tool_choice: { type: "function", function: { name: "extract_items" } },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    
    // Extract items from tool call
    let items: unknown[] = [];
    
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        items = parsed.items || [];
      } catch (parseError) {
        console.error('Error parsing tool call arguments:', parseError);
      }
    }

    console.log(`Extracted ${items.length} items from transcript`);

    return new Response(
      JSON.stringify({ items }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Extraction error:', error);
    return new Response(
      JSON.stringify({ items: [], error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

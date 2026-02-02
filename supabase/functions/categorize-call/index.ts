import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, summary } = await req.json();
    
    if (!transcript) {
      return new Response(
        JSON.stringify({ error: 'Transcript is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('Categorizing call with AI...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are analyzing phone call transcripts for a roofing company called ROOF-ing Friend. 
            
Categorize each call into one of these categories:

1. **spam** - Unsolicited sales calls, telemarketers, people trying to sell services to the company, robocalls, wrong numbers, vague inquiries without proper introduction, OR calls where the caller didn't actually speak/participate in conversation
2. **prospect** - ONLY if BOTH conditions are met: (a) caller introduces themselves by name, AND (b) they are specifically asking about roofing services/quotes/pricing
3. **customer** - Existing customers calling about ongoing projects, follow-ups on work being done, complaints about service

STRICT RULES for "prospect":
- Must have caller's name clearly stated in the conversation
- Must express interest in getting roofing services (repairs, replacement, inspection, quotes, etc.)
- Must be a TWO-WAY conversation where the caller actively participates
- If caller doesn't give their name OR doesn't ask about services OR doesn't speak → NOT a prospect

STRICT RULES for "spam":
- If the transcript shows the caller didn't speak or participate → ALWAYS spam
- If only one person talking (typically your assistant) → spam
- Robocalls, voicemails, hang-ups → spam
- No name given, trying to sell TO the company, marketing calls → spam

Key indicators:
- Spam: Caller silent/didn't speak, one-sided conversation, no name given, trying to sell TO the company, marketing calls, robocalls, generic questions, wrong numbers
- Prospect: TWO-WAY dialogue + "Hi, my name is [NAME]" + "I need a roof repair/quote/inspection", clear service request with identification
- Customer: References to existing jobs, "you guys were supposed to", "my project", ongoing work discussions`
          },
          {
            role: "user",
            content: `Analyze this call transcript and summary:

TRANSCRIPT:
${transcript}

${summary ? `SUMMARY:\n${summary}` : ''}

Categorize this call.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "categorize_call",
              description: "Categorize the call based on the transcript",
              parameters: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    enum: ["spam", "prospect", "customer"],
                    description: "The category of the call"
                  },
                  confidence: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "Confidence level of the categorization"
                  },
                  reasoning: {
                    type: "string",
                    description: "Brief explanation of why this category was chosen"
                  }
                },
                required: ["category", "confidence", "reasoning"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "categorize_call" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log('Categorization result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in categorize-call function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

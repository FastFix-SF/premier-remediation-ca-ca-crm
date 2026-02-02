import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { scopeOfWork, clientName, propertyAddress, projectType } = await req.json();

    if (!scopeOfWork) {
      throw new Error('Scope of work is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Transform this technical scope of work into an engaging story-style description for a roofing project portfolio. The story should:

1. Sound like an exciting transformation narrative
2. Be written for public viewing (homeowners and potential customers)
3. Highlight the challenges overcome and benefits achieved
4. Use engaging, professional language
5. Keep the key technical details but present them in an accessible way
6. Focus on the customer experience and outcome

Project Details:
- Client: ${clientName || 'The homeowner'}
- Property: ${propertyAddress || 'A residential property'}
- Project Type: ${projectType || 'Roofing project'}

Technical Scope of Work:
${scopeOfWork}

Transform this into a compelling story (2-3 paragraphs) that would make other homeowners want to hire this roofing company. Start with the challenge or opportunity, describe the solution and process, and end with the successful outcome.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert storyteller specializing in home improvement narratives. Create engaging, professional stories that showcase successful roofing projects while maintaining credibility and highlighting technical expertise.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const storyDescription = data.choices[0].message.content;

    console.log('Story transformation completed successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      storyDescription,
      originalScope: scopeOfWork 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in transform-scope-to-story function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
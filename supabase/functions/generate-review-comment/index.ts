import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!openAIApiKey) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const { emotions, surpriseMe, projectInfo } = await req.json();

    let prompt: string;
    
    // Build project context if available
    let projectContext = '';
    if (projectInfo) {
      const details = [];
      if (projectInfo.name) details.push(`Project: ${projectInfo.name}`);
      if (projectInfo.address) details.push(`Location: ${projectInfo.address}`);
      if (projectInfo.projectType) details.push(`Type: ${projectInfo.projectType}`);
      if (projectInfo.roofType) details.push(`Roof: ${projectInfo.roofType}`);
      if (details.length > 0) {
        projectContext = `\n\nProject details: ${details.join(', ')}. Use these details naturally in the review if appropriate.`;
      }
    }
    
    if (surpriseMe) {
      prompt = `Generate a positive, authentic customer review for a roofing company called "Roofing Friend". 
      The review should be 2-3 sentences, feel genuine and personal, and focus on quality work, professionalism, 
      and customer satisfaction. Make it sound like a real homeowner wrote it.${projectContext}`;
    } else if (emotions && emotions.length > 0) {
      const emotionText = emotions.join(', ');
      prompt = `Generate a positive customer review for a roofing company called "Roofing Friend" using these emotions: ${emotionText}. 
      The review should be 2-3 sentences, incorporate the emotions naturally, and sound like a genuine homeowner's experience. 
      Focus on how the new roof made them feel and the quality of service.${projectContext}`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Either emotions array or surpriseMe flag is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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
            content: `You are a helpful assistant that generates authentic, positive customer reviews. 
            Keep reviews concise (2-3 sentences), genuine, and focused on real customer benefits.
            Avoid overly promotional language - make it sound like a real person wrote it.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate review');
    }

    const data = await response.json();
    const review = data.choices[0].message.content.trim();

    // Remove quotes if they wrap the entire review
    const cleanReview = review.replace(/^["']|["']$/g, '');

    return new Response(
      JSON.stringify({ review: cleanReview }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-review-comment function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
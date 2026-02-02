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

  let feedbackId: string | null = null;
  
  try {
    const body = await req.json();
    feedbackId = body.feedbackId;
    
    if (!feedbackId) {
      throw new Error('feedbackId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update status to analyzing
    await supabase
      .from('admin_feedback')
      .update({ suggestion_status: 'analyzing' })
      .eq('id', feedbackId);

    // Fetch the feedback
    const { data: feedback, error: fetchError } = await supabase
      .from('admin_feedback')
      .select('*')
      .eq('id', feedbackId)
      .single();

    if (fetchError) throw fetchError;

    // Parse selected element if it exists
    let selectedElement = null;
    if (feedback.selected_element) {
      try {
        selectedElement = typeof feedback.selected_element === 'string' 
          ? JSON.parse(feedback.selected_element) 
          : feedback.selected_element;
      } catch (e) {
        console.error('Failed to parse selected_element:', e);
      }
    }

    // Build context for AI
    const context = {
      feedback: feedback.feedback_text,
      selectedElement: selectedElement ? {
        selector: selectedElement.selector,
        text: selectedElement.text?.substring(0, 100),
        component: selectedElement.component,
      } : null,
    };

    // Call Lovable AI
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
            content: `You are an expert code analyzer helping identify and fix issues in a React/TypeScript admin dashboard. 
            
Your task is to analyze user feedback and suggest specific code changes.

Return a JSON object with this EXACT structure (no markdown, no extra text):
{
  "priority": "low" | "medium" | "high" | "critical",
  "category": "bug" | "ui" | "ux" | "performance" | "feature",
  "likelyFiles": ["file1.tsx", "file2.tsx"],
  "diagnosis": "Brief description of what's likely wrong",
  "suggestedFix": "Specific code changes or approach to fix the issue",
  "implementation": "Step-by-step implementation guide"
}`
          },
          {
            role: 'user',
            content: `Analyze this feedback and provide fix suggestions:

Feedback: "${context.feedback}"

${context.selectedElement ? `Selected Element:
- Selector: ${context.selectedElement.selector}
- Text content: "${context.selectedElement.text}"
${context.selectedElement.component ? `- Component: ${context.selectedElement.component}` : ''}` : 'No specific element was selected.'}

Provide actionable recommendations in the JSON format specified.`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const suggestion = aiData.choices[0].message.content;
    
    // Parse the JSON response
    let parsedSuggestion;
    try {
      // Remove markdown code blocks if present
      const cleanedSuggestion = suggestion.replace(/```json\n?|\n?```/g, '').trim();
      parsedSuggestion = JSON.parse(cleanedSuggestion);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', suggestion);
      // Fallback structure
      parsedSuggestion = {
        priority: 'medium',
        category: 'bug',
        likelyFiles: [],
        diagnosis: 'Failed to parse AI response',
        suggestedFix: suggestion,
        implementation: 'Please review the raw suggestion manually'
      };
    }

    // Update feedback with AI suggestion and auto-triage
    const { error: updateError } = await supabase
      .from('admin_feedback')
      .update({
        ai_suggestion: parsedSuggestion,
        ai_analyzed_at: new Date().toISOString(),
        suggestion_status: 'completed',
        fix_status: 'fix_ready',
        // Auto-triage based on AI analysis
        priority: parsedSuggestion.priority || 'medium',
        category: parsedSuggestion.category === 'bug' ? 'bug' : 
                  parsedSuggestion.category === 'feature' ? 'feature_request' : 
                  parsedSuggestion.category === 'ui' || parsedSuggestion.category === 'ux' ? 'improvement' : 
                  'uncategorized',
      })
      .eq('id', feedbackId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        suggestion: parsedSuggestion 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-feedback function:', error);
    
    // Try to update status to failed if we have the feedbackId
    if (feedbackId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('admin_feedback')
          .update({ suggestion_status: 'failed' })
          .eq('id', feedbackId);
      } catch (e) {
        console.error('Failed to update status to failed:', e);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

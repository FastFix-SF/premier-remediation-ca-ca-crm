import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { mrf_prospect_id, session_id, page_url, action, additional_data } = await req.json();

    if (!mrf_prospect_id || !session_id) {
      throw new Error('Missing required fields: mrf_prospect_id and session_id');
    }

    // Check if session exists
    const { data: existingSession } = await supabase
      .from('visitor_sessions')
      .select('*')
      .eq('mrf_prospect_id', mrf_prospect_id)
      .eq('session_id', session_id)
      .single();

    if (existingSession) {
      // Update existing session
      const { error: updateError } = await supabase
        .from('visitor_sessions')
        .update({
          page_views: existingSession.page_views + 1,
          total_time_seconds: existingSession.total_time_seconds + (additional_data?.time_spent || 0),
          session_data: {
            ...existingSession.session_data,
            last_page: page_url,
            last_action: action,
            browser_info: additional_data?.browser_info || {},
            timestamp: new Date().toISOString()
          },
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSession.id);

      if (updateError) {
        console.error('Error updating session:', updateError);
        throw updateError;
      }
    } else {
      // Create new session
      const { error: insertError } = await supabase
        .from('visitor_sessions')
        .insert({
          mrf_prospect_id,
          session_id,
          page_views: 1,
          total_time_seconds: additional_data?.time_spent || 0,
          session_data: {
            first_page: page_url,
            first_action: action,
            browser_info: additional_data?.browser_info || {},
            timestamp: new Date().toISOString()
          },
          last_activity: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating session:', insertError);
        throw insertError;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Visitor tracking updated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in track-visitor function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error),
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
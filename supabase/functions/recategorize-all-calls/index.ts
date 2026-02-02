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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting recategorization of all calls...');

    // Fetch all calls that have transcripts
    const { data: calls, error: fetchError } = await supabaseClient
      .from('call_logs')
      .select('id, bland_call_id, transcript, summary')
      .not('transcript', 'is', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching calls:', fetchError);
      throw fetchError;
    }

    if (!calls || calls.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No calls with transcripts found',
          processed: 0,
          total: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${calls.length} calls with transcripts to categorize`);

    let processedCount = 0;
    let errorCount = 0;
    const results = [];

    for (const call of calls) {
      try {
        console.log(`Categorizing call ${call.bland_call_id}...`);

        const categorizationResponse = await supabaseClient.functions.invoke('categorize-call', {
          body: {
            transcript: call.transcript,
            summary: call.summary
          }
        });

        if (categorizationResponse.error) {
          console.error(`Error categorizing call ${call.bland_call_id}:`, categorizationResponse.error);
          errorCount++;
          results.push({
            call_id: call.bland_call_id,
            success: false,
            error: categorizationResponse.error
          });
          continue;
        }

        const { category, confidence, reasoning } = categorizationResponse.data;

        // Update the call status
        const { error: updateError } = await supabaseClient
          .from('call_logs')
          .update({ status: category })
          .eq('id', call.id);

        if (updateError) {
          console.error(`Error updating call ${call.bland_call_id}:`, updateError);
          errorCount++;
          results.push({
            call_id: call.bland_call_id,
            success: false,
            error: updateError.message
          });
        } else {
          processedCount++;
          results.push({
            call_id: call.bland_call_id,
            success: true,
            category,
            confidence,
            reasoning
          });
          console.log(`Call ${call.bland_call_id} categorized as: ${category} (${confidence} confidence)`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Error processing call ${call.bland_call_id}:`, error);
        errorCount++;
        results.push({
          call_id: call.bland_call_id,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`Recategorization complete: ${processedCount} successful, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Recategorized ${processedCount} out of ${calls.length} calls`,
        processed: processedCount,
        errors: errorCount,
        total: calls.length,
        results: results.slice(0, 10) // Return first 10 results as sample
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recategorize-all-calls:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

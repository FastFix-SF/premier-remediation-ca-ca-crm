import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quote_request_id, action } = await req.json();

    if (!quote_request_id) {
      return new Response(
        JSON.stringify({ error: 'quote_request_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === 'calculate') {
      // Load all structures for this quote request
      const { data: structures, error: structuresError } = await supabase
        .from('roof_structures')
        .select('*')
        .eq('quote_request_id', quote_request_id)
        .eq('is_included', true)
        .order('structure_id');

      if (structuresError) {
        console.error('Error loading structures:', structuresError);
        return new Response(
          JSON.stringify({ error: 'Failed to load roof structures' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate totals using geodesic math
      const totals = {
        plan_area_sq_ft_total: structures?.reduce((sum, s) => sum + (s.area_sq_ft || 0), 0) || 0,
        surface_area_sq_ft_total: 0, // Will be calculated with pitch factor
        plan_squares: 0,
        surface_squares: 0,
        eave_lf_total: 0,
        rake_lf_total: 0,
        ridge_lf_total: 0,
        structures: structures || []
      };

      // Calculate derived values
      const pitchFactor = Math.sqrt(1 + Math.pow(4/12, 2)); // Default 4/12 pitch
      totals.surface_area_sq_ft_total = totals.plan_area_sq_ft_total * pitchFactor;
      totals.plan_squares = totals.plan_area_sq_ft_total / 100;
      totals.surface_squares = totals.surface_area_sq_ft_total / 100;

      // Basic linear feet calculation (simplified)
      totals.eave_lf_total = structures?.reduce((sum, s) => sum + (s.perimeter_ft || 0) * 0.6, 0) || 0;
      totals.rake_lf_total = structures?.reduce((sum, s) => sum + (s.perimeter_ft || 0) * 0.4, 0) || 0;

      return new Response(
        JSON.stringify(totals),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in roof-measurements function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
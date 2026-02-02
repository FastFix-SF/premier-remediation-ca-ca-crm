// Auto clock-out functionality is disabled.
// Employees must manually close their shifts and can submit edit requests if needed.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[auto-clockout] Function called but is disabled');

  return new Response(
    JSON.stringify({ 
      message: 'Auto clock-out is disabled. Employees must manually close their shifts.',
      disabled: true 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});

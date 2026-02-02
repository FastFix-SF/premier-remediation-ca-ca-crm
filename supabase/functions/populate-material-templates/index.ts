import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the complete materials from the source quote
    const { data: quoteData, error: quoteError } = await supabaseClient
      .from('quote_requests')
      .select('shingles_items, services_items, rf_items')
      .eq('id', 'd38f1c58-c166-4aad-8348-ad91c4c01b44')
      .single();

    if (quoteError) throw quoteError;

    // Delete existing templates
    await supabaseClient.from('material_templates').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert new templates
    const templates = [
      { category: 'shingles', items: quoteData.shingles_items || [] },
      { category: 'services', items: quoteData.services_items || [] },
      { category: 'other-materials', items: quoteData.rf_items || [] }
    ];

    const { error: insertError } = await supabaseClient
      .from('material_templates')
      .insert(templates);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, message: 'Material templates populated successfully' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

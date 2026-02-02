import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyMagicLinkRequest {
  token: string;
  proposalId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { token, proposalId }: VerifyMagicLinkRequest = await req.json();

    // Verify the magic link token
    const { data: magicLink, error: verifyError } = await supabase
      .from('proposal_magic_links')
      .select('*')
      .eq('token', token)
      .eq('proposal_id', proposalId)
      .gt('expires_at', new Date().toISOString())
      .is('used_at', null)
      .single();

    if (verifyError || !magicLink) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or expired magic link' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Mark the magic link as used
    await supabase
      .from('proposal_magic_links')  
      .update({ used_at: new Date().toISOString() })
      .eq('id', magicLink.id);

    // Fetch the proposal data
    const { data: proposal, error: proposalError } = await supabase
      .from('project_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Proposal not found' 
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Get or create user account for the customer
    const customerEmail = magicLink.email;
    
    // Try to sign up the user (will fail silently if user already exists)
    await supabase.auth.admin.createUser({
      email: customerEmail,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        created_via_magic_link: true,
        proposal_access: true
      }
    });

    // Generate a session for the user
    const { data: session, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: customerEmail,
    });

    if (sessionError) {
      console.error('Error generating session:', sessionError);
      throw new Error('Failed to create session');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        proposal: proposal,
        email: customerEmail,
        authUrl: session.properties?.action_link,
        message: 'Magic link verified successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in verify-proposal-magic-link:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
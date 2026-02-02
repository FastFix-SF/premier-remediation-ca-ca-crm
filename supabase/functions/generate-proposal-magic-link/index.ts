import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MagicLinkRequest {
  proposalId: string;
  customerEmail: string;
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

    const { proposalId, customerEmail }: MagicLinkRequest = await req.json();

    // Generate a secure token for the magic link
    const magicToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');

    // Store the magic link in the database
    const { error: insertError } = await supabase
      .from('proposal_magic_links')
      .insert({
        proposal_id: proposalId,
        email: customerEmail,
        token: magicToken,
      });

    if (insertError) {
      console.error('Error creating magic link:', insertError);
      throw new Error('Failed to create magic link');
    }

    // Get proposal details for email
    const { data: proposal, error: proposalError } = await supabase
      .from('project_proposals')
      .select('proposal_number, property_address, client_name')
      .eq('id', proposalId)
      .single();

    if (proposalError) {
      console.error('Error fetching proposal:', proposalError);
      throw new Error('Failed to fetch proposal details');
    }

    // Generate the magic link URL
    const baseUrl = Deno.env.get('SITE_URL') || 'https://roofingfriend.com';
    const magicLinkUrl = `${baseUrl}/proposals/${magicToken}`;

    // Send email with magic link using Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    const { error: emailError } = await resend.emails.send({
      from: 'Roofing Friend <proposals@roofingfriend.com>',
      to: [customerEmail],
      subject: `Your Roofing Proposal ${proposal.proposal_number} is Ready`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Your Roofing Proposal is Ready!</h1>
          
          <p>Hello ${proposal.client_name},</p>
          
          <p>Your roofing proposal for <strong>${proposal.property_address}</strong> is now ready for review.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 15px 0; font-weight: bold;">Proposal Number: ${proposal.proposal_number}</p>
            <a href="${magicLinkUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              View Your Proposal
            </a>
          </div>
          
          <p>This secure link will automatically sign you in to view your proposal. The link expires in 7 days.</p>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>The Roofing Friend Team</p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw new Error('Failed to send email');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Magic link sent successfully',
        magicLinkUrl // Include for testing purposes
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in generate-proposal-magic-link:', error);
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
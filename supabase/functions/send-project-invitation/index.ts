
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  projectId: string;
  customerEmail: string;
  projectName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const { projectId, customerEmail, projectName }: InvitationRequest = await req.json();

    // Generate invitation link
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app') || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/project-invitation?project=${projectId}&email=${encodeURIComponent(customerEmail)}`;

    // Send invitation email
    await resend.emails.send({
      from: 'Roofing Friend <noreply@resend.dev>',
      to: [customerEmail],
      subject: `You've been invited to view project: ${projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Roofing Friend</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Project Portal Invitation</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">You've been invited to view your project!</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Hello! You've been invited to access the project portal for <strong>${projectName}</strong>. 
              Through this portal, you'll be able to:
            </p>
            
            <ul style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 20px 0;">
              <li>View real-time project photos and progress updates</li>
              <li>Track project milestones and timeline</li>
              <li>Download and share photos on social media</li>
              <li>Communicate directly with your project team</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" 
                 style="background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Access Your Project Portal
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you already have an account, simply sign in. If you're new, you'll be guided through creating your account.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              This invitation was sent by your contractor through Roofing Friend.<br>
              If you have any questions, please contact your project manager directly.
            </p>
          </div>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Invitation sent successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error) {
    console.error('Error sending invitation:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send invitation' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);

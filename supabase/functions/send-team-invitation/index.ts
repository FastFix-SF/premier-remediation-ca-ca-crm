import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  full_name: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { 
      email, 
      full_name, 
      role 
    }: InvitationRequest = await req.json();

    console.log(`Creating team invitation for: ${email} with role: ${role}`);

    // Generate secure invitation token
    const inviteToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // UPSERT team directory entry with invitation token
    const { error: upsertError } = await supabaseAdmin
      .from('team_directory')
      .upsert({
        email: email,
        full_name: full_name,
        role: role,
        status: 'invited',
        invited_at: new Date().toISOString(),
        invite_token: inviteToken,
        token_expires_at: expiresAt.toISOString(),
        user_id: null // Will be updated when user accepts invitation
      }, {
        onConflict: 'email',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error("Error upserting team directory:", upsertError);
      throw upsertError;
    }

    // Generate invitation URL dynamically based on environment
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://roofing-friend-panels-shop.lovable.app';
    const invitationUrl = `${origin}/accept-invite/${inviteToken}`;
    
    console.log(`Invitation token generated successfully for: ${email}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Invitation link generated successfully",
      invitationUrl: invitationUrl,
      expiresAt: expiresAt.toISOString()
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-team-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to send team invitation"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
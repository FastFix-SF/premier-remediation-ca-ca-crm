import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, message, senderName, portalAccessId } = await req.json();

    if (!projectId || !message?.trim()) {
      return new Response(JSON.stringify({ error: "Missing projectId or message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[client-portal-send-message] Sending message for project:", projectId);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify active portal access
    const { data: portal } = await supabase
      .from("client_portal_access")
      .select("id, is_active, project_id")
      .eq("id", portalAccessId)
      .eq("is_active", true)
      .maybeSingle();

    if (!portal || portal.project_id !== projectId) {
      return new Response(JSON.stringify({ error: "Invalid portal access" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get project info for sender name fallback
    const { data: project } = await supabase
      .from("projects")
      .select("client_name, name")
      .eq("id", projectId)
      .single();

    const finalSenderName = senderName || project?.client_name || "Client";

    // Insert message into team_chats with special channel_type
    const { data, error } = await supabase
      .from("team_chats")
      .insert({
        channel_type: "project",
        channel_id: projectId,
        content: message.trim(),
        sender_name: `[Client] ${finalSenderName}`,
        sender_id: null, // No auth user for client portal
      })
      .select("id, content, sender_name, created_at")
      .single();

    if (error) {
      console.error("[client-portal-send-message] Insert error:", error);
      return new Response(JSON.stringify({ error: "Failed to send message" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[client-portal-send-message] Message sent successfully:", data.id);

    return new Response(JSON.stringify({ 
      success: true,
      message: {
        id: data.id,
        content: data.content,
        sender_name: data.sender_name,
        created_at: data.created_at,
        is_client: true,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[client-portal-send-message] Error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

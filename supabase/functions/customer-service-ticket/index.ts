import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CustomerTicketRequest = {
  token?: string;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let token: string | undefined;

    // Accept token via JSON body or query param
    if (req.headers.get("content-type")?.includes("application/json")) {
      const body: CustomerTicketRequest = await req.json().catch(() => ({}));
      token = body?.token;
    }

    if (!token) {
      const url = new URL(req.url);
      token = url.searchParams.get("token") ?? undefined;
    }

    if (!token || token.length < 16) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("customer-service-ticket: fetching ticket for token", token.slice(0, 8) + "...");

    const { data: ticket, error } = await supabase
      .from("service_tickets")
      .select(
        [
          "id",
          "title",
          "ticket_number",
          "status",
          "scheduled_date",
          "scheduled_time",
          "duration_hours",
          "service_address",
          "service_city",
          "service_state",
          "service_zip",
          "description",
          "service_notes",
          "updated_at",
        ].join(",")
      )
      .eq("customer_access_token", token)
      .maybeSingle();

    if (error) {
      console.error("customer-service-ticket: query error", error);
      return new Response(JSON.stringify({ error: "Failed to load ticket" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ticket) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(ticket), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in customer-service-ticket:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

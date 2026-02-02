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
    const { slug } = await req.json().catch(() => ({}));
    
    if (!slug || typeof slug !== "string") {
      return new Response(JSON.stringify({ error: "Missing slug parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[client-portal-bootstrap] Looking up portal for slug:", slug);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1) Validate portal access by url_slug first, then fallback to access_token
    let { data: portal } = await supabase
      .from("client_portal_access")
      .select("id, client_id, project_id, is_active, expires_at, url_slug")
      .eq("url_slug", slug)
      .maybeSingle();

    if (!portal) {
      // Fallback to access_token
      const { data: tokenPortal } = await supabase
        .from("client_portal_access")
        .select("id, client_id, project_id, is_active, expires_at, url_slug")
        .eq("access_token", slug)
        .maybeSingle();
      portal = tokenPortal;
    }

    if (!portal) {
      console.log("[client-portal-bootstrap] No portal found for slug:", slug);
      return new Response(JSON.stringify({ error: "Invalid or expired portal link" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!portal.is_active) {
      return new Response(JSON.stringify({ error: "This portal access has been disabled" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (portal.expires_at && new Date(portal.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "This portal link has expired" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Update last_accessed_at
    await supabase
      .from("client_portal_access")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("id", portal.id);

    // 3) Load project info
    const projectId = portal.project_id;
    
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(`
        id, name, address, status, project_type, start_date, estimated_end_date,
        client_name, client_phone, customer_email, project_manager_id
      `)
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      console.log("[client-portal-bootstrap] Project not found:", projectId);
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[client-portal-bootstrap] Loading portal data for project:", project.name);

    // 4) Load proposals from project_proposals
    const { data: proposals } = await supabase
      .from("project_proposals")
      .select("id, proposal_number, title, status, total_amount, proposal_date, valid_until, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    // 5) Load contracts from client_contracts
    const { data: contracts } = await supabase
      .from("client_contracts")
      .select("id, title, contract_number, file_url, status, start_date, end_date, total_value, signed_at, signed_by_name, created_at")
      .eq("project_id", projectId)
      .neq("status", "pending")
      .order("created_at", { ascending: false });

    // 6) Load project tasks (visible to client only)
    const { data: tasksData } = await supabase
      .from("project_tasks")
      .select("id, title, description, status, progress_percent, due_date, completed_at, screenshots, created_at")
      .eq("project_id", projectId)
      .eq("visible_to_client", true)
      .order("created_at", { ascending: false });

    const tasks = (tasksData ?? []).map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      progress_percent: t.progress_percent ?? 0,
      due_date: t.due_date,
      completed_at: t.completed_at,
      screenshots: t.screenshots ?? [],
      created_at: t.created_at,
    }));

    // 7) Load invoices
    const { data: invoices } = await supabase
      .from("invoices")
      .select("id, invoice_number, title, status, total, balance_due, due_date, paid_date, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    // Calculate financial summary
    const totalInvoiced = (invoices ?? []).reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
    const totalPaid = (invoices ?? [])
      .filter((inv: any) => inv.status === 'paid')
      .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
    const outstandingBalance = totalInvoiced - totalPaid;

    // 8) Load project updates
    const { data: updatesData } = await supabase
      .from("client_updates")
      .select("id, title, content, media_urls, update_type, requires_acknowledgment, acknowledged_at, created_by, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(20);

    const updates = updatesData ?? [];

    // 9) Load project manager info
    let projectManager = null;
    if (project.project_manager_id) {
      const { data: pmData } = await supabase
        .from("team_directory")
        .select("user_id, full_name, email, phone_number, role, avatar_url")
        .eq("user_id", project.project_manager_id)
        .single();

      if (pmData) {
        projectManager = {
          id: pmData.user_id,
          name: pmData.full_name,
          email: pmData.email,
          phone: pmData.phone_number,
          role: pmData.role,
          avatar_url: pmData.avatar_url,
        };
      }
    }

    // 10) Load schedules from job_schedules
    const today = new Date().toISOString().split('T')[0];
    const { data: schedules } = await supabase
      .from("job_schedules")
      .select("id, job_name, start_time, end_time, status, location, description, created_at")
      .eq("project_id", projectId)
      .gte("start_time", today)
      .neq("status", "cancelled")
      .order("start_time", { ascending: true })
      .limit(20);

    // 11) Load team chat messages for the project
    const { data: messages } = await supabase
      .from("team_chats")
      .select("id, content, sender_id, sender_name, created_at")
      .eq("channel_type", "project")
      .eq("channel_id", projectId)
      .order("created_at", { ascending: true })
      .limit(100);

    // 12) Load work orders
    const { data: workOrders } = await supabase
      .from("work_orders")
      .select("id, work_order_number, title, status, service_start_date, description, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    // 13) Load change orders
    const { data: changeOrders } = await supabase
      .from("change_orders")
      .select("id, co_number, title, status, grand_total, date, description, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    // 14) Load daily logs
    const { data: dailyLogs } = await supabase
      .from("daily_logs")
      .select("id, log_date, status, time_in, time_out, tasks_performed, site_condition, weather_data, created_at")
      .eq("project_id", projectId)
      .order("log_date", { ascending: false })
      .limit(10);

    // 15) Load project documents
    const { data: documents } = await supabase
      .from("project_documents")
      .select("id, file_name, file_url, file_size, file_type, category, uploaded_at")
      .eq("project_id", projectId)
      .order("uploaded_at", { ascending: false });

    // 16) Load estimates
    const { data: estimates } = await supabase
      .from("project_estimates")
      .select("id, estimate_number, title, status, grand_total, created_at, expiration_date")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    // Build response
    const response = {
      portalAccessId: portal.id,
      urlSlug: portal.url_slug,
      project: {
        id: project.id,
        name: project.name,
        address: project.address,
        status: project.status,
        project_type: project.project_type,
        start_date: project.start_date,
        estimated_end_date: project.estimated_end_date,
        client_name: project.client_name,
        client_phone: project.client_phone,
        customer_email: project.customer_email,
      },
      proposals: proposals ?? [],
      contracts: contracts ?? [],
      tasks,
      invoices: invoices ?? [],
      financialSummary: {
        totalInvoiced,
        totalPaid,
        outstandingBalance,
        currency: 'USD'
      },
      updates,
      projectManager,
      schedules: schedules ?? [],
      messages: messages ?? [],
      workOrders: workOrders ?? [],
      changeOrders: changeOrders ?? [],
      dailyLogs: dailyLogs ?? [],
      documents: documents ?? [],
      estimates: estimates ?? [],
    };

    console.log("[client-portal-bootstrap] Successfully loaded portal data");

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[client-portal-bootstrap] Error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

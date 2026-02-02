import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive tools covering all major database tables with CREATE, UPDATE, READ capabilities
const tools = [
  // ===== READ TOOLS =====
  {
    type: "function",
    function: {
      name: "query_projects",
      description: "Get information about roofing projects including status, location, team assignments, budgets, timelines, and details",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by project status (active, completed, on-hold, etc.)" },
          search: { type: "string", description: "Search by project name or address" },
          limit: { type: "number", description: "Maximum number of projects to return (default 20)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_project_financials",
      description: "Get detailed financial breakdown for a specific project including invoices, payments, costs, and profitability.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project UUID" },
          project_name: { type: "string", description: "Project name to search for" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_employees",
      description: "Get information about team members including names, roles, contact info, status, and language preferences",
      parameters: {
        type: "object",
        properties: {
          role: { type: "string", description: "Filter by employee role (owner, admin, leader, contributor, sales)" },
          status: { type: "string", description: "Filter by status (active, invited, pending_approval, inactive)" },
          search: { type: "string", description: "Search by name or email" },
          limit: { type: "number", description: "Maximum number of employees to return (default 30)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_timesheets",
      description: "Get timesheet data including clock in/out times, hours worked, overtime, breaks, and employee activity",
      parameters: {
        type: "object",
        properties: {
          employee_id: { type: "string", description: "Filter by specific employee UUID" },
          start_date: { type: "string", description: "Start date for timesheet range (YYYY-MM-DD)" },
          end_date: { type: "string", description: "End date for timesheet range (YYYY-MM-DD)" },
          limit: { type: "number", description: "Maximum number of records to return (default 50)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_schedules",
      description: "Get job schedules and shift assignments including dates, times, locations, assigned employees, and confirmation status. Use this for 'today', 'this week', 'tomorrow' questions.",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "Start date for schedule range (YYYY-MM-DD). Use today's date for 'today' questions." },
          end_date: { type: "string", description: "End date for schedule range (YYYY-MM-DD)" },
          status: { type: "string", description: "Filter by schedule status (scheduled, in_progress, completed, cancelled)" },
          limit: { type: "number", description: "Maximum number of schedules to return (default 30)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_leads",
      description: "Get information about leads and potential customers including contact info, status, source, project type, and qualification data",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by lead status (new, contacted, qualified, proposal, won, lost)" },
          source: { type: "string", description: "Filter by lead source (website, referral, social, etc.)" },
          search: { type: "string", description: "Search by name, email, or phone" },
          limit: { type: "number", description: "Maximum number of leads to return (default 30)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_quotes",
      description: "Get quote requests and proposals including customer details, project requirements, pricing, and roof specifications",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by quote status (new, in_progress, sent, approved, declined)" },
          search: { type: "string", description: "Search by customer name, email, or address" },
          limit: { type: "number", description: "Maximum number of quotes to return (default 30)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_invoices",
      description: "Get invoice data including amounts, payment status, due dates, project associations, and payment history",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by invoice status (draft, sent, paid, overdue)" },
          project_id: { type: "string", description: "Filter by specific project UUID" },
          limit: { type: "number", description: "Maximum number of invoices to return (default 30)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_materials",
      description: "Get material inventory, project material assignments, costs, quantities, and categories",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Filter by specific project UUID" },
          category: { type: "string", description: "Filter by material category" },
          search: { type: "string", description: "Search by material name or description" },
          limit: { type: "number", description: "Maximum number of materials to return (default 30)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_time_clock",
      description: "Get real-time clock-in/out status for employees currently working. Use this to answer 'who is clocked in now' or 'who is working' questions.",
      parameters: {
        type: "object",
        properties: {
          clocked_in_only: { type: "boolean", description: "If true, only return currently clocked-in employees (default: true)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_project_team",
      description: "Get project team assignments showing which employees are assigned to which projects",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Filter by specific project UUID" },
          user_id: { type: "string", description: "Filter by specific employee UUID" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_updates",
      description: "Get team updates, announcements, and company-wide communications",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Maximum number of updates to return (default 10)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_crm_progress",
      description: "Get CRM pipeline data showing customer journey stages, deal progress, and workflow phases",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by progress status (active, completed, on_hold)" },
          limit: { type: "number", description: "Maximum number of records to return (default 20)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_stats",
      description: "Get aggregate statistics and counts including total projects, active employees, pending leads, revenue totals, etc. Use this for 'how many' questions.",
      parameters: {
        type: "object",
        properties: {
          stat_type: { 
            type: "string", 
            description: "Type of statistic (projects, employees, leads, quotes, invoices, revenue, hours_worked)" 
          },
          start_date: { type: "string", description: "Start date for time-based stats (YYYY-MM-DD)" },
          end_date: { type: "string", description: "End date for time-based stats (YYYY-MM-DD)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_dashboard_stats",
      description: "Get aggregate dashboard statistics - projects, revenue, leads, etc. Use for overall business metrics.",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", description: "Time period: today, this_week, this_month, this_year" }
        }
      }
    }
  },
  // ===== CREATE TOOLS =====
  {
    type: "function",
    function: {
      name: "create_lead",
      description: "Create a new lead/customer in the CRM. Ask the user for required info if not provided.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Lead's full name" },
          email: { type: "string", description: "Lead's email" },
          phone: { type: "string", description: "Lead's phone number" },
          address: { type: "string", description: "Property address" },
          project_type: { type: "string", description: "Type: residential-installation, commercial, repair" },
          source: { type: "string", description: "Lead source: website, referral, social, phone" },
          notes: { type: "string", description: "Additional notes" }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_project",
      description: "Create a new roofing project in the system",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Project name" },
          property_address: { type: "string", description: "Project address" },
          customer_name: { type: "string", description: "Customer name" },
          customer_email: { type: "string", description: "Customer email" },
          customer_phone: { type: "string", description: "Customer phone" },
          status: { type: "string", description: "Status: pending, active, in_progress, completed" }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_schedule",
      description: "Create a new job schedule/assignment for the team",
      parameters: {
        type: "object",
        properties: {
          job_name: { type: "string", description: "Job/task name" },
          location: { type: "string", description: "Job location" },
          start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
          start_time: { type: "string", description: "Start time (HH:MM)" },
          end_time: { type: "string", description: "End time (HH:MM)" },
          assigned_to: { type: "string", description: "Employee name to assign" },
          priority: { type: "string", description: "Priority: low, medium, high" }
        },
        required: ["job_name", "start_date"]
      }
    }
  },
  // ===== UPDATE TOOLS =====
  {
    type: "function",
    function: {
      name: "update_lead_status",
      description: "Update a lead's status in the CRM pipeline. You can specify either lead_name OR lead_id. Using lead_name is preferred as it's more reliable.",
      parameters: {
        type: "object",
        properties: {
          lead_name: { type: "string", description: "The lead's name (preferred - will search and find the exact match)" },
          lead_id: { type: "string", description: "The lead's UUID (optional - use lead_name instead when possible)" },
          new_status: { 
            type: "string", 
            enum: ["new", "contacted", "qualified", "ready_to_quote", "quoted", "proposal_sent", "won", "lost", "paid"],
            description: "The new status to set for the lead"
          }
        },
        required: ["new_status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_project_status",
      description: "Update a project's status in the system",
      parameters: {
        type: "object",
        properties: {
          project_name: { type: "string", description: "Project name to find" },
          project_id: { type: "string", description: "Project UUID (optional)" },
          new_status: { 
            type: "string", 
            enum: ["pending", "scheduled", "active", "in_progress", "completed", "on_hold", "cancelled"],
            description: "New status"
          }
        },
        required: ["new_status"]
      }
    }
  }
];

async function executeToolCall(toolName: string, args: any, supabase: any) {
  console.log(`Executing tool: ${toolName} with args:`, args);
  
  try {
    switch (toolName) {
      // ===== READ TOOLS =====
      case "query_projects": {
        let query = supabase.from('projects').select('id, name, status, property_address, created_at, updated_at, customer_name, customer_email, customer_phone');
        if (args.status) query = query.eq('status', args.status);
        if (args.search) query = query.or(`name.ilike.%${args.search}%,property_address.ilike.%${args.search}%`);
        query = query.order('created_at', { ascending: false }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        return { projects: data, count: data.length };
      }
      
      case "get_project_financials": {
        let projectData;
        
        if (args.project_id) {
          const { data } = await supabase.from('projects').select('*').eq('id', args.project_id).single();
          projectData = data;
        } else if (args.project_name) {
          const { data } = await supabase.from('projects').select('*').ilike('name', `%${args.project_name}%`).limit(1).single();
          projectData = data;
        }
        
        if (!projectData) return { error: "Project not found" };
        
        // Get invoices for this project
        const { data: invoices } = await supabase.from('invoices')
          .select('id, invoice_number, total_amount, balance_due, status, due_date, paid_at')
          .eq('project_id', projectData.id);
        
        // Get material costs
        const { data: materials } = await supabase.from('project_materials')
          .select('id, material_name, quantity, unit_cost, total_cost')
          .eq('project_id', projectData.id);
        
        const totalInvoiced = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
        const totalPaid = invoices?.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
        const totalDue = invoices?.reduce((sum, inv) => sum + (inv.balance_due || 0), 0) || 0;
        const materialCost = materials?.reduce((sum, m) => sum + (m.total_cost || 0), 0) || 0;
        
        return {
          project: projectData,
          financials: {
            total_invoiced: totalInvoiced,
            total_paid: totalPaid,
            total_due: totalDue,
            material_cost: materialCost,
            profit: totalPaid - materialCost,
            profit_margin: totalPaid > 0 ? ((totalPaid - materialCost) / totalPaid * 100).toFixed(1) : 0
          },
          invoices: invoices || [],
          materials: materials || []
        };
      }
      
      case "query_employees": {
        let query = supabase.from('team_directory').select('user_id, email, full_name, role, status, language, last_login_at, created_at');
        if (args.role) query = query.eq('role', args.role);
        if (args.status) query = query.eq('status', args.status);
        if (args.search) query = query.or(`full_name.ilike.%${args.search}%,email.ilike.%${args.search}%`);
        query = query.order('full_name', { ascending: true }).limit(args.limit || 30);
        const { data, error } = await query;
        if (error) throw error;
        return { employees: data, count: data.length };
      }
      
      case "query_timesheets": {
        let query = supabase.from('time_clock').select('id, user_id, employee_name, clock_in, clock_out, total_hours, break_time_minutes, overtime_hours, location, project_name, notes, created_at');
        if (args.employee_id) query = query.eq('user_id', args.employee_id);
        if (args.start_date) query = query.gte('clock_in', args.start_date);
        if (args.end_date) query = query.lte('clock_in', args.end_date + 'T23:59:59');
        query = query.order('clock_in', { ascending: false }).limit(args.limit || 50);
        const { data, error } = await query;
        if (error) throw error;
        
        // Calculate total hours
        const totalHours = data.reduce((sum, entry) => sum + (entry.total_hours || 0), 0);
        
        return { timesheets: data, count: data.length, total_hours: totalHours };
      }
      
      case "query_schedules": {
        let query = supabase.from('job_schedules').select('id, job_name, start_time, end_time, location, description, status, priority, assigned_users, assignment_status');
        if (args.start_date) query = query.gte('start_time', args.start_date);
        if (args.end_date) query = query.lte('start_time', args.end_date + 'T23:59:59');
        if (args.status) query = query.eq('status', args.status);
        query = query.order('start_time', { ascending: true }).limit(args.limit || 30);
        const { data, error } = await query;
        if (error) throw error;
        
        const today = new Date().toISOString().split('T')[0];
        return { schedules: data, count: data.length, today };
      }
      
      case "query_leads": {
        let query = supabase.from('leads').select('id, name, email, phone, status, source, project_type, address, notes, created_at');
        if (args.status) query = query.eq('status', args.status);
        if (args.source) query = query.eq('source', args.source);
        if (args.search) query = query.or(`name.ilike.%${args.search}%,email.ilike.%${args.search}%,phone.ilike.%${args.search}%`);
        query = query.order('created_at', { ascending: false }).limit(args.limit || 30);
        const { data, error } = await query;
        if (error) throw error;
        return { leads: data, count: data.length };
      }
      
      case "query_quotes": {
        let query = supabase.from('quote_requests').select('id, name, email, phone, property_address, project_type, property_type, timeline, status, notes, created_at');
        if (args.status) query = query.eq('status', args.status);
        if (args.search) query = query.or(`name.ilike.%${args.search}%,email.ilike.%${args.search}%,property_address.ilike.%${args.search}%`);
        query = query.order('created_at', { ascending: false }).limit(args.limit || 30);
        const { data, error } = await query;
        if (error) throw error;
        return { quotes: data, count: data.length };
      }
      
      case "query_invoices": {
        let query = supabase.from('invoices').select('id, invoice_number, customer_name, project_name, total_amount, balance_due, status, due_date, created_at');
        if (args.status) query = query.eq('status', args.status);
        if (args.project_id) query = query.eq('project_id', args.project_id);
        query = query.order('created_at', { ascending: false }).limit(args.limit || 30);
        const { data, error } = await query;
        if (error) throw error;
        
        const totalAmount = data.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const totalDue = data.reduce((sum, inv) => sum + (inv.balance_due || 0), 0);
        
        return { invoices: data, count: data.length, total_amount: totalAmount, total_due: totalDue };
      }
      
      case "query_materials": {
        let query = supabase.from('materials').select('id, name, category, unit, total, status, image_url, show_in_app');
        if (args.category) query = query.eq('category', args.category);
        if (args.search) query = query.ilike('name', `%${args.search}%`);
        query = query.order('name', { ascending: true }).limit(args.limit || 30);
        const { data, error } = await query;
        if (error) throw error;
        return { materials: data, count: data.length };
      }
      
      case "query_time_clock": {
        let query = supabase.from('time_clock')
          .select('id, user_id, employee_name, employee_role, clock_in, clock_out, notes')
          .is('clock_out', null)
          .order('clock_in', { ascending: false });
        
        const { data, error } = await query;
        if (error) throw error;
        
        return { clocked_in: data, count: data.length };
      }
      
      case "query_project_team": {
        let query = supabase.from('project_team_assignments').select('project_id, user_id, assigned_at');
        if (args.project_id) query = query.eq('project_id', args.project_id);
        if (args.user_id) query = query.eq('user_id', args.user_id);
        const { data, error } = await query;
        if (error) throw error;
        return { assignments: data, count: data.length };
      }
      
      case "query_updates": {
        let query = supabase.from('team_updates')
          .select('id, title, content, created_by, background_color, created_at')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(args.limit || 10);
        const { data, error } = await query;
        if (error) throw error;
        return { updates: data, count: data.length };
      }
      
      case "query_crm_progress": {
        let query = supabase.from('crm_customer_progress')
          .select('id, customer_id, workflow_id, current_phase_id, progress_percentage, status, started_at, updated_at');
        if (args.status) query = query.eq('status', args.status);
        query = query.order('updated_at', { ascending: false }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        return { crm_progress: data, count: data.length };
      }
      
      case "query_stats": {
        const results: any = {};
        
        if (!args.stat_type || args.stat_type === 'projects') {
          const { count: projectCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
          results.total_projects = projectCount;
          
          const { count: activeProjects } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active');
          results.active_projects = activeProjects;
        }
        
        if (!args.stat_type || args.stat_type === 'employees') {
          const { count: employeeCount } = await supabase.from('team_directory').select('*', { count: 'exact', head: true }).eq('status', 'active');
          results.total_employees = employeeCount;
        }
        
        if (!args.stat_type || args.stat_type === 'leads') {
          const { count: leadCount } = await supabase.from('leads').select('*', { count: 'exact', head: true });
          results.total_leads = leadCount;
          
          const { count: newLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new');
          results.new_leads = newLeads;
        }
        
        if (!args.stat_type || args.stat_type === 'quotes') {
          const { count: quoteCount } = await supabase.from('quote_requests').select('*', { count: 'exact', head: true });
          results.total_quotes = quoteCount;
        }
        
        if (!args.stat_type || args.stat_type === 'invoices') {
          const { data: invoices } = await supabase.from('invoices').select('total_amount, balance_due, status');
          const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
          const totalDue = invoices?.reduce((sum, inv) => sum + (inv.balance_due || 0), 0) || 0;
          results.total_revenue = totalRevenue;
          results.outstanding_balance = totalDue;
        }
        
        return { statistics: results };
      }
      
      case "get_dashboard_stats": {
        const results: any = {};
        
        // Project counts
        const { count: totalProjects } = await supabase.from('projects').select('*', { count: 'exact', head: true });
        const { count: activeProjects } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active');
        const { count: completedProjects } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'completed');
        
        // Lead counts
        const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });
        const { count: newLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new');
        
        // Invoice totals
        const { data: invoices } = await supabase.from('invoices').select('total_amount, balance_due, status');
        const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
        const totalDue = invoices?.reduce((sum, inv) => sum + (inv.balance_due || 0), 0) || 0;
        const paidInvoices = invoices?.filter(i => i.status === 'paid').length || 0;
        
        // Employee count
        const { count: totalEmployees } = await supabase.from('team_directory').select('*', { count: 'exact', head: true }).eq('status', 'active');
        
        results.stats = {
          projects: { total: totalProjects, active: activeProjects, completed: completedProjects },
          leads: { total: totalLeads, new: newLeads },
          revenue: { total: totalRevenue, outstanding: totalDue, paid_invoices: paidInvoices },
          team: { total: totalEmployees }
        };
        
        return results;
      }
      
      // ===== CREATE TOOLS =====
      case "create_lead": {
        if (!args.name) {
          return { 
            success: false,
            error: "Please provide at least the lead's name to create a new lead."
          };
        }
        
        const { data, error } = await supabase.from('leads').insert({
          name: args.name,
          email: args.email || null,
          phone: args.phone || null,
          address: args.address || null,
          project_type: args.project_type || 'residential-installation',
          source: args.source || 'manual',
          status: 'new',
          notes: args.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).select().single();
        
        if (error) {
          console.error('Error creating lead:', error);
          return { success: false, error: error.message };
        }
        
        return { 
          success: true, 
          lead: data, 
          message: `Lead "${args.name}" created successfully!`
        };
      }
      
      case "create_project": {
        if (!args.name) {
          return { 
            success: false,
            error: "Please provide at least a project name to create a new project."
          };
        }
        
        const { data, error } = await supabase.from('projects').insert({
          name: args.name,
          property_address: args.property_address || null,
          customer_name: args.customer_name || null,
          customer_email: args.customer_email || null,
          customer_phone: args.customer_phone || null,
          status: args.status || 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).select().single();
        
        if (error) {
          console.error('Error creating project:', error);
          return { success: false, error: error.message };
        }
        
        return { 
          success: true, 
          project: data, 
          message: `Project "${args.name}" created successfully!`
        };
      }
      
      case "create_schedule": {
        if (!args.job_name || !args.start_date) {
          return { 
            success: false,
            error: "Please provide at least the job name and start date to create a schedule."
          };
        }
        
        const startDateTime = new Date(`${args.start_date}T${args.start_time || '09:00'}:00`);
        const endDateTime = new Date(`${args.start_date}T${args.end_time || '17:00'}:00`);
        
        const { data, error } = await supabase.from('job_schedules').insert({
          job_name: args.job_name,
          location: args.location || null,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: 'scheduled',
          priority: args.priority || 'medium',
          assigned_users: args.assigned_to ? [{ name: args.assigned_to }] : [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).select().single();
        
        if (error) {
          console.error('Error creating schedule:', error);
          return { success: false, error: error.message };
        }
        
        return { 
          success: true, 
          schedule: data, 
          message: `Job "${args.job_name}" scheduled for ${args.start_date}!`
        };
      }
      
      // ===== UPDATE TOOLS =====
      case "update_lead_status": {
        console.log(`Updating lead to status: ${args.new_status}`, { lead_name: args.lead_name, lead_id: args.lead_id });
        
        let leadData;
        let leadId = args.lead_id;
        
        // If lead_name is provided, search for the lead first
        if (args.lead_name) {
          console.log(`Searching for lead by name: ${args.lead_name}`);
          const { data: searchResults, error: searchError } = await supabase
            .from('leads')
            .select('id, name, email, status')
            .ilike('name', `%${args.lead_name}%`)
            .limit(1);
          
          if (searchError) {
            console.error('Error searching for lead:', searchError);
            return { success: false, error: `Error searching for lead: ${searchError.message}` };
          }
          
          if (!searchResults || searchResults.length === 0) {
            console.error('No lead found with name:', args.lead_name);
            return { success: false, error: `No lead found with name "${args.lead_name}". Please check the spelling.` };
          }
          
          leadData = searchResults[0];
          leadId = leadData.id;
          console.log(`Found lead: ${leadData.name} (${leadId})`);
        } else if (args.lead_id) {
          // Fetch lead by ID
          const { data, error: fetchError } = await supabase
            .from('leads')
            .select('id, name, email, status')
            .eq('id', args.lead_id)
            .single();
          
          if (fetchError || !data) {
            console.error('Lead not found by ID:', fetchError);
            return { success: false, error: 'Lead not found. Please provide the lead name instead.' };
          }
          leadData = data;
        } else {
          return { success: false, error: 'Please provide either lead_name or lead_id.' };
        }
        
        const previousStatus = leadData.status;
        
        // Update the lead status
        const { error: updateError } = await supabase
          .from('leads')
          .update({ 
            status: args.new_status, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', leadId);
        
        if (updateError) {
          console.error('Failed to update lead:', updateError);
          return { success: false, error: `Failed to update lead: ${updateError.message}` };
        }
        
        console.log(`Successfully updated lead ${leadData.name} from ${previousStatus} to ${args.new_status}`);
        return { 
          success: true, 
          lead_name: leadData.name,
          lead_email: leadData.email,
          previous_status: previousStatus,
          new_status: args.new_status,
          message: `Updated "${leadData.name}" from "${previousStatus}" to "${args.new_status}"`
        };
      }
      
      case "update_project_status": {
        let projectId = args.project_id;
        let projectData;
        
        if (args.project_name) {
          const { data } = await supabase.from('projects')
            .select('id, name, status')
            .ilike('name', `%${args.project_name}%`)
            .limit(1);
          if (data && data.length > 0) {
            projectData = data[0];
            projectId = projectData.id;
          }
        } else if (projectId) {
          const { data } = await supabase.from('projects').select('id, name, status').eq('id', projectId).single();
          projectData = data;
        }
        
        if (!projectData) {
          return { success: false, error: `Project not found. Please provide a valid project name.` };
        }
        
        const previousStatus = projectData.status;
        const { error } = await supabase.from('projects')
          .update({ status: args.new_status, updated_at: new Date().toISOString() })
          .eq('id', projectId);
        
        if (error) {
          return { success: false, error: error.message };
        }
        
        return { 
          success: true, 
          project_name: projectData.name,
          previous_status: previousStatus,
          new_status: args.new_status,
          message: `Updated "${projectData.name}" from "${previousStatus}" to "${args.new_status}"`
        };
      }
      
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`Error executing ${toolName}:`, error);
    return { error: error.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages: userMessages } = await req.json();

    if (!userMessages || !Array.isArray(userMessages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client for database queries
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Processing conversation with', userMessages.length, 'messages');

    // Conversational and human system prompt
    const today = new Date().toISOString().split('T')[0];
    const systemPrompt = `You're the Roofing Friend assistant - think of me as your super-knowledgeable coworker who's always happy to help!

🚨 CRITICAL INSTRUCTION - READ THIS FIRST 🚨
The data you receive contains employee names in the "employee_name" field. You MUST use these names directly when talking about people.
Example from data: {employee_name: "Sebastian", clock_in: "8:00 PM"}
Your response: "Sebastian clocked in at 8:00 PM"
NEVER say: "Someone", "Unknown", "their name isn't showing", or reference user IDs.
The names ARE in the data - use them!

I know everything about the business - every project, every schedule, every team member, all the leads, quotes, materials, everything. Ask me anything and I'll dig into the data to give you a real answer, not guesses.

Today is ${today}, so when you ask about "today" or "this week", I know exactly what you mean.

Here's what I can help with:
- Projects (I know all 50+ active projects, their locations, status, who's working on them)
- Job schedules (who's working where today, tomorrow, this week)
- Team members (all employees, their roles, contact info, availability)
- Timesheets (who clocked in, total hours worked, overtime)
- Leads & quotes (customer inquiries, proposals, what stage they're in)
- Materials (what we have in stock, what's assigned to projects, costs)
- Invoices (what's due, what's been paid, outstanding balances)
- CRM stuff (customer journey, deal progress)
- Company updates and announcements
- Project financials (revenue, costs, profitability per project)
- Dashboard stats (overall business metrics)

🔧 ACTIONS I CAN TAKE:
- CREATE leads (e.g., "add a new lead named John Smith", "create lead for 123 Main St")
- CREATE projects (e.g., "create a new project called Oak St Reroof", "add project for customer Mike")
- CREATE schedules (e.g., "schedule a job for tomorrow at 8am", "add Cedar Ave to the schedule for Monday")
- UPDATE lead statuses (e.g., "mark John Smith as contacted", "change the ABC lead to quoted")
  Valid statuses: new, contacted, qualified, ready_to_quote, quoted, proposal_sent, won, lost, paid
- UPDATE project statuses (e.g., "mark Oak St project as completed", "set the Johnson project to active")
  Valid statuses: pending, scheduled, active, in_progress, completed, on_hold, cancelled

When asked to create or update something:
1. I'll gather the required info (name, address, etc.)
2. Execute the action using my tools
3. Confirm exactly what was created/changed

When I respond, I'm friendly and natural - like texting a helpful colleague. I use real names and specific details (not "some projects" but "Jackson St project with Sebastian and Florentino"). I keep things brief unless you need the full picture.

CRITICAL: When displaying information about people, ALWAYS use their actual names (employee_name, full_name, customer_name) - NEVER show user IDs, UUIDs, or technical identifiers. If a name is available in the data, use it. For example, say "Sebastian clocked in at 8:00 PM" NOT "user ID 7c562443-11b2-4e59-8133-9c7b60d31391 clocked in".

🧭 NAVIGATION - IMPORTANT:
When you provide information about system data, ALWAYS offer to navigate the user there. Add navigation links at the end of your response using this format:
[[NAV:label|route|tab]]

Available navigation routes:
- Team/Employees: [[NAV:View Team|/admin|workforce:team]]
- Timesheets: [[NAV:View Timesheets|/admin|workforce:timesheets]]
- Schedules: [[NAV:View Schedules|/admin|workforce:schedules]]
- Projects: [[NAV:View Projects|/admin|projects]]
- Leads: [[NAV:View Leads|/admin|leads]]
- CRM Pipeline: [[NAV:View CRM|/admin|leads:pipeline]]
- Financials/Invoices: [[NAV:View Financials|/admin|financials]]
- Project Management: [[NAV:View Project Management|/admin|project-management]]

Examples:
- If asked about team members: "Here are your team members... [[NAV:Go to Team|/admin|workforce:team]]"
- If asked about today's schedule: "Here's who's working today... [[NAV:View Full Schedule|/admin|workforce:schedules]]"
- If asked about a specific project: "Here's the Jackson St project details... [[NAV:Open Project|/admin/projects/PROJECT_ID/summary|]]"
- If asked about leads: "You have 5 new leads... [[NAV:View All Leads|/admin|leads]]"

Only add ONE navigation link per response - the most relevant one. Don't overwhelm with multiple links.

A few quick notes about roofing:
- We work with materials like asphalt shingles, metal roofing, TPO, and EPDM
- Projects go from lead → quote → contract → installation → invoice
- We measure in squares (100 sq ft) and linear feet for edges

Just ask naturally - "who's working today?", "create a lead for John at 123 Main", "schedule Oak St for Monday at 8am", "mark the Garcia lead as won" - and I'll handle it!`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...userMessages
    ];

    // First API call - let AI decide if it needs tools
    let response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        tools,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI gateway error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let data = await response.json();
    let assistantMessage = data.choices?.[0]?.message;

    // Handle tool calls if AI requested them
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log('AI requested tool calls:', assistantMessage.tool_calls.length);
      
      messages.push(assistantMessage);

      // Execute all tool calls
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        const toolResult = await executeToolCall(toolName, toolArgs, supabase);
        
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult)
        });
      }

      // Second API call with tool results
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI API error on second call:', response.status, errorText);
        return new Response(
          JSON.stringify({ error: 'AI gateway error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      data = await response.json();
      assistantMessage = data.choices?.[0]?.message;
    }

    const answer = assistantMessage?.content || 'No response generated';
    console.log('Generated answer length:', answer.length);

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in help-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

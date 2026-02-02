import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive tools with CREATE, UPDATE, READ capabilities
const tools = [
  // ===== READ TOOLS =====
  {
    type: "function",
    function: {
      name: "query_projects",
      description: "Get information about roofing projects including status, financials, team, and progress. Returns data for visual cards.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by project status (active, completed, on-hold)" },
          search: { type: "string", description: "Search by project name or address" },
          include_financials: { type: "boolean", description: "Include financial summary (invoices, costs)" },
          limit: { type: "number", description: "Maximum number of projects (default 10)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_project_financials",
      description: "Get detailed financial breakdown for a specific project including invoices, payments, costs, and profitability. Returns chart data.",
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
      name: "query_leads",
      description: "Get leads and CRM pipeline data with status, source, and progress tracking",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by lead status" },
          search: { type: "string", description: "Search by name, email, or phone" },
          limit: { type: "number", description: "Maximum number of leads (default 20)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_schedules",
      description: "Get job schedules and assignments. Use for today/this week questions.",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
          end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
          status: { type: "string", description: "Filter by status" },
          limit: { type: "number", description: "Maximum number (default 20)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_employees",
      description: "Get team members with roles and status",
      parameters: {
        type: "object",
        properties: {
          role: { type: "string", description: "Filter by role" },
          status: { type: "string", description: "Filter by status (active, invited)" },
          search: { type: "string", description: "Search by name or email" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_dashboard_stats",
      description: "Get aggregate dashboard statistics - projects, revenue, leads, etc. Returns chart-ready data.",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", description: "Time period: today, this_week, this_month, this_year" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_invoices",
      description: "Get invoice data with payment status and amounts",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status (draft, sent, paid, overdue, unpaid)" },
          project_id: { type: "string", description: "Filter by project" },
          limit: { type: "number", description: "Maximum number (default 20)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_materials",
      description: "Get material inventory and costs",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Filter by category" },
          search: { type: "string", description: "Search by name" },
          project_id: { type: "string", description: "Filter by project" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_attendance_data",
      description: "Get employee attendance, time clock entries, hours worked. Use for attendance charts, who worked today/this week, hours summary.",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "Start date (YYYY-MM-DD), defaults to start of week" },
          end_date: { type: "string", description: "End date (YYYY-MM-DD), defaults to today" },
          employee_name: { type: "string", description: "Filter by employee name" },
          show_chart: { type: "boolean", description: "Return chart data for visualization" }
        }
      }
    }
  },
  // ===== CREATE TOOLS =====
  {
    type: "function",
    function: {
      name: "create_lead",
      description: "Create a new lead/customer in the CRM. Returns a form request if info is missing.",
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
      description: "Create a new roofing project",
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
      description: "Create a new job schedule/assignment",
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
      description: "Update a lead's CRM status",
      parameters: {
        type: "object",
        properties: {
          lead_name: { type: "string", description: "Lead name to find" },
          lead_id: { type: "string", description: "Lead UUID (optional)" },
          new_status: { 
            type: "string", 
            enum: ["new", "contacted", "qualified", "ready_to_quote", "quoted", "proposal_sent", "won", "lost"],
            description: "New status"
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
      description: "Update a project's status",
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
  },
  // ===== PDF REPORT TOOLS =====
{
      type: "function",
      function: {
        name: "generate_pdf_report",
        description: "Generate a PDF report. ALWAYS use this tool when user asks for a PDF, report, or timesheet.",
        parameters: {
          type: "object",
          properties: {
            report_type: { 
              type: "string", 
              enum: ["timesheet", "invoice", "proposal", "project_summary"],
              description: "Type of PDF report to generate"
            },
            employee_name: { type: "string", description: "Employee name for timesheet. Use 'all' for all employees." },
            employee_id: { type: "string", description: "Employee user_id for timesheet report" },
            all_employees: { type: "boolean", description: "Set to true to generate timesheets for all employees" },
            week_start: { type: "string", description: "Week start date (YYYY-MM-DD) for timesheet" },
            invoice_id: { type: "string", description: "Invoice ID for invoice report" },
            project_id: { type: "string", description: "Project ID for project_summary or proposal" },
            project_name: { type: "string", description: "Project name to search for" },
            proposal_id: { type: "string", description: "Proposal ID for proposal report" }
          },
          required: ["report_type"]
        }
      }
    },
  // ===== DELETE TOOLS =====
  {
    type: "function",
    function: {
      name: "delete_lead",
      description: "Delete a lead from the CRM",
      parameters: {
        type: "object",
        properties: {
          lead_id: { type: "string", description: "Lead UUID" },
          lead_name: { type: "string", description: "Lead name to find and delete" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_project",
      description: "Delete a project",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project UUID" },
          project_name: { type: "string", description: "Project name to find and delete" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_schedule",
      description: "Delete a job schedule",
      parameters: {
        type: "object",
        properties: {
          schedule_id: { type: "string", description: "Schedule UUID" },
          job_name: { type: "string", description: "Job name to find and delete" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_work_order",
      description: "Delete a work order",
      parameters: {
        type: "object",
        properties: {
          work_order_id: { type: "string", description: "Work order UUID" },
          work_order_title: { type: "string", description: "Work order title to find and delete" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_service_ticket",
      description: "Delete a service ticket",
      parameters: {
        type: "object",
        properties: {
          ticket_id: { type: "string", description: "Service ticket UUID" },
          ticket_title: { type: "string", description: "Ticket title to find and delete" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_expense",
      description: "Delete an expense record",
      parameters: {
        type: "object",
        properties: {
          expense_id: { type: "string", description: "Expense UUID" },
          description: { type: "string", description: "Expense description to find and delete" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_purchase_order",
      description: "Delete a purchase order",
      parameters: {
        type: "object",
        properties: {
          po_id: { type: "string", description: "Purchase order UUID" },
          po_number: { type: "string", description: "PO number to find and delete" },
          vendor_name: { type: "string", description: "Vendor name to find PO" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_invoice",
      description: "Delete an invoice",
      parameters: {
        type: "object",
        properties: {
          invoice_id: { type: "string", description: "Invoice UUID" },
          invoice_number: { type: "string", description: "Invoice number to find and delete" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_bill",
      description: "Delete a bill",
      parameters: {
        type: "object",
        properties: {
          bill_id: { type: "string", description: "Bill UUID" },
          bill_number: { type: "string", description: "Bill number to find and delete" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_inspection",
      description: "Delete an inspection",
      parameters: {
        type: "object",
        properties: {
          inspection_id: { type: "string", description: "Inspection UUID" }
        },
        required: ["inspection_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_punchlist",
      description: "Delete a punchlist item",
      parameters: {
        type: "object",
        properties: {
          punchlist_id: { type: "string", description: "Punchlist UUID" }
        },
        required: ["punchlist_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_daily_log",
      description: "Delete a daily log entry",
      parameters: {
        type: "object",
        properties: {
          log_id: { type: "string", description: "Daily log UUID" }
        },
        required: ["log_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_permit",
      description: "Delete a permit",
      parameters: {
        type: "object",
        properties: {
          permit_id: { type: "string", description: "Permit UUID" }
        },
        required: ["permit_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_contact",
      description: "Delete a contact from directory",
      parameters: {
        type: "object",
        properties: {
          contact_id: { type: "string", description: "Contact UUID" },
          company_name: { type: "string", description: "Company name to find and delete" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_team_member",
      description: "Remove a team member (marks as inactive)",
      parameters: {
        type: "object",
        properties: {
          user_id: { type: "string", description: "User UUID" },
          name: { type: "string", description: "Team member name to find and deactivate" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_change_order",
      description: "Delete a change order",
      parameters: {
        type: "object",
        properties: {
          change_order_id: { type: "string", description: "Change order UUID" },
          co_number: { type: "string", description: "CO number to find and delete" }
        }
      }
    }
  },
  // ===== FINANCIAL CRUD TOOLS =====
  {
    type: "function",
    function: {
      name: "create_invoice",
      description: "Create a new invoice for a customer or project",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Customer name" },
          project_name: { type: "string", description: "Project name to link invoice" },
          total_amount: { type: "number", description: "Invoice total amount" },
          description: { type: "string", description: "Invoice description" },
          due_date: { type: "string", description: "Due date (YYYY-MM-DD)" }
        },
        required: ["customer_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_invoice",
      description: "Update an invoice's status or amounts",
      parameters: {
        type: "object",
        properties: {
          invoice_id: { type: "string", description: "Invoice UUID" },
          invoice_number: { type: "string", description: "Invoice number to find" },
          status: { type: "string", enum: ["draft", "sent", "paid", "cancelled"], description: "New status" },
          total_amount: { type: "number", description: "Updated total" },
          due_date: { type: "string", description: "New due date" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "record_payment",
      description: "Record a payment against an invoice",
      parameters: {
        type: "object",
        properties: {
          invoice_id: { type: "string", description: "Invoice UUID" },
          invoice_number: { type: "string", description: "Invoice number to find" },
          amount: { type: "number", description: "Payment amount" },
          payment_method: { type: "string", description: "Method: check, credit_card, cash, ach" },
          notes: { type: "string", description: "Payment notes" }
        },
        required: ["amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_bill",
      description: "Create a new vendor bill",
      parameters: {
        type: "object",
        properties: {
          vendor_name: { type: "string", description: "Vendor name" },
          total: { type: "number", description: "Bill total" },
          description: { type: "string", description: "Bill description" },
          due_date: { type: "string", description: "Due date (YYYY-MM-DD)" },
          project_name: { type: "string", description: "Project to link bill" }
        },
        required: ["vendor_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_bill",
      description: "Update a bill's status or details",
      parameters: {
        type: "object",
        properties: {
          bill_id: { type: "string", description: "Bill UUID" },
          bill_number: { type: "string", description: "Bill number to find" },
          status: { type: "string", enum: ["draft", "pending", "paid", "cancelled"], description: "New status" },
          total: { type: "number", description: "Updated total" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "pay_bill",
      description: "Record a payment against a vendor bill",
      parameters: {
        type: "object",
        properties: {
          bill_id: { type: "string", description: "Bill UUID" },
          bill_number: { type: "string", description: "Bill number to find" },
          amount: { type: "number", description: "Payment amount" },
          payment_method: { type: "string", description: "Payment method" }
        },
        required: ["amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_estimate",
      description: "Create a new project estimate",
      parameters: {
        type: "object",
        properties: {
          project_name: { type: "string", description: "Project name" },
          customer_name: { type: "string", description: "Customer name" },
          description: { type: "string", description: "Estimate description/scope" },
          total_amount: { type: "number", description: "Estimated total" }
        },
        required: ["project_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_estimates",
      description: "Query project estimates",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status" },
          project_name: { type: "string", description: "Search by project name" },
          limit: { type: "number", description: "Max results (default 20)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_change_order",
      description: "Create a change order for a project",
      parameters: {
        type: "object",
        properties: {
          project_name: { type: "string", description: "Project name" },
          title: { type: "string", description: "Change order title" },
          description: { type: "string", description: "Description of changes" },
          estimated_cost: { type: "number", description: "Estimated cost change" }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_change_order",
      description: "Update a change order status",
      parameters: {
        type: "object",
        properties: {
          change_order_id: { type: "string", description: "Change order UUID" },
          co_number: { type: "string", description: "CO number to find" },
          status: { type: "string", enum: ["draft", "pending", "approved", "rejected"], description: "New status" },
          estimated_cost: { type: "number", description: "Updated cost" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_change_orders",
      description: "Query change orders",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status" },
          project_name: { type: "string", description: "Filter by project" },
          limit: { type: "number", description: "Max results (default 20)" }
        }
      }
    }
  },
  // ===== TODO MANAGEMENT =====
  {
    type: "function",
    function: {
      name: "create_todo",
      description: "Create a new todo/task",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title" },
          description: { type: "string", description: "Task description" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "Priority" },
          due_date: { type: "string", description: "Due date (YYYY-MM-DD)" },
          assigned_to: { type: "string", description: "Assignee name" },
          project_name: { type: "string", description: "Link to project" }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_todo",
      description: "Update a todo's status or details",
      parameters: {
        type: "object",
        properties: {
          todo_id: { type: "string", description: "Todo UUID" },
          title: { type: "string", description: "Todo title to find" },
          status: { type: "string", enum: ["pending", "in_progress", "completed"], description: "New status" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "New priority" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_todos",
      description: "Query todos/tasks",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status" },
          assigned_to: { type: "string", description: "Filter by assignee" },
          project_name: { type: "string", description: "Filter by project" },
          priority: { type: "string", description: "Filter by priority" },
          limit: { type: "number", description: "Max results (default 20)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_todo",
      description: "Delete a todo/task",
      parameters: {
        type: "object",
        properties: {
          todo_id: { type: "string", description: "Todo UUID" },
          title: { type: "string", description: "Todo title to find and delete" }
        }
      }
    }
  },
  // ===== INCIDENT MANAGEMENT =====
  {
    type: "function",
    function: {
      name: "create_incident",
      description: "Report a safety incident",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Incident title" },
          description: { type: "string", description: "What happened" },
          severity: { type: "string", enum: ["minor", "moderate", "major", "critical"], description: "Severity level" },
          location: { type: "string", description: "Where it happened" },
          injured_party: { type: "string", description: "Who was affected" }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_incidents",
      description: "Query safety incidents",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status" },
          severity: { type: "string", description: "Filter by severity" },
          limit: { type: "number", description: "Max results (default 20)" }
        }
      }
    }
  },
  // ===== SAFETY MEETINGS =====
  {
    type: "function",
    function: {
      name: "create_safety_meeting",
      description: "Schedule a safety meeting",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Meeting title/topic" },
          scheduled_date: { type: "string", description: "Date (YYYY-MM-DD)" },
          location: { type: "string", description: "Meeting location" },
          topics: { type: "string", description: "Topics to cover" }
        },
        required: ["title", "scheduled_date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_safety_meetings",
      description: "Query safety meetings",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status" },
          start_date: { type: "string", description: "Filter from date" },
          limit: { type: "number", description: "Max results (default 20)" }
        }
      }
    }
  },
  // ===== UPDATE EXPENSE =====
  {
    type: "function",
    function: {
      name: "update_expense",
      description: "Update an expense record",
      parameters: {
        type: "object",
        properties: {
          expense_id: { type: "string", description: "Expense UUID" },
          description: { type: "string", description: "Find by description" },
          amount: { type: "number", description: "Updated amount" },
          category: { type: "string", description: "Updated category" }
        }
      }
    }
  },
  // ===== UPDATE PURCHASE ORDER =====
  {
    type: "function",
    function: {
      name: "update_purchase_order",
      description: "Update a purchase order status",
      parameters: {
        type: "object",
        properties: {
          po_id: { type: "string", description: "PO UUID" },
          po_number: { type: "string", description: "PO number to find" },
          status: { type: "string", enum: ["draft", "sent", "received", "cancelled"], description: "New status" },
          total_amount: { type: "number", description: "Updated total" }
        }
      }
    }
  }
];

// Tool execution - comprehensive implementation
async function executeToolCall(toolName: string, args: any, supabase: any) {
  console.log(`[Agent Hub] Executing tool: ${toolName}`, args);
  
  try {
    switch (toolName) {
      // ===== MOBILE TASK MANAGEMENT (team_tasks table) =====
      case "create_task": {
        if (!args.title) {
          return { 
            success: false, 
            message: "What should I call this task?",
            needs_input: true
          };
        }
        
        const userId = args.current_context?.user_id;
        
        // Find project ID if project_name provided
        let projectId = null;
        if (args.project_name) {
          const { data: project } = await supabase
            .from('projects')
            .select('id')
            .ilike('name', `%${args.project_name}%`)
            .limit(1)
            .maybeSingle();
          projectId = project?.id;
        }
        
        const { data, error } = await supabase.from('team_tasks').insert({
          title: args.title,
          description: args.description || null,
          priority: args.priority || 'P2',
          status: 'NOT_STARTED',
          owner_id: userId || null,
          project_id: projectId,
          due_date: args.due_date || null,
          current_focus: false,
          estimated_duration: 'M',
          progress_percent: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).select().single();
        
        if (error) {
          console.error('Error creating task:', error);
          return { success: false, error: error.message };
        }
        
        return { 
          success: true, 
          task: data, 
          message: `Created "${args.title}"`,
          visual_type: 'success_card',
          action_completed: 'create_task',
          data_modified: ['team-tasks', 'mobile-tasks', 'tasks']
        };
      }
      
      case "query_my_tasks": {
        const userId = args.current_context?.user_id;
        
        let query = supabase.from('team_tasks')
          .select('id, title, description, status, priority, due_date, current_focus, progress_percent')
          .order('current_focus', { ascending: false })
          .order('priority', { ascending: true })
          .order('due_date', { ascending: true, nullsFirst: false });
        
        if (userId) {
          query = query.eq('owner_id', userId);
        }
        
        if (args.status && args.status !== 'all') {
          query = query.eq('status', args.status);
        }
        
        query = query.limit(args.limit || 10);
        
        const { data, error } = await query;
        
        if (error) {
          return { success: false, error: error.message };
        }
        
        return {
          success: true,
          tasks: data || [],
          count: data?.length || 0,
          message: `Found ${data?.length || 0} tasks`,
          visual_type: 'task_list'
        };
      }
      
      case "update_task": {
        let taskId = args.task_id;
        
        if (!taskId && args.task_title) {
          const { data: found } = await supabase.from('team_tasks')
            .select('id')
            .ilike('title', `%${args.task_title}%`)
            .limit(1)
            .maybeSingle();
          taskId = found?.id;
        }
        
        if (!taskId) {
          return { success: false, message: "Which task do you want to update?" };
        }
        
        const updates: any = { updated_at: new Date().toISOString() };
        if (args.status) updates.status = args.status;
        if (args.priority) updates.priority = args.priority;
        
        const { error } = await supabase.from('team_tasks')
          .update(updates)
          .eq('id', taskId);
        
        if (error) {
          return { success: false, error: error.message };
        }
        
        return {
          success: true,
          message: `Updated task`,
          visual_type: 'success_card',
          data_modified: ['team-tasks', 'mobile-tasks', 'tasks']
        };
      }
      
      case "complete_task": {
        let taskId = args.task_id;
        
        if (!taskId && args.task_title) {
          const { data: found } = await supabase.from('team_tasks')
            .select('id, title')
            .ilike('title', `%${args.task_title}%`)
            .limit(1)
            .maybeSingle();
          taskId = found?.id;
        }
        
        if (!taskId) {
          return { success: false, message: "Which task should I mark as done?" };
        }
        
        const { error } = await supabase.from('team_tasks')
          .update({ 
            status: 'DONE', 
            completed_at: new Date().toISOString(),
            progress_percent: 100,
            updated_at: new Date().toISOString() 
          })
          .eq('id', taskId);
        
        if (error) {
          return { success: false, error: error.message };
        }
        
        return {
          success: true,
          message: `Done!`,
          visual_type: 'success_card',
          data_modified: ['team-tasks', 'mobile-tasks', 'tasks']
        };
      }
      
      case "clock_in": {
        const userId = args.current_context?.user_id;
        
        if (!userId) {
          return { success: false, message: "Couldn't identify you. Please log in." };
        }
        
        // Check if already clocked in
        const today = new Date().toISOString().split('T')[0];
        const { data: existing } = await supabase.from('time_entries')
          .select('id')
          .eq('user_id', userId)
          .gte('clock_in', today)
          .is('clock_out', null)
          .limit(1)
          .maybeSingle();
        
        if (existing) {
          return { success: false, message: "You're already clocked in!" };
        }
        
        const { data, error } = await supabase.from('time_entries').insert({
          user_id: userId,
          clock_in: new Date().toISOString(),
          notes: args.notes || null,
          created_at: new Date().toISOString()
        }).select().single();
        
        if (error) {
          console.error('Clock in error:', error);
          return { success: false, error: error.message };
        }
        
        return {
          success: true,
          message: "Clocked in!",
          time_entry: data,
          visual_type: 'success_card',
          data_modified: ['time-entries', 'attendance']
        };
      }
      
      case "clock_out": {
        const userId = args.current_context?.user_id;
        
        if (!userId) {
          return { success: false, message: "Couldn't identify you. Please log in." };
        }
        
        // Find open time entry
        const { data: openEntry } = await supabase.from('time_entries')
          .select('id, clock_in')
          .eq('user_id', userId)
          .is('clock_out', null)
          .order('clock_in', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (!openEntry) {
          return { success: false, message: "You're not clocked in." };
        }
        
        const clockOut = new Date();
        const clockIn = new Date(openEntry.clock_in);
        const hoursWorked = ((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)).toFixed(1);
        
        const { error } = await supabase.from('time_entries')
          .update({ 
            clock_out: clockOut.toISOString(),
            notes: args.notes || null
          })
          .eq('id', openEntry.id);
        
        if (error) {
          return { success: false, error: error.message };
        }
        
        return {
          success: true,
          message: `Clocked out! ${hoursWorked} hours today.`,
          visual_type: 'success_card',
          data_modified: ['time-entries', 'attendance']
        };
      }
      
      case "get_my_schedule": {
        const userId = args.current_context?.user_id;
        const daysAhead = args.days_ahead || 7;
        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const { data, error } = await supabase.from('job_schedules')
          .select('id, job_name, location, start_date, start_time, end_time, status, assigned_to')
          .or(userId ? `assigned_to.eq.${userId}` : '')
          .gte('start_date', today)
          .lte('start_date', futureDate)
          .order('start_date', { ascending: true })
          .limit(20);
        
        return {
          success: true,
          schedules: data || [],
          count: data?.length || 0,
          message: `${data?.length || 0} upcoming shifts`,
          visual_type: 'schedule_list'
        };
      }
      
      case "create_time_off_request": {
        const userId = args.current_context?.user_id;
        
        if (!args.start_date || !args.end_date) {
          return { success: false, message: "When do you need off? Give me start and end dates." };
        }
        
        const { data, error } = await supabase.from('time_off_requests').insert({
          user_id: userId,
          start_date: args.start_date,
          end_date: args.end_date,
          reason: args.reason || 'Personal',
          status: 'pending',
          created_at: new Date().toISOString()
        }).select().single();
        
        if (error) {
          console.error('Time off request error:', error);
          return { success: false, error: error.message };
        }
        
        return {
          success: true,
          message: `Time off request submitted for ${args.start_date} to ${args.end_date}`,
          request: data,
          visual_type: 'success_card',
          data_modified: ['time-off-requests']
        };
      }
      
      // ===== DIRECTORY & CONTACTS =====
      case "add_team_member": {
        if (!args.full_name) {
          return { 
            visual_type: 'input_form',
            form_type: 'add_team_member',
            message: "I'll help you add a team member. What's their name?",
            fields: [
              { name: 'full_name', label: 'Full Name', required: true, type: 'text' },
              { name: 'email', label: 'Email', required: true, type: 'email' },
              { name: 'role', label: 'Role', required: true, type: 'select', options: ['owner', 'admin', 'leader', 'contributor'] },
              { name: 'phone_number', label: 'Phone', required: false, type: 'tel' }
            ]
          };
        }
        
        const { data, error } = await supabase.from('team_directory').insert({
          full_name: args.full_name,
          email: args.email || null,
          role: args.role || 'contributor',
          phone_number: args.phone_number || null,
          job_title: args.job_title || null,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).select().single();
        
        if (error) {
          console.error('Error adding team member:', error);
          return { success: false, error: error.message };
        }
        
        return { 
          success: true, 
          team_member: data, 
          message: `Added ${args.full_name} to the team as a ${args.role || 'contributor'}!`,
          visual_type: 'success_card',
          action_completed: 'add_team_member',
          data_modified: ['team-directory', 'employees']
        };
      }
      
      case "add_contact": {
        if (!args.company_name) {
          return { 
            visual_type: 'input_form',
            form_type: 'add_contact',
            message: "I'll add a contact. What's the company name?",
            fields: [
              { name: 'company_name', label: 'Company Name', required: true, type: 'text' },
              { name: 'contact_name', label: 'Contact Name', required: false, type: 'text' },
              { name: 'email', label: 'Email', required: false, type: 'email' },
              { name: 'phone', label: 'Phone', required: false, type: 'tel' },
              { name: 'contact_type', label: 'Type', required: true, type: 'select', options: ['vendor', 'subcontractor', 'customer', 'supplier'] }
            ]
          };
        }
        
        const { data, error } = await supabase.from('directory_contacts').insert({
          company_name: args.company_name,
          contact_name: args.contact_name || null,
          email: args.email || null,
          phone: args.phone || null,
          contact_type: args.contact_type || 'vendor',
          address: args.address || null,
          notes: args.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).select().single();
        
        if (error) {
          console.error('Error adding contact:', error);
          return { success: false, error: error.message };
        }
        
        return { 
          success: true, 
          contact: data, 
          message: `Added ${args.company_name} as a ${args.contact_type || 'vendor'}!`,
          visual_type: 'success_card',
          action_completed: 'add_contact',
          data_modified: ['directory-contacts']
        };
      }
      
      case "query_directory": {
        const results: any = { visual_type: 'directory_list' };
        
        if (!args.type || args.type === 'team' || args.type === 'all') {
          let query = supabase.from('team_directory').select('user_id, full_name, email, role, phone_number, status, job_title');
          if (args.search) query = query.or(`full_name.ilike.%${args.search}%,email.ilike.%${args.search}%`);
          query = query.eq('status', 'active').limit(20);
          const { data: teamData } = await query;
          results.team = teamData || [];
        }
        
        if (!args.type || args.type === 'contacts' || args.type === 'all') {
          let query = supabase.from('directory_contacts').select('id, company_name, contact_name, email, phone, contact_type');
          if (args.search) query = query.or(`company_name.ilike.%${args.search}%,contact_name.ilike.%${args.search}%`);
          query = query.limit(20);
          const { data: contactsData } = await query;
          results.contacts = contactsData || [];
        }
        
        results.count = (results.team?.length || 0) + (results.contacts?.length || 0);
        return results;
      }
      
      case "update_contact": {
        const { data: existing } = await supabase.from('directory_contacts')
          .select('id, company_name')
          .ilike('company_name', `%${args.contact_name}%`)
          .limit(1);
        
        if (!existing || existing.length === 0) {
          // Try team directory
          const { data: teamMember } = await supabase.from('team_directory')
            .select('user_id, full_name')
            .ilike('full_name', `%${args.contact_name}%`)
            .limit(1);
          
          if (!teamMember || teamMember.length === 0) {
            return { success: false, error: 'Contact not found' };
          }
          
          const updates: any = { updated_at: new Date().toISOString() };
          if (args.email) updates.email = args.email;
          if (args.phone) updates.phone_number = args.phone;
          
          const { error } = await supabase.from('team_directory')
            .update(updates)
            .eq('user_id', teamMember[0].user_id);
          
          if (error) return { success: false, error: error.message };
          
          return { 
            success: true, 
            message: `Updated ${teamMember[0].full_name}!`,
            visual_type: 'success_card',
            data_modified: ['team-directory', 'employees']
          };
        }
        
        const updates: any = { updated_at: new Date().toISOString() };
        if (args.email) updates.email = args.email;
        if (args.phone) updates.phone = args.phone;
        if (args.notes) updates.notes = args.notes;
        
        const { error } = await supabase.from('directory_contacts')
          .update(updates)
          .eq('id', existing[0].id);
        
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Updated ${existing[0].company_name}!`,
          visual_type: 'success_card',
          data_modified: ['directory-contacts']
        };
      }
      
      // ===== WORK ORDERS =====
      case "create_work_order": {
        if (!args.title) {
          return { 
            visual_type: 'input_form',
            form_type: 'create_work_order',
            message: "What's the work order for?",
            fields: [
              { name: 'title', label: 'Title', required: true, type: 'text' },
              { name: 'description', label: 'Description', required: false, type: 'textarea' },
              { name: 'priority', label: 'Priority', required: false, type: 'select', options: ['low', 'medium', 'high', 'urgent'] }
            ]
          };
        }
        
        let projectId = null;
        if (args.project_name) {
          const { data: projects } = await supabase.from('projects')
            .select('id').ilike('name', `%${args.project_name}%`).limit(1);
          if (projects?.length) projectId = projects[0].id;
        }
        
        const { data, error } = await supabase.from('work_orders').insert({
          title: args.title,
          description: args.description || null,
          project_id: projectId,
          priority: args.priority || 'medium',
          assigned_to: args.assigned_to || null,
          due_date: args.due_date || null,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).select().single();
        
        if (error) {
          console.error('Error creating work order:', error);
          return { success: false, error: error.message };
        }
        
        return { 
          success: true, 
          work_order: data, 
          message: `Work order "${args.title}" created!`,
          visual_type: 'success_card',
          action_completed: 'create_work_order',
          data_modified: ['work-orders']
        };
      }
      
      case "query_work_orders": {
        let query = supabase.from('work_orders').select('id, title, description, status, priority, assigned_to, due_date, created_at');
        if (args.status && args.status !== 'all') query = query.eq('status', args.status);
        if (args.assigned_to) query = query.ilike('assigned_to', `%${args.assigned_to}%`);
        query = query.order('created_at', { ascending: false }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        
        return { work_orders: data, count: data?.length || 0, visual_type: 'work_order_list' };
      }
      
      case "update_work_order_status": {
        let workOrderId = args.work_order_id;
        let workOrderData;
        
        if (args.work_order_title) {
          const { data } = await supabase.from('work_orders')
            .select('id, title, status')
            .ilike('title', `%${args.work_order_title}%`)
            .limit(1);
          if (data?.length) {
            workOrderData = data[0];
            workOrderId = workOrderData.id;
          }
        }
        
        if (!workOrderId) return { success: false, error: 'Work order not found' };
        
        const { error } = await supabase.from('work_orders')
          .update({ status: args.new_status, updated_at: new Date().toISOString() })
          .eq('id', workOrderId);
        
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Work order updated to "${args.new_status}"`,
          visual_type: 'status_update',
          data_modified: ['work-orders']
        };
      }
      
      // ===== SERVICE TICKETS =====
      case "create_service_ticket": {
        if (!args.title) {
          return { 
            visual_type: 'input_form',
            form_type: 'create_service_ticket',
            message: "What's the service request about?",
            fields: [
              { name: 'title', label: 'Title', required: true, type: 'text' },
              { name: 'description', label: 'Issue Description', required: false, type: 'textarea' },
              { name: 'customer_name', label: 'Customer Name', required: false, type: 'text' },
              { name: 'priority', label: 'Priority', required: false, type: 'select', options: ['low', 'medium', 'high', 'emergency'] }
            ]
          };
        }
        
        const { data, error } = await supabase.from('service_tickets').insert({
          title: args.title,
          description: args.description || null,
          customer_name: args.customer_name || null,
          property_address: args.property_address || null,
          priority: args.priority || 'medium',
          ticket_type: args.ticket_type || 'repair',
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).select().single();
        
        if (error) {
          console.error('Error creating service ticket:', error);
          return { success: false, error: error.message };
        }
        
        return { 
          success: true, 
          service_ticket: data, 
          message: `Service ticket "${args.title}" created!`,
          visual_type: 'success_card',
          action_completed: 'create_service_ticket',
          data_modified: ['service-tickets']
        };
      }
      
      case "query_service_tickets": {
        let query = supabase.from('service_tickets').select('id, title, description, status, priority, customer_name, ticket_type, created_at');
        if (args.status && args.status !== 'all') query = query.eq('status', args.status);
        if (args.ticket_type) query = query.eq('ticket_type', args.ticket_type);
        if (args.customer_name) query = query.ilike('customer_name', `%${args.customer_name}%`);
        query = query.order('created_at', { ascending: false }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        
        return { service_tickets: data, count: data?.length || 0, visual_type: 'service_ticket_list' };
      }
      
      // ===== TIME & ATTENDANCE =====
      case "query_who_clocked_in": {
        const today = new Date().toISOString().split('T')[0];
        
        // Get entries clocked in today that haven't clocked out
        const { data: clockedIn, error } = await supabase.from('time_clock')
          .select('id, user_id, employee_name, employee_role, clock_in, project_name, location, status')
          .gte('clock_in', today + 'T00:00:00')
          .is('clock_out', null)
          .order('clock_in', { ascending: false });
        
        if (error) throw error;
        
        const uniqueEmployees = new Map();
        (clockedIn || []).forEach(entry => {
          if (!uniqueEmployees.has(entry.employee_name)) {
            uniqueEmployees.set(entry.employee_name, {
              name: entry.employee_name,
              role: entry.employee_role,
              clock_in: entry.clock_in,
              project: entry.project_name,
              location: entry.location
            });
          }
        });
        
        const employees = Array.from(uniqueEmployees.values());
        
        return { 
          clocked_in: employees, 
          count: employees.length, 
          visual_type: 'clocked_in_list',
          message: employees.length > 0 
            ? `${employees.length} ${employees.length === 1 ? 'person' : 'people'} currently clocked in`
            : 'No one is currently clocked in'
        };
      }
      
      case "clock_in_employee": {
        if (!args.employee_name) {
          return { error: 'Employee name required' };
        }
        
        // Find the employee
        const { data: employee } = await supabase.from('team_directory')
          .select('user_id, full_name, role')
          .ilike('full_name', `%${args.employee_name}%`)
          .limit(1);
        
        if (!employee?.length) {
          return { success: false, error: `Employee "${args.employee_name}" not found` };
        }
        
        // Check if already clocked in today
        const today = new Date().toISOString().split('T')[0];
        const { data: existing } = await supabase.from('time_clock')
          .select('id')
          .eq('user_id', employee[0].user_id)
          .gte('clock_in', today + 'T00:00:00')
          .is('clock_out', null);
        
        if (existing?.length) {
          return { success: false, error: `${employee[0].full_name} is already clocked in` };
        }
        
        const { data, error } = await supabase.from('time_clock').insert({
          user_id: employee[0].user_id,
          employee_name: employee[0].full_name,
          employee_role: employee[0].role,
          clock_in: new Date().toISOString(),
          project_name: args.project_name || null,
          location: args.location || null,
          status: 'clocked_in'
        }).select().single();
        
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `${employee[0].full_name} clocked in at ${new Date().toLocaleTimeString()}`,
          visual_type: 'success_card',
          action_completed: 'clock_in'
        };
      }
      
      case "clock_out_employee": {
        if (!args.employee_name) {
          return { error: 'Employee name required' };
        }
        
        // Find active clock-in entry
        const today = new Date().toISOString().split('T')[0];
        const { data: entry } = await supabase.from('time_clock')
          .select('id, employee_name, clock_in')
          .ilike('employee_name', `%${args.employee_name}%`)
          .gte('clock_in', today + 'T00:00:00')
          .is('clock_out', null)
          .limit(1);
        
        if (!entry?.length) {
          return { success: false, error: `${args.employee_name} is not currently clocked in` };
        }
        
        const clockOut = new Date();
        const clockIn = new Date(entry[0].clock_in);
        const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
        
        const { error } = await supabase.from('time_clock')
          .update({ 
            clock_out: clockOut.toISOString(), 
            total_hours: hoursWorked.toFixed(2),
            status: 'clocked_out',
            notes: args.notes || null
          })
          .eq('id', entry[0].id);
        
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `${entry[0].employee_name} clocked out. Worked ${hoursWorked.toFixed(1)} hours.`,
          visual_type: 'success_card',
          action_completed: 'clock_out'
        };
      }
      
      case "approve_timesheet": {
        return { 
          success: true, 
          message: `Timesheet approval noted for ${args.employee_name}. Full approval workflow coming soon.`,
          visual_type: 'info_card'
        };
      }
      
      // ===== FINANCIALS =====
      case "query_bills": {
        let query = supabase.from('bills').select('id, bill_number, vendor_name, total, balance_due, status, due_date, bill_date');
        if (args.status === 'unpaid') {
          query = query.gt('balance_due', 0);
        } else if (args.status === 'overdue') {
          query = query.gt('balance_due', 0).lt('due_date', new Date().toISOString().split('T')[0]);
        } else if (args.status && args.status !== 'all') {
          query = query.eq('status', args.status);
        }
        if (args.vendor_name) query = query.ilike('vendor_name', `%${args.vendor_name}%`);
        query = query.order('due_date', { ascending: true }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        
        const totalDue = (data || []).reduce((sum, b) => sum + (b.balance_due || 0), 0);
        
        return { 
          bills: data, 
          count: data?.length || 0, 
          total_due: totalDue,
          visual_type: 'bill_list' 
        };
      }
      
      case "create_expense": {
        if (!args.description || !args.amount) {
          return { 
            visual_type: 'input_form',
            form_type: 'create_expense',
            message: "What's the expense for?",
            fields: [
              { name: 'description', label: 'Description', required: true, type: 'text' },
              { name: 'amount', label: 'Amount ($)', required: true, type: 'number' },
              { name: 'category', label: 'Category', required: false, type: 'select', options: ['materials', 'labor', 'equipment', 'fuel', 'office', 'other'] }
            ]
          };
        }
        
        let projectId = null;
        if (args.project_name) {
          const { data: projects } = await supabase.from('projects')
            .select('id').ilike('name', `%${args.project_name}%`).limit(1);
          if (projects?.length) projectId = projects[0].id;
        }
        
        const { data, error } = await supabase.from('expenses').insert({
          description: args.description,
          amount: args.amount,
          category: args.category || 'other',
          project_id: projectId,
          vendor_name: args.vendor_name || null,
          expense_date: args.date || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        }).select().single();
        
        if (error) {
          console.error('Error creating expense:', error);
          return { success: false, error: error.message };
        }
        
        return { 
          success: true, 
          expense: data, 
          message: `Logged expense: $${args.amount} for ${args.description}`,
          visual_type: 'success_card'
        };
      }
      
      case "query_expenses": {
        let query = supabase.from('expenses').select('id, description, amount, category, expense_date, vendor_name');
        if (args.category) query = query.eq('category', args.category);
        if (args.start_date) query = query.gte('expense_date', args.start_date);
        if (args.end_date) query = query.lte('expense_date', args.end_date);
        query = query.order('expense_date', { ascending: false }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        
        const total = (data || []).reduce((sum, e) => sum + (e.amount || 0), 0);
        
        return { expenses: data, count: data?.length || 0, total, visual_type: 'expense_list' };
      }
      
      case "create_purchase_order": {
        if (!args.vendor_name) {
          return { 
            visual_type: 'input_form',
            form_type: 'create_purchase_order',
            message: "Who's the vendor?",
            fields: [
              { name: 'vendor_name', label: 'Vendor Name', required: true, type: 'text' },
              { name: 'description', label: 'Description', required: false, type: 'textarea' },
              { name: 'total_amount', label: 'Total Amount ($)', required: false, type: 'number' }
            ]
          };
        }
        
        let projectId = null;
        if (args.project_name) {
          const { data: projects } = await supabase.from('projects')
            .select('id').ilike('name', `%${args.project_name}%`).limit(1);
          if (projects?.length) projectId = projects[0].id;
        }
        
        const { data, error } = await supabase.from('purchase_orders').insert({
          vendor_name: args.vendor_name,
          description: args.description || null,
          items: args.items || null,
          total_amount: args.total_amount || 0,
          project_id: projectId,
          status: 'draft',
          created_at: new Date().toISOString()
        }).select().single();
        
        if (error) {
          console.error('Error creating PO:', error);
          return { success: false, error: error.message };
        }
        
        return { 
          success: true, 
          purchase_order: data, 
          message: `Purchase order for ${args.vendor_name} created!`,
          visual_type: 'success_card'
        };
      }
      
      case "query_purchase_orders": {
        let query = supabase.from('purchase_orders').select('id, po_number, vendor_name, description, total_amount, status, created_at');
        if (args.status && args.status !== 'all') query = query.eq('status', args.status);
        if (args.vendor_name) query = query.ilike('vendor_name', `%${args.vendor_name}%`);
        query = query.order('created_at', { ascending: false }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        
        return { purchase_orders: data, count: data?.length || 0, visual_type: 'po_list' };
      }
      
      case "query_payments": {
        let query = supabase.from('invoice_payments').select('id, amount, payment_date, payment_method, invoice_id');
        if (args.start_date) query = query.gte('payment_date', args.start_date);
        if (args.end_date) query = query.lte('payment_date', args.end_date);
        query = query.order('payment_date', { ascending: false }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        
        const total = (data || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        
        return { payments: data, count: data?.length || 0, total, visual_type: 'payment_list' };
      }
      
      // ===== PROJECT MANAGEMENT =====
      case "query_inspections": {
        let query = supabase.from('project_inspections').select('id, inspection_type, status, scheduled_date, inspector_name, notes, project_id');
        if (args.status && args.status !== 'all') query = query.eq('status', args.status);
        query = query.order('scheduled_date', { ascending: false }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        
        return { inspections: data, count: data?.length || 0, visual_type: 'inspection_list' };
      }
      
      case "create_inspection": {
        let projectId = null;
        if (args.project_name) {
          const { data: projects } = await supabase.from('projects')
            .select('id').ilike('name', `%${args.project_name}%`).limit(1);
          if (projects?.length) projectId = projects[0].id;
        }
        
        const { data, error } = await supabase.from('project_inspections').insert({
          inspection_type: args.inspection_type,
          project_id: projectId,
          scheduled_date: args.scheduled_date || new Date().toISOString().split('T')[0],
          inspector_name: args.inspector_name || null,
          notes: args.notes || null,
          status: 'scheduled',
          created_at: new Date().toISOString()
        }).select().single();
        
        if (error) {
          console.error('Error creating inspection:', error);
          return { success: false, error: error.message };
        }
        
        return { 
          success: true, 
          inspection: data, 
          message: `${args.inspection_type} inspection scheduled!`,
          visual_type: 'success_card'
        };
      }
      
      case "query_punchlists": {
        let query = supabase.from('punchlist_items').select('id, description, status, priority, assigned_to, location, project_id');
        if (args.status && args.status !== 'all') query = query.eq('status', args.status);
        query = query.order('created_at', { ascending: false }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        
        return { punchlist_items: data, count: data?.length || 0, visual_type: 'punchlist' };
      }
      
      case "create_punchlist_item": {
        let projectId = null;
        if (args.project_name) {
          const { data: projects } = await supabase.from('projects')
            .select('id').ilike('name', `%${args.project_name}%`).limit(1);
          if (projects?.length) projectId = projects[0].id;
        }
        
        const { data, error } = await supabase.from('punchlist_items').insert({
          description: args.description,
          project_id: projectId,
          priority: args.priority || 'medium',
          assigned_to: args.assigned_to || null,
          location: args.location || null,
          status: 'open',
          created_at: new Date().toISOString()
        }).select().single();
        
        if (error) {
          console.error('Error creating punchlist item:', error);
          return { success: false, error: error.message };
        }
        
        return { 
          success: true, 
          punchlist_item: data, 
          message: `Punchlist item added!`,
          visual_type: 'success_card'
        };
      }
      
      case "query_permits": {
        let query = supabase.from('permits').select('id, permit_type, permit_number, status, expiration_date, project_id');
        if (args.status && args.status !== 'all') query = query.eq('status', args.status);
        query = query.order('expiration_date', { ascending: false }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        
        return { permits: data, count: data?.length || 0, visual_type: 'permit_list' };
      }
      
      case "create_daily_log": {
        let projectId = null;
        let projectName = args.project_name;
        
        if (args.project_name) {
          const { data: projects } = await supabase.from('projects')
            .select('id, name').ilike('name', `%${args.project_name}%`).limit(1);
          if (projects?.length) {
            projectId = projects[0].id;
            projectName = projects[0].name;
          }
        }
        
        if (!projectId) {
          return { error: 'Project not found' };
        }
        
        const { data, error } = await supabase.from('daily_log_entries').insert({
          project_id: projectId,
          log_date: args.log_date || new Date().toISOString().split('T')[0],
          weather_data: args.weather ? { conditions: args.weather } : null,
          tasks_performed: args.work_performed || null,
          status: 'draft',
          created_at: new Date().toISOString()
        }).select().single();
        
        if (error) {
          console.error('Error creating daily log:', error);
          return { success: false, error: error.message };
        }
        
        return { 
          success: true, 
          daily_log: data, 
          message: `Daily log created for ${projectName}!`,
          visual_type: 'success_card'
        };
      }
      
      case "query_daily_logs": {
        let query = supabase.from('daily_log_entries').select('id, log_date, tasks_performed, weather_data, status, project_id, created_at');
        if (args.start_date) query = query.gte('log_date', args.start_date);
        if (args.end_date) query = query.lte('log_date', args.end_date);
        query = query.order('log_date', { ascending: false }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        
        return { daily_logs: data, count: data?.length || 0, visual_type: 'daily_log_list' };
      }
      
      // ===== NAVIGATION =====
      case "navigate_to_page": {
        // Comprehensive page map including ALL subtabs
        const pageMap: Record<string, string> = {
          // Main tabs
          home: '/admin?tab=home',
          dashboard: '/admin?tab=home',
          sales: '/admin?tab=sales',
          'project-management': '/admin?tab=project-management',
          projects: '/admin?tab=project-management',
          workforce: '/admin?tab=workforce',
          financials: '/admin?tab=financials',
          analytics: '/admin?tab=analytics',
          documents: '/admin?tab=documents',
          settings: '/admin?tab=settings',
          
          // Sales subtabs
          leads: '/admin?tab=sales&subtab=leads',
          quotes: '/admin?tab=sales&subtab=quotes',
          proposals: '/admin?tab=sales&subtab=proposals',
          contracts: '/admin?tab=sales&subtab=contracts',
          
          // Project Management subtabs
          'projects': '/admin?tab=project-management&subtab=projects',
          'daily-logs': '/admin?tab=project-management&subtab=daily-logs',
          'daily logs': '/admin?tab=project-management&subtab=daily-logs',
          dailylogs: '/admin?tab=project-management&subtab=daily-logs',
          logs: '/admin?tab=project-management&subtab=daily-logs',
          schedule: '/admin?tab=project-management&subtab=schedule',
          todos: '/admin?tab=project-management&subtab=todos',
          'to dos': '/admin?tab=project-management&subtab=todos',
          'to-dos': '/admin?tab=project-management&subtab=todos',
          'work-orders': '/admin?tab=project-management&subtab=work-orders',
          'work orders': '/admin?tab=project-management&subtab=work-orders',
          workorders: '/admin?tab=project-management&subtab=work-orders',
          inspections: '/admin?tab=project-management&subtab=inspections',
          punchlists: '/admin?tab=project-management&subtab=punchlists',
          'punch lists': '/admin?tab=project-management&subtab=punchlists',
          'punch-lists': '/admin?tab=project-management&subtab=punchlists',
          'service-tickets': '/admin?tab=project-management&subtab=service-tickets',
          'service tickets': '/admin?tab=project-management&subtab=service-tickets',
          servicetickets: '/admin?tab=project-management&subtab=service-tickets',
          permits: '/admin?tab=project-management&subtab=permits',
          
          // Workforce subtabs
          summary: '/admin?tab=workforce&subtab=summary',
          directory: '/admin?tab=workforce&subtab=directory',
          opportunities: '/admin?tab=workforce&subtab=opportunities',
          timesheets: '/admin?tab=workforce&subtab=timesheets',
          scheduling: '/admin?tab=workforce&subtab=scheduling',
          tasks: '/admin?tab=workforce&subtab=tasks',
          requests: '/admin?tab=workforce&subtab=requests',
          scoring: '/admin?tab=workforce&subtab=scoring',
          users: '/admin?tab=workforce&subtab=users',
          incidents: '/admin?tab=workforce&subtab=incidents',
          'safety-meetings': '/admin?tab=workforce&subtab=safety-meetings',
          'safety meetings': '/admin?tab=workforce&subtab=safety-meetings',
          safetymeetings: '/admin?tab=workforce&subtab=safety-meetings',
          
          // Financials subtabs
          estimates: '/admin?tab=financials&subtab=estimates',
          'bid-manager': '/admin?tab=financials&subtab=bid-manager',
          'bid manager': '/admin?tab=financials&subtab=bid-manager',
          bidmanager: '/admin?tab=financials&subtab=bid-manager',
          'change-orders': '/admin?tab=financials&subtab=change-orders',
          'change orders': '/admin?tab=financials&subtab=change-orders',
          changeorders: '/admin?tab=financials&subtab=change-orders',
          invoices: '/admin?tab=financials&subtab=invoices',
          payments: '/admin?tab=financials&subtab=payments',
          expenses: '/admin?tab=financials&subtab=expenses',
          'purchase-orders': '/admin?tab=financials&subtab=purchase-orders',
          'purchase orders': '/admin?tab=financials&subtab=purchase-orders',
          purchaseorders: '/admin?tab=financials&subtab=purchase-orders',
          'sub-contracts': '/admin?tab=financials&subtab=sub-contracts',
          'sub contracts': '/admin?tab=financials&subtab=sub-contracts',
          subcontracts: '/admin?tab=financials&subtab=sub-contracts',
          bills: '/admin?tab=financials&subtab=bills',
          'transaction-log': '/admin?tab=financials&subtab=transaction-log',
          'transaction log': '/admin?tab=financials&subtab=transaction-log',
          transactions: '/admin?tab=financials&subtab=transaction-log',
          
          // Documents subtabs
          'files-photos': '/admin?tab=documents&subtab=files-photos',
          files: '/admin?tab=documents&subtab=files-photos',
          photos: '/admin?tab=documents&subtab=files-photos',
          reports: '/admin?tab=documents&subtab=reports',
          'forms-checklists': '/admin?tab=documents&subtab=forms-checklists',
          forms: '/admin?tab=documents&subtab=forms-checklists',
          checklists: '/admin?tab=documents&subtab=forms-checklists',
          'rfi-notices': '/admin?tab=documents&subtab=rfi-notices',
          rfis: '/admin?tab=documents&subtab=rfi-notices',
          notices: '/admin?tab=documents&subtab=rfi-notices',
          submittals: '/admin?tab=documents&subtab=submittals',
          'vehicle-logs': '/admin?tab=documents&subtab=vehicle-logs',
          'vehicle logs': '/admin?tab=documents&subtab=vehicle-logs',
          'equipment-logs': '/admin?tab=documents&subtab=equipment-logs',
          'equipment logs': '/admin?tab=documents&subtab=equipment-logs',
          notes: '/admin?tab=documents&subtab=notes',
          'send-email': '/admin?tab=documents&subtab=send-email',
          email: '/admin?tab=documents&subtab=send-email',
          'document-writer': '/admin?tab=documents&subtab=document-writer',
          'document writer': '/admin?tab=documents&subtab=document-writer',
          
          // Settings subtabs
          'team-board': '/admin?tab=settings&subtab=team-board',
          'team board': '/admin?tab=settings&subtab=team-board',
          feedback: '/admin?tab=settings&subtab=feedback',
          general: '/admin?tab=settings&subtab=general',
          storage: '/admin?tab=settings&subtab=storage',
          integrations: '/admin?tab=settings&subtab=integrations',
        };
        
        // Normalize and clean the page argument
        let normalizedPage = (args.page || '').toLowerCase().trim();
        
        // Strip common prefixes the AI might include
        const prefixes = ['go to', 'go to the', 'open', 'open the', 'show', 'show me', 'show me the', 'take me to', 'navigate to'];
        for (const prefix of prefixes) {
          if (normalizedPage.startsWith(prefix + ' ')) {
            normalizedPage = normalizedPage.slice(prefix.length + 1).trim();
            break;
          }
        }

        // Remove common relationship words/phrases ("quotes inside sales", "under projects")
        normalizedPage = normalizedPage
          .replace(/\b(inside of|inside|under|within|in)\b/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Strip common suffixes
        const suffixes = ['tab', 'page', 'section', 'screen'];
        for (const suffix of suffixes) {
          if (normalizedPage.endsWith(' ' + suffix)) {
            normalizedPage = normalizedPage.slice(0, -(suffix.length + 1)).trim();
          }
        }
        
        // Try direct lookup first
        let url = pageMap[normalizedPage];
        
        // If no direct match, try fuzzy matching
        if (!url) {
          // Try without spaces/hyphens
          const noSpaces = normalizedPage.replace(/[\s-]/g, '');
          for (const [key, value] of Object.entries(pageMap)) {
            const keyNoSpaces = key.replace(/[\s-]/g, '');
            if (keyNoSpaces === noSpaces || key.includes(normalizedPage) || normalizedPage.includes(key)) {
              url = value;
              break;
            }
          }
        }
        
        // Default to admin if still no match
        url = url || '/admin';
        
        // Extract subtab from URL for the response
        const subtabMatch = url.match(/subtab=([^&]+)/);
        const subtab = subtabMatch ? subtabMatch[1] : null;
        
        console.log(`[navigate_to_page] input="${args.page}", normalized="${normalizedPage}", url="${url}", subtab="${subtab}"`);
        
        return { 
          success: true,
          visual_type: 'navigation',
          navigate_to: url,
          tab: subtab, // Pass subtab explicitly for the navigation bridge
          message: `Navigating to ${args.page}...`
        };
      }
      
      // ===== DEEP NAVIGATION TO SPECIFIC ITEMS =====
      case "navigate_to_specific_item": {
        const itemType = args.item_type;
        // Check BOTH search and filter for the search term (AI sometimes uses wrong param)
        let searchTerm = (args.search || args.filter || 'latest').toLowerCase().trim();
        
        // Normalize common variations
        if (searchTerm === 'last' || searchTerm === 'newest' || searchTerm === 'most recent' || searchTerm === 'recent') {
          searchTerm = 'latest';
        }
        if (searchTerm === 'first') {
          searchTerm = 'oldest';
        }
        
        // Create normalized version without hyphens/spaces for fuzzy matching
        const normalizedSearch = searchTerm.replace(/[-\s]/g, '').toLowerCase();
        const numbersOnly = searchTerm.replace(/\D/g, '');
        
        console.log(`[navigate_to_specific_item] itemType=${itemType}, searchTerm=${searchTerm}, normalized=${normalizedSearch}, numbersOnly=${numbersOnly}`);
        
        let item = null;
        let url = '/admin';
        let itemName = '';
        
        if (itemType === 'project') {
          let data = null;
          
          if (searchTerm === 'latest') {
            const result = await supabase.from('projects').select('id, name, status, address').order('created_at', { ascending: false }).limit(1);
            data = result.data;
          } else if (searchTerm === 'oldest') {
            const result = await supabase.from('projects').select('id, name, status, address').order('created_at', { ascending: true }).limit(1);
            data = result.data;
          } else {
            // Try multiple search strategies for fuzzy matching
            // Strategy 1: Search name and address with original term
            let result = await supabase.from('projects')
              .select('id, name, status, address')
              .or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`)
              .limit(1);
            data = result.data;
            
            // Strategy 2: If no result, try normalized (no hyphens/spaces)
            if (!data?.length && normalizedSearch !== searchTerm) {
              result = await supabase.from('projects')
                .select('id, name, status, address')
                .or(`name.ilike.%${normalizedSearch}%,address.ilike.%${normalizedSearch}%`)
                .limit(1);
              data = result.data;
            }
            
            // Strategy 3: If still no result and has numbers, try numbers only
            if (!data?.length && numbersOnly.length >= 3) {
              result = await supabase.from('projects')
                .select('id, name, status, address')
                .or(`name.ilike.%${numbersOnly}%,address.ilike.%${numbersOnly}%`)
                .limit(1);
              data = result.data;
            }
          }
          
          console.log(`[navigate_to_specific_item] Project query result:`, data);
          
          if (data?.length) {
            item = data[0];
            url = `/admin/projects/${item.id}`;
            itemName = item.name || item.address || 'Project';
          }
        } else if (itemType === 'lead') {
          let data = null;
          
          if (searchTerm === 'latest') {
            const result = await supabase.from('leads').select('id, name, status, email, phone').order('created_at', { ascending: false }).limit(1);
            data = result.data;
          } else if (searchTerm === 'oldest') {
            const result = await supabase.from('leads').select('id, name, status, email, phone').order('created_at', { ascending: true }).limit(1);
            data = result.data;
          } else {
            // Search name, email, and phone
            let result = await supabase.from('leads')
              .select('id, name, status, email, phone')
              .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
              .limit(1);
            data = result.data;
            
            // Fallback: normalized search
            if (!data?.length && normalizedSearch !== searchTerm) {
              result = await supabase.from('leads')
                .select('id, name, status, email, phone')
                .or(`name.ilike.%${normalizedSearch}%,email.ilike.%${normalizedSearch}%`)
                .limit(1);
              data = result.data;
            }
          }
          
          if (data?.length) {
            item = data[0];
            url = `/admin/leads/${item.id}`;
            itemName = item.name || item.email || 'Lead';
          }
        } else if (itemType === 'invoice') {
          let data = null;
          
          if (searchTerm === 'latest') {
            const result = await supabase.from('invoices').select('id, invoice_number, customer_name, status').order('created_at', { ascending: false }).limit(1);
            data = result.data;
          } else if (searchTerm === 'oldest') {
            const result = await supabase.from('invoices').select('id, invoice_number, customer_name, status').order('created_at', { ascending: true }).limit(1);
            data = result.data;
          } else {
            const result = await supabase.from('invoices')
              .select('id, invoice_number, customer_name, status')
              .or(`invoice_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%`)
              .limit(1);
            data = result.data;
          }
          
          if (data?.length) {
            item = data[0];
            url = `/admin/invoices/${item.id}`;
            itemName = item.invoice_number || item.customer_name || 'Invoice';
          }
        } else if (itemType === 'employee') {
          let data = null;
          
          if (searchTerm === 'latest') {
            const result = await supabase.from('team_directory').select('user_id, full_name, role').order('created_at', { ascending: false }).limit(1);
            data = result.data;
          } else {
            const result = await supabase.from('team_directory')
              .select('user_id, full_name, role')
              .ilike('full_name', `%${searchTerm}%`)
              .limit(1);
            data = result.data;
          }
          
          if (data?.length) {
            item = data[0];
            url = `/admin/team/${item.user_id}`;
            itemName = item.full_name || 'Employee';
          }
        }
        
        if (!item) {
          console.log(`[navigate_to_specific_item] No ${itemType} found for search: ${searchTerm}`);
          return { 
            success: false, 
            message: `Couldn't find that ${itemType}. Try a different search term.`
          };
        }
        
        return { 
          success: true,
          visual_type: 'navigation',
          navigate_to: url,
          message: `Opening ${itemName}...`,
          item: item
        };
      }
      
      // ===== AGENTIC TOOLS (Context, Edit, Download) =====
      case "get_current_context": {
        // This tool returns what the frontend sends as context
        // The actual context is passed from the frontend in args.current_context
        return {
          success: true,
          context: args.current_context || {
            page: 'unknown',
            project_id: null,
            tab: null,
            message: 'Context not provided. Ask user where they are.'
          },
          message: 'Current context retrieved'
        };
      }
      
      case "edit_current_project": {
        if (!args.field || !args.new_value) {
          return { 
            success: false, 
            error: 'Missing field or new_value',
            message: 'I need to know what to edit and the new value.' 
          };
        }
        
        // Get project ID from args or context
        let projectId = args.project_id || args.current_context?.project_id;
        
        if (!projectId) {
          return { 
            success: false, 
            error: 'No project context',
            message: "I'm not sure which project to edit. Can you navigate to the project first, or tell me the project name?" 
          };
        }
        
        // Map field names to database columns
        const fieldMap: Record<string, string> = {
          name: 'name',
          address: 'address',
          status: 'status',
          customer_name: 'customer_name',
          customer_email: 'customer_email',
          customer_phone: 'customer_phone',
          notes: 'notes'
        };
        
        const dbField = fieldMap[args.field];
        if (!dbField) {
          return { 
            success: false, 
            error: 'Invalid field',
            message: `I can't edit "${args.field}". I can edit: name, address, status, customer_name, customer_email, customer_phone, or notes.` 
          };
        }
        
        // Perform the update
        const updateData: Record<string, any> = {
          [dbField]: args.new_value,
          updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('projects')
          .update(updateData)
          .eq('id', projectId)
          .select('id, name, status, address')
          .single();
        
        if (error) {
          console.error('[edit_current_project] Error:', error);
          return { 
            success: false, 
            error: error.message,
            message: 'Failed to update the project.' 
          };
        }
        
        return { 
          success: true,
          visual_type: 'success_card',
          action_completed: 'edit_project',
          project: data,
          message: `Updated ${args.field} to "${args.new_value}". Refreshing the page...`,
          trigger_refresh: true
        };
      }
      
      case "download_pdf": {
        // This is handled client-side, but we acknowledge the request
        return { 
          success: true,
          visual_type: 'download_pdf',
          action: 'trigger_download',
          message: 'Starting download...'
        };
      }
      
      // ===== EXISTING READ TOOLS =====
      case "query_projects": {
        let query = supabase.from('projects').select(`
          id, name, status, address, customer_email, project_type, project_category, roof_type,
          created_at, updated_at, start_date, end_date, customer_rating, is_featured,
          budget_labor, budget_materials
        `);
        if (args.status && args.status !== 'all') query = query.eq('status', args.status);
        if (args.search) query = query.or(`name.ilike.%${args.search}%,address.ilike.%${args.search}%`);
        query = query.order('updated_at', { ascending: false }).limit(args.limit || 10);
        const { data: projectsData, error } = await query;
        if (error) throw error;
        
        // Fetch best photo for each project
        const projectsWithPhotos = await Promise.all((projectsData || []).map(async (project) => {
          const { data: photos } = await supabase
            .from('project_photos')
            .select('id, photo_url, photo_tag, is_highlighted_after, is_highlighted_before')
            .eq('project_id', project.id)
            .order('is_highlighted_after', { ascending: false, nullsFirst: false })
            .limit(5);
          
          let bestPhoto = null;
          if (photos && photos.length > 0) {
            bestPhoto = photos.find(p => p.is_highlighted_after) ||
                       photos.find(p => p.photo_tag === 'after') ||
                       photos.find(p => p.is_highlighted_before) ||
                       photos[0];
          }
          
          const { count: teamCount } = await supabase
            .from('project_team_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);
          
          const daysSinceUpdate = Math.floor((Date.now() - new Date(project.updated_at).getTime()) / (1000 * 60 * 60 * 24));
          
          return {
            ...project,
            photo_url: bestPhoto?.photo_url || null,
            photo_tag: bestPhoto?.photo_tag || null,
            team_count: teamCount || 0,
            days_since_update: daysSinceUpdate,
            photo_count: photos?.length || 0,
          };
        }));
        
        return { 
          projects: projectsWithPhotos, 
          count: projectsWithPhotos.length,
          visual_type: 'project_cards'
        };
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
        
        const { data: invoices } = await supabase.from('invoices')
          .select('id, invoice_number, total_amount, balance_due, status, due_date, paid_at')
          .eq('project_id', projectData.id);
        
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
          materials: materials || [],
          visual_type: 'financial_chart',
          chart_data: [
            { name: 'Paid', value: totalPaid, color: '#22c55e' },
            { name: 'Due', value: totalDue, color: '#f59e0b' },
            { name: 'Materials', value: materialCost, color: '#3b82f6' }
          ]
        };
      }
      
      case "query_leads": {
        let query = supabase.from('leads').select('id, name, email, phone, status, source, project_type, address, notes, created_at');
        if (args.status && args.status !== 'all') query = query.eq('status', args.status);
        if (args.search) query = query.or(`name.ilike.%${args.search}%,email.ilike.%${args.search}%,phone.ilike.%${args.search}%`);
        query = query.order('created_at', { ascending: false }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        
        return { leads: data, count: data.length, visual_type: 'lead_list' };
      }
      
      case "query_schedules": {
        const today = new Date().toISOString().split('T')[0];
        let query = supabase.from('job_schedules').select('id, job_name, start_time, end_time, location, status, priority, assigned_users');
        if (args.start_date) query = query.gte('start_time', args.start_date);
        else query = query.gte('start_time', today);
        if (args.end_date) query = query.lte('start_time', args.end_date + 'T23:59:59');
        if (args.status && args.status !== 'all') query = query.eq('status', args.status);
        query = query.order('start_time', { ascending: true }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        
        const processedSchedules = (data || []).map(schedule => {
          let assignedNames: string[] = [];
          if (Array.isArray(schedule.assigned_users)) {
            assignedNames = schedule.assigned_users.map((u: any) => {
              if (typeof u === 'string') return u;
              if (typeof u === 'object' && u !== null) return u.name || u.full_name || u.id || 'Unknown';
              return 'Unknown';
            });
          }
          return { ...schedule, assigned_users: assignedNames };
        });
        
        return { schedules: processedSchedules, count: processedSchedules.length, today, visual_type: 'schedule_list' };
      }
      
      case "query_employees": {
        let query = supabase.from('team_directory').select('user_id, email, full_name, role, status, phone_number, created_at');
        if (args.role) query = query.eq('role', args.role);
        if (args.status && args.status !== 'all') query = query.eq('status', args.status);
        else query = query.eq('status', 'active');
        if (args.search) query = query.or(`full_name.ilike.%${args.search}%,email.ilike.%${args.search}%`);
        query = query.order('full_name', { ascending: true }).limit(30);
        const { data, error } = await query;
        if (error) throw error;
        
        return { employees: data, count: data.length, visual_type: 'employee_list' };
      }
      
      case "get_dashboard_stats": {
        const results: any = { visual_type: 'dashboard_stats' };
        
        const { count: totalProjects } = await supabase.from('projects').select('*', { count: 'exact', head: true });
        const { count: activeProjects } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active');
        const { count: completedProjects } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'completed');
        
        const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });
        const { count: newLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new');
        
        const { data: invoices } = await supabase.from('invoices').select('total_amount, balance_due, status');
        const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
        const totalDue = invoices?.reduce((sum, inv) => sum + (inv.balance_due || 0), 0) || 0;
        const paidInvoices = invoices?.filter(i => i.status === 'paid').length || 0;
        
        const { count: totalEmployees } = await supabase.from('team_directory').select('*', { count: 'exact', head: true }).eq('status', 'active');
        
        results.stats = {
          projects: { total: totalProjects, active: activeProjects, completed: completedProjects },
          leads: { total: totalLeads, new: newLeads },
          revenue: { total: totalRevenue, outstanding: totalDue, paid_invoices: paidInvoices },
          team: { total: totalEmployees }
        };
        
        results.chart_data = [
          { name: 'Active Projects', value: activeProjects || 0, color: '#3b82f6' },
          { name: 'Completed', value: completedProjects || 0, color: '#22c55e' },
          { name: 'New Leads', value: newLeads || 0, color: '#f59e0b' }
        ];
        
        return results;
      }
      
      case "query_invoices": {
        let query = supabase.from('invoices').select('id, invoice_number, customer_name, project_name, total_amount, balance_due, status, due_date, created_at');
        if (args.status === 'unpaid') {
          query = query.gt('balance_due', 0);
        } else if (args.status === 'overdue') {
          query = query.gt('balance_due', 0).lt('due_date', new Date().toISOString().split('T')[0]);
        } else if (args.status && args.status !== 'all') {
          query = query.eq('status', args.status);
        }
        if (args.project_id) query = query.eq('project_id', args.project_id);
        query = query.order('created_at', { ascending: false }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        
        const totalAmount = data.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const totalDue = data.reduce((sum, inv) => sum + (inv.balance_due || 0), 0);
        
        return { 
          invoices: data, 
          count: data.length, 
          total_amount: totalAmount, 
          total_due: totalDue,
          visual_type: 'invoice_list'
        };
      }
      
      case "query_materials": {
        let query = supabase.from('materials').select('id, name, category, unit, total, status, image_url');
        if (args.category) query = query.eq('category', args.category);
        if (args.search) query = query.ilike('name', `%${args.search}%`);
        query = query.order('name', { ascending: true }).limit(30);
        const { data, error } = await query;
        if (error) throw error;
        
        return { materials: data, count: data.length, visual_type: 'material_list' };
      }
      
      case "get_attendance_data": {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        
        const startDate = args.start_date || startOfWeek.toISOString().split('T')[0];
        const endDate = args.end_date || today.toISOString().split('T')[0];
        
        let query = supabase.from('time_clock')
          .select('id, user_id, employee_name, employee_role, clock_in, clock_out, total_hours, project_name, location, status, break_time_minutes')
          .gte('clock_in', startDate + 'T00:00:00')
          .lte('clock_in', endDate + 'T23:59:59')
          .order('clock_in', { ascending: false });
        
        if (args.employee_name) {
          query = query.ilike('employee_name', `%${args.employee_name}%`);
        }
        
        const { data: entries, error } = await query.limit(100);
        if (error) throw error;
        
        const totalHours = (entries || []).reduce((sum, e) => sum + (Number(e.total_hours) || 0), 0);
        const uniqueEmployees = new Set((entries || []).map(e => e.employee_name)).size;
        const daysWorked = new Set((entries || []).map(e => e.clock_in?.split('T')[0])).size;
        
        const byEmployee: Record<string, number> = {};
        (entries || []).forEach(e => {
          const name = e.employee_name || 'Unknown';
          byEmployee[name] = (byEmployee[name] || 0) + (Number(e.total_hours) || 0);
        });
        
        const byDay: Record<string, number> = {};
        (entries || []).forEach(e => {
          const day = e.clock_in?.split('T')[0] || 'Unknown';
          byDay[day] = (byDay[day] || 0) + (Number(e.total_hours) || 0);
        });
        
        const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
        
        const chartData = Object.entries(byEmployee)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 7)
          .map(([name, hours], idx) => ({
            name: name.split(' ')[0],
            value: Math.round(hours * 10) / 10,
            color: colors[idx % colors.length]
          }));
        
        const dailyChart = Object.entries(byDay)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, hours], idx) => ({
            name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            value: Math.round(hours * 10) / 10,
            color: colors[idx % colors.length]
          }));
        
        return {
          visual_type: 'attendance_chart',
          period: { start: startDate, end: endDate },
          summary: {
            total_hours: Math.round(totalHours * 10) / 10,
            unique_employees: uniqueEmployees,
            days_with_activity: daysWorked,
            entry_count: (entries || []).length
          },
          chart_data: chartData,
          daily_chart: dailyChart,
          entries: (entries || []).slice(0, 10).map(e => ({
            employee: e.employee_name,
            date: e.clock_in?.split('T')[0],
            hours: Math.round((Number(e.total_hours) || 0) * 10) / 10,
            project: e.project_name,
            status: e.status
          }))
        };
      }
      
      // ===== CREATE TOOLS =====
      case "create_lead": {
        if (!args.name) {
          return { 
            visual_type: 'input_form',
            form_type: 'create_lead',
            message: "I'll help you create a new lead. Please provide the information:",
            fields: [
              { name: 'name', label: 'Full Name', required: true, type: 'text' },
              { name: 'email', label: 'Email', required: false, type: 'email' },
              { name: 'phone', label: 'Phone', required: false, type: 'tel' },
              { name: 'address', label: 'Property Address', required: false, type: 'text' },
              { name: 'source', label: 'Lead Source', required: false, type: 'select', options: ['website', 'referral', 'social', 'phone', 'other'] }
            ]
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
          message: `Lead "${args.name}" created successfully!`,
          visual_type: 'success_card',
          action_completed: 'create_lead',
          data_modified: ['leads']
        };
      }
      
      case "create_project": {
        if (!args.name) {
          return { 
            visual_type: 'input_form',
            form_type: 'create_project',
            message: "I'll help you create a new project. Please provide the information:",
            fields: [
              { name: 'name', label: 'Project Name', required: true, type: 'text' },
              { name: 'property_address', label: 'Property Address', required: true, type: 'text' },
              { name: 'customer_name', label: 'Customer Name', required: false, type: 'text' },
              { name: 'customer_email', label: 'Customer Email', required: false, type: 'email' },
              { name: 'customer_phone', label: 'Customer Phone', required: false, type: 'tel' }
            ]
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
          message: `Project "${args.name}" created successfully!`,
          visual_type: 'success_card',
          action_completed: 'create_project',
          data_modified: ['projects']
        };
      }
      
      case "create_schedule": {
        if (!args.job_name || !args.start_date) {
          return { 
            visual_type: 'input_form',
            form_type: 'create_schedule',
            message: "I'll help you schedule a job. Please provide the information:",
            fields: [
              { name: 'job_name', label: 'Job Name', required: true, type: 'text' },
              { name: 'location', label: 'Location', required: false, type: 'text' },
              { name: 'start_date', label: 'Date', required: true, type: 'date' },
              { name: 'start_time', label: 'Start Time', required: false, type: 'time' },
              { name: 'end_time', label: 'End Time', required: false, type: 'time' },
              { name: 'assigned_to', label: 'Assign To', required: false, type: 'text' }
            ]
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
          message: `Job "${args.job_name}" scheduled for ${args.start_date}!`,
          visual_type: 'success_card',
          action_completed: 'create_schedule',
          data_modified: ['schedules']
        };
      }
      
      // ===== UPDATE TOOLS =====
      case "update_lead_status": {
        let leadId = args.lead_id;
        let leadData;
        
        if (args.lead_name) {
          const { data } = await supabase.from('leads')
            .select('id, name, status')
            .ilike('name', `%${args.lead_name}%`)
            .limit(1);
          if (data && data.length > 0) {
            leadData = data[0];
            leadId = leadData.id;
          }
        } else if (leadId) {
          const { data } = await supabase.from('leads').select('id, name, status').eq('id', leadId).single();
          leadData = data;
        }
        
        if (!leadData) {
          return { success: false, error: `Lead not found. Please provide a valid lead name.` };
        }
        
        const previousStatus = leadData.status;
        const { error } = await supabase.from('leads')
          .update({ status: args.new_status, updated_at: new Date().toISOString() })
          .eq('id', leadId);
        
        if (error) {
          return { success: false, error: error.message };
        }
        
        return { 
          success: true, 
          lead_name: leadData.name,
          previous_status: previousStatus,
          new_status: args.new_status,
          message: `Updated "${leadData.name}" from "${previousStatus}" to "${args.new_status}"`,
          visual_type: 'status_update',
          data_modified: ['leads'],
          status_steps: [
            { name: 'New', completed: true },
            { name: 'Contacted', completed: ['contacted', 'qualified', 'ready_to_quote', 'quoted', 'proposal_sent', 'won'].includes(args.new_status) },
            { name: 'Quoted', completed: ['quoted', 'proposal_sent', 'won'].includes(args.new_status) },
            { name: 'Won', completed: args.new_status === 'won' }
          ]
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
          message: `Updated "${projectData.name}" from "${previousStatus}" to "${args.new_status}"`,
          visual_type: 'status_update',
          data_modified: ['projects'],
          status_steps: [
            { name: 'Pending', completed: true },
            { name: 'Active', completed: ['active', 'in_progress', 'completed'].includes(args.new_status) },
            { name: 'In Progress', completed: ['in_progress', 'completed'].includes(args.new_status) },
            { name: 'Completed', completed: args.new_status === 'completed' }
          ]
        };
      }
      
      // ===== PDF REPORT TOOLS =====
      case "generate_pdf_report": {
        const reportType = args.report_type;
        
        switch (reportType) {
          case 'timesheet': {
            const now = new Date();
            const weekStart = args.week_start ? new Date(args.week_start) : new Date(now.setDate(now.getDate() - now.getDay() + 1));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            const isAllEmployees = args.all_employees || args.employee_name?.toLowerCase() === 'all';
            
            if (isAllEmployees) {
              const { data: employees } = await supabase.from('team_directory')
                .select('user_id, full_name, email, role')
                .eq('status', 'active');
              
              const timesheets = await Promise.all((employees || []).map(async (emp) => {
                const { data: entries } = await supabase.from('time_clock')
                  .select('clock_in, clock_out, total_hours, break_time_minutes, project_name')
                  .eq('user_id', emp.user_id)
                  .gte('clock_in', weekStart.toISOString().split('T')[0] + 'T00:00:00')
                  .lte('clock_in', weekEnd.toISOString().split('T')[0] + 'T23:59:59');
                
                const totalHours = (entries || []).reduce((sum, e) => sum + (Number(e.total_hours) || 0), 0);
                
                return {
                  employee: emp,
                  entries: entries || [],
                  totalHours: totalHours
                };
              }));
              
              const employeesWithHours = timesheets.filter(t => t.totalHours > 0);
              const grandTotalHours = employeesWithHours.reduce((sum, t) => sum + t.totalHours, 0);
              
              return {
                visual_type: 'pdf_report',
                report_type: 'timesheet_all',
                title: 'All Employee Timesheets',
                subtitle: `Week of ${weekStart.toISOString().split('T')[0]}`,
                data: {
                  timesheets: employeesWithHours,
                  weekStart: weekStart.toISOString().split('T')[0],
                  grandTotalHours: grandTotalHours
                },
                message: `Ready! ${employeesWithHours.length} employees worked ${grandTotalHours.toFixed(1)} total hours.`
              };
            } else {
              let employeeData;
              if (args.employee_id) {
                const { data } = await supabase.from('team_directory')
                  .select('user_id, full_name, email, role')
                  .eq('user_id', args.employee_id)
                  .single();
                employeeData = data;
              } else if (args.employee_name) {
                const { data } = await supabase.from('team_directory')
                  .select('user_id, full_name, email, role')
                  .ilike('full_name', `%${args.employee_name}%`)
                  .limit(1);
                if (data && data.length > 0) employeeData = data[0];
              }
              
              if (!employeeData) {
                return { 
                  error: 'Employee not found. Please provide an employee name or say "all employees".',
                  visual_type: 'input_form',
                  form_type: 'timesheet_report',
                  message: "Who's timesheet would you like?",
                  fields: [
                    { name: 'employee_name', label: 'Employee Name', required: true, type: 'text' }
                  ]
                };
              }
              
              const { data: entries } = await supabase.from('time_clock')
                .select('id, clock_in, clock_out, total_hours, break_time_minutes, project_name, status, notes')
                .eq('user_id', employeeData.user_id)
                .gte('clock_in', weekStart.toISOString().split('T')[0] + 'T00:00:00')
                .lte('clock_in', weekEnd.toISOString().split('T')[0] + 'T23:59:59')
                .order('clock_in', { ascending: true });
              
              const totalHours = (entries || []).reduce((sum, e) => sum + (Number(e.total_hours) || 0), 0);
              const totalBreakMinutes = (entries || []).reduce((sum, e) => sum + (Number(e.break_time_minutes) || 0), 0);
              
              return {
                visual_type: 'pdf_report',
                report_type: 'timesheet',
                title: `Timesheet: ${employeeData.full_name}`,
                subtitle: `Week of ${weekStart.toISOString().split('T')[0]}`,
                data: {
                  employeeName: employeeData.full_name,
                  classCode: employeeData.role,
                  weekStart: weekStart.toISOString().split('T')[0],
                  entries: entries || [],
                  totalRegularHours: totalHours,
                  totalBreakMinutes: totalBreakMinutes
                },
                message: `Ready to download timesheet for ${employeeData.full_name}. Total hours: ${totalHours.toFixed(1)}`
              };
            }
          }
          
          case 'invoice': {
            let invoiceData;
            if (args.invoice_id) {
              const { data } = await supabase.from('invoices')
                .select('*, projects(name, address)')
                .eq('id', args.invoice_id)
                .single();
              invoiceData = data;
            } else if (args.project_name) {
              const { data: projects } = await supabase.from('projects')
                .select('id')
                .ilike('name', `%${args.project_name}%`)
                .limit(1);
              if (projects && projects.length > 0) {
                const { data } = await supabase.from('invoices')
                  .select('*, projects(name, address)')
                  .eq('project_id', projects[0].id)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single();
                invoiceData = data;
              }
            }
            
            if (!invoiceData) {
              return {
                error: 'Invoice not found.',
                message: 'Could not find an invoice. Please specify a project name or invoice ID.'
              };
            }
            
            return {
              visual_type: 'pdf_report',
              report_type: 'invoice',
              title: `Invoice #${invoiceData.invoice_number}`,
              subtitle: invoiceData.customer_name || invoiceData.projects?.name,
              data: {
                invoiceNumber: invoiceData.invoice_number,
                date: invoiceData.created_at?.split('T')[0],
                dueDate: invoiceData.due_date?.split('T')[0],
                customerName: invoiceData.customer_name || '',
                customerContact: invoiceData.customer_email || '',
                projectAddress: invoiceData.projects?.address || '',
                projectNumber: invoiceData.project_id?.slice(0, 8) || '',
                description: invoiceData.description || 'Roofing Services',
                total: invoiceData.total_amount || 0,
                tax: invoiceData.tax || 0,
                balanceDue: invoiceData.balance_due || invoiceData.total_amount || 0
              },
              message: `Ready to download Invoice #${invoiceData.invoice_number} for $${(invoiceData.total_amount || 0).toLocaleString()}`
            };
          }
          
          case 'proposal': {
            let proposalData;
            if (args.proposal_id) {
              const { data } = await supabase.from('proposals')
                .select('*')
                .eq('id', args.proposal_id)
                .single();
              proposalData = data;
            } else if (args.project_name) {
              const { data } = await supabase.from('proposals')
                .select('*')
                .ilike('property_address', `%${args.project_name}%`)
                .order('created_at', { ascending: false })
                .limit(1);
              if (data && data.length > 0) proposalData = data[0];
            }
            
            if (!proposalData) {
              return {
                error: 'Proposal not found.',
                message: 'Could not find a proposal. Please specify a project name or proposal ID.'
              };
            }
            
            const { data: quotes } = await supabase.from('proposal_quotes')
              .select('*')
              .eq('proposal_id', proposalData.id);
            
            const { data: pricingItems } = await supabase.from('proposal_pricing_items')
              .select('*')
              .eq('proposal_id', proposalData.id);
            
            return {
              visual_type: 'pdf_report',
              report_type: 'proposal',
              title: `Proposal #${proposalData.proposal_number}`,
              subtitle: proposalData.property_address,
              data: {
                proposal: proposalData,
                quotes: quotes || [],
                pricingItems: pricingItems || [],
                comparisonBlocks: []
              },
              message: `Ready to download Proposal #${proposalData.proposal_number}`
            };
          }
          
          case 'project_summary': {
            let projectData;
            if (args.project_id) {
              const { data } = await supabase.from('projects')
                .select('*')
                .eq('id', args.project_id)
                .single();
              projectData = data;
            } else if (args.project_name) {
              const { data } = await supabase.from('projects')
                .select('*')
                .ilike('name', `%${args.project_name}%`)
                .limit(1);
              if (data && data.length > 0) projectData = data[0];
            }
            
            if (!projectData) {
              return {
                error: 'Project not found.',
                message: 'Could not find the project. Please specify a project name.',
                visual_type: 'input_form',
                form_type: 'project_summary',
                fields: [
                  { name: 'project_name', label: 'Project Name', required: true, type: 'text' }
                ]
              };
            }
            
            const { data: invoices } = await supabase.from('invoices')
              .select('total_amount, balance_due, status')
              .eq('project_id', projectData.id);
            
            const { data: materials } = await supabase.from('project_materials')
              .select('total_cost')
              .eq('project_id', projectData.id);
            
            const totalInvoiced = (invoices || []).reduce((sum, i) => sum + (i.total_amount || 0), 0);
            const totalPaid = (invoices || []).filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0);
            const totalDue = (invoices || []).reduce((sum, i) => sum + (i.balance_due || 0), 0);
            const materialCost = (materials || []).reduce((sum, m) => sum + (m.total_cost || 0), 0);
            
            return {
              visual_type: 'pdf_report',
              report_type: 'project_summary',
              title: `Project Summary: ${projectData.name}`,
              subtitle: projectData.address || projectData.status,
              data: {
                project: projectData,
                financials: {
                  total_invoiced: totalInvoiced,
                  total_paid: totalPaid,
                  total_due: totalDue,
                  material_cost: materialCost,
                  profit: totalPaid - materialCost,
                  profit_margin: totalPaid > 0 ? ((totalPaid - materialCost) / totalPaid * 100).toFixed(1) : 0
                }
              },
              message: `Ready to download summary for "${projectData.name}"`
            };
          }
          
          default:
            return { error: `Unknown report type: ${reportType}` };
        }
      }
      
      // ===== DELETE HANDLERS =====
      case "delete_lead": {
        let leadId = args.lead_id;
        if (!leadId && args.lead_name) {
          const { data } = await supabase.from('leads')
            .select('id, name')
            .ilike('name', `%${args.lead_name}%`)
            .limit(1);
          if (data?.length) leadId = data[0].id;
        }
        if (!leadId) return { success: false, error: 'Lead not found' };
        
        const { error } = await supabase.from('leads').delete().eq('id', leadId);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Lead deleted successfully!`,
          visual_type: 'success_card',
          data_modified: ['leads']
        };
      }
      
      case "delete_project": {
        let projectId = args.project_id;
        if (!projectId && args.project_name) {
          const { data } = await supabase.from('projects')
            .select('id, name')
            .ilike('name', `%${args.project_name}%`)
            .limit(1);
          if (data?.length) projectId = data[0].id;
        }
        if (!projectId) return { success: false, error: 'Project not found' };
        
        const { error } = await supabase.from('projects').delete().eq('id', projectId);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Project deleted successfully!`,
          visual_type: 'success_card',
          data_modified: ['projects']
        };
      }
      
      case "delete_schedule": {
        let scheduleId = args.schedule_id;
        if (!scheduleId && args.job_name) {
          const { data } = await supabase.from('job_schedules')
            .select('id')
            .ilike('job_name', `%${args.job_name}%`)
            .limit(1);
          if (data?.length) scheduleId = data[0].id;
        }
        if (!scheduleId) return { success: false, error: 'Schedule not found' };
        
        const { error } = await supabase.from('job_schedules').delete().eq('id', scheduleId);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Schedule deleted!`,
          visual_type: 'success_card',
          data_modified: ['schedules']
        };
      }
      
      case "delete_work_order": {
        let woId = args.work_order_id;
        if (!woId && args.work_order_title) {
          const { data } = await supabase.from('work_orders')
            .select('id')
            .ilike('title', `%${args.work_order_title}%`)
            .limit(1);
          if (data?.length) woId = data[0].id;
        }
        if (!woId) return { success: false, error: 'Work order not found' };
        
        const { error } = await supabase.from('work_orders').delete().eq('id', woId);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Work order deleted!`,
          visual_type: 'success_card',
          data_modified: ['work-orders']
        };
      }
      
      case "delete_service_ticket": {
        let ticketId = args.ticket_id;
        if (!ticketId && args.ticket_title) {
          const { data } = await supabase.from('service_tickets')
            .select('id')
            .ilike('title', `%${args.ticket_title}%`)
            .limit(1);
          if (data?.length) ticketId = data[0].id;
        }
        if (!ticketId) return { success: false, error: 'Service ticket not found' };
        
        const { error } = await supabase.from('service_tickets').delete().eq('id', ticketId);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Service ticket deleted!`,
          visual_type: 'success_card',
          data_modified: ['service-tickets']
        };
      }
      
      case "delete_expense": {
        let expenseId = args.expense_id;
        if (!expenseId && args.description) {
          const { data } = await supabase.from('expenses')
            .select('id')
            .ilike('description', `%${args.description}%`)
            .limit(1);
          if (data?.length) expenseId = data[0].id;
        }
        if (!expenseId) return { success: false, error: 'Expense not found' };
        
        const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Expense deleted!`,
          visual_type: 'success_card',
          data_modified: ['expenses']
        };
      }
      
      case "delete_purchase_order": {
        let poId = args.po_id;
        if (!poId && (args.po_number || args.vendor_name)) {
          let query = supabase.from('purchase_orders').select('id');
          if (args.po_number) query = query.ilike('po_number', `%${args.po_number}%`);
          if (args.vendor_name) query = query.ilike('vendor_name', `%${args.vendor_name}%`);
          const { data } = await query.limit(1);
          if (data?.length) poId = data[0].id;
        }
        if (!poId) return { success: false, error: 'Purchase order not found' };
        
        const { error } = await supabase.from('purchase_orders').delete().eq('id', poId);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Purchase order deleted!`,
          visual_type: 'success_card',
          data_modified: ['purchase-orders']
        };
      }
      
      case "delete_invoice": {
        let invoiceId = args.invoice_id;
        if (!invoiceId && args.invoice_number) {
          const { data } = await supabase.from('invoices')
            .select('id')
            .ilike('invoice_number', `%${args.invoice_number}%`)
            .limit(1);
          if (data?.length) invoiceId = data[0].id;
        }
        if (!invoiceId) return { success: false, error: 'Invoice not found' };
        
        const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Invoice deleted!`,
          visual_type: 'success_card',
          data_modified: ['invoices']
        };
      }
      
      case "delete_bill": {
        let billId = args.bill_id;
        if (!billId && args.bill_number) {
          const { data } = await supabase.from('bills')
            .select('id')
            .ilike('bill_number', `%${args.bill_number}%`)
            .limit(1);
          if (data?.length) billId = data[0].id;
        }
        if (!billId) return { success: false, error: 'Bill not found' };
        
        const { error } = await supabase.from('bills').delete().eq('id', billId);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Bill deleted!`,
          visual_type: 'success_card',
          data_modified: ['bills']
        };
      }
      
      case "delete_inspection": {
        const { error } = await supabase.from('project_inspections').delete().eq('id', args.inspection_id);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Inspection deleted!`,
          visual_type: 'success_card',
          data_modified: ['inspections']
        };
      }
      
      case "delete_punchlist": {
        const { error } = await supabase.from('punchlist_items').delete().eq('id', args.punchlist_id);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Punchlist item deleted!`,
          visual_type: 'success_card',
          data_modified: ['punchlists']
        };
      }
      
      case "delete_daily_log": {
        const { error } = await supabase.from('daily_log_entries').delete().eq('id', args.log_id);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Daily log deleted!`,
          visual_type: 'success_card',
          data_modified: ['daily-logs']
        };
      }
      
      case "delete_permit": {
        const { error } = await supabase.from('permits').delete().eq('id', args.permit_id);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Permit deleted!`,
          visual_type: 'success_card',
          data_modified: ['permits']
        };
      }
      
      case "delete_contact": {
        let contactId = args.contact_id;
        if (!contactId && args.company_name) {
          const { data } = await supabase.from('directory_contacts')
            .select('id')
            .ilike('company_name', `%${args.company_name}%`)
            .limit(1);
          if (data?.length) contactId = data[0].id;
        }
        if (!contactId) return { success: false, error: 'Contact not found' };
        
        const { error } = await supabase.from('directory_contacts').delete().eq('id', contactId);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Contact deleted!`,
          visual_type: 'success_card',
          data_modified: ['directory-contacts']
        };
      }
      
      case "delete_team_member": {
        let userId = args.user_id;
        if (!userId && args.name) {
          const { data } = await supabase.from('team_directory')
            .select('user_id')
            .ilike('full_name', `%${args.name}%`)
            .limit(1);
          if (data?.length) userId = data[0].user_id;
        }
        if (!userId) return { success: false, error: 'Team member not found' };
        
        // Soft delete - mark as inactive
        const { error } = await supabase.from('team_directory')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Team member deactivated!`,
          visual_type: 'success_card',
          data_modified: ['team-directory', 'employees']
        };
      }
      
      case "delete_change_order": {
        let coId = args.change_order_id;
        if (!coId && args.co_number) {
          const { data } = await supabase.from('change_orders')
            .select('id')
            .ilike('co_number', `%${args.co_number}%`)
            .limit(1);
          if (data?.length) coId = data[0].id;
        }
        if (!coId) return { success: false, error: 'Change order not found' };
        
        const { error } = await supabase.from('change_orders').delete().eq('id', coId);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Change order deleted!`,
          visual_type: 'success_card',
          data_modified: ['change-orders']
        };
      }
      
      // ===== FINANCIAL CRUD HANDLERS =====
      case "create_invoice": {
        if (!args.customer_name) {
          return { 
            visual_type: 'input_form',
            form_type: 'create_invoice',
            message: "I'll create an invoice. Who's the customer?",
            fields: [
              { name: 'customer_name', label: 'Customer Name', required: true, type: 'text' },
              { name: 'total_amount', label: 'Amount ($)', required: true, type: 'number' },
              { name: 'description', label: 'Description', required: false, type: 'textarea' },
              { name: 'due_date', label: 'Due Date', required: false, type: 'date' }
            ]
          };
        }
        
        let projectId = null;
        if (args.project_name) {
          const { data } = await supabase.from('projects')
            .select('id').ilike('name', `%${args.project_name}%`).limit(1);
          if (data?.length) projectId = data[0].id;
        }
        
        const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
        const { data, error } = await supabase.from('invoices').insert({
          invoice_number: invoiceNum,
          customer_name: args.customer_name,
          project_id: projectId,
          total_amount: args.total_amount || 0,
          balance_due: args.total_amount || 0,
          description: args.description || null,
          due_date: args.due_date || null,
          status: 'draft',
          created_at: new Date().toISOString()
        }).select().single();
        
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          invoice: data, 
          message: `Invoice ${invoiceNum} created for ${args.customer_name}!`,
          visual_type: 'success_card',
          data_modified: ['invoices']
        };
      }
      
      case "update_invoice": {
        let invoiceId = args.invoice_id;
        if (!invoiceId && args.invoice_number) {
          const { data } = await supabase.from('invoices')
            .select('id').ilike('invoice_number', `%${args.invoice_number}%`).limit(1);
          if (data?.length) invoiceId = data[0].id;
        }
        if (!invoiceId) return { success: false, error: 'Invoice not found' };
        
        const updates: any = { updated_at: new Date().toISOString() };
        if (args.status) updates.status = args.status;
        if (args.total_amount !== undefined) {
          updates.total_amount = args.total_amount;
          updates.balance_due = args.total_amount;
        }
        if (args.due_date) updates.due_date = args.due_date;
        
        const { error } = await supabase.from('invoices').update(updates).eq('id', invoiceId);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Invoice updated!`,
          visual_type: 'success_card',
          data_modified: ['invoices']
        };
      }
      
      case "record_payment": {
        let invoiceId = args.invoice_id;
        if (!invoiceId && args.invoice_number) {
          const { data } = await supabase.from('invoices')
            .select('id, balance_due').ilike('invoice_number', `%${args.invoice_number}%`).limit(1);
          if (data?.length) invoiceId = data[0].id;
        }
        if (!invoiceId) return { success: false, error: 'Invoice not found' };
        
        const { data: paymentData, error: paymentError } = await supabase.from('invoice_payments').insert({
          invoice_id: invoiceId,
          amount: args.amount,
          payment_method: args.payment_method || 'check',
          payment_date: new Date().toISOString().split('T')[0],
          notes: args.notes || null
        }).select().single();
        
        if (paymentError) return { success: false, error: paymentError.message };
        
        // Update invoice balance
        const { data: invoice } = await supabase.from('invoices').select('balance_due').eq('id', invoiceId).single();
        const newBalance = Math.max(0, (invoice?.balance_due || 0) - args.amount);
        await supabase.from('invoices').update({
          balance_due: newBalance,
          status: newBalance === 0 ? 'paid' : 'sent',
          paid_at: newBalance === 0 ? new Date().toISOString() : null
        }).eq('id', invoiceId);
        
        return { 
          success: true, 
          payment: paymentData, 
          message: `Payment of $${args.amount} recorded!`,
          visual_type: 'success_card',
          data_modified: ['invoices', 'payments']
        };
      }
      
      case "create_bill": {
        if (!args.vendor_name) {
          return { 
            visual_type: 'input_form',
            form_type: 'create_bill',
            message: "I'll create a bill. Who's the vendor?",
            fields: [
              { name: 'vendor_name', label: 'Vendor Name', required: true, type: 'text' },
              { name: 'total', label: 'Amount ($)', required: true, type: 'number' },
              { name: 'description', label: 'Description', required: false, type: 'textarea' },
              { name: 'due_date', label: 'Due Date', required: false, type: 'date' }
            ]
          };
        }
        
        let projectId = null;
        if (args.project_name) {
          const { data } = await supabase.from('projects')
            .select('id').ilike('name', `%${args.project_name}%`).limit(1);
          if (data?.length) projectId = data[0].id;
        }
        
        const billNum = `BILL-${Date.now().toString().slice(-6)}`;
        const { data, error } = await supabase.from('bills').insert({
          bill_number: billNum,
          vendor_name: args.vendor_name,
          project_id: projectId,
          total: args.total || 0,
          balance_due: args.total || 0,
          description: args.description || null,
          due_date: args.due_date || null,
          bill_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          created_at: new Date().toISOString()
        }).select().single();
        
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          bill: data, 
          message: `Bill ${billNum} created for ${args.vendor_name}!`,
          visual_type: 'success_card',
          data_modified: ['bills']
        };
      }
      
      case "update_bill": {
        let billId = args.bill_id;
        if (!billId && args.bill_number) {
          const { data } = await supabase.from('bills')
            .select('id').ilike('bill_number', `%${args.bill_number}%`).limit(1);
          if (data?.length) billId = data[0].id;
        }
        if (!billId) return { success: false, error: 'Bill not found' };
        
        const updates: any = { updated_at: new Date().toISOString() };
        if (args.status) updates.status = args.status;
        if (args.total !== undefined) {
          updates.total = args.total;
          updates.balance_due = args.total;
        }
        
        const { error } = await supabase.from('bills').update(updates).eq('id', billId);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Bill updated!`,
          visual_type: 'success_card',
          data_modified: ['bills']
        };
      }
      
      case "pay_bill": {
        let billId = args.bill_id;
        if (!billId && args.bill_number) {
          const { data } = await supabase.from('bills')
            .select('id, balance_due').ilike('bill_number', `%${args.bill_number}%`).limit(1);
          if (data?.length) billId = data[0].id;
        }
        if (!billId) return { success: false, error: 'Bill not found' };
        
        const { data: paymentData, error: paymentError } = await supabase.from('bill_payments').insert({
          bill_id: billId,
          amount: args.amount,
          payment_method: args.payment_method || 'check',
          payment_date: new Date().toISOString().split('T')[0]
        }).select().single();
        
        if (paymentError) return { success: false, error: paymentError.message };
        
        // Update bill balance
        const { data: bill } = await supabase.from('bills').select('balance_due, paid').eq('id', billId).single();
        const newBalance = Math.max(0, (bill?.balance_due || 0) - args.amount);
        const newPaid = (bill?.paid || 0) + args.amount;
        await supabase.from('bills').update({
          balance_due: newBalance,
          paid: newPaid,
          status: newBalance === 0 ? 'paid' : 'pending'
        }).eq('id', billId);
        
        return { 
          success: true, 
          payment: paymentData, 
          message: `Payment of $${args.amount} recorded against bill!`,
          visual_type: 'success_card',
          data_modified: ['bills']
        };
      }
      
      case "create_estimate": {
        if (!args.project_name) {
          return { 
            visual_type: 'input_form',
            form_type: 'create_estimate',
            message: "I'll create an estimate. What project is this for?",
            fields: [
              { name: 'project_name', label: 'Project Name', required: true, type: 'text' },
              { name: 'customer_name', label: 'Customer Name', required: false, type: 'text' },
              { name: 'total_amount', label: 'Estimated Amount ($)', required: false, type: 'number' },
              { name: 'description', label: 'Scope/Description', required: false, type: 'textarea' }
            ]
          };
        }
        
        const estNum = `EST-${Date.now().toString().slice(-6)}`;
        const { data, error } = await supabase.from('project_estimates').insert({
          estimate_number: estNum,
          title: args.project_name,
          customer_name: args.customer_name || null,
          description: args.description || null,
          grand_total: args.total_amount || 0,
          status: 'draft',
          created_at: new Date().toISOString()
        }).select().single();
        
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          estimate: data, 
          message: `Estimate ${estNum} created!`,
          visual_type: 'success_card',
          data_modified: ['estimates']
        };
      }
      
      case "query_estimates": {
        let query = supabase.from('project_estimates').select('id, estimate_number, title, customer_name, grand_total, status, created_at');
        if (args.status && args.status !== 'all') query = query.eq('status', args.status);
        if (args.project_name) query = query.ilike('title', `%${args.project_name}%`);
        query = query.order('created_at', { ascending: false }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        
        return { estimates: data, count: data?.length || 0, visual_type: 'estimate_list' };
      }
      
      case "create_change_order": {
        if (!args.title) {
          return { 
            visual_type: 'input_form',
            form_type: 'create_change_order',
            message: "I'll create a change order. What's the title?",
            fields: [
              { name: 'title', label: 'Title', required: true, type: 'text' },
              { name: 'project_name', label: 'Project', required: false, type: 'text' },
              { name: 'description', label: 'Description', required: false, type: 'textarea' },
              { name: 'estimated_cost', label: 'Cost Change ($)', required: false, type: 'number' }
            ]
          };
        }
        
        let projectId = null;
        if (args.project_name) {
          const { data } = await supabase.from('projects')
            .select('id').ilike('name', `%${args.project_name}%`).limit(1);
          if (data?.length) projectId = data[0].id;
        }
        
        const coNum = `CO-${Date.now().toString().slice(-6)}`;
        const { data, error } = await supabase.from('change_orders').insert({
          co_number: coNum,
          title: args.title,
          description: args.description || null,
          project_id: projectId,
          estimated_cost: args.estimated_cost || 0,
          status: 'draft',
          date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        }).select().single();
        
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          change_order: data, 
          message: `Change order ${coNum} created!`,
          visual_type: 'success_card',
          data_modified: ['change-orders']
        };
      }
      
      case "update_change_order": {
        let coId = args.change_order_id;
        if (!coId && args.co_number) {
          const { data } = await supabase.from('change_orders')
            .select('id').ilike('co_number', `%${args.co_number}%`).limit(1);
          if (data?.length) coId = data[0].id;
        }
        if (!coId) return { success: false, error: 'Change order not found' };
        
        const updates: any = { updated_at: new Date().toISOString() };
        if (args.status) updates.status = args.status;
        if (args.estimated_cost !== undefined) updates.estimated_cost = args.estimated_cost;
        
        const { error } = await supabase.from('change_orders').update(updates).eq('id', coId);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Change order updated!`,
          visual_type: 'success_card',
          data_modified: ['change-orders']
        };
      }
      
      case "query_change_orders": {
        let query = supabase.from('change_orders').select('id, co_number, title, status, estimated_cost, project_id, created_at');
        if (args.status && args.status !== 'all') query = query.eq('status', args.status);
        if (args.project_name) {
          const { data: projects } = await supabase.from('projects')
            .select('id').ilike('name', `%${args.project_name}%`);
          if (projects?.length) {
            query = query.in('project_id', projects.map(p => p.id));
          }
        }
        query = query.order('created_at', { ascending: false }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        
        return { change_orders: data, count: data?.length || 0, visual_type: 'change_order_list' };
      }
      
      // ===== TODO HANDLERS =====
      case "create_todo": {
        if (!args.title) {
          return { 
            visual_type: 'input_form',
            form_type: 'create_todo',
            message: "I'll create a task. What needs to be done?",
            fields: [
              { name: 'title', label: 'Task Title', required: true, type: 'text' },
              { name: 'description', label: 'Description', required: false, type: 'textarea' },
              { name: 'priority', label: 'Priority', required: false, type: 'select', options: ['low', 'medium', 'high'] },
              { name: 'due_date', label: 'Due Date', required: false, type: 'date' }
            ]
          };
        }
        
        let projectId = null;
        if (args.project_name) {
          const { data } = await supabase.from('projects')
            .select('id').ilike('name', `%${args.project_name}%`).limit(1);
          if (data?.length) projectId = data[0].id;
        }
        
        const { data, error } = await supabase.from('todos').insert({
          title: args.title,
          description: args.description || null,
          priority: args.priority || 'medium',
          due_date: args.due_date || null,
          assigned_to: args.assigned_to || null,
          project_id: projectId,
          status: 'pending',
          created_at: new Date().toISOString()
        }).select().single();
        
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          todo: data, 
          message: `Task "${args.title}" created!`,
          visual_type: 'success_card',
          data_modified: ['todos']
        };
      }
      
      case "update_todo": {
        let todoId = args.todo_id;
        if (!todoId && args.title) {
          const { data } = await supabase.from('todos')
            .select('id').ilike('title', `%${args.title}%`).limit(1);
          if (data?.length) todoId = data[0].id;
        }
        if (!todoId) return { success: false, error: 'Todo not found' };
        
        const updates: any = { updated_at: new Date().toISOString() };
        if (args.status) updates.status = args.status;
        if (args.priority) updates.priority = args.priority;
        
        const { error } = await supabase.from('todos').update(updates).eq('id', todoId);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Task updated!`,
          visual_type: 'success_card',
          data_modified: ['todos']
        };
      }
      
      case "query_todos": {
        let query = supabase.from('todos').select('id, title, description, status, priority, due_date, assigned_to, created_at');
        if (args.status && args.status !== 'all') query = query.eq('status', args.status);
        if (args.priority) query = query.eq('priority', args.priority);
        if (args.assigned_to) query = query.ilike('assigned_to', `%${args.assigned_to}%`);
        query = query.order('created_at', { ascending: false }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        
        return { todos: data, count: data?.length || 0, visual_type: 'todo_list' };
      }
      
      case "delete_todo": {
        let todoId = args.todo_id;
        if (!todoId && args.title) {
          const { data } = await supabase.from('todos')
            .select('id').ilike('title', `%${args.title}%`).limit(1);
          if (data?.length) todoId = data[0].id;
        }
        if (!todoId) return { success: false, error: 'Todo not found' };
        
        const { error } = await supabase.from('todos').delete().eq('id', todoId);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Task deleted!`,
          visual_type: 'success_card',
          data_modified: ['todos']
        };
      }
      
      // ===== INCIDENT HANDLERS =====
      case "create_incident": {
        if (!args.title) {
          return { 
            visual_type: 'input_form',
            form_type: 'create_incident',
            message: "I'll report an incident. What happened?",
            fields: [
              { name: 'title', label: 'Incident Title', required: true, type: 'text' },
              { name: 'description', label: 'What happened?', required: true, type: 'textarea' },
              { name: 'severity', label: 'Severity', required: true, type: 'select', options: ['minor', 'moderate', 'major', 'critical'] },
              { name: 'location', label: 'Location', required: false, type: 'text' }
            ]
          };
        }
        
        const { data, error } = await supabase.from('incidents').insert({
          title: args.title,
          description: args.description || null,
          severity: args.severity || 'moderate',
          location: args.location || null,
          injured_party: args.injured_party || null,
          status: 'open',
          incident_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        }).select().single();
        
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          incident: data, 
          message: `Incident "${args.title}" reported!`,
          visual_type: 'success_card',
          data_modified: ['incidents']
        };
      }
      
      case "query_incidents": {
        let query = supabase.from('incidents').select('id, title, description, severity, status, location, incident_date, created_at');
        if (args.status && args.status !== 'all') query = query.eq('status', args.status);
        if (args.severity) query = query.eq('severity', args.severity);
        query = query.order('created_at', { ascending: false }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        
        return { incidents: data, count: data?.length || 0, visual_type: 'incident_list' };
      }
      
      // ===== SAFETY MEETING HANDLERS =====
      case "create_safety_meeting": {
        if (!args.title || !args.scheduled_date) {
          return { 
            visual_type: 'input_form',
            form_type: 'create_safety_meeting',
            message: "I'll schedule a safety meeting. What's the topic?",
            fields: [
              { name: 'title', label: 'Meeting Topic', required: true, type: 'text' },
              { name: 'scheduled_date', label: 'Date', required: true, type: 'date' },
              { name: 'location', label: 'Location', required: false, type: 'text' },
              { name: 'topics', label: 'Topics to Cover', required: false, type: 'textarea' }
            ]
          };
        }
        
        const { data, error } = await supabase.from('safety_meetings').insert({
          title: args.title,
          scheduled_date: args.scheduled_date,
          location: args.location || null,
          topics: args.topics || null,
          status: 'scheduled',
          created_at: new Date().toISOString()
        }).select().single();
        
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          safety_meeting: data, 
          message: `Safety meeting "${args.title}" scheduled for ${args.scheduled_date}!`,
          visual_type: 'success_card',
          data_modified: ['safety-meetings']
        };
      }
      
      case "query_safety_meetings": {
        let query = supabase.from('safety_meetings').select('id, title, scheduled_date, location, status, topics, created_at');
        if (args.status && args.status !== 'all') query = query.eq('status', args.status);
        if (args.start_date) query = query.gte('scheduled_date', args.start_date);
        query = query.order('scheduled_date', { ascending: false }).limit(args.limit || 20);
        const { data, error } = await query;
        if (error) throw error;
        
        return { safety_meetings: data, count: data?.length || 0, visual_type: 'safety_meeting_list' };
      }
      
      // ===== UPDATE EXPENSE =====
      case "update_expense": {
        let expenseId = args.expense_id;
        if (!expenseId && args.description) {
          const { data } = await supabase.from('expenses')
            .select('id').ilike('description', `%${args.description}%`).limit(1);
          if (data?.length) expenseId = data[0].id;
        }
        if (!expenseId) return { success: false, error: 'Expense not found' };
        
        const updates: any = {};
        if (args.amount !== undefined) updates.amount = args.amount;
        if (args.category) updates.category = args.category;
        
        const { error } = await supabase.from('expenses').update(updates).eq('id', expenseId);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Expense updated!`,
          visual_type: 'success_card',
          data_modified: ['expenses']
        };
      }
      
      // ===== UPDATE PURCHASE ORDER =====
      case "update_purchase_order": {
        let poId = args.po_id;
        if (!poId && args.po_number) {
          const { data } = await supabase.from('purchase_orders')
            .select('id').ilike('po_number', `%${args.po_number}%`).limit(1);
          if (data?.length) poId = data[0].id;
        }
        if (!poId) return { success: false, error: 'Purchase order not found' };
        
        const updates: any = {};
        if (args.status) updates.status = args.status;
        if (args.total_amount !== undefined) updates.total_amount = args.total_amount;
        
        const { error } = await supabase.from('purchase_orders').update(updates).eq('id', poId);
        if (error) return { success: false, error: error.message };
        
        return { 
          success: true, 
          message: `Purchase order updated!`,
          visual_type: 'success_card',
          data_modified: ['purchase-orders']
        };
      }
      
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`[Agent Hub] Error in ${toolName}:`, error);
    return { error: error.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Support direct tool execution for realtime voice
    if (body.action && body.params !== undefined) {
      console.log('[Agent Hub] Direct tool execution:', body.action);
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const result = await executeToolCall(body.action, body.params || {}, supabase);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Standard chat-based flow
    const userMessages = body.messages;

    if (!userMessages || !Array.isArray(userMessages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array or action/params is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Agent Hub] Processing', userMessages.length, 'messages');

    const today = new Date().toISOString().split('T')[0];
    const systemPrompt = `You are the AI Agent Command Center for a roofing company. You have FULL ACCESS to create, update, and query all business data.

TODAY: ${today}

🔧 YOUR CAPABILITIES:

READ DATA:
- Projects, Leads, Schedules, Attendance (who's clocked in), Invoices, Team, Materials
- Work Orders, Service Tickets, Expenses, Purchase Orders, Bills, Payments
- Inspections, Punchlists, Permits, Daily Logs

CREATE DATA:
- Team members, Contacts (vendors/subs/customers), Leads, Projects, Schedules
- Work Orders, Service Tickets, Expenses, Purchase Orders, Inspections, Punchlists, Daily Logs

UPDATE DATA:
- Lead status, Project status, Work order status, Contact info

TIME & ATTENDANCE:
- See who's clocked in NOW
- Clock employees in/out
- Approve timesheets

📄 PDF REPORTS:
Generate timesheets (all or specific employee), invoices, proposals, project summaries

📊 VISUAL RESPONSES:
When returning data, use visual components (charts, cards, lists).

🎯 Keep text responses SHORT (1-2 sentences) - the visuals show the data.`;

    let aiMessages = [
      { role: 'system', content: systemPrompt },
      ...userMessages
    ];

    console.log('[Agent Hub] Calling AI with tools...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: aiMessages,
        tools: tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Agent Hub] AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const assistantMessage = aiResult.choices?.[0]?.message;

    if (!assistantMessage) {
      throw new Error('No response from AI');
    }

    console.log('[Agent Hub] AI response:', JSON.stringify(assistantMessage).slice(0, 500));

    let structuredData = null;
    let finalAnswer = assistantMessage.content || '';

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log('[Agent Hub] Processing', assistantMessage.tool_calls.length, 'tool calls');
      
      aiMessages.push(assistantMessage);
      
      const toolResults = [];
      for (const toolCall of assistantMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments || '{}');
        const result = await executeToolCall(toolCall.function.name, args, supabase);
        
        console.log(`[Agent Hub] Tool ${toolCall.function.name} result:`, JSON.stringify(result).slice(0, 300));
        
        if (result.visual_type) {
          structuredData = result;
        }
        
        toolResults.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
      }
      
      aiMessages.push(...toolResults);
      
      const finalResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: aiMessages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (finalResponse.ok) {
        const finalResult = await finalResponse.json();
        finalAnswer = finalResult.choices?.[0]?.message?.content || '';
      }
    }

    console.log('[Agent Hub] Final answer length:', finalAnswer.length);
    console.log('[Agent Hub] Structured data:', structuredData ? structuredData.visual_type : 'none');

    return new Response(
      JSON.stringify({ 
        answer: finalAnswer,
        structured_data: structuredData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Agent Hub] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

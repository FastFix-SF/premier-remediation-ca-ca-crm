import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tables to EXCLUDE from the schema seed (Roofing Friend specific)
const EXCLUDED_TABLES = [
  'analytics_events',
  'visitor_sessions', 
  'enhanced_visitor_sessions',
  'blog_posts',
  'chat_conversations_mrf',
  'chat_conversation_state',
  'conversation_sessions',
  'edge_training_data',
  'ai_learning_metrics',
  'ai_suggestions',
  'ai_workforce_insights',
  'roof_corrections',
  'quote_training_sessions',
  'missed_opportunities',
  'mrf_prospects',
  'admin_feedback',
  'companycam_projects',
  'companycam_photos',
  'call_logs',
  'connecteam_config',
  'site_content',
  'user_roles', // deprecated
  'visualizer_images',
  'visualizer_masks', 
  'visualizer_projects',
  'visualizer_variants',
  'project_invitations', // deprecated, use team_invitations
  'project_assignments', // deprecated
  'customer_feedback', // RF specific
  'roofing_materials_pricing', // RF specific pricing
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting schema export...');

    // 1. Get all enums
    const { data: enums, error: enumError } = await supabase.rpc('get_schema_enums');
    
    // 2. Get all tables with columns
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    // Since we can't directly query information_schema, we'll use raw SQL via a function
    // For now, generate a template that can be filled in manually or via pg_dump
    
    const schemaSQL = generateSchemaTemplate();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Schema template generated',
        schema: schemaSQL,
        excludedTables: EXCLUDED_TABLES,
        note: 'This is a template. For full schema export, use pg_dump or Supabase dashboard export.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating schema:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateSchemaTemplate(): string {
  return `-- ================================================================
-- FASTFIX MASTER SCHEMA SEED
-- Generated: ${new Date().toISOString()}
-- 
-- This schema creates all essential tables for a FastFix client project.
-- Run this on a fresh Lovable Cloud database after remix.
-- ================================================================

-- ============================================================
-- SECTION 1: EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- SECTION 2: CUSTOM TYPES (ENUMS)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE blog_category AS ENUM ('tips', 'news', 'guides', 'case-studies');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE edge_label AS ENUM ('eave', 'rake', 'ridge', 'hip', 'valley', 'step_flashing', 'headwall', 'sidewall', 'drip_edge', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- SECTION 3: CORE TABLES (in dependency order)
-- ============================================================

-- 3.1 User & Auth Tables
-- -----------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  admin_background_style TEXT DEFAULT '{"background":"linear-gradient(135deg, rgb(249 250 251) 0%, rgb(255 255 255) 100%)"}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'contributor',
  status TEXT NOT NULL DEFAULT 'invited',
  avatar_url TEXT,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  invite_token TEXT,
  token_expires_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  language_preference TEXT DEFAULT 'en',
  sms_notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'contributor',
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  invited_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  is_expired BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rf_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.2 CRM & Leads Tables
-- ----------------------

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  address TEXT,
  project_type TEXT,
  property_type TEXT,
  roof_size TEXT,
  timeline TEXT,
  budget_range TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT,
  notes TEXT,
  estimated_value NUMERIC,
  assigned_to UUID REFERENCES auth.users(id),
  qualification_data JSONB DEFAULT '{}'::jsonb,
  mrf_prospect_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  property_address TEXT,
  project_type TEXT,
  property_type TEXT,
  timeline TEXT,
  notes TEXT,
  status TEXT DEFAULT 'new',
  source TEXT DEFAULT 'website',
  roof_data JSONB DEFAULT '{}'::jsonb,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.3 Project Tables
-- ------------------

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  status TEXT DEFAULT 'pending',
  project_type TEXT DEFAULT 'residential',
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE,
  estimated_completion DATE,
  contract_value NUMERIC,
  actual_cost NUMERIC,
  profit_margin NUMERIC,
  customer_rating INTEGER,
  notes TEXT,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  external_ref TEXT,
  customer_access_granted BOOLEAN DEFAULT false,
  invitation_sent_at TIMESTAMPTZ,
  lead_id UUID REFERENCES public.leads(id),
  quote_request_id UUID REFERENCES public.quote_requests(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'contributor',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.project_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  photo_tag TEXT,
  is_visible_to_customer BOOLEAN DEFAULT false,
  is_highlighted_before BOOLEAN DEFAULT false,
  is_highlighted_after BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  file_size BIGINT DEFAULT 0,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  assigned_to UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  update_type TEXT DEFAULT 'general',
  is_visible_to_customer BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_status_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.4 Proposals & Contracts
-- -------------------------

CREATE TABLE IF NOT EXISTS public.project_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_number TEXT NOT NULL DEFAULT ('PROP-' || lpad((EXTRACT(epoch FROM now()))::text, 10, '0')),
  quote_request_id UUID REFERENCES public.quote_requests(id),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  property_address TEXT NOT NULL,
  project_type TEXT DEFAULT 'residential',
  status TEXT DEFAULT 'draft',
  scope_of_work TEXT,
  notes_disclaimers TEXT,
  contract_price NUMERIC,
  contract_url TEXT,
  contract_created_at TIMESTAMPTZ,
  agreement_number TEXT,
  payment_schedule JSONB DEFAULT '{}'::jsonb,
  access_token TEXT DEFAULT encode(gen_random_bytes(32), 'base64'),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.proposal_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.project_proposals(id) ON DELETE CASCADE,
  system_name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC,
  is_recommended BOOLEAN DEFAULT false,
  is_optional BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.proposal_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.project_proposals(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  comparison_block_id UUID,
  comparison_metadata JSONB DEFAULT '{}'::jsonb,
  file_size BIGINT DEFAULT 0,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.5 Signature & Envelope Tables
-- -------------------------------

CREATE TABLE IF NOT EXISTS public.signature_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.project_proposals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.envelope_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envelope_id UUID NOT NULL REFERENCES public.signature_envelopes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'signer',
  status TEXT DEFAULT 'pending',
  signing_order INTEGER DEFAULT 1,
  access_token TEXT DEFAULT encode(gen_random_bytes(32), 'base64'),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.envelope_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envelope_id UUID NOT NULL REFERENCES public.signature_envelopes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  document_order INTEGER DEFAULT 1,
  page_count INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.envelope_documents(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.envelope_recipients(id) ON DELETE CASCADE,
  field_type TEXT NOT NULL,
  field_label TEXT,
  x_position NUMERIC NOT NULL,
  y_position NUMERIC NOT NULL,
  width NUMERIC NOT NULL,
  height NUMERIC NOT NULL,
  page_number INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT true,
  default_value TEXT,
  validation_pattern TEXT,
  options JSONB,
  tab_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.field_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES public.document_fields(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.envelope_recipients(id) ON DELETE CASCADE,
  value TEXT,
  signature_image_url TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  completed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.envelope_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envelope_id UUID NOT NULL REFERENCES public.signature_envelopes(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.envelope_recipients(id),
  user_id UUID,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.envelope_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL UNIQUE REFERENCES public.project_proposals(id) ON DELETE CASCADE,
  subject TEXT DEFAULT '',
  message TEXT DEFAULT '',
  recipients JSONB DEFAULT '[]'::jsonb,
  fields JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.6 Materials & Pricing
-- -----------------------

CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'None',
  unit TEXT DEFAULT '$/Ea',
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Active',
  image_url TEXT,
  show_in_app BOOLEAN DEFAULT true,
  show_on_estimate BOOLEAN DEFAULT false,
  show_on_material_order BOOLEAN DEFAULT false,
  show_on_contract BOOLEAN DEFAULT false,
  show_on_labor_report BOOLEAN DEFAULT false,
  last_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.material_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES public.materials(id),
  action TEXT NOT NULL,
  changes JSONB,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.price_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  system TEXT NOT NULL,
  lines JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  price_sheet_id UUID REFERENCES public.price_sheets(id),
  settings JSONB,
  totals JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quote_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_waste_pct NUMERIC DEFAULT 10,
  default_markup_pct NUMERIC DEFAULT 15,
  labor_rate_per_sq NUMERIC DEFAULT 350,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.7 Invoicing
-- -------------

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  project_id UUID REFERENCES public.projects(id),
  project_name TEXT NOT NULL,
  project_address TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  description TEXT,
  subtotal NUMERIC NOT NULL,
  tax_rate NUMERIC,
  tax_amount NUMERIC,
  credit_card_fee NUMERIC,
  total_amount NUMERIC NOT NULL,
  balance_due NUMERIC NOT NULL,
  status TEXT DEFAULT 'draft',
  payment_terms TEXT,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  payment_reference TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ DEFAULT now(),
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.8 Workforce & Scheduling
-- --------------------------

CREATE TABLE IF NOT EXISTS public.crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_name TEXT NOT NULL,
  description TEXT,
  specialty TEXT,
  crew_lead_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crew_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(crew_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.job_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'scheduled',
  assigned_users JSONB DEFAULT '[]'::jsonb,
  crew_id UUID REFERENCES public.crews(id),
  location TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.time_clock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  employee_name TEXT NOT NULL,
  employee_role TEXT,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  total_hours NUMERIC,
  overtime_hours NUMERIC DEFAULT 0,
  break_time_minutes INTEGER DEFAULT 0,
  job_id UUID REFERENCES public.job_schedules(id),
  project_name TEXT,
  location TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  connecteam_timecard_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.work_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  employee_mapping_id UUID,
  employee_name TEXT NOT NULL,
  employee_role TEXT,
  work_date DATE NOT NULL,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  regular_hours NUMERIC DEFAULT 0,
  overtime_hours NUMERIC DEFAULT 0,
  total_hours NUMERIC DEFAULT 0,
  hourly_rate NUMERIC DEFAULT 25.0,
  overtime_rate NUMERIC DEFAULT 37.5,
  total_cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  connectteam_timecard_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connecteam_employee_id TEXT NOT NULL UNIQUE,
  connecteam_name TEXT,
  email TEXT NOT NULL,
  team_directory_user_id UUID REFERENCES public.team_directory(id),
  sync_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_pay_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_mapping_id UUID NOT NULL,
  hourly_rate NUMERIC NOT NULL,
  overtime_multiplier NUMERIC DEFAULT 1.5,
  burden_multiplier NUMERIC,
  overhead_allocation_rate NUMERIC,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_category TEXT DEFAULT 'general',
  proficiency_level INTEGER DEFAULT 1,
  years_experience NUMERIC DEFAULT 0,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  certification_type TEXT DEFAULT 'trade',
  issuing_body TEXT,
  issued_date DATE,
  expiry_date DATE,
  document_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  experience_score NUMERIC DEFAULT 0,
  performance_score NUMERIC DEFAULT 0,
  reliability_score NUMERIC DEFAULT 0,
  skills_score NUMERIC DEFAULT 0,
  safety_score NUMERIC DEFAULT 15,
  total_score NUMERIC DEFAULT 15,
  score_breakdown JSONB,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  explanation TEXT,
  notes TEXT,
  job_name TEXT,
  shift_start_date DATE,
  shift_start_time TIME,
  shift_end_date DATE,
  shift_end_time TIME,
  total_hours NUMERIC,
  include_mileage BOOLEAN,
  break_type TEXT,
  break_start_time TIME,
  break_end_time TIME,
  break_duration_minutes INTEGER,
  time_off_type TEXT,
  time_off_start_date DATE,
  time_off_start_time TIME,
  time_off_end_date DATE,
  time_off_end_time TIME,
  total_time_off_hours NUMERIC,
  is_all_day BOOLEAN,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.safety_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id),
  incident_date DATE NOT NULL,
  incident_type TEXT NOT NULL,
  severity TEXT DEFAULT 'minor',
  description TEXT,
  corrective_action TEXT,
  reported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workforce_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_mapping_id UUID NOT NULL,
  work_date DATE NOT NULL,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  total_hours NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  connecteam_timecard_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workforce_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connecteam_message_id TEXT,
  author_employee_id TEXT,
  author_name TEXT NOT NULL,
  author_role TEXT,
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'announcement',
  channel_name TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  is_important BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]'::jsonb,
  sync_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.9 Cost Configuration
-- ----------------------

CREATE TABLE IF NOT EXISTS public.labor_burden_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workers_comp_rate NUMERIC DEFAULT 0.03,
  health_insurance_monthly NUMERIC DEFAULT 600,
  payroll_tax_rate NUMERIC DEFAULT 0.153,
  other_benefits_rate NUMERIC DEFAULT 0.02,
  effective_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.overhead_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_method TEXT DEFAULT 'labor_hours',
  office_staff_rate NUMERIC DEFAULT 15.00,
  liability_insurance_rate NUMERIC DEFAULT 0.005,
  equipment_rental_rate NUMERIC DEFAULT 8.00,
  facility_overhead_rate NUMERIC DEFAULT 5.00,
  effective_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.10 Messaging & Communications
-- -------------------------------

CREATE TABLE IF NOT EXISTS public.sms_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  customer_name TEXT,
  lead_id UUID REFERENCES public.leads(id),
  project_id UUID REFERENCES public.projects(id),
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.sms_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'delivered',
  twilio_sid TEXT,
  sent_by UUID REFERENCES auth.users(id),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sms_scheduled (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.sms_conversations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.direct_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_two_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_one_id, participant_two_id)
);

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.message_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_message_id UUID,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  chat_id TEXT NOT NULL,
  pinned_by UUID NOT NULL REFERENCES auth.users(id),
  pinned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, chat_id)
);

-- 3.11 Notifications
-- ------------------

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT DEFAULT 'general',
  reference_type TEXT,
  reference_id UUID,
  is_read BOOLEAN DEFAULT false,
  sent_via JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  device_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.help_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  message_text TEXT,
  audio_url TEXT,
  status TEXT DEFAULT 'pending',
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.12 Aerial Imagery
-- -------------------

CREATE TABLE IF NOT EXISTS public.aerial_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_address TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  image_type TEXT DEFAULT 'satellite',
  api_source TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  capture_date TIMESTAMPTZ,
  zoom_level INTEGER,
  season TEXT,
  angle TEXT,
  resolution TEXT,
  image_quality_score INTEGER DEFAULT 0,
  file_size BIGINT,
  image_metadata JSONB DEFAULT '{}'::jsonb,
  processing_status TEXT DEFAULT 'pending',
  lead_id UUID REFERENCES public.leads(id),
  project_id UUID REFERENCES public.projects(id),
  quote_request_id UUID REFERENCES public.quote_requests(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.13 Roof Analysis & Quotes
-- ---------------------------

CREATE TABLE IF NOT EXISTS public.roof_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  quote_request_id UUID REFERENCES public.quote_requests(id),
  total_area_sqft NUMERIC,
  total_perimeter_ft NUMERIC,
  facet_count INTEGER,
  predominant_pitch TEXT,
  complexity_score INTEGER,
  analysis_data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roof_facets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roof_analysis_id UUID NOT NULL REFERENCES public.roof_analyses(id) ON DELETE CASCADE,
  facet_number INTEGER NOT NULL,
  area_sqft NUMERIC,
  pitch TEXT,
  orientation TEXT,
  geometry JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roof_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roof_analysis_id UUID NOT NULL REFERENCES public.roof_analyses(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL,
  length_ft NUMERIC NOT NULL,
  geometry JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.facets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  polygon_geojson JSONB NOT NULL,
  pitch NUMERIC DEFAULT 4.0,
  story INTEGER DEFAULT 1,
  flags JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  facet_id UUID REFERENCES public.facets(id),
  label edge_label NOT NULL,
  length_ft NUMERIC DEFAULT 0,
  line_geojson JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.edge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  group_name TEXT,
  hotkey TEXT,
  display_order INTEGER,
  parent_id UUID REFERENCES public.edge_categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.edge_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT NOT NULL UNIQUE DEFAULT ('Q-' || lpad((EXTRACT(epoch FROM now()))::text, 10, '0')),
  quote_request_id UUID REFERENCES public.quote_requests(id),
  project_id UUID REFERENCES public.projects(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  property_address TEXT NOT NULL,
  project_type TEXT DEFAULT 'residential',
  status TEXT DEFAULT 'draft',
  roof_data JSONB DEFAULT '{}'::jsonb,
  line_items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  notes TEXT,
  valid_until DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roofing_variable_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variable_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  options JSONB NOT NULL,
  affects_categories JSONB NOT NULL,
  educational_tooltip TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.imagery_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  vendor TEXT NOT NULL,
  bounds_geojson JSONB,
  capture_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roof_quoter_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.14 CRM Workflow Tables
-- ------------------------

CREATE TABLE IF NOT EXISTS public.crm_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_workflow_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.crm_workflows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  phase_order INTEGER NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'Circle',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES public.crm_workflow_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  step_order INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT false,
  estimated_duration_hours INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_customer_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES public.crm_workflows(id),
  current_phase_id UUID REFERENCES public.crm_workflow_phases(id),
  current_step_id UUID REFERENCES public.crm_workflow_steps(id),
  status TEXT DEFAULT 'active',
  progress_percentage INTEGER DEFAULT 0,
  assigned_to UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_step_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_progress_id UUID NOT NULL REFERENCES public.crm_customer_progress(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.crm_workflow_steps(id),
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_progress_id UUID NOT NULL REFERENCES public.crm_customer_progress(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_user_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_progress_id UUID NOT NULL REFERENCES public.crm_customer_progress(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  condition_data JSONB,
  action_type TEXT NOT NULL,
  action_data JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.15 App Configuration
-- ----------------------

CREATE TABLE IF NOT EXISTS public.app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.16 Training Documents (for AI)
-- --------------------------------

CREATE TABLE IF NOT EXISTS public.project_training_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID REFERENCES public.quote_requests(id),
  file_name TEXT NOT NULL,
  source_file_url TEXT NOT NULL,
  source_file_type TEXT NOT NULL,
  document_category TEXT NOT NULL,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  processing_status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 4: ESSENTIAL FUNCTIONS
-- ============================================================

-- 4.1 Admin Check Function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  ) INTO is_admin_user;
  
  IF NOT is_admin_user THEN
    SELECT EXISTS (
      SELECT 1 FROM team_directory
      WHERE user_id = auth.uid() 
        AND status = 'active' 
        AND role IN ('owner', 'admin')
    ) INTO is_admin_user;
  END IF;
  
  RETURN is_admin_user;
END;
$$;

-- 4.2 Team Admin Check
CREATE OR REPLACE FUNCTION public.is_team_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_directory 
    WHERE user_id = auth.uid() 
      AND status = 'active' 
      AND role IN ('owner','admin')
  );
END;
$$;

-- 4.3 Active Team Member Check
CREATE OR REPLACE FUNCTION public.is_active_team_member()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_directory
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
$$;

-- 4.4 Check Admin or Owner
CREATE OR REPLACE FUNCTION public.check_user_admin_or_owner()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM public.team_directory
    WHERE user_id = auth.uid() 
      AND status = 'active' 
      AND role IN ('owner', 'admin')
  );
END;
$$;

-- 4.5 Check User Assigned to Project
CREATE OR REPLACE FUNCTION public.check_user_assigned_to_project(project_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_team_assignments
    WHERE project_id = project_id_param 
      AND user_id = auth.uid()
  );
END;
$$;

-- 4.6 Handle New User (Profile Creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;

-- 4.7 Update Timestamp Function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4.8 Touch Updated At (alternate name)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4.9 Get or Create DM Conversation
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  conversation_id uuid;
  smaller_id uuid;
  larger_id uuid;
BEGIN
  IF user1_id < user2_id THEN
    smaller_id := user1_id;
    larger_id := user2_id;
  ELSE
    smaller_id := user2_id;
    larger_id := user1_id;
  END IF;

  SELECT id INTO conversation_id
  FROM public.direct_conversations
  WHERE participant_one_id = smaller_id 
    AND participant_two_id = larger_id;

  IF conversation_id IS NULL THEN
    INSERT INTO public.direct_conversations (participant_one_id, participant_two_id)
    VALUES (smaller_id, larger_id)
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$;

-- 4.10 Update DM Conversation Timestamp
CREATE OR REPLACE FUNCTION public.update_direct_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.direct_conversations
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- 4.11 Generate Secure Invite Token
CREATE OR REPLACE FUNCTION public.generate_secure_invite_token()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  RETURN gen_random_uuid()::text;
END;
$$;

-- 4.12 Cleanup Expired Invite Tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_invite_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.team_directory 
  SET invite_token = NULL, token_expires_at = NULL
  WHERE invite_token IS NOT NULL 
    AND token_expires_at < now();
END;
$$;

-- 4.13 Validate Invitation Token
CREATE OR REPLACE FUNCTION public.validate_invitation_token(token_value text)
RETURNS TABLE(email text, full_name text, role text, invited_by uuid, token_expires_at timestamp with time zone, status text, user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM set_config('app.invite_token', token_value, true);
  PERFORM cleanup_expired_invite_tokens();
  
  RETURN QUERY
  SELECT 
    td.email,
    td.full_name,
    td.role,
    td.invited_by,
    td.token_expires_at,
    td.status,
    td.user_id
  FROM team_directory td
  WHERE td.invite_token = token_value
    AND td.status = 'invited'
    AND td.token_expires_at > now();
END;
$$;

-- 4.14 Pin Message Function
CREATE OR REPLACE FUNCTION public.pin_message(message_id uuid, chat_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pinned_messages 
    WHERE message_id = pin_message.message_id 
    AND chat_id = pin_message.chat_id
  ) THEN
    DELETE FROM pinned_messages 
    WHERE message_id = pin_message.message_id 
    AND chat_id = pin_message.chat_id;
  ELSE
    INSERT INTO pinned_messages (message_id, chat_id, pinned_by, pinned_at)
    VALUES (pin_message.message_id, pin_message.chat_id, auth.uid(), NOW());
  END IF;
END;
$$;

-- 4.15 CRM Move Customer
CREATE OR REPLACE FUNCTION public.crm_move_customer(p_lead_id uuid, p_phase_name text, p_step_name text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_progress_id UUID;
    v_workflow_id UUID;
    v_target_phase_id UUID;
    v_target_step_id UUID;
    v_phase_order INTEGER;
    v_total_phases INTEGER;
    v_progress_pct INTEGER;
BEGIN
    SELECT cp.id, cp.workflow_id 
    INTO v_progress_id, v_workflow_id
    FROM crm_customer_progress cp
    WHERE cp.customer_id = p_lead_id AND cp.status = 'active'
    LIMIT 1;
    
    IF v_progress_id IS NULL THEN RETURN FALSE; END IF;
    
    SELECT cwp.id, cwp.phase_order
    INTO v_target_phase_id, v_phase_order
    FROM crm_workflow_phases cwp
    WHERE cwp.workflow_id = v_workflow_id AND cwp.name = p_phase_name
    LIMIT 1;
    
    IF v_target_phase_id IS NULL THEN RETURN FALSE; END IF;
    
    IF p_step_name IS NOT NULL THEN
        SELECT cws.id INTO v_target_step_id
        FROM crm_workflow_steps cws
        WHERE cws.phase_id = v_target_phase_id AND cws.name = p_step_name
        LIMIT 1;
    END IF;
    
    SELECT COUNT(*) INTO v_total_phases
    FROM crm_workflow_phases WHERE workflow_id = v_workflow_id;
    
    v_progress_pct := CASE WHEN v_total_phases > 0 THEN (v_phase_order * 100 / v_total_phases) ELSE 0 END;
    
    UPDATE crm_customer_progress
    SET current_phase_id = v_target_phase_id,
        current_step_id = v_target_step_id,
        progress_percentage = v_progress_pct,
        updated_at = NOW(),
        status = CASE WHEN p_phase_name = 'Close-Out' THEN 'completed' ELSE 'active' END,
        completed_at = CASE WHEN p_phase_name = 'Close-Out' THEN NOW() ELSE NULL END
    WHERE id = v_progress_id;
    
    INSERT INTO crm_step_history (customer_progress_id, step_id, status, completed_at, completed_by, notes)
    VALUES (v_progress_id, 
            COALESCE(v_target_step_id, (SELECT id FROM crm_workflow_steps WHERE phase_id = v_target_phase_id ORDER BY step_order LIMIT 1)),
            'complete', NOW(), auth.uid(),
            'Moved to ' || p_phase_name || CASE WHEN p_step_name IS NOT NULL THEN ' - ' || p_step_name ELSE '' END);
    
    RETURN TRUE;
END;
$$;

-- 4.16 Create CRM Progress on Lead Insert
CREATE OR REPLACE FUNCTION public.create_progress_on_lead_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    default_workflow_id UUID;
    lead_capture_phase_id UUID;
BEGIN
    SELECT id INTO default_workflow_id 
    FROM crm_workflows 
    WHERE name = 'Default Roofing Workflow' AND is_active = true
    LIMIT 1;
    
    SELECT id INTO lead_capture_phase_id
    FROM crm_workflow_phases 
    WHERE workflow_id = default_workflow_id AND name = 'Lead Capture'
    LIMIT 1;
    
    IF default_workflow_id IS NOT NULL AND lead_capture_phase_id IS NOT NULL THEN
        INSERT INTO crm_customer_progress (customer_id, workflow_id, current_phase_id, status, progress_percentage)
        VALUES (NEW.id, default_workflow_id, lead_capture_phase_id, 'active', 10);
    END IF;
    
    RETURN NEW;
END;
$$;

-- 4.17 Calculate Employee Score
CREATE OR REPLACE FUNCTION public.calculate_employee_score(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_experience_score NUMERIC := 0;
  v_performance_score NUMERIC := 0;
  v_reliability_score NUMERIC := 0;
  v_skills_score NUMERIC := 0;
  v_safety_score NUMERIC := 15;
  v_total_score NUMERIC := 0;
  v_breakdown JSONB := '{}'::jsonb;
  v_total_hours NUMERIC;
  v_project_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(total_hours), 0) INTO v_total_hours
  FROM time_clock WHERE user_id = p_user_id;
  
  SELECT COUNT(DISTINCT project_id) INTO v_project_count
  FROM project_team_assignments WHERE user_id = p_user_id;
  
  v_experience_score := LEAST(15, (v_total_hours / 1000) * 15) + LEAST(10, (v_project_count / 50.0) * 10);
  v_performance_score := 12.5;
  v_reliability_score := 16;
  v_skills_score := 0;
  
  v_total_score := v_experience_score + v_performance_score + v_reliability_score + v_skills_score + v_safety_score;
  
  INSERT INTO employee_scores (user_id, experience_score, performance_score, reliability_score, skills_score, safety_score, total_score, score_breakdown, calculated_at)
  VALUES (p_user_id, v_experience_score, v_performance_score, v_reliability_score, v_skills_score, v_safety_score, v_total_score, v_breakdown, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    experience_score = EXCLUDED.experience_score,
    performance_score = EXCLUDED.performance_score,
    reliability_score = EXCLUDED.reliability_score,
    skills_score = EXCLUDED.skills_score,
    safety_score = EXCLUDED.safety_score,
    total_score = EXCLUDED.total_score,
    score_breakdown = EXCLUDED.score_breakdown,
    calculated_at = NOW(),
    updated_at = NOW();

  RETURN jsonb_build_object('user_id', p_user_id, 'total_score', v_total_score);
END;
$$;

-- 4.18 Set Employee Name from Directory
CREATE OR REPLACE FUNCTION public.set_employee_name_from_directory()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.employee_name IS NULL OR NEW.employee_name = 'Unknown' THEN
    SELECT full_name INTO NEW.employee_name
    FROM team_directory WHERE user_id = NEW.user_id LIMIT 1;
    IF NEW.employee_name IS NULL THEN NEW.employee_name := 'Unknown'; END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 4.19 Sync Shift to Project Assignments
CREATE OR REPLACE FUNCTION public.sync_shift_to_project_assignments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record jsonb;
  user_id_val uuid;
  assigner_id uuid;
BEGIN
  IF NEW.project_id IS NOT NULL THEN
    assigner_id := auth.uid();
    IF NEW.assigned_users IS NOT NULL AND jsonb_array_length(NEW.assigned_users) > 0 THEN
      FOR user_record IN SELECT * FROM jsonb_array_elements(NEW.assigned_users)
      LOOP
        BEGIN
          IF jsonb_typeof(user_record) = 'object' THEN
            user_id_val := (user_record->>'id')::uuid;
          ELSIF jsonb_typeof(user_record) = 'string' THEN
            user_id_val := (user_record#>>'{}')::uuid;
          ELSE CONTINUE; END IF;
          
          IF user_id_val IS NULL THEN CONTINUE; END IF;
          IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id_val) THEN CONTINUE; END IF;
          
          INSERT INTO public.project_team_assignments (project_id, user_id, role, assigned_by)
          VALUES (NEW.project_id, user_id_val, 'contributor', COALESCE(assigner_id, user_id_val))
          ON CONFLICT (project_id, user_id) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN CONTINUE;
        END;
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- SECTION 5: TRIGGERS
-- ============================================================

-- 5.1 Profile creation trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5.2 Updated at triggers
CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_time_clock_updated_at
  BEFORE UPDATE ON public.time_clock
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_team_directory_updated_at
  BEFORE UPDATE ON public.team_directory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5.3 Direct message timestamp trigger
CREATE OR REPLACE TRIGGER update_dm_conversation_timestamp
  AFTER INSERT ON public.direct_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_direct_conversation_timestamp();

-- 5.4 CRM Lead progress trigger
CREATE OR REPLACE TRIGGER create_crm_progress_on_lead
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.create_progress_on_lead_insert();

-- 5.5 Shift assignment sync trigger
CREATE OR REPLACE TRIGGER sync_shift_assignments
  AFTER INSERT OR UPDATE ON public.job_schedules
  FOR EACH ROW EXECUTE FUNCTION public.sync_shift_to_project_assignments();

-- 5.6 Time clock employee name trigger
CREATE OR REPLACE TRIGGER set_time_clock_employee_name
  BEFORE INSERT ON public.time_clock
  FOR EACH ROW EXECUTE FUNCTION public.set_employee_name_from_directory();

-- ============================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rf_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envelope_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envelope_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envelope_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envelope_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_clock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_pay_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labor_burden_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overhead_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_scheduled ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aerial_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roof_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roof_facets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roof_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roofing_variable_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imagery_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roof_quoter_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_workflow_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_customer_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_step_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_user_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_training_documents ENABLE ROW LEVEL SECURITY;

-- Core RLS Policies

-- Profiles
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Admin Users
CREATE POLICY "Users can view own admin status" ON public.admin_users FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role can manage admins" ON public.admin_users FOR ALL USING (current_setting('role') = 'service_role');

-- Team Directory
CREATE POLICY "Admins can manage team directory" ON public.team_directory FOR ALL USING (is_admin());
CREATE POLICY "Team members can view team directory" ON public.team_directory FOR SELECT USING (is_active_team_member());
CREATE POLICY "Users can view own record" ON public.team_directory FOR SELECT USING (user_id = auth.uid());

-- Leads
CREATE POLICY "Admins can manage all leads" ON public.leads FOR ALL USING (is_admin());
CREATE POLICY "Users can view assigned leads" ON public.leads FOR SELECT USING (assigned_to = auth.uid());

-- Projects
CREATE POLICY "Admins can manage all projects" ON public.projects FOR ALL USING (is_admin());
CREATE POLICY "Assigned users can view projects" ON public.projects FOR SELECT USING (check_user_assigned_to_project(id));
CREATE POLICY "Public projects are viewable" ON public.projects FOR SELECT USING (is_public = true);

-- Project Team Assignments
CREATE POLICY "Admins can manage assignments" ON public.project_team_assignments FOR ALL USING (is_admin());
CREATE POLICY "Team members can view assignments" ON public.project_team_assignments FOR SELECT USING (is_active_team_member());

-- Materials
CREATE POLICY "Admins can manage materials" ON public.materials FOR ALL USING (is_admin());
CREATE POLICY "Team members can view materials" ON public.materials FOR SELECT USING (is_active_team_member());

-- Time Clock
CREATE POLICY "Admins can manage time clock" ON public.time_clock FOR ALL USING (is_admin());
CREATE POLICY "Users can view own time entries" ON public.time_clock FOR SELECT USING (user_id = auth.uid() OR is_active_team_member());
CREATE POLICY "Users can insert own time entries" ON public.time_clock FOR INSERT WITH CHECK (user_id = auth.uid());

-- Job Schedules
CREATE POLICY "Admins can manage schedules" ON public.job_schedules FOR ALL USING (is_admin());
CREATE POLICY "Team members can view schedules" ON public.job_schedules FOR SELECT USING (is_active_team_member());

-- Crews
CREATE POLICY "Admins can manage crews" ON public.crews FOR ALL USING (is_admin());
CREATE POLICY "Team members can view crews" ON public.crews FOR SELECT USING (is_active_team_member());

-- Direct Conversations
CREATE POLICY "Users can view own conversations" ON public.direct_conversations FOR SELECT 
  USING (participant_one_id = auth.uid() OR participant_two_id = auth.uid());
CREATE POLICY "Users can create conversations" ON public.direct_conversations FOR INSERT 
  WITH CHECK (participant_one_id = auth.uid() OR participant_two_id = auth.uid());

-- Direct Messages
CREATE POLICY "Users can view messages in own conversations" ON public.direct_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM direct_conversations dc WHERE dc.id = conversation_id 
    AND (dc.participant_one_id = auth.uid() OR dc.participant_two_id = auth.uid())));
CREATE POLICY "Users can send messages" ON public.direct_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- Invoices
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL USING (is_admin());
CREATE POLICY "Team members can view invoices" ON public.invoices FOR SELECT USING (is_active_team_member());

-- Quotes
CREATE POLICY "Admins can manage quotes" ON public.quotes FOR ALL USING (is_admin());
CREATE POLICY "Team members can view quotes" ON public.quotes FOR SELECT USING (is_active_team_member());

-- App Config
CREATE POLICY "Admins can manage config" ON public.app_config FOR ALL USING (is_admin());
CREATE POLICY "Service role can read config" ON public.app_config FOR SELECT USING (true);

-- ============================================================
-- SECTION 7: STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('project-photos', 'project-photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('help-voice-notes', 'help-voice-notes', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('quote-attachments', 'quote-attachments', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Project photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'project-photos');
CREATE POLICY "Team members can upload project photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-photos' AND auth.uid() IS NOT NULL);

-- ============================================================
-- SECTION 8: SEED DATA
-- ============================================================

-- 8.1 Default Roles
INSERT INTO public.rf_roles (key, label, description, permissions) VALUES
  ('owner', 'Owner', 'Full access to all features', '["*"]'::jsonb),
  ('admin', 'Admin', 'Administrative access', '["manage_team", "manage_projects", "manage_settings"]'::jsonb),
  ('manager', 'Manager', 'Can manage projects and team', '["manage_projects", "view_reports"]'::jsonb),
  ('contributor', 'Contributor', 'Field worker access', '["view_projects", "clock_time", "upload_photos"]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 8.2 Default CRM Workflow
INSERT INTO public.crm_workflows (id, name, description, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Default Roofing Workflow', 'Standard workflow for roofing projects', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.crm_workflow_phases (workflow_id, name, phase_order, color, icon) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Lead Capture', 1, '#3b82f6', 'UserPlus'),
  ('11111111-1111-1111-1111-111111111111', 'Qualification', 2, '#8b5cf6', 'ClipboardCheck'),
  ('11111111-1111-1111-1111-111111111111', 'Proposal', 3, '#f59e0b', 'FileText'),
  ('11111111-1111-1111-1111-111111111111', 'Contract', 4, '#10b981', 'FileSignature'),
  ('11111111-1111-1111-1111-111111111111', 'Production', 5, '#ef4444', 'Hammer'),
  ('11111111-1111-1111-1111-111111111111', 'Close-Out', 6, '#6366f1', 'CheckCircle')
ON CONFLICT DO NOTHING;

-- 8.3 Default Edge Categories
INSERT INTO public.edge_categories (key, label, color, group_name, display_order) VALUES
  ('eave', 'Eave', '#3b82f6', 'Perimeter', 1),
  ('rake', 'Rake', '#10b981', 'Perimeter', 2),
  ('ridge', 'Ridge', '#f59e0b', 'Peak', 3),
  ('hip', 'Hip', '#8b5cf6', 'Peak', 4),
  ('valley', 'Valley', '#ef4444', 'Transition', 5),
  ('step_flashing', 'Step Flashing', '#ec4899', 'Flashing', 6),
  ('headwall', 'Headwall', '#14b8a6', 'Flashing', 7),
  ('sidewall', 'Sidewall', '#f97316', 'Flashing', 8),
  ('drip_edge', 'Drip Edge', '#6366f1', 'Perimeter', 9)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SCHEMA SEED COMPLETE
-- ============================================================
-- Run this file on a fresh Lovable Cloud database after remix.
-- This creates all tables, functions, triggers, RLS policies,
-- storage buckets, and seed data needed for a FastFix project.
-- ============================================================
`;
}

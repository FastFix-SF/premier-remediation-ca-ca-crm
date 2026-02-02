-- Create CRM workflow system tables

-- 1. CRM Workflows - Define workflow templates
CREATE TABLE public.crm_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. CRM Workflow Phases - The 5 main phases
CREATE TABLE public.crm_workflow_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.crm_workflows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phase_order INTEGER NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT NOT NULL DEFAULT 'circle',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. CRM Workflow Steps - Sub-steps within each phase
CREATE TABLE public.crm_workflow_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID NOT NULL REFERENCES public.crm_workflow_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  estimated_duration_hours INTEGER DEFAULT 24,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. CRM Customer Progress - Track customer progression through workflow
CREATE TABLE public.crm_customer_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES public.crm_workflows(id) ON DELETE CASCADE,
  current_phase_id UUID REFERENCES public.crm_workflow_phases(id),
  current_step_id UUID REFERENCES public.crm_workflow_steps(id),
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'on_hold')),
  assigned_to UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. CRM Step History - Audit trail of step completions
CREATE TABLE public.crm_step_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_progress_id UUID NOT NULL REFERENCES public.crm_customer_progress(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.crm_workflow_steps(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'complete', 'skipped')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. CRM Automations - Define automation rules and triggers
CREATE TABLE public.crm_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL, -- 'lead_created', 'contract_signed', 'payment_received', etc.
  condition_data JSONB DEFAULT '{}',
  action_type TEXT NOT NULL, -- 'move_phase', 'assign_user', 'create_task', 'send_email'
  action_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. CRM Documents - Document repository integration
CREATE TABLE public.crm_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_progress_id UUID NOT NULL REFERENCES public.crm_customer_progress(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'contract', 'estimate', 'invoice', 'permit', 'inspection_report'
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. CRM User Assignments - Role-based assignments
CREATE TABLE public.crm_user_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_progress_id UUID NOT NULL REFERENCES public.crm_customer_progress(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('sales_rep', 'project_manager', 'admin')),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE(user_id, customer_progress_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.crm_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_workflow_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_customer_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_step_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_user_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for CRM Workflows
CREATE POLICY "Admins can manage workflows" ON public.crm_workflows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can view active workflows" ON public.crm_workflows
  FOR SELECT USING (is_active = true);

-- RLS Policies for CRM Workflow Phases
CREATE POLICY "Admins can manage workflow phases" ON public.crm_workflow_phases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can view workflow phases" ON public.crm_workflow_phases
  FOR SELECT USING (true);

-- RLS Policies for CRM Workflow Steps
CREATE POLICY "Admins can manage workflow steps" ON public.crm_workflow_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can view workflow steps" ON public.crm_workflow_steps
  FOR SELECT USING (true);

-- RLS Policies for CRM Customer Progress
CREATE POLICY "Admins can manage all customer progress" ON public.crm_customer_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Assigned users can view their customer progress" ON public.crm_customer_progress
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM crm_user_assignments cua
      WHERE cua.customer_progress_id = id AND cua.user_id = auth.uid()
    )
  );

CREATE POLICY "Assigned users can update their customer progress" ON public.crm_customer_progress
  FOR UPDATE USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM crm_user_assignments cua
      WHERE cua.customer_progress_id = id AND cua.user_id = auth.uid()
    )
  );

-- RLS Policies for CRM Step History
CREATE POLICY "Admins can manage all step history" ON public.crm_step_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Assigned users can manage step history" ON public.crm_step_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM crm_customer_progress cp
      JOIN crm_user_assignments cua ON cua.customer_progress_id = cp.id
      WHERE cp.id = customer_progress_id AND cua.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM crm_customer_progress cp
      WHERE cp.id = customer_progress_id AND cp.assigned_to = auth.uid()
    )
  );

-- RLS Policies for CRM Automations
CREATE POLICY "Admins can manage automations" ON public.crm_automations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for CRM Documents
CREATE POLICY "Admins can manage all documents" ON public.crm_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Assigned users can manage documents" ON public.crm_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM crm_customer_progress cp
      JOIN crm_user_assignments cua ON cua.customer_progress_id = cp.id
      WHERE cp.id = customer_progress_id AND cua.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM crm_customer_progress cp
      WHERE cp.id = customer_progress_id AND cp.assigned_to = auth.uid()
    )
  );

-- RLS Policies for CRM User Assignments
CREATE POLICY "Admins can manage user assignments" ON public.crm_user_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can view their assignments" ON public.crm_user_assignments
  FOR SELECT USING (user_id = auth.uid());

-- Create triggers for updated_at columns
CREATE TRIGGER update_crm_workflows_updated_at
  BEFORE UPDATE ON public.crm_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_customer_progress_updated_at
  BEFORE UPDATE ON public.crm_customer_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_step_history_updated_at
  BEFORE UPDATE ON public.crm_step_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_automations_updated_at
  BEFORE UPDATE ON public.crm_automations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default roofing workflow
INSERT INTO public.crm_workflows (name, description) VALUES 
('Default Roofing Workflow', 'Standard roofing project workflow from lead to completion');

-- Get the workflow ID for phase insertion
DO $$
DECLARE
  workflow_uuid UUID;
BEGIN
  SELECT id INTO workflow_uuid FROM public.crm_workflows WHERE name = 'Default Roofing Workflow';
  
  -- Insert the 5 main phases
  INSERT INTO public.crm_workflow_phases (workflow_id, name, phase_order, color, icon, description) VALUES
  (workflow_uuid, 'Lead Capture', 1, '#10B981', 'user-plus', 'Initial lead capture and CRM entry'),
  (workflow_uuid, 'Sales Process', 2, '#3B82F6', 'handshake', 'Sales rep assignment through customer decision'),
  (workflow_uuid, 'Contract Signed', 3, '#8B5CF6', 'file-check', 'Contract signing and deposit collection'),
  (workflow_uuid, 'Production', 4, '#F59E0B', 'hammer', 'Project execution from permits to QC'),
  (workflow_uuid, 'Close-Out', 5, '#059669', 'check-circle', 'Final inspection, payment, and feedback');
  
  -- Insert sub-steps for Lead Capture phase
  INSERT INTO public.crm_workflow_steps (phase_id, name, step_order, description) VALUES
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Lead Capture'), 'Source Identification', 1, 'Identify and record lead source'),
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Lead Capture'), 'CRM Entry', 2, 'Enter lead information into CRM system');
  
  -- Insert sub-steps for Sales Process phase
  INSERT INTO public.crm_workflow_steps (phase_id, name, step_order, description) VALUES
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Sales Process'), 'Assign Sales Rep', 1, 'Assign sales representative to lead'),
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Sales Process'), 'Initial Presentation', 2, 'Conduct initial sales presentation'),
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Sales Process'), 'Quote Sent', 3, 'Prepare and send quote to customer'),
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Sales Process'), 'Negotiation', 4, 'Handle customer negotiations and objections'),
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Sales Process'), 'Customer Decision', 5, 'Obtain final customer decision');
  
  -- Insert sub-steps for Contract Signed phase
  INSERT INTO public.crm_workflow_steps (phase_id, name, step_order, description) VALUES
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Contract Signed'), 'Sign Contract', 1, 'Execute contract with customer'),
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Contract Signed'), 'Collect Deposit', 2, 'Collect initial deposit payment');
  
  -- Insert sub-steps for Production phase
  INSERT INTO public.crm_workflow_steps (phase_id, name, step_order, description) VALUES
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Production'), 'Obtain Permits', 1, 'Secure necessary building permits'),
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Production'), 'Order Materials', 2, 'Order and schedule material delivery'),
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Production'), 'Schedule Project', 3, 'Schedule project timeline and crew'),
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Production'), 'Assign Project Manager', 4, 'Assign project manager to oversee work'),
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Production'), 'Execute Project', 5, 'Perform roofing installation work'),
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Production'), 'Quality Check', 6, 'Conduct quality control inspection');
  
  -- Insert sub-steps for Close-Out phase
  INSERT INTO public.crm_workflow_steps (phase_id, name, step_order, description) VALUES
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Close-Out'), 'Final Inspection', 1, 'Conduct final project inspection'),
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Close-Out'), 'Final Invoice', 2, 'Send final invoice to customer'),
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Close-Out'), 'Payment Received', 3, 'Receive final payment from customer'),
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Close-Out'), 'Customer Review', 4, 'Request customer review and feedback'),
  ((SELECT id FROM public.crm_workflow_phases WHERE workflow_id = workflow_uuid AND name = 'Close-Out'), 'CRM Feedback', 5, 'Record feedback in CRM system');
  
  -- Insert default automations
  INSERT INTO public.crm_automations (name, trigger_event, action_type, action_data) VALUES
  ('Auto-assign Lead Capture', 'lead_created', 'move_phase', '{"phase_name": "Lead Capture"}'),
  ('Auto-move to Production', 'contract_signed', 'move_phase', '{"phase_name": "Production"}'),
  ('Create Rework Task', 'inspection_failed', 'create_task', '{"task_type": "rework", "title": "Rework/Correction Required"}'),
  ('Auto-complete on Payment', 'payment_received', 'move_phase', '{"phase_name": "Close-Out", "complete": true}');
  
END $$;
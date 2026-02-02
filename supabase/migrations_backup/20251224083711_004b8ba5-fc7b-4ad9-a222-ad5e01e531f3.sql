
-- Add new columns to projects table (ADDITIVE ONLY - preserving all existing columns)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS contract_amount NUMERIC,
ADD COLUMN IF NOT EXISTS retention_percentage NUMERIC DEFAULT 10,
ADD COLUMN IF NOT EXISTS warranty_start_date DATE,
ADD COLUMN IF NOT EXISTS warranty_months INTEGER DEFAULT 12;

-- Create project_change_orders table
CREATE TABLE IF NOT EXISTS public.project_change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  change_order_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'voided')),
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  impact_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project_inspections table
CREATE TABLE IF NOT EXISTS public.project_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE,
  scheduled_time TIME,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'passed', 'failed', 'cancelled', 'rescheduled')),
  inspector_name TEXT,
  inspector_phone TEXT,
  inspector_email TEXT,
  result_notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project_punchlists table
CREATE TABLE IF NOT EXISTS public.project_punchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'verified')),
  assigned_to UUID REFERENCES auth.users(id),
  photo_url TEXT,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.project_change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_punchlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_change_orders
CREATE POLICY "Admins can manage change orders" ON public.project_change_orders
  FOR ALL USING (public.is_admin());

CREATE POLICY "Team members can view change orders" ON public.project_change_orders
  FOR SELECT USING (public.is_active_team_member());

-- RLS Policies for project_inspections
CREATE POLICY "Admins can manage inspections" ON public.project_inspections
  FOR ALL USING (public.is_admin());

CREATE POLICY "Team members can view inspections" ON public.project_inspections
  FOR SELECT USING (public.is_active_team_member());

CREATE POLICY "Assigned users can update inspections" ON public.project_inspections
  FOR UPDATE USING (
    public.check_user_assigned_to_project(project_id) OR public.is_admin()
  );

-- RLS Policies for project_punchlists
CREATE POLICY "Admins can manage punchlists" ON public.project_punchlists
  FOR ALL USING (public.is_admin());

CREATE POLICY "Team members can view punchlists" ON public.project_punchlists
  FOR SELECT USING (public.is_active_team_member());

CREATE POLICY "Assigned users can update punchlists" ON public.project_punchlists
  FOR UPDATE USING (
    assigned_to = auth.uid() OR public.check_user_assigned_to_project(project_id) OR public.is_admin()
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_change_orders_project ON public.project_change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON public.project_change_orders(status);
CREATE INDEX IF NOT EXISTS idx_inspections_project ON public.project_inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON public.project_inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_scheduled ON public.project_inspections(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_punchlists_project ON public.project_punchlists(project_id);
CREATE INDEX IF NOT EXISTS idx_punchlists_status ON public.project_punchlists(status);
CREATE INDEX IF NOT EXISTS idx_punchlists_assigned ON public.project_punchlists(assigned_to);

-- Triggers for updated_at
CREATE TRIGGER update_change_orders_updated_at
  BEFORE UPDATE ON public.project_change_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at
  BEFORE UPDATE ON public.project_inspections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_punchlists_updated_at
  BEFORE UPDATE ON public.project_punchlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create project_estimates table
CREATE TABLE public.project_estimates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_number TEXT NOT NULL,
  title TEXT,
  customer_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  estimate_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiration_date DATE,
  project_type TEXT DEFAULT 'residential',
  sector TEXT DEFAULT 'new_construction',
  status TEXT NOT NULL DEFAULT 'bidding',
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  project_manager_id UUID,
  estimator_id UUID,
  sales_rep_id UUID,
  invoiced_to TEXT,
  approved_by_id UUID,
  subtotal NUMERIC DEFAULT 0,
  profit_margin_pct NUMERIC DEFAULT 15,
  profit_margin_amount NUMERIC DEFAULT 0,
  tax_pct NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  terms_content TEXT,
  inclusions_content TEXT,
  exclusions_content TEXT,
  scope_summary TEXT,
  cover_sheet_content TEXT,
  cover_sheet_template_id UUID,
  include_cover_sheet BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create estimate_items table
CREATE TABLE public.estimate_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.project_estimates(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'material',
  item_name TEXT NOT NULL,
  description TEXT,
  cost_code TEXT,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'EA',
  unit_cost NUMERIC DEFAULT 0,
  markup_pct NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  tax_applicable BOOLEAN DEFAULT false,
  assigned_to_id UUID,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create estimate_scope_items table
CREATE TABLE public.estimate_scope_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.project_estimates(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT,
  is_included BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create estimate_bid_packages table
CREATE TABLE public.estimate_bid_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.project_estimates(id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create estimate_files table
CREATE TABLE public.estimate_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.project_estimates(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create estimate_notes table
CREATE TABLE public.estimate_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.project_estimates(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create estimate_cover_sheet_templates table
CREATE TABLE public.estimate_cover_sheet_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.project_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_scope_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_bid_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_cover_sheet_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_estimates
CREATE POLICY "Admins can manage all estimates" ON public.project_estimates FOR ALL USING (is_admin());
CREATE POLICY "Team members can view estimates" ON public.project_estimates FOR SELECT USING (is_active_team_member());
CREATE POLICY "Team members can create estimates" ON public.project_estimates FOR INSERT WITH CHECK (is_active_team_member());
CREATE POLICY "Team members can update estimates" ON public.project_estimates FOR UPDATE USING (is_active_team_member());

-- RLS Policies for estimate_items
CREATE POLICY "Admins can manage estimate items" ON public.estimate_items FOR ALL USING (is_admin());
CREATE POLICY "Team members can manage estimate items" ON public.estimate_items FOR ALL USING (is_active_team_member());

-- RLS Policies for estimate_scope_items
CREATE POLICY "Admins can manage scope items" ON public.estimate_scope_items FOR ALL USING (is_admin());
CREATE POLICY "Team members can manage scope items" ON public.estimate_scope_items FOR ALL USING (is_active_team_member());

-- RLS Policies for estimate_bid_packages
CREATE POLICY "Admins can manage bid packages" ON public.estimate_bid_packages FOR ALL USING (is_admin());
CREATE POLICY "Team members can manage bid packages" ON public.estimate_bid_packages FOR ALL USING (is_active_team_member());

-- RLS Policies for estimate_files
CREATE POLICY "Admins can manage estimate files" ON public.estimate_files FOR ALL USING (is_admin());
CREATE POLICY "Team members can manage estimate files" ON public.estimate_files FOR ALL USING (is_active_team_member());

-- RLS Policies for estimate_notes
CREATE POLICY "Admins can manage estimate notes" ON public.estimate_notes FOR ALL USING (is_admin());
CREATE POLICY "Team members can manage estimate notes" ON public.estimate_notes FOR ALL USING (is_active_team_member());

-- RLS Policies for templates
CREATE POLICY "Anyone can view templates" ON public.estimate_cover_sheet_templates FOR SELECT USING (true);
CREATE POLICY "Admins can manage templates" ON public.estimate_cover_sheet_templates FOR ALL USING (is_admin());

-- Create indexes for performance
CREATE INDEX idx_project_estimates_status ON public.project_estimates(status);
CREATE INDEX idx_project_estimates_customer_id ON public.project_estimates(customer_id);
CREATE INDEX idx_project_estimates_project_id ON public.project_estimates(project_id);
CREATE INDEX idx_estimate_items_estimate_id ON public.estimate_items(estimate_id);
CREATE INDEX idx_estimate_scope_items_estimate_id ON public.estimate_scope_items(estimate_id);
CREATE INDEX idx_estimate_files_estimate_id ON public.estimate_files(estimate_id);
CREATE INDEX idx_estimate_notes_estimate_id ON public.estimate_notes(estimate_id);

-- Create trigger for updated_at
CREATE TRIGGER update_project_estimates_updated_at
  BEFORE UPDATE ON public.project_estimates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Generate estimate number function
CREATE OR REPLACE FUNCTION public.generate_estimate_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  estimate_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(estimate_number FROM 'EST-(\d+)') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.project_estimates
  WHERE estimate_number ~ '^EST-\d+$';
  
  estimate_num := 'EST-' || LPAD(next_num::TEXT, 6, '0');
  RETURN estimate_num;
END;
$$;

-- Set estimate number trigger
CREATE OR REPLACE FUNCTION public.set_estimate_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.estimate_number IS NULL OR NEW.estimate_number = '' THEN
    NEW.estimate_number := generate_estimate_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_estimate_number_trigger
  BEFORE INSERT ON public.project_estimates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_estimate_number();
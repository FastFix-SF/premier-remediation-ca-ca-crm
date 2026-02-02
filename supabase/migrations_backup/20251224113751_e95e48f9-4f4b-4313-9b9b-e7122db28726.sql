-- Create work_orders table
CREATE TABLE public.work_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'estimating', 'submitted', 'approved', 'complete', 'cancelled')),
  project_id UUID REFERENCES public.projects(id),
  location TEXT,
  service_start_date DATE,
  service_end_date DATE,
  issued_by UUID,
  issued_by_name TEXT,
  invoiced_to TEXT,
  customer_contract_number TEXT,
  assigned_to UUID,
  assigned_to_name TEXT,
  approved_by UUID,
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ,
  estimated_cost DECIMAL(12,2) DEFAULT 0,
  profit_amount DECIMAL(12,2) DEFAULT 0,
  profit_percentage DECIMAL(5,2) DEFAULT 0,
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  tax_percentage DECIMAL(5,2) DEFAULT 0,
  grand_total DECIMAL(12,2) DEFAULT 0,
  markup_percentage DECIMAL(5,2) DEFAULT 30,
  hours DECIMAL(8,2) DEFAULT 0,
  terms_and_conditions TEXT,
  is_no_cost BOOLEAN DEFAULT false,
  site_type TEXT,
  site_drawing TEXT,
  site_page TEXT,
  site_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create work_order_items table
CREATE TABLE public.work_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  item_type TEXT,
  item_name TEXT NOT NULL,
  cost_code TEXT,
  quantity DECIMAL(12,2) DEFAULT 1,
  unit TEXT,
  unit_cost DECIMAL(12,2) DEFAULT 0,
  markup_percentage DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  tax_applicable BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create work_order_files table
CREATE TABLE public.work_order_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create work_order_notes table
CREATE TABLE public.work_order_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for work_orders
CREATE POLICY "Authenticated users can view work orders" ON public.work_orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create work orders" ON public.work_orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update work orders" ON public.work_orders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete work orders" ON public.work_orders
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for work_order_items
CREATE POLICY "Authenticated users can view work order items" ON public.work_order_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create work order items" ON public.work_order_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update work order items" ON public.work_order_items
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete work order items" ON public.work_order_items
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for work_order_files
CREATE POLICY "Authenticated users can view work order files" ON public.work_order_files
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create work order files" ON public.work_order_files
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete work order files" ON public.work_order_files
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for work_order_notes
CREATE POLICY "Authenticated users can view work order notes" ON public.work_order_notes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create work order notes" ON public.work_order_notes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete work order notes" ON public.work_order_notes
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE TRIGGER update_work_orders_updated_at
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_work_orders_status ON public.work_orders(status);
CREATE INDEX idx_work_orders_project_id ON public.work_orders(project_id);
CREATE INDEX idx_work_order_items_work_order_id ON public.work_order_items(work_order_id);
CREATE INDEX idx_work_order_files_work_order_id ON public.work_order_files(work_order_id);
CREATE INDEX idx_work_order_notes_work_order_id ON public.work_order_notes(work_order_id);
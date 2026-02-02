-- Create change_orders table
CREATE TABLE public.change_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  co_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES public.projects(id),
  estimate_id UUID REFERENCES public.project_estimates(id),
  customer_id UUID REFERENCES public.directory_contacts(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('on_hold', 'open', 'pending_approval', 'unbilled_approved', 'billed', 'denied')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  requested_by TEXT,
  customer_co_number TEXT,
  time_delay TEXT,
  associated_rfi TEXT,
  project_manager_id UUID,
  estimator_id UUID,
  estimated_cost NUMERIC(12,2) DEFAULT 0,
  profit_margin NUMERIC(5,2) DEFAULT 7,
  sub_total NUMERIC(12,2) DEFAULT 0,
  tax NUMERIC(12,2) DEFAULT 0,
  grand_total NUMERIC(12,2) DEFAULT 0,
  is_no_cost BOOLEAN DEFAULT false,
  approved_by TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create change_order_items table
CREATE TABLE public.change_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  change_order_id UUID NOT NULL REFERENCES public.change_orders(id) ON DELETE CASCADE,
  item_type TEXT DEFAULT 'material' CHECK (item_type IN ('material', 'labor', 'equipment', 'subcontractor', 'other')),
  item_name TEXT NOT NULL,
  cost_code TEXT,
  quantity NUMERIC(12,2) DEFAULT 0,
  unit_cost NUMERIC(12,2) DEFAULT 0,
  unit TEXT DEFAULT 'ea',
  markup_percent NUMERIC(5,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  is_taxable BOOLEAN DEFAULT false,
  assigned_to UUID,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create change_order_files table
CREATE TABLE public.change_order_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  change_order_id UUID NOT NULL REFERENCES public.change_orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create change_order_notes table
CREATE TABLE public.change_order_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  change_order_id UUID NOT NULL REFERENCES public.change_orders(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_order_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_order_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view change orders"
  ON public.change_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create change orders"
  ON public.change_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update change orders"
  ON public.change_orders FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete change orders"
  ON public.change_orders FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view change order items"
  ON public.change_order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage change order items"
  ON public.change_order_items FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view change order files"
  ON public.change_order_files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage change order files"
  ON public.change_order_files FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view change order notes"
  ON public.change_order_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage change order notes"
  ON public.change_order_notes FOR ALL
  TO authenticated
  USING (true);

-- Create function to generate CO number
CREATE OR REPLACE FUNCTION generate_change_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.co_number IS NULL THEN
    NEW.co_number := 'CO #' || TO_CHAR(NOW(), 'YYYY') || '-' || 
      LPAD((SELECT COALESCE(MAX(CAST(SPLIT_PART(SPLIT_PART(co_number, '-', 2), '-', 1) AS INTEGER)), 0) + 1 
            FROM change_orders 
            WHERE co_number LIKE 'CO #' || TO_CHAR(NOW(), 'YYYY') || '-%')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating CO number
CREATE TRIGGER set_change_order_number
  BEFORE INSERT ON public.change_orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_change_order_number();

-- Create trigger for updating timestamps
CREATE TRIGGER update_change_orders_updated_at
  BEFORE UPDATE ON public.change_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
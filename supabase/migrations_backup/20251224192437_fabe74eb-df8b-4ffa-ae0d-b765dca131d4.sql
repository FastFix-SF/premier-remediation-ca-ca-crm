
-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT,
  title TEXT NOT NULL,
  supplier TEXT,
  supplier_contact TEXT,
  from_employee TEXT,
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  ship_to TEXT,
  shipped_via TEXT,
  fob_point TEXT,
  payment_terms TEXT,
  reference_number TEXT,
  description TEXT,
  total_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  is_billable BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft',
  project_id UUID REFERENCES public.projects(id),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_order_items table
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(12,2) DEFAULT 1,
  unit TEXT DEFAULT 'EA',
  unit_cost DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_order_notes table
CREATE TABLE public.purchase_order_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_order_files table
CREATE TABLE public.purchase_order_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_files ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow all access to purchase_orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to purchase_order_items" ON public.purchase_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to purchase_order_notes" ON public.purchase_order_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to purchase_order_files" ON public.purchase_order_files FOR ALL USING (true) WITH CHECK (true);

-- Create sequence for PO numbers
CREATE SEQUENCE IF NOT EXISTS public.purchase_order_number_seq START 1;

-- Function to generate PO number
CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.po_number IS NULL THEN
    NEW.po_number := 'PO-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('public.purchase_order_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger
CREATE TRIGGER set_po_number
  BEFORE INSERT ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_po_number();

-- Update timestamp trigger
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for PO files
INSERT INTO storage.buckets (id, name, public)
VALUES ('purchase-order-files', 'purchase-order-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Allow public read access to po files"
ON storage.objects FOR SELECT
USING (bucket_id = 'purchase-order-files');

CREATE POLICY "Allow authenticated users to upload po files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'purchase-order-files');

CREATE POLICY "Allow authenticated users to delete po files"
ON storage.objects FOR DELETE
USING (bucket_id = 'purchase-order-files');

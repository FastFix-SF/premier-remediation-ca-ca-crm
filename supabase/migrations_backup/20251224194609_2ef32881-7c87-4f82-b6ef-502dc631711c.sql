-- Create standalone bills table
CREATE TABLE public.bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_number TEXT,
  vendor_id UUID REFERENCES public.directory_contacts(id),
  vendor_name TEXT,
  project_id UUID REFERENCES public.projects(id),
  project_name TEXT,
  description TEXT,
  bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  terms TEXT,
  sub_total NUMERIC(12,2) DEFAULT 0,
  tax NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  paid NUMERIC(12,2) DEFAULT 0,
  balance_due NUMERIC(12,2) GENERATED ALWAYS AS (COALESCE(total, 0) - COALESCE(paid, 0)) STORED,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'partial', 'paid', 'overdue', 'void')),
  is_billable BOOLEAN DEFAULT true,
  ref_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create bill line items table
CREATE TABLE public.bill_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  cost_code TEXT,
  quantity NUMERIC(12,4) DEFAULT 1,
  unit TEXT,
  unit_cost NUMERIC(12,4) DEFAULT 0,
  total NUMERIC(12,2) GENERATED ALWAYS AS (COALESCE(quantity, 1) * COALESCE(unit_cost, 0)) STORED,
  is_taxable BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bill payments table
CREATE TABLE public.bill_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create bill files table
CREATE TABLE public.bill_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Create bill notes table
CREATE TABLE public.bill_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for bills
CREATE POLICY "Users can view bills" ON public.bills FOR SELECT USING (true);
CREATE POLICY "Users can insert bills" ON public.bills FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update bills" ON public.bills FOR UPDATE USING (true);
CREATE POLICY "Users can delete bills" ON public.bills FOR DELETE USING (true);

-- Create policies for bill_items
CREATE POLICY "Users can view bill items" ON public.bill_items FOR SELECT USING (true);
CREATE POLICY "Users can insert bill items" ON public.bill_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update bill items" ON public.bill_items FOR UPDATE USING (true);
CREATE POLICY "Users can delete bill items" ON public.bill_items FOR DELETE USING (true);

-- Create policies for bill_payments
CREATE POLICY "Users can view bill payments" ON public.bill_payments FOR SELECT USING (true);
CREATE POLICY "Users can insert bill payments" ON public.bill_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update bill payments" ON public.bill_payments FOR UPDATE USING (true);
CREATE POLICY "Users can delete bill payments" ON public.bill_payments FOR DELETE USING (true);

-- Create policies for bill_files
CREATE POLICY "Users can view bill files" ON public.bill_files FOR SELECT USING (true);
CREATE POLICY "Users can insert bill files" ON public.bill_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update bill files" ON public.bill_files FOR UPDATE USING (true);
CREATE POLICY "Users can delete bill files" ON public.bill_files FOR DELETE USING (true);

-- Create policies for bill_notes
CREATE POLICY "Users can view bill notes" ON public.bill_notes FOR SELECT USING (true);
CREATE POLICY "Users can insert bill notes" ON public.bill_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update bill notes" ON public.bill_notes FOR UPDATE USING (true);
CREATE POLICY "Users can delete bill notes" ON public.bill_notes FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON public.bills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_bills_vendor_id ON public.bills(vendor_id);
CREATE INDEX idx_bills_project_id ON public.bills(project_id);
CREATE INDEX idx_bills_status ON public.bills(status);
CREATE INDEX idx_bills_due_date ON public.bills(due_date);
CREATE INDEX idx_bill_items_bill_id ON public.bill_items(bill_id);
CREATE INDEX idx_bill_payments_bill_id ON public.bill_payments(bill_id);
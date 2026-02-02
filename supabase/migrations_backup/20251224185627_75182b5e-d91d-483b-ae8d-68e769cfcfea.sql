-- Add new columns to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS terms_conditions TEXT,
ADD COLUMN IF NOT EXISTS retainage_percent NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS period_start_date DATE,
ADD COLUMN IF NOT EXISTS period_end_date DATE,
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS online_payment_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id),
ADD COLUMN IF NOT EXISTS estimate_id UUID REFERENCES public.project_estimates(id),
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.directory_contacts(id),
ADD COLUMN IF NOT EXISTS address TEXT;

-- Create invoice_items table
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_type TEXT DEFAULT 'material',
  item_name TEXT NOT NULL,
  cost_code TEXT,
  quantity NUMERIC DEFAULT 1,
  unit_cost NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'EA',
  markup_percent NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  is_taxable BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice_payments table
CREATE TABLE public.invoice_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_type TEXT DEFAULT 'check',
  payment_note TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'received',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create invoice_files table
CREATE TABLE public.invoice_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice_notes table
CREATE TABLE public.invoice_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoice_items
CREATE POLICY "Authenticated users can view invoice items"
  ON public.invoice_items FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create invoice items"
  ON public.invoice_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update invoice items"
  ON public.invoice_items FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete invoice items"
  ON public.invoice_items FOR DELETE
  USING (true);

-- RLS Policies for invoice_payments
CREATE POLICY "Authenticated users can view invoice payments"
  ON public.invoice_payments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create invoice payments"
  ON public.invoice_payments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update invoice payments"
  ON public.invoice_payments FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete invoice payments"
  ON public.invoice_payments FOR DELETE
  USING (true);

-- RLS Policies for invoice_files
CREATE POLICY "Authenticated users can view invoice files"
  ON public.invoice_files FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create invoice files"
  ON public.invoice_files FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update invoice files"
  ON public.invoice_files FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete invoice files"
  ON public.invoice_files FOR DELETE
  USING (true);

-- RLS Policies for invoice_notes
CREATE POLICY "Authenticated users can view invoice notes"
  ON public.invoice_notes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create invoice notes"
  ON public.invoice_notes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update invoice notes"
  ON public.invoice_notes FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete invoice notes"
  ON public.invoice_notes FOR DELETE
  USING (true);
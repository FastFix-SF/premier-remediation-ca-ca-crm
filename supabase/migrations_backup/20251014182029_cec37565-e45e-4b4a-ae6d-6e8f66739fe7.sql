-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  invoice_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  project_name TEXT NOT NULL,
  project_address TEXT,
  description TEXT,
  subtotal NUMERIC NOT NULL,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  balance_due NUMERIC NOT NULL,
  payment_method TEXT,
  credit_card_fee NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  payment_terms TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Admins can manage all invoices
CREATE POLICY "Admins can manage all invoices"
ON public.invoices
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- Customers can view their invoices
CREATE POLICY "Customers can view their invoices"
ON public.invoices
FOR SELECT
USING (customer_email = auth.email());

-- Public access for payment (via invoice number)
CREATE POLICY "Public can view invoices for payment"
ON public.invoices
FOR SELECT
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoices_customer_email ON public.invoices(customer_email);
CREATE INDEX idx_invoices_status ON public.invoices(status);
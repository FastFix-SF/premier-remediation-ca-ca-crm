-- Create payments table for standalone payments management
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_number TEXT,
  customer_name TEXT NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id),
  invoice_number TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_type TEXT DEFAULT 'check',
  deposit_to TEXT,
  reference_number TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_notes table
CREATE TABLE public.payment_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Authenticated users can view payments"
  ON public.payments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create payments"
  ON public.payments FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update payments"
  ON public.payments FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete payments"
  ON public.payments FOR DELETE USING (true);

-- RLS Policies for payment_notes
CREATE POLICY "Authenticated users can view payment notes"
  ON public.payment_notes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create payment notes"
  ON public.payment_notes FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update payment notes"
  ON public.payment_notes FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete payment notes"
  ON public.payment_notes FOR DELETE USING (true);

-- Auto-generate payment number
CREATE OR REPLACE FUNCTION public.generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_number IS NULL THEN
    NEW.payment_number := 'PMT-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
      LPAD((SELECT COALESCE(MAX(CAST(SPLIT_PART(SPLIT_PART(payment_number, '-', 3), '-', 1) AS INTEGER)), 0) + 1 
            FROM payments 
            WHERE payment_number LIKE 'PMT-' || TO_CHAR(NOW(), 'YYYY') || '-%')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_payment_number
  BEFORE INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_payment_number();

-- Updated_at trigger
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
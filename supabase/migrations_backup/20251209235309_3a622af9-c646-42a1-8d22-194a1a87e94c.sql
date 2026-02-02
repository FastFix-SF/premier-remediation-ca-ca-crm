-- Create contact_bills table to store bills for contacts
CREATE TABLE public.contact_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.directory_contacts(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.directory_contacts(id) ON DELETE SET NULL,
  bill_number TEXT NOT NULL,
  bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
  terms TEXT,
  is_billable BOOLEAN DEFAULT false,
  amount NUMERIC(12,2),
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.contact_bills ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_bills
CREATE POLICY "Authenticated users can view all bills"
  ON public.contact_bills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert bills"
  ON public.contact_bills FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update bills"
  ON public.contact_bills FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete bills"
  ON public.contact_bills FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_contact_bills_updated_at
  BEFORE UPDATE ON public.contact_bills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
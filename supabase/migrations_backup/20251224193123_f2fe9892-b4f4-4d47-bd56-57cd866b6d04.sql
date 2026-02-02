
-- Create sub_contracts table
CREATE TABLE public.sub_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agreement_number TEXT,
  subject TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  subcontractor_id UUID REFERENCES public.directory_contacts(id),
  issued_by UUID,
  date DATE DEFAULT CURRENT_DATE,
  work_retainage_percent NUMERIC(5,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  billed_amount NUMERIC(12,2) DEFAULT 0,
  total_retainage NUMERIC(12,2) DEFAULT 0,
  remaining_retainage NUMERIC(12,2) DEFAULT 0,
  paid NUMERIC(12,2) DEFAULT 0,
  balance NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'committed', 'submitted', 'approved', 'closed')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sub_contract_items table (Original Scope items)
CREATE TABLE public.sub_contract_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_contract_id UUID NOT NULL REFERENCES public.sub_contracts(id) ON DELETE CASCADE,
  item_type TEXT,
  item_name TEXT NOT NULL,
  cost_code TEXT,
  quantity NUMERIC(12,2) DEFAULT 1,
  unit_cost NUMERIC(12,2) DEFAULT 0,
  unit TEXT,
  billed NUMERIC(12,2) DEFAULT 0,
  remaining NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sub_contract_terms table
CREATE TABLE public.sub_contract_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_contract_id UUID NOT NULL REFERENCES public.sub_contracts(id) ON DELETE CASCADE,
  default_terms TEXT,
  scope_of_work TEXT,
  inclusions TEXT,
  exclusions TEXT,
  clarifications TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sub_contract_documents table (Insurance Certificates)
CREATE TABLE public.sub_contract_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_contract_id UUID NOT NULL REFERENCES public.sub_contracts(id) ON DELETE CASCADE,
  policy_type TEXT,
  policy_number TEXT,
  expires_at DATE,
  status TEXT DEFAULT 'active',
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sub_contract_bills table (Associated Bills)
CREATE TABLE public.sub_contract_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_contract_id UUID NOT NULL REFERENCES public.sub_contracts(id) ON DELETE CASCADE,
  bill_number TEXT,
  bill_date DATE,
  due_date DATE,
  total NUMERIC(12,2) DEFAULT 0,
  paid NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sub_contract_files table
CREATE TABLE public.sub_contract_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_contract_id UUID NOT NULL REFERENCES public.sub_contracts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sub_contract_notes table
CREATE TABLE public.sub_contract_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_contract_id UUID NOT NULL REFERENCES public.sub_contracts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sub_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_contract_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_contract_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_contract_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_contract_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_contract_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_contract_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sub_contracts
CREATE POLICY "Allow all for authenticated users" ON public.sub_contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.sub_contract_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.sub_contract_terms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.sub_contract_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.sub_contract_bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.sub_contract_files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.sub_contract_notes FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for sub-contract files
INSERT INTO storage.buckets (id, name, public) VALUES ('sub-contract-files', 'sub-contract-files', true);

-- Storage policies
CREATE POLICY "Allow public read access" ON storage.objects FOR SELECT USING (bucket_id = 'sub-contract-files');
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'sub-contract-files');
CREATE POLICY "Allow authenticated updates" ON storage.objects FOR UPDATE USING (bucket_id = 'sub-contract-files');
CREATE POLICY "Allow authenticated deletes" ON storage.objects FOR DELETE USING (bucket_id = 'sub-contract-files');

-- Auto-generate agreement number
CREATE OR REPLACE FUNCTION public.generate_agreement_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  next_num INTEGER;
  agreement_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(agreement_number FROM 'SC-(\d+)') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.sub_contracts
  WHERE agreement_number ~ '^SC-\d+$';
  
  agreement_num := 'SC-' || LPAD(next_num::TEXT, 6, '0');
  RETURN agreement_num;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_agreement_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.agreement_number IS NULL OR NEW.agreement_number = '' THEN
    NEW.agreement_number := generate_agreement_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_agreement_number_trigger
BEFORE INSERT ON public.sub_contracts
FOR EACH ROW
EXECUTE FUNCTION set_agreement_number();

-- Update timestamp trigger
CREATE TRIGGER update_sub_contracts_updated_at
BEFORE UPDATE ON public.sub_contracts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_contract_terms_updated_at
BEFORE UPDATE ON public.sub_contract_terms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

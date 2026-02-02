
-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_number TEXT,
  expense_name TEXT NOT NULL,
  vendor TEXT,
  expense_type TEXT DEFAULT 'material',
  expense_date DATE DEFAULT CURRENT_DATE,
  employee_name TEXT,
  account TEXT DEFAULT 'Company',
  bank_account TEXT,
  cost_code TEXT,
  amount DECIMAL(12,2) DEFAULT 0,
  is_billable BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  reason TEXT,
  ref_number TEXT,
  project_id UUID REFERENCES public.projects(id),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense_notes table
CREATE TABLE public.expense_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense_files table
CREATE TABLE public.expense_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for expenses
CREATE POLICY "Allow all access to expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to expense_notes" ON public.expense_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to expense_files" ON public.expense_files FOR ALL USING (true) WITH CHECK (true);

-- Function to generate expense number
CREATE OR REPLACE FUNCTION public.generate_expense_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expense_number := 'EXP-' || LPAD(NEXTVAL('public.expense_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for expense numbers
CREATE SEQUENCE IF NOT EXISTS public.expense_number_seq START 1;

-- Create trigger
CREATE TRIGGER set_expense_number
  BEFORE INSERT ON public.expenses
  FOR EACH ROW
  WHEN (NEW.expense_number IS NULL)
  EXECUTE FUNCTION public.generate_expense_number();

-- Update timestamp trigger
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

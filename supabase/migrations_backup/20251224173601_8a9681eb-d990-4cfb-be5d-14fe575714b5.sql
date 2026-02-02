-- Create service_tickets table
CREATE TABLE public.service_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Customer/Project linkage
  customer_id UUID REFERENCES public.leads(id),
  project_id UUID REFERENCES public.projects(id),
  
  -- Address info
  service_address TEXT,
  service_city TEXT,
  service_state TEXT,
  service_zip TEXT,
  access_gate_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  
  -- Scheduling
  status TEXT NOT NULL DEFAULT 'unscheduled',
  scheduled_date DATE,
  scheduled_time TIME,
  duration_hours NUMERIC DEFAULT 1,
  
  -- Assignment
  assigned_technician_id UUID,
  
  -- Tracking
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Financials
  is_billable BOOLEAN DEFAULT true,
  total_amount NUMERIC DEFAULT 0,
  
  -- Metadata
  service_notes TEXT,
  internal_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create service_ticket_items table (for line items)
CREATE TABLE public.service_ticket_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  item_type TEXT DEFAULT 'labor',
  item_name TEXT NOT NULL,
  description TEXT,
  cost_code TEXT,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'ea',
  unit_cost NUMERIC DEFAULT 0,
  total NUMERIC GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create service_ticket_time_cards table
CREATE TABLE public.service_ticket_time_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  employee_id UUID,
  employee_name TEXT,
  work_date DATE NOT NULL,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  duration_hours NUMERIC,
  cost_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create service_ticket_files table
CREATE TABLE public.service_ticket_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create service_ticket_notes table
CREATE TABLE public.service_ticket_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create service_ticket_invoices table
CREATE TABLE public.service_ticket_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  balance NUMERIC GENERATED ALWAYS AS (amount - paid_amount) STORED,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create service_ticket_payments table
CREATE TABLE public.service_ticket_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.service_ticket_invoices(id),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL,
  payment_type TEXT DEFAULT 'check',
  payment_note TEXT,
  status TEXT DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_ticket_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_ticket_time_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_ticket_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_ticket_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_ticket_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_ticket_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_tickets
CREATE POLICY "Admins can manage service tickets" ON public.service_tickets FOR ALL USING (is_admin());
CREATE POLICY "Team members can view service tickets" ON public.service_tickets FOR SELECT USING (is_active_team_member());
CREATE POLICY "Team members can create service tickets" ON public.service_tickets FOR INSERT WITH CHECK (is_active_team_member());
CREATE POLICY "Assigned technicians can update their tickets" ON public.service_tickets FOR UPDATE USING (assigned_technician_id = auth.uid() OR is_admin());

-- RLS Policies for related tables (inherit from ticket access)
CREATE POLICY "Admins can manage ticket items" ON public.service_ticket_items FOR ALL USING (is_admin());
CREATE POLICY "Team members can view ticket items" ON public.service_ticket_items FOR SELECT USING (is_active_team_member());
CREATE POLICY "Team members can manage ticket items" ON public.service_ticket_items FOR ALL USING (is_active_team_member());

CREATE POLICY "Admins can manage time cards" ON public.service_ticket_time_cards FOR ALL USING (is_admin());
CREATE POLICY "Team members can view time cards" ON public.service_ticket_time_cards FOR SELECT USING (is_active_team_member());
CREATE POLICY "Team members can manage time cards" ON public.service_ticket_time_cards FOR ALL USING (is_active_team_member());

CREATE POLICY "Admins can manage ticket files" ON public.service_ticket_files FOR ALL USING (is_admin());
CREATE POLICY "Team members can view ticket files" ON public.service_ticket_files FOR SELECT USING (is_active_team_member());
CREATE POLICY "Team members can manage ticket files" ON public.service_ticket_files FOR ALL USING (is_active_team_member());

CREATE POLICY "Admins can manage ticket notes" ON public.service_ticket_notes FOR ALL USING (is_admin());
CREATE POLICY "Team members can view ticket notes" ON public.service_ticket_notes FOR SELECT USING (is_active_team_member());
CREATE POLICY "Team members can manage ticket notes" ON public.service_ticket_notes FOR ALL USING (is_active_team_member());

CREATE POLICY "Admins can manage ticket invoices" ON public.service_ticket_invoices FOR ALL USING (is_admin());
CREATE POLICY "Team members can view ticket invoices" ON public.service_ticket_invoices FOR SELECT USING (is_active_team_member());

CREATE POLICY "Admins can manage ticket payments" ON public.service_ticket_payments FOR ALL USING (is_admin());
CREATE POLICY "Team members can view ticket payments" ON public.service_ticket_payments FOR SELECT USING (is_active_team_member());

-- Create indexes
CREATE INDEX idx_service_tickets_status ON public.service_tickets(status);
CREATE INDEX idx_service_tickets_customer ON public.service_tickets(customer_id);
CREATE INDEX idx_service_tickets_technician ON public.service_tickets(assigned_technician_id);
CREATE INDEX idx_service_tickets_scheduled ON public.service_tickets(scheduled_date);
CREATE INDEX idx_service_ticket_items_ticket ON public.service_ticket_items(ticket_id);
CREATE INDEX idx_service_ticket_time_cards_ticket ON public.service_ticket_time_cards(ticket_id);

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  ticket_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 'ST #(\d+)') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.service_tickets
  WHERE ticket_number ~ '^ST #\d+$';
  
  ticket_num := 'ST #' || next_num::TEXT;
  RETURN ticket_num;
END;
$$;

-- Trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_ticket_number_trigger
  BEFORE INSERT ON public.service_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Updated_at trigger
CREATE TRIGGER update_service_tickets_updated_at
  BEFORE UPDATE ON public.service_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- Create bid_packages table (enhanced version)
CREATE TABLE IF NOT EXISTS public.bid_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID REFERENCES public.project_estimates(id) ON DELETE CASCADE,
  bid_number TEXT UNIQUE,
  title TEXT NOT NULL,
  bidding_deadline DATE,
  deadline_time TIME,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'awarded', 'closed')),
  bid_manager_id UUID REFERENCES auth.users(id),
  reminder_days INTEGER DEFAULT 3,
  scope_of_work TEXT,
  terms TEXT,
  inclusions TEXT,
  exclusions TEXT,
  clarification TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bid_package_items table
CREATE TABLE IF NOT EXISTS public.bid_package_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_package_id UUID NOT NULL REFERENCES public.bid_packages(id) ON DELETE CASCADE,
  item_type TEXT DEFAULT 'material' CHECK (item_type IN ('material', 'labor', 'equipment', 'subcontractor', 'other')),
  item_name TEXT NOT NULL,
  description TEXT,
  cost_code TEXT,
  quantity DECIMAL(10,2),
  unit TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bid_package_files table
CREATE TABLE IF NOT EXISTS public.bid_package_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_package_id UUID NOT NULL REFERENCES public.bid_packages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bid_package_bidders table
CREATE TABLE IF NOT EXISTS public.bid_package_bidders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_package_id UUID NOT NULL REFERENCES public.bid_packages(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  invited_at TIMESTAMPTZ,
  date_sent TIMESTAMPTZ,
  will_submit BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'submitted', 'awarded', 'declined')),
  bid_amount DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bid_submissions table for detailed submission tracking
CREATE TABLE IF NOT EXISTS public.bid_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bidder_id UUID NOT NULL REFERENCES public.bid_package_bidders(id) ON DELETE CASCADE,
  bid_package_id UUID NOT NULL REFERENCES public.bid_packages(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  bid_total DECIMAL(12,2),
  notes TEXT,
  is_awarded BOOLEAN DEFAULT false,
  awarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.bid_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_package_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_package_bidders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bid_packages
CREATE POLICY "Admins can manage bid packages" ON public.bid_packages
  FOR ALL USING (public.is_admin());

CREATE POLICY "Team members can view bid packages" ON public.bid_packages
  FOR SELECT USING (public.is_active_team_member());

-- RLS Policies for bid_package_items
CREATE POLICY "Admins can manage bid package items" ON public.bid_package_items
  FOR ALL USING (public.is_admin());

CREATE POLICY "Team members can view bid package items" ON public.bid_package_items
  FOR SELECT USING (public.is_active_team_member());

-- RLS Policies for bid_package_files
CREATE POLICY "Admins can manage bid package files" ON public.bid_package_files
  FOR ALL USING (public.is_admin());

CREATE POLICY "Team members can view bid package files" ON public.bid_package_files
  FOR SELECT USING (public.is_active_team_member());

-- RLS Policies for bid_package_bidders
CREATE POLICY "Admins can manage bid package bidders" ON public.bid_package_bidders
  FOR ALL USING (public.is_admin());

CREATE POLICY "Team members can view bid package bidders" ON public.bid_package_bidders
  FOR SELECT USING (public.is_active_team_member());

-- RLS Policies for bid_submissions
CREATE POLICY "Admins can manage bid submissions" ON public.bid_submissions
  FOR ALL USING (public.is_admin());

CREATE POLICY "Team members can view bid submissions" ON public.bid_submissions
  FOR SELECT USING (public.is_active_team_member());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bid_packages_estimate_id ON public.bid_packages(estimate_id);
CREATE INDEX IF NOT EXISTS idx_bid_packages_status ON public.bid_packages(status);
CREATE INDEX IF NOT EXISTS idx_bid_package_items_package_id ON public.bid_package_items(bid_package_id);
CREATE INDEX IF NOT EXISTS idx_bid_package_files_package_id ON public.bid_package_files(bid_package_id);
CREATE INDEX IF NOT EXISTS idx_bid_package_bidders_package_id ON public.bid_package_bidders(bid_package_id);
CREATE INDEX IF NOT EXISTS idx_bid_submissions_bidder_id ON public.bid_submissions(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bid_submissions_package_id ON public.bid_submissions(bid_package_id);

-- Create function to generate bid number
CREATE OR REPLACE FUNCTION public.generate_bid_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  bid_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(bid_number FROM 'BID-(\d+)') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.bid_packages
  WHERE bid_number ~ '^BID-\d+$';
  
  bid_num := 'BID-' || LPAD(next_num::TEXT, 6, '0');
  RETURN bid_num;
END;
$$;

-- Create trigger to auto-set bid number
CREATE OR REPLACE FUNCTION public.set_bid_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.bid_number IS NULL OR NEW.bid_number = '' THEN
    NEW.bid_number := generate_bid_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_bid_number_trigger
  BEFORE INSERT ON public.bid_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_bid_number();

-- Add updated_at trigger for bid_packages
CREATE TRIGGER update_bid_packages_updated_at
  BEFORE UPDATE ON public.bid_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for bid_package_bidders
CREATE TRIGGER update_bid_package_bidders_updated_at
  BEFORE UPDATE ON public.bid_package_bidders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
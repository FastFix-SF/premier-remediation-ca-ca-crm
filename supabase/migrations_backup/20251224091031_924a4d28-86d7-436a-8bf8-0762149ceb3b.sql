-- Daily Log Entries - main table, one entry per project per day
CREATE TABLE public.daily_log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  arrival_time TIME,
  departure_time TIME,
  tasks_performed TEXT,
  weather_data JSONB DEFAULT '{}',
  site_condition TEXT DEFAULT 'good' CHECK (site_condition IN ('good', 'fair', 'poor')),
  site_condition_notes TEXT,
  has_weather_delay BOOLEAN DEFAULT false,
  has_schedule_delay BOOLEAN DEFAULT false,
  delay_notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, log_date)
);

-- Daily Log People - employees on site for a specific day
CREATE TABLE public.daily_log_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID NOT NULL REFERENCES public.daily_log_entries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  employee_name TEXT NOT NULL,
  hours_worked NUMERIC(5,2),
  cost_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily Log Visitors - visitors to job site
CREATE TABLE public.daily_log_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID NOT NULL REFERENCES public.daily_log_entries(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  company TEXT,
  purpose TEXT,
  arrival_time TIME,
  departure_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily Log Subcontractors - subs on site
CREATE TABLE public.daily_log_subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID NOT NULL REFERENCES public.daily_log_entries(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  workers_count INTEGER DEFAULT 0,
  work_performed TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily Log Materials - materials delivered/used
CREATE TABLE public.daily_log_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID NOT NULL REFERENCES public.daily_log_entries(id) ON DELETE CASCADE,
  material_type TEXT NOT NULL CHECK (material_type IN ('delivered', 'used')),
  item_name TEXT NOT NULL,
  quantity NUMERIC(10,2),
  unit TEXT,
  delivered_by TEXT,
  supplier TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily Log Equipment - equipment tracking
CREATE TABLE public.daily_log_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID NOT NULL REFERENCES public.daily_log_entries(id) ON DELETE CASCADE,
  equipment_type TEXT NOT NULL CHECK (equipment_type IN ('delivered', 'used', 'log')),
  equipment_name TEXT NOT NULL,
  hours NUMERIC(5,2),
  operator TEXT,
  cost_code TEXT,
  status TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily Log Notes - general & project notes
CREATE TABLE public.daily_log_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID NOT NULL REFERENCES public.daily_log_entries(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL DEFAULT 'general' CHECK (note_type IN ('general', 'project', 'safety')),
  title TEXT,
  content TEXT NOT NULL,
  posted_by UUID REFERENCES auth.users(id),
  posted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily Log Files - attached files & photos
CREATE TABLE public.daily_log_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID NOT NULL REFERENCES public.daily_log_entries(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  category TEXT DEFAULT 'document' CHECK (category IN ('photo', 'document')),
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_daily_log_entries_project_id ON public.daily_log_entries(project_id);
CREATE INDEX idx_daily_log_entries_log_date ON public.daily_log_entries(log_date);
CREATE INDEX idx_daily_log_entries_created_by ON public.daily_log_entries(created_by);
CREATE INDEX idx_daily_log_people_daily_log_id ON public.daily_log_people(daily_log_id);
CREATE INDEX idx_daily_log_visitors_daily_log_id ON public.daily_log_visitors(daily_log_id);
CREATE INDEX idx_daily_log_subcontractors_daily_log_id ON public.daily_log_subcontractors(daily_log_id);
CREATE INDEX idx_daily_log_materials_daily_log_id ON public.daily_log_materials(daily_log_id);
CREATE INDEX idx_daily_log_equipment_daily_log_id ON public.daily_log_equipment(daily_log_id);
CREATE INDEX idx_daily_log_notes_daily_log_id ON public.daily_log_notes(daily_log_id);
CREATE INDEX idx_daily_log_files_daily_log_id ON public.daily_log_files(daily_log_id);

-- Enable RLS on all tables
ALTER TABLE public.daily_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_log_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_log_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_log_subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_log_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_log_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_log_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_log_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_log_entries
CREATE POLICY "Admins can manage daily log entries"
  ON public.daily_log_entries FOR ALL
  USING (is_admin());

CREATE POLICY "Team members can view daily log entries"
  ON public.daily_log_entries FOR SELECT
  USING (is_active_team_member());

CREATE POLICY "Team members can create daily log entries"
  ON public.daily_log_entries FOR INSERT
  WITH CHECK (is_active_team_member());

CREATE POLICY "Team members can update their own daily log entries"
  ON public.daily_log_entries FOR UPDATE
  USING (created_by = auth.uid() OR is_admin());

-- RLS Policies for daily_log_people
CREATE POLICY "Admins can manage daily log people"
  ON public.daily_log_people FOR ALL
  USING (is_admin());

CREATE POLICY "Team members can view daily log people"
  ON public.daily_log_people FOR SELECT
  USING (is_active_team_member());

CREATE POLICY "Team members can manage daily log people"
  ON public.daily_log_people FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.daily_log_entries dle
    WHERE dle.id = daily_log_people.daily_log_id
    AND (dle.created_by = auth.uid() OR is_admin())
  ));

-- RLS Policies for daily_log_visitors
CREATE POLICY "Admins can manage daily log visitors"
  ON public.daily_log_visitors FOR ALL
  USING (is_admin());

CREATE POLICY "Team members can view daily log visitors"
  ON public.daily_log_visitors FOR SELECT
  USING (is_active_team_member());

CREATE POLICY "Team members can manage daily log visitors"
  ON public.daily_log_visitors FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.daily_log_entries dle
    WHERE dle.id = daily_log_visitors.daily_log_id
    AND (dle.created_by = auth.uid() OR is_admin())
  ));

-- RLS Policies for daily_log_subcontractors
CREATE POLICY "Admins can manage daily log subcontractors"
  ON public.daily_log_subcontractors FOR ALL
  USING (is_admin());

CREATE POLICY "Team members can view daily log subcontractors"
  ON public.daily_log_subcontractors FOR SELECT
  USING (is_active_team_member());

CREATE POLICY "Team members can manage daily log subcontractors"
  ON public.daily_log_subcontractors FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.daily_log_entries dle
    WHERE dle.id = daily_log_subcontractors.daily_log_id
    AND (dle.created_by = auth.uid() OR is_admin())
  ));

-- RLS Policies for daily_log_materials
CREATE POLICY "Admins can manage daily log materials"
  ON public.daily_log_materials FOR ALL
  USING (is_admin());

CREATE POLICY "Team members can view daily log materials"
  ON public.daily_log_materials FOR SELECT
  USING (is_active_team_member());

CREATE POLICY "Team members can manage daily log materials"
  ON public.daily_log_materials FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.daily_log_entries dle
    WHERE dle.id = daily_log_materials.daily_log_id
    AND (dle.created_by = auth.uid() OR is_admin())
  ));

-- RLS Policies for daily_log_equipment
CREATE POLICY "Admins can manage daily log equipment"
  ON public.daily_log_equipment FOR ALL
  USING (is_admin());

CREATE POLICY "Team members can view daily log equipment"
  ON public.daily_log_equipment FOR SELECT
  USING (is_active_team_member());

CREATE POLICY "Team members can manage daily log equipment"
  ON public.daily_log_equipment FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.daily_log_entries dle
    WHERE dle.id = daily_log_equipment.daily_log_id
    AND (dle.created_by = auth.uid() OR is_admin())
  ));

-- RLS Policies for daily_log_notes
CREATE POLICY "Admins can manage daily log notes"
  ON public.daily_log_notes FOR ALL
  USING (is_admin());

CREATE POLICY "Team members can view daily log notes"
  ON public.daily_log_notes FOR SELECT
  USING (is_active_team_member());

CREATE POLICY "Team members can manage daily log notes"
  ON public.daily_log_notes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.daily_log_entries dle
    WHERE dle.id = daily_log_notes.daily_log_id
    AND (dle.created_by = auth.uid() OR is_admin())
  ));

-- RLS Policies for daily_log_files
CREATE POLICY "Admins can manage daily log files"
  ON public.daily_log_files FOR ALL
  USING (is_admin());

CREATE POLICY "Team members can view daily log files"
  ON public.daily_log_files FOR SELECT
  USING (is_active_team_member());

CREATE POLICY "Team members can manage daily log files"
  ON public.daily_log_files FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.daily_log_entries dle
    WHERE dle.id = daily_log_files.daily_log_id
    AND (dle.created_by = auth.uid() OR is_admin())
  ));

-- Update trigger for daily_log_entries
CREATE TRIGGER update_daily_log_entries_updated_at
  BEFORE UPDATE ON public.daily_log_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
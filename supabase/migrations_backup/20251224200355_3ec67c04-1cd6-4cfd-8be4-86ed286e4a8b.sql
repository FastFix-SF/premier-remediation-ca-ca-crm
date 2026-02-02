-- Create incidents table
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_number TEXT,
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  incident_time TIME,
  type TEXT NOT NULL DEFAULT 'incident', -- incident, write-up
  classification TEXT, -- accident, termination, water intrusion, near-miss, observation, verbal, written, time off
  severity TEXT DEFAULT 'low', -- low, medium, high, critical
  description TEXT,
  location TEXT,
  project_id UUID REFERENCES public.projects(id),
  cost_code TEXT,
  
  -- People involved
  involved_employee_ids UUID[] DEFAULT '{}',
  witness_ids UUID[] DEFAULT '{}',
  notified_ids UUID[] DEFAULT '{}',
  notified_date TIMESTAMP WITH TIME ZONE,
  reported_by UUID,
  
  -- Action taken
  action_taken TEXT,
  corrective_steps TEXT,
  
  -- Observations / Injury info
  has_injury BOOLEAN DEFAULT false,
  injury_description TEXT,
  accepted_treatment BOOLEAN DEFAULT false,
  treatment_description TEXT,
  transported_to_hospital BOOLEAN DEFAULT false,
  hospital_description TEXT,
  returned_to_work_same_day BOOLEAN DEFAULT false,
  return_description TEXT,
  is_osha_violation BOOLEAN DEFAULT false,
  osha_description TEXT,
  
  -- OSHA 300 Log fields
  days_away_from_work INTEGER DEFAULT 0,
  days_job_transfer INTEGER DEFAULT 0,
  injury_type TEXT,
  
  status TEXT DEFAULT 'open', -- open, resolved, under-review
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create incident files table
CREATE TABLE public.incident_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create incident notes table
CREATE TABLE public.incident_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_notes ENABLE ROW LEVEL SECURITY;

-- Incidents policies
CREATE POLICY "Admins can manage incidents" ON public.incidents
  FOR ALL USING (is_admin());

CREATE POLICY "Team members can view incidents" ON public.incidents
  FOR SELECT USING (is_active_team_member());

-- Incident files policies
CREATE POLICY "Admins can manage incident files" ON public.incident_files
  FOR ALL USING (is_admin());

CREATE POLICY "Team members can view incident files" ON public.incident_files
  FOR SELECT USING (is_active_team_member());

-- Incident notes policies
CREATE POLICY "Admins can manage incident notes" ON public.incident_notes
  FOR ALL USING (is_admin());

CREATE POLICY "Team members can view incident notes" ON public.incident_notes
  FOR SELECT USING (is_active_team_member());
-- Create safety_meetings table
CREATE TABLE public.safety_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meeting_time TIME,
  topic TEXT NOT NULL,
  topic_text TEXT, -- The full content/material of the safety meeting
  location TEXT,
  meeting_type TEXT DEFAULT 'group', -- group, individual, toolbox
  meeting_leader_id UUID,
  meeting_leader_name TEXT,
  project_id UUID REFERENCES public.projects(id),
  cost_code TEXT,
  status TEXT DEFAULT 'in-process', -- in-process, completed
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create safety_meeting_attendees table for tracking who attended and their signatures
CREATE TABLE public.safety_meeting_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.safety_meetings(id) ON DELETE CASCADE,
  employee_id UUID,
  employee_name TEXT NOT NULL,
  employee_initials TEXT,
  signature_url TEXT, -- URL to signature image if captured
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create safety_meeting_files table
CREATE TABLE public.safety_meeting_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.safety_meetings(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create safety_meeting_notes table
CREATE TABLE public.safety_meeting_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.safety_meetings(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.safety_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_meeting_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_meeting_notes ENABLE ROW LEVEL SECURITY;

-- Safety meetings policies
CREATE POLICY "Admins can manage safety meetings" ON public.safety_meetings
  FOR ALL USING (is_admin());

CREATE POLICY "Team members can view safety meetings" ON public.safety_meetings
  FOR SELECT USING (is_active_team_member());

-- Attendees policies
CREATE POLICY "Admins can manage meeting attendees" ON public.safety_meeting_attendees
  FOR ALL USING (is_admin());

CREATE POLICY "Team members can view meeting attendees" ON public.safety_meeting_attendees
  FOR SELECT USING (is_active_team_member());

-- Files policies
CREATE POLICY "Admins can manage meeting files" ON public.safety_meeting_files
  FOR ALL USING (is_admin());

CREATE POLICY "Team members can view meeting files" ON public.safety_meeting_files
  FOR SELECT USING (is_active_team_member());

-- Notes policies
CREATE POLICY "Admins can manage meeting notes" ON public.safety_meeting_notes
  FOR ALL USING (is_admin());

CREATE POLICY "Team members can view meeting notes" ON public.safety_meeting_notes
  FOR SELECT USING (is_active_team_member());
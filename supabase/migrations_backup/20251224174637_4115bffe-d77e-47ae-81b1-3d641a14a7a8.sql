-- Create permits table
CREATE TABLE public.permits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permit_number TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name TEXT,
  project_address TEXT,
  permit_type TEXT NOT NULL DEFAULT 'building',
  status TEXT NOT NULL DEFAULT 'active',
  fee NUMERIC DEFAULT 0,
  agency_id UUID REFERENCES public.directory_contacts(id) ON DELETE SET NULL,
  agency_name TEXT,
  pulled_date DATE,
  approved_date DATE,
  expires_date DATE,
  must_pull_by_date DATE,
  referenced_inspection_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create permit files table
CREATE TABLE public.permit_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permit_id UUID NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create permit notes table
CREATE TABLE public.permit_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permit_id UUID NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_notes ENABLE ROW LEVEL SECURITY;

-- Permits policies
CREATE POLICY "Admins can manage permits" ON public.permits FOR ALL USING (is_admin());
CREATE POLICY "Team members can view permits" ON public.permits FOR SELECT USING (is_active_team_member());

-- Permit files policies
CREATE POLICY "Admins can manage permit files" ON public.permit_files FOR ALL USING (is_admin());
CREATE POLICY "Team members can view permit files" ON public.permit_files FOR SELECT USING (is_active_team_member());

-- Permit notes policies
CREATE POLICY "Admins can manage permit notes" ON public.permit_notes FOR ALL USING (is_admin());
CREATE POLICY "Team members can view permit notes" ON public.permit_notes FOR SELECT USING (is_active_team_member());

-- Indexes
CREATE INDEX idx_permits_project_id ON public.permits(project_id);
CREATE INDEX idx_permits_status ON public.permits(status);
CREATE INDEX idx_permits_expires_date ON public.permits(expires_date);
CREATE INDEX idx_permit_files_permit_id ON public.permit_files(permit_id);
CREATE INDEX idx_permit_notes_permit_id ON public.permit_notes(permit_id);

-- Trigger for updated_at
CREATE TRIGGER update_permits_updated_at
  BEFORE UPDATE ON public.permits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
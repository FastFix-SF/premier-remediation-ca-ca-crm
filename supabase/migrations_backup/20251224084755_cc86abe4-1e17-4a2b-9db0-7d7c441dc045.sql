-- Create project_documents table
CREATE TABLE public.project_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  category TEXT DEFAULT 'general',
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_contacts table
CREATE TABLE public.project_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_documents
CREATE POLICY "Admins and owners can manage project documents"
ON public.project_documents
FOR ALL
USING (public.check_user_admin_or_owner());

CREATE POLICY "Active team members can view project documents"
ON public.project_documents
FOR SELECT
USING (public.is_active_team_member());

CREATE POLICY "Assigned users can manage project documents"
ON public.project_documents
FOR ALL
USING (public.check_user_assigned_to_project(project_id));

-- RLS Policies for project_contacts
CREATE POLICY "Admins and owners can manage project contacts"
ON public.project_contacts
FOR ALL
USING (public.check_user_admin_or_owner());

CREATE POLICY "Active team members can view project contacts"
ON public.project_contacts
FOR SELECT
USING (public.is_active_team_member());

CREATE POLICY "Assigned users can manage project contacts"
ON public.project_contacts
FOR ALL
USING (public.check_user_assigned_to_project(project_id));

-- Add indexes for performance
CREATE INDEX idx_project_documents_project_id ON public.project_documents(project_id);
CREATE INDEX idx_project_documents_category ON public.project_documents(category);
CREATE INDEX idx_project_contacts_project_id ON public.project_contacts(project_id);
CREATE INDEX idx_project_contacts_role ON public.project_contacts(role);

-- Add updated_at triggers
CREATE TRIGGER update_project_documents_updated_at
  BEFORE UPDATE ON public.project_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_contacts_updated_at
  BEFORE UPDATE ON public.project_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
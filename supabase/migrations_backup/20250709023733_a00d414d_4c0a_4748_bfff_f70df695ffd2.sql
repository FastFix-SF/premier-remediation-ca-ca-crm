
-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  start_date DATE,
  end_date DATE,
  address TEXT,
  project_type TEXT
);

-- Create project_assignments table for customer access
CREATE TABLE public.project_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  customer_email TEXT NOT NULL,
  customer_id UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id) NOT NULL,
  UNIQUE(project_id, customer_email)
);

-- Create project_photos table
CREATE TABLE public.project_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  is_visible_to_customer BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  display_order INTEGER DEFAULT 0
);

-- Create project_updates table
CREATE TABLE public.project_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_visible_to_customer BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Admins can manage all projects" ON public.projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Customers can view assigned projects" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_assignments 
      WHERE project_id = projects.id 
      AND (customer_id = auth.uid() OR customer_email = auth.email())
    )
  );

-- RLS Policies for project_assignments
CREATE POLICY "Admins can manage all assignments" ON public.project_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Customers can view their assignments" ON public.project_assignments
  FOR SELECT USING (
    customer_id = auth.uid() OR customer_email = auth.email()
  );

-- RLS Policies for project_photos
CREATE POLICY "Admins can manage all project photos" ON public.project_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Customers can view visible project photos" ON public.project_photos
  FOR SELECT USING (
    is_visible_to_customer = true 
    AND EXISTS (
      SELECT 1 FROM project_assignments 
      WHERE project_id = project_photos.project_id 
      AND (customer_id = auth.uid() OR customer_email = auth.email())
    )
  );

-- RLS Policies for project_updates
CREATE POLICY "Admins can manage all project updates" ON public.project_updates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Customers can view visible project updates" ON public.project_updates
  FOR SELECT USING (
    is_visible_to_customer = true 
    AND EXISTS (
      SELECT 1 FROM project_assignments 
      WHERE project_id = project_updates.project_id 
      AND (customer_id = auth.uid() OR customer_email = auth.email())
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON public.projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_updates_updated_at 
  BEFORE UPDATE ON public.project_updates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to send project invitation emails
CREATE OR REPLACE FUNCTION public.send_project_invitation(
  project_id_param UUID,
  customer_email_param TEXT
) RETURNS VOID AS $$
BEGIN
  -- This function will be called from the frontend to trigger email sending
  -- The actual email sending will be handled by an edge function
  INSERT INTO project_assignments (project_id, customer_email, assigned_by)
  VALUES (project_id_param, customer_email_param, auth.uid())
  ON CONFLICT (project_id, customer_email) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

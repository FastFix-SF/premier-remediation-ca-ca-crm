
-- Create table to store CompanyCam projects
CREATE TABLE public.companycam_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  companycam_project_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  location TEXT,
  created_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  project_type TEXT,
  materials_used TEXT[],
  sync_status TEXT DEFAULT 'pending',
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to store project photos
CREATE TABLE public.companycam_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.companycam_projects(id) ON DELETE CASCADE,
  companycam_photo_id TEXT NOT NULL UNIQUE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  photo_type TEXT CHECK (photo_type IN ('before', 'after', 'during')),
  is_featured BOOLEAN DEFAULT false,
  quality_score INTEGER DEFAULT 0,
  taken_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.companycam_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companycam_photos ENABLE ROW LEVEL SECURITY;

-- Public read access for projects and photos (for displaying on website)
CREATE POLICY "Public can view completed projects" 
  ON public.companycam_projects 
  FOR SELECT 
  USING (status = 'completed');

CREATE POLICY "Public can view project photos" 
  ON public.companycam_photos 
  FOR SELECT 
  USING (true);

-- Admin access for managing projects
CREATE POLICY "Admins can manage all projects" 
  ON public.companycam_projects 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

CREATE POLICY "Admins can manage all photos" 
  ON public.companycam_photos 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

-- Create indexes for better performance
CREATE INDEX idx_companycam_projects_status ON public.companycam_projects(status);
CREATE INDEX idx_companycam_projects_completed_date ON public.companycam_projects(completed_date);
CREATE INDEX idx_companycam_photos_project_id ON public.companycam_photos(project_id);
CREATE INDEX idx_companycam_photos_type_featured ON public.companycam_photos(photo_type, is_featured);

-- Add trigger for updated_at
CREATE TRIGGER update_companycam_projects_updated_at
  BEFORE UPDATE ON public.companycam_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companycam_photos_updated_at
  BEFORE UPDATE ON public.companycam_photos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

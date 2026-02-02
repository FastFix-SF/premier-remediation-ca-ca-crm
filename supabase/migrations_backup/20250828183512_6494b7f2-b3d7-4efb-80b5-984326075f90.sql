-- Create visualizer storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('visualizer', 'visualizer', true);

-- Create visualizer tables
CREATE TABLE public.visualizer_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner UUID REFERENCES auth.users(id),
  title TEXT,
  session_token TEXT, -- For anonymous users
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.visualizer_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.visualizer_projects(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.visualizer_masks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID NOT NULL REFERENCES public.visualizer_images(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Roof',
  type TEXT CHECK (type IN ('include', 'exclude')) DEFAULT 'include',
  svg_path TEXT NOT NULL,
  alpha_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.visualizer_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID NOT NULL REFERENCES public.visualizer_images(id) ON DELETE CASCADE,
  color_key TEXT NOT NULL,
  hex TEXT NOT NULL,
  preview_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visualizer_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visualizer_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visualizer_masks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visualizer_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visualizer_projects
CREATE POLICY "Users can manage their own projects" 
ON public.visualizer_projects 
FOR ALL 
USING (auth.uid() = owner);

CREATE POLICY "Anonymous users can manage via session token" 
ON public.visualizer_projects 
FOR ALL 
USING (session_token IS NOT NULL AND session_token = current_setting('app.session_token', true));

CREATE POLICY "Anonymous users can create projects" 
ON public.visualizer_projects 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for visualizer_images
CREATE POLICY "Users can manage images in their projects" 
ON public.visualizer_images 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.visualizer_projects 
  WHERE id = visualizer_images.project_id 
  AND (auth.uid() = owner OR session_token = current_setting('app.session_token', true))
));

-- RLS Policies for visualizer_masks
CREATE POLICY "Users can manage masks in their projects" 
ON public.visualizer_masks 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.visualizer_images vi 
  JOIN public.visualizer_projects vp ON vp.id = vi.project_id
  WHERE vi.id = visualizer_masks.image_id 
  AND (auth.uid() = vp.owner OR vp.session_token = current_setting('app.session_token', true))
));

-- RLS Policies for visualizer_variants
CREATE POLICY "Users can manage variants in their projects" 
ON public.visualizer_variants 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.visualizer_images vi 
  JOIN public.visualizer_projects vp ON vp.id = vi.project_id
  WHERE vi.id = visualizer_variants.image_id 
  AND (auth.uid() = vp.owner OR vp.session_token = current_setting('app.session_token', true))
));

-- Storage policies for visualizer bucket
CREATE POLICY "Anyone can view visualizer files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'visualizer');

CREATE POLICY "Users can upload to their project folders" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'visualizer');

CREATE POLICY "Users can manage their project files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'visualizer');

-- Add update trigger for visualizer_projects
CREATE TRIGGER update_visualizer_projects_updated_at
BEFORE UPDATE ON public.visualizer_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add update trigger for visualizer_masks
CREATE TRIGGER update_visualizer_masks_updated_at
BEFORE UPDATE ON public.visualizer_masks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create app_icons table for storing generated icon metadata
CREATE TABLE public.app_icons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id TEXT NOT NULL UNIQUE,
  icon_url TEXT,
  prompt_used TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_icons ENABLE ROW LEVEL SECURITY;

-- Allow public read access (icons are public assets)
CREATE POLICY "App icons are publicly viewable" 
ON public.app_icons 
FOR SELECT 
USING (true);

-- Only authenticated users can manage icons (admins will use edge function)
CREATE POLICY "Authenticated users can insert app icons" 
ON public.app_icons 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update app icons" 
ON public.app_icons 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create storage bucket for app icons
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('app-icons', 'app-icons', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']);

-- Storage policies for app-icons bucket
CREATE POLICY "App icons are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'app-icons');

CREATE POLICY "Authenticated users can upload app icons" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'app-icons' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update app icons" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'app-icons' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete app icons" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'app-icons' AND auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE TRIGGER update_app_icons_updated_at
BEFORE UPDATE ON public.app_icons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
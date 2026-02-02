-- Create aerial_images table for storing satellite/aerial imagery metadata
CREATE TABLE public.aerial_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id),
  project_id UUID REFERENCES public.projects(id),
  property_address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  image_type TEXT NOT NULL DEFAULT 'satellite', -- satellite, aerial, drone
  api_source TEXT NOT NULL, -- nearmap, google_maps, manual
  capture_date TIMESTAMP WITH TIME ZONE,
  season TEXT, -- spring, summer, fall, winter
  angle TEXT, -- north, south, east, west, overhead
  resolution TEXT, -- high, medium, low
  zoom_level INTEGER,
  image_quality_score INTEGER DEFAULT 0, -- 0-100 quality score
  file_size BIGINT,
  image_metadata JSONB DEFAULT '{}',
  processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.aerial_images ENABLE ROW LEVEL SECURITY;

-- Create policies for aerial images access
CREATE POLICY "Admins can manage all aerial images" 
ON public.aerial_images 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Public can view aerial images from public projects" 
ON public.aerial_images 
FOR SELECT 
USING (
  project_id IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = aerial_images.project_id AND is_public = true
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_aerial_images_updated_at
BEFORE UPDATE ON public.aerial_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_aerial_images_lead_id ON public.aerial_images(lead_id);
CREATE INDEX idx_aerial_images_project_id ON public.aerial_images(project_id);
CREATE INDEX idx_aerial_images_address ON public.aerial_images(property_address);
CREATE INDEX idx_aerial_images_coordinates ON public.aerial_images(latitude, longitude);
CREATE INDEX idx_aerial_images_api_source ON public.aerial_images(api_source);
CREATE INDEX idx_aerial_images_status ON public.aerial_images(processing_status);
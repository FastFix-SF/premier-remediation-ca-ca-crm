-- Create roof_analyses table for storing AI roof detection results
CREATE TABLE public.roof_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aerial_image_id UUID NOT NULL,
  analysis_status TEXT NOT NULL DEFAULT 'pending',
  total_roof_area NUMERIC,
  roof_complexity_score INTEGER,
  roof_outline_coordinates JSONB,
  roof_planes_data JSONB,
  ai_confidence_score NUMERIC,
  ai_response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create roof_planes table for individual roof plane segments
CREATE TABLE public.roof_planes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roof_analysis_id UUID NOT NULL,
  plane_coordinates JSONB NOT NULL,
  area_sqft NUMERIC,
  slope_angle NUMERIC,
  plane_type TEXT DEFAULT 'primary',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.roof_analyses 
ADD CONSTRAINT roof_analyses_aerial_image_id_fkey 
FOREIGN KEY (aerial_image_id) REFERENCES public.aerial_images(id) ON DELETE CASCADE;

ALTER TABLE public.roof_planes 
ADD CONSTRAINT roof_planes_roof_analysis_id_fkey 
FOREIGN KEY (roof_analysis_id) REFERENCES public.roof_analyses(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.roof_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roof_planes ENABLE ROW LEVEL SECURITY;

-- Create policies for roof_analyses
CREATE POLICY "Admins can manage all roof analyses" 
ON public.roof_analyses 
FOR ALL 
USING (EXISTS ( SELECT 1
   FROM admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true))));

-- Create policies for roof_planes
CREATE POLICY "Admins can manage all roof planes" 
ON public.roof_planes 
FOR ALL 
USING (EXISTS ( SELECT 1
   FROM admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true))));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_roof_analyses_updated_at
BEFORE UPDATE ON public.roof_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_roof_analyses_aerial_image_id ON public.roof_analyses(aerial_image_id);
CREATE INDEX idx_roof_analyses_status ON public.roof_analyses(analysis_status);
CREATE INDEX idx_roof_planes_roof_analysis_id ON public.roof_planes(roof_analysis_id);
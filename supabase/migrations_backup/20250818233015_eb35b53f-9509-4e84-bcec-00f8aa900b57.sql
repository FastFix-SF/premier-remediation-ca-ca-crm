-- Create roof_structures table for multi-structure support
CREATE TABLE public.roof_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_request_id UUID NOT NULL,
  structure_id TEXT NOT NULL, -- A, B, C, etc.
  geometry JSONB NOT NULL, -- GeoJSON Polygon
  area_sq_ft NUMERIC,
  perimeter_ft NUMERIC,
  surface_area_sq_ft NUMERIC,
  confidence NUMERIC DEFAULT 0.0,
  is_included BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quote_request_id, structure_id)
);

-- Create ridge_lines table for manual ridge measurements
CREATE TABLE public.ridge_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_request_id UUID NOT NULL,
  geometry JSONB NOT NULL, -- GeoJSON LineString
  length_ft NUMERIC NOT NULL,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.roof_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ridge_lines ENABLE ROW LEVEL SECURITY;

-- Create policies for roof_structures
CREATE POLICY "Admins can manage all roof structures"
ON public.roof_structures
FOR ALL
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

-- Create policies for ridge_lines
CREATE POLICY "Admins can manage all ridge lines"
ON public.ridge_lines
FOR ALL
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

-- Add triggers for updated_at
CREATE TRIGGER update_roof_structures_updated_at
BEFORE UPDATE ON public.roof_structures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ridge_lines_updated_at
BEFORE UPDATE ON public.ridge_lines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create roof_structures table for multi-structure support
CREATE TABLE public.roof_structures (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
    structure_id TEXT NOT NULL, -- 'A', 'B', 'C', etc.
    geometry JSONB NOT NULL, -- GeoJSON Polygon
    area_sq_ft NUMERIC NOT NULL,
    perimeter_ft NUMERIC,
    confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    is_included BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for roof_structures
ALTER TABLE public.roof_structures ENABLE ROW LEVEL SECURITY;

-- Create policies for roof_structures
CREATE POLICY "Admins can manage all roof structures" 
ON public.roof_structures 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
));

-- Add roi_summary field to quote_requests
ALTER TABLE public.quote_requests 
ADD COLUMN roi_summary JSONB DEFAULT '{}';

-- Add index for performance
CREATE INDEX idx_roof_structures_quote_request_id ON public.roof_structures(quote_request_id);

-- Create trigger for updated_at
CREATE TRIGGER update_roof_structures_updated_at
    BEFORE UPDATE ON public.roof_structures
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
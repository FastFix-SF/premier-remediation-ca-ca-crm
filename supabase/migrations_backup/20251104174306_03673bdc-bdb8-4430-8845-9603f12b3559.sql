-- Create table for storing vision-based roof analyses
CREATE TABLE IF NOT EXISTS public.roof_vision_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_request_id UUID REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  roof_type TEXT,
  confidence_score DECIMAL(3, 2),
  detected_edges JSONB,
  detected_planes JSONB,
  detected_features JSONB,
  analysis_notes TEXT,
  model_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.roof_vision_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - allow authenticated users to manage their analyses
CREATE POLICY "Authenticated users can view vision analyses"
ON public.roof_vision_analyses
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert vision analyses"
ON public.roof_vision_analyses
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Create index for faster queries
CREATE INDEX idx_vision_analyses_quote ON public.roof_vision_analyses(quote_request_id);

-- Create trigger for updated_at
CREATE TRIGGER update_roof_vision_analyses_updated_at
BEFORE UPDATE ON public.roof_vision_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
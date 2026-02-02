-- Create roof_measurements table for RoofSnap-compatible data
CREATE TABLE public.roof_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  assistant_thread_id TEXT,
  assistant_run_id TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  confidence_score NUMERIC DEFAULT 0.0,
  analysis_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.roof_measurements ENABLE ROW LEVEL SECURITY;

-- Create policies for admin-only access
CREATE POLICY "Admins can manage all roof measurements" 
ON public.roof_measurements 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_roof_measurements_updated_at
BEFORE UPDATE ON public.roof_measurements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for efficient project lookups
CREATE INDEX idx_roof_measurements_project_id ON public.roof_measurements(project_id);
CREATE INDEX idx_roof_measurements_created_at ON public.roof_measurements(created_at DESC);
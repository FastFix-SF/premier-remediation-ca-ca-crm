-- Add roof_features table for detailed feature detection
CREATE TABLE public.roof_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roof_analysis_id UUID NOT NULL REFERENCES public.roof_analyses(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL, -- 'chimney', 'vent', 'skylight', 'gutter', 'downspout', 'dormer', 'valley', 'ridge'
  feature_coordinates JSONB NOT NULL, -- Array of [x,y] coordinates for feature outline
  dimensions JSONB, -- {width, height, area, length} depending on feature type
  feature_count INTEGER DEFAULT 1, -- For features that can be counted (vents, chimneys)
  confidence_score NUMERIC(3,2) DEFAULT 0.0, -- AI confidence in detection
  measurements JSONB DEFAULT '{}', -- Additional measurements specific to feature type
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add enhanced analysis fields to roof_analyses table
ALTER TABLE public.roof_analyses ADD COLUMN IF NOT EXISTS penetration_count INTEGER DEFAULT 0;
ALTER TABLE public.roof_analyses ADD COLUMN IF NOT EXISTS chimney_count INTEGER DEFAULT 0;
ALTER TABLE public.roof_analyses ADD COLUMN IF NOT EXISTS vent_count INTEGER DEFAULT 0;
ALTER TABLE public.roof_analyses ADD COLUMN IF NOT EXISTS skylight_count INTEGER DEFAULT 0;
ALTER TABLE public.roof_analyses ADD COLUMN IF NOT EXISTS gutter_length_ft NUMERIC DEFAULT 0;
ALTER TABLE public.roof_analyses ADD COLUMN IF NOT EXISTS downspout_count INTEGER DEFAULT 0;
ALTER TABLE public.roof_analyses ADD COLUMN IF NOT EXISTS roof_pitch_degrees NUMERIC DEFAULT 0;
ALTER TABLE public.roof_analyses ADD COLUMN IF NOT EXISTS dormer_count INTEGER DEFAULT 0;
ALTER TABLE public.roof_analyses ADD COLUMN IF NOT EXISTS valley_count INTEGER DEFAULT 0;
ALTER TABLE public.roof_analyses ADD COLUMN IF NOT EXISTS ridge_length_ft NUMERIC DEFAULT 0;

-- Enable RLS on roof_features
ALTER TABLE public.roof_features ENABLE ROW LEVEL SECURITY;

-- Create policies for roof_features
CREATE POLICY "Admins can manage all roof features" 
ON public.roof_features 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

-- Create indexes for better performance
CREATE INDEX idx_roof_features_analysis_id ON public.roof_features(roof_analysis_id);
CREATE INDEX idx_roof_features_type ON public.roof_features(feature_type);

-- Add trigger to update roof_analyses updated_at when features are modified
CREATE OR REPLACE FUNCTION public.update_roof_analysis_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.roof_analyses 
  SET updated_at = now() 
  WHERE id = COALESCE(NEW.roof_analysis_id, OLD.roof_analysis_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roof_analysis_on_feature_change
  AFTER INSERT OR UPDATE OR DELETE ON public.roof_features
  FOR EACH ROW
  EXECUTE FUNCTION public.update_roof_analysis_timestamp();
-- Create table to store roof correction data for AI learning
CREATE TABLE IF NOT EXISTS public.roof_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  vision_analysis_id UUID REFERENCES public.roof_vision_analyses(id) ON DELETE SET NULL,
  
  -- Original AI prediction
  original_vertices JSONB NOT NULL,
  original_edges JSONB,
  
  -- User's corrected version
  corrected_vertices JSONB NOT NULL,
  corrected_edges JSONB,
  
  -- Metadata about the correction
  roof_type TEXT,
  image_quality TEXT, -- 'high', 'medium', 'low'
  correction_notes TEXT,
  
  -- Calculate adjustment patterns
  adjustment_summary JSONB, -- avg shift in lat/lng, rotation angle, scale factor
  
  -- Context for matching similar cases
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  image_resolution TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.roof_corrections ENABLE ROW LEVEL SECURITY;

-- Admin users can view all corrections
CREATE POLICY "Admins can view all corrections"
  ON public.roof_corrections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Admin users can insert corrections
CREATE POLICY "Admins can insert corrections"
  ON public.roof_corrections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_roof_corrections_quote ON public.roof_corrections(quote_request_id);
CREATE INDEX idx_roof_corrections_location ON public.roof_corrections(location_lat, location_lng);
CREATE INDEX idx_roof_corrections_created ON public.roof_corrections(created_at DESC);

-- Function to calculate adjustment summary
CREATE OR REPLACE FUNCTION calculate_correction_adjustments(
  original JSONB,
  corrected JSONB
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
  lat_shifts DECIMAL[] := ARRAY[]::DECIMAL[];
  lng_shifts DECIMAL[] := ARRAY[]::DECIMAL[];
  avg_lat_shift DECIMAL;
  avg_lng_shift DECIMAL;
  i INTEGER;
BEGIN
  -- Calculate shift for each vertex
  FOR i IN 0..jsonb_array_length(original)-1 LOOP
    lat_shifts := array_append(lat_shifts, 
      (corrected->i->>1)::DECIMAL - (original->i->>1)::DECIMAL);
    lng_shifts := array_append(lng_shifts, 
      (corrected->i->>0)::DECIMAL - (original->i->>0)::DECIMAL);
  END LOOP;
  
  -- Calculate averages
  SELECT AVG(unnest) INTO avg_lat_shift FROM unnest(lat_shifts);
  SELECT AVG(unnest) INTO avg_lng_shift FROM unnest(lng_shifts);
  
  result := jsonb_build_object(
    'avg_lat_shift', avg_lat_shift,
    'avg_lng_shift', avg_lng_shift,
    'vertex_count', jsonb_array_length(original),
    'max_lat_shift', (SELECT MAX(unnest) FROM unnest(lat_shifts)),
    'max_lng_shift', (SELECT MAX(unnest) FROM unnest(lng_shifts))
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
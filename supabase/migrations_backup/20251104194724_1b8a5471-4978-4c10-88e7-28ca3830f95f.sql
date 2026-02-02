-- Fix security issue: Set search_path for calculate_correction_adjustments function
CREATE OR REPLACE FUNCTION calculate_correction_adjustments(
  original JSONB,
  corrected JSONB
) RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;
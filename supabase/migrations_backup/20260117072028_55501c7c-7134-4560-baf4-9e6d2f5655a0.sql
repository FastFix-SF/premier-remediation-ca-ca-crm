-- Drop the existing constraint
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_roof_type_valid;

-- Add updated constraint with Tile Roof included
ALTER TABLE public.projects ADD CONSTRAINT projects_roof_type_valid 
CHECK (roof_type IS NULL OR roof_type = ANY (ARRAY['Standing Seam', 'Metal Panels', 'Stone Coated', 'Shingles', 'Tile Roof', 'Flat Roof']));
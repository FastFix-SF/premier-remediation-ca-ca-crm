-- Add project_category and roof_type to projects for classification
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_category text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS roof_type text;

COMMENT ON COLUMN public.projects.project_category IS 'Residential or Commercial';
COMMENT ON COLUMN public.projects.roof_type IS 'Roofing system type, e.g., Standing Seam, Metal Panels, Stone Coated, Shingles, Flat Roofs';
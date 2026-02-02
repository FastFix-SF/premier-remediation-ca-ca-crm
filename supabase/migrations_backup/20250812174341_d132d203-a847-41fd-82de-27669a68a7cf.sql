
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_project_category_valid'
  ) THEN
    ALTER TABLE public.projects
    ADD CONSTRAINT projects_project_category_valid CHECK (
      project_category IS NULL OR project_category IN ('Residential','Commercial')
    ) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_roof_type_valid'
  ) THEN
    ALTER TABLE public.projects
    ADD CONSTRAINT projects_roof_type_valid CHECK (
      roof_type IS NULL OR roof_type IN ('Standing Seam','Metal Panels','Stone Coated','Shingles','Flat Roof')
    ) NOT VALID;
  END IF;
END $$;

-- Indexes for fast filtering and sorting
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON public.projects (is_public);
CREATE INDEX IF NOT EXISTS idx_projects_project_category ON public.projects (project_category);
CREATE INDEX IF NOT EXISTS idx_projects_roof_type ON public.projects (roof_type);
CREATE INDEX IF NOT EXISTS idx_projects_public_category ON public.projects (is_public, project_category);
CREATE INDEX IF NOT EXISTS idx_projects_public_roof_type ON public.projects (is_public, roof_type);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects (created_at DESC);

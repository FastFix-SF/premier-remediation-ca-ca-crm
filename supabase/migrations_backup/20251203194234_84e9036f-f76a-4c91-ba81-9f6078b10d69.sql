-- Add quote_request_id to projects table to link quotes with projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS quote_request_id uuid REFERENCES public.quote_requests(id);

-- Add additional fields from quote_requests that should be displayed on projects
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS source text,
ADD COLUMN IF NOT EXISTS property_type text,
ADD COLUMN IF NOT EXISTS timeline text,
ADD COLUMN IF NOT EXISTS existing_roof text,
ADD COLUMN IF NOT EXISTS wanted_roof text,
ADD COLUMN IF NOT EXISTS existing_roof_deck text,
ADD COLUMN IF NOT EXISTS wanted_roof_deck text,
ADD COLUMN IF NOT EXISTS insulation text,
ADD COLUMN IF NOT EXISTS project_manager_id uuid,
ADD COLUMN IF NOT EXISTS site_manager_id uuid,
ADD COLUMN IF NOT EXISTS sales_representative_id uuid,
ADD COLUMN IF NOT EXISTS company_name text;

-- Create index for quote_request_id
CREATE INDEX IF NOT EXISTS idx_projects_quote_request_id ON public.projects(quote_request_id);

-- Comment for documentation
COMMENT ON COLUMN public.projects.quote_request_id IS 'Links to the original quote request that created this project';
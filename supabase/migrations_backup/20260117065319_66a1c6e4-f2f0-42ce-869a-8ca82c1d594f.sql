-- Add contractor/third-party management company fields to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS contractor_company_name text,
ADD COLUMN IF NOT EXISTS contractor_contact_person text,
ADD COLUMN IF NOT EXISTS contractor_phone text,
ADD COLUMN IF NOT EXISTS contractor_email text,
ADD COLUMN IF NOT EXISTS contractor_address text,
ADD COLUMN IF NOT EXISTS is_contractor_managed boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.projects.contractor_company_name IS 'Name of the contractor or third-party management company';
COMMENT ON COLUMN public.projects.contractor_contact_person IS 'Primary contact person at the contractor company';
COMMENT ON COLUMN public.projects.contractor_phone IS 'Phone number for the contractor company';
COMMENT ON COLUMN public.projects.contractor_email IS 'Email address for the contractor company';
COMMENT ON COLUMN public.projects.contractor_address IS 'Physical address of the contractor company';
COMMENT ON COLUMN public.projects.is_contractor_managed IS 'Flag indicating if project is managed by a contractor or third party';
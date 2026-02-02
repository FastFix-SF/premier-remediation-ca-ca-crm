-- Drop the text columns and add UUID columns to reference team_directory users
ALTER TABLE quote_requests 
DROP COLUMN IF EXISTS project_manager,
DROP COLUMN IF EXISTS site_manager,
DROP COLUMN IF EXISTS sales_representative,
ADD COLUMN IF NOT EXISTS project_manager_id uuid,
ADD COLUMN IF NOT EXISTS site_manager_id uuid,
ADD COLUMN IF NOT EXISTS sales_representative_id uuid;
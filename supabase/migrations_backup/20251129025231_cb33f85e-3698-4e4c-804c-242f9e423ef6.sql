-- Add project management fields to quote_requests table as text fields
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS project_manager text,
ADD COLUMN IF NOT EXISTS site_manager text,
ADD COLUMN IF NOT EXISTS sales_representative text;
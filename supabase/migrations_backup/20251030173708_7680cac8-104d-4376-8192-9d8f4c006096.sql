-- Add template_configurations column to quote_requests table
ALTER TABLE quote_requests 
ADD COLUMN template_configurations JSONB DEFAULT '{}'::jsonb;
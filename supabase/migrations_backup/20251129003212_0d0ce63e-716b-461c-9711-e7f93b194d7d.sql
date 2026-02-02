-- Add company_name and source fields to quote_requests table
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS source TEXT;
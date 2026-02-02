-- Add client information columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS additional_contact TEXT;
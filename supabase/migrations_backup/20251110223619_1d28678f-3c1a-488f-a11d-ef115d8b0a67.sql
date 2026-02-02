-- Add phone_number column to team_directory table
ALTER TABLE team_directory 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN team_directory.phone_number IS 'Contact phone number for the team member';
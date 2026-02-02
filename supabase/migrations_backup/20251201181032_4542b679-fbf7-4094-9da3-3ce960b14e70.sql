-- Add language preference column to team_directory
ALTER TABLE team_directory 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en' CHECK (language IN ('en', 'es'));

-- Add comment for documentation
COMMENT ON COLUMN team_directory.language IS 'User preferred language for notifications (en=English, es=Spanish)';
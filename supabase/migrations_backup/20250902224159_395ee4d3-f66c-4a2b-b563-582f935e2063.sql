-- Clean up duplicate email entries in team_directory and ensure proper constraints
-- First, let's clean up any duplicate email entries by keeping the most recent one

DELETE FROM team_directory 
WHERE user_id IN (
  SELECT user_id
  FROM (
    SELECT user_id,
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM team_directory
  ) t
  WHERE t.rn > 1
);

-- Add proper index for email lookups
CREATE INDEX IF NOT EXISTS idx_team_directory_email ON team_directory(email);
CREATE INDEX IF NOT EXISTS idx_team_directory_status ON team_directory(status);

-- Ensure we have proper unique constraint on email
ALTER TABLE team_directory DROP CONSTRAINT IF EXISTS team_directory_email_key;
ALTER TABLE team_directory ADD CONSTRAINT team_directory_email_unique UNIQUE (email);
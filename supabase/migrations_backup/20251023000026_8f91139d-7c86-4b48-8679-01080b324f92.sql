-- Add push_token column to team_directory for storing device push notification tokens
ALTER TABLE team_directory ADD COLUMN IF NOT EXISTS push_token TEXT;
-- Add audio_url and duration columns to team_chats table for voice messages
ALTER TABLE team_chats 
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS duration NUMERIC;
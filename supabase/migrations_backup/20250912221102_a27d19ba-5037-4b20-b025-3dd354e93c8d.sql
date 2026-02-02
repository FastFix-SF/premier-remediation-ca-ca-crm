-- Add audio_url and duration columns for voice messages on team chats
ALTER TABLE public.team_chats 
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS duration NUMERIC;
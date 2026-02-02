-- Add hourly_rate column to team_directory for simple rate storage
ALTER TABLE public.team_directory 
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 25;
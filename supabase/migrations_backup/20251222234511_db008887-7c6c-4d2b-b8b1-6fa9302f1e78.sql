-- Add avatar_url column to team_directory table
ALTER TABLE public.team_directory 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
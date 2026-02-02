-- Add class_code column to team_directory table
ALTER TABLE public.team_directory 
ADD COLUMN IF NOT EXISTS class_code TEXT;
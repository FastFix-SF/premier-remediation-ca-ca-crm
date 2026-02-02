-- Add label field to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS label TEXT;
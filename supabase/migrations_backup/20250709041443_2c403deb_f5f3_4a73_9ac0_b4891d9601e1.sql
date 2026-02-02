
-- Add is_public column to projects table
ALTER TABLE public.projects 
ADD COLUMN is_public boolean DEFAULT false;

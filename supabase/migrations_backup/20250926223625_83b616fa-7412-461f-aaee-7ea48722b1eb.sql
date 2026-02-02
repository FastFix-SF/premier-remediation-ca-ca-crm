-- Add original_scope field to projects table to preserve technical details
ALTER TABLE public.projects 
ADD COLUMN original_scope text;
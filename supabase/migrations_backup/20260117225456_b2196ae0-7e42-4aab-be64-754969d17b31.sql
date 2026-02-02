-- Add recommendation column to project_photos for customer-facing repair suggestions
ALTER TABLE public.project_photos 
ADD COLUMN recommendation TEXT;
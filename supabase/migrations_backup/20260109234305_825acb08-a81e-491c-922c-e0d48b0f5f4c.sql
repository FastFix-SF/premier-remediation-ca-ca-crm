-- Add budget_overhead column to projects table for storing estimated overhead costs
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS budget_overhead NUMERIC DEFAULT 0;
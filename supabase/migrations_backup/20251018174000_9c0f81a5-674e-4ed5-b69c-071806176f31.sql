-- Add color column to job_schedules table
ALTER TABLE public.job_schedules 
ADD COLUMN color TEXT DEFAULT '#dc2626';
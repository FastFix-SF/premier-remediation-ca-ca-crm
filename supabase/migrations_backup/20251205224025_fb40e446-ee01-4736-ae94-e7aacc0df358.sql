-- Add attachments column to job_schedules table
ALTER TABLE public.job_schedules 
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;
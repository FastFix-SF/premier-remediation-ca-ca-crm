-- Add missing columns to projects table for ConnectTeam integration
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS connecteam_job_name TEXT,
ADD COLUMN IF NOT EXISTS connecteam_last_labor_sync_at TIMESTAMPTZ;
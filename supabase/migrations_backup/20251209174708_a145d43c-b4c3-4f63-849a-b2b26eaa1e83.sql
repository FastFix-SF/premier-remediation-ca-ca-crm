-- Add created_by column to job_schedules to track who scheduled the job
ALTER TABLE public.job_schedules 
ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Add index for performance
CREATE INDEX idx_job_schedules_created_by ON public.job_schedules(created_by);
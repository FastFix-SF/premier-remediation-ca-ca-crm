-- Enable realtime for job_schedules table
ALTER TABLE public.job_schedules REPLICA IDENTITY FULL;

-- Add job_schedules to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_schedules;
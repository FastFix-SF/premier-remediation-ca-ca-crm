-- Add scheduling fields to project_tasks table for calendar view
ALTER TABLE public.project_tasks
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS duration_days integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS color text DEFAULT '#3b82f6';

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS idx_project_tasks_start_date ON public.project_tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_project_tasks_end_date ON public.project_tasks(end_date);
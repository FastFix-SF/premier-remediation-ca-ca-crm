-- Add assignment columns to project_tasks
ALTER TABLE public.project_tasks 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups by assigned user
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON public.project_tasks(assigned_to);
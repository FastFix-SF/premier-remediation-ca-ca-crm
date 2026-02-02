-- Add is_completed column to project_status_updates for crew leaders to mark scope items as done
ALTER TABLE public.project_status_updates 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;
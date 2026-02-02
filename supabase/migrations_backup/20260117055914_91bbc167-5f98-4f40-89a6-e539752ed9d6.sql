-- Create shift_tasks table for shift-specific tasks
CREATE TABLE public.shift_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES job_schedules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shift_tasks ENABLE ROW LEVEL SECURITY;

-- Policy for team members to view shift tasks
CREATE POLICY "Team members can view shift tasks"
  ON public.shift_tasks FOR SELECT
  USING (public.is_active_team_member());

-- Policy for team members to create shift tasks
CREATE POLICY "Team members can create shift tasks"
  ON public.shift_tasks FOR INSERT
  WITH CHECK (public.is_active_team_member());

-- Policy for team members to update shift tasks
CREATE POLICY "Team members can update shift tasks"
  ON public.shift_tasks FOR UPDATE
  USING (public.is_active_team_member());

-- Policy for team members to delete shift tasks
CREATE POLICY "Team members can delete shift tasks"
  ON public.shift_tasks FOR DELETE
  USING (public.is_active_team_member());

-- Create updated_at trigger
CREATE TRIGGER update_shift_tasks_updated_at
  BEFORE UPDATE ON public.shift_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Create project_task_assignees junction table for multi-user assignment
CREATE TABLE public.project_task_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID,
  UNIQUE(task_id, user_id)
);

-- Create project_task_subtasks table
CREATE TABLE public.project_task_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  assigned_to UUID,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.project_task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_task_subtasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_task_assignees
CREATE POLICY "Authenticated users can view task assignees"
  ON public.project_task_assignees FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert task assignees"
  ON public.project_task_assignees FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete task assignees"
  ON public.project_task_assignees FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- RLS policies for project_task_subtasks
CREATE POLICY "Authenticated users can view subtasks"
  ON public.project_task_subtasks FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert subtasks"
  ON public.project_task_subtasks FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update subtasks"
  ON public.project_task_subtasks FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete subtasks"
  ON public.project_task_subtasks FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_project_task_assignees_task_id ON public.project_task_assignees(task_id);
CREATE INDEX idx_project_task_assignees_user_id ON public.project_task_assignees(user_id);
CREATE INDEX idx_project_task_subtasks_task_id ON public.project_task_subtasks(project_task_id);
CREATE INDEX idx_project_task_subtasks_order ON public.project_task_subtasks(project_task_id, order_index);
-- =====================================================
-- TEAM TASKS TABLE (simplified without sales_clients FK)
-- =====================================================
CREATE TABLE public.team_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID,
  priority TEXT NOT NULL DEFAULT 'P2',
  status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  progress_percent INTEGER NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ,
  blocker_notes TEXT,
  current_focus BOOLEAN NOT NULL DEFAULT false,
  urgency_level INTEGER NOT NULL DEFAULT 3,
  importance_level INTEGER NOT NULL DEFAULT 3,
  estimated_duration TEXT NOT NULL DEFAULT 'M',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_name TEXT,
  document_url TEXT,
  document_title TEXT,
  collaborator_ids UUID[] DEFAULT '{}',
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  proof_url TEXT,
  proof_description TEXT,
  CONSTRAINT team_tasks_status_check CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'DONE')),
  CONSTRAINT team_tasks_priority_check CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
  CONSTRAINT team_tasks_duration_check CHECK (estimated_duration IN ('XS', 'S', 'M', 'L', 'XL'))
);

-- =====================================================
-- TASK SUBTASKS TABLE
-- =====================================================
CREATE TABLE public.task_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_task_id UUID NOT NULL REFERENCES public.team_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'TODO',
  order_index INTEGER NOT NULL DEFAULT 0,
  assigned_to UUID,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  proof_url TEXT,
  proof_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT task_subtasks_status_check CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE'))
);

-- =====================================================
-- TASK COMMENTS TABLE
-- =====================================================
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.team_tasks(id) ON DELETE CASCADE,
  subtask_id UUID REFERENCES public.task_subtasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT task_comments_reference_check CHECK (task_id IS NOT NULL OR subtask_id IS NOT NULL)
);

-- =====================================================
-- PROJECT CALENDAR EVENTS TABLE
-- =====================================================
CREATE TABLE public.project_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  status TEXT DEFAULT 'scheduled',
  assignee_ids UUID[],
  color_code TEXT,
  reminder_days INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_recurring BOOLEAN DEFAULT false,
  recurrence_type TEXT,
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_days INTEGER[],
  recurrence_end_date DATE,
  parent_event_id UUID REFERENCES public.project_calendar_events(id) ON DELETE SET NULL,
  CONSTRAINT project_events_type_check CHECK (event_type IN ('milestone', 'review', 'deadline', 'kickoff', 'delivery', 'meeting')),
  CONSTRAINT project_events_status_check CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  CONSTRAINT project_events_recurrence_check CHECK (recurrence_type IS NULL OR recurrence_type IN ('daily', 'weekly', 'monthly', 'custom'))
);

-- =====================================================
-- FEEDBACK ITEMS TABLE
-- =====================================================
CREATE TABLE public.feedback_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'improvement',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'new',
  submitted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT feedback_category_check CHECK (category IN ('bug', 'feature_request', 'improvement', 'question')),
  CONSTRAINT feedback_priority_check CHECK (priority IN ('critical', 'high', 'medium', 'low'))
);

-- =====================================================
-- IDEA ITEMS TABLE
-- =====================================================
CREATE TABLE public.idea_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  submitted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT idea_category_check CHECK (category IN ('product', 'process', 'marketing', 'technology', 'general'))
);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE public.team_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view tasks" ON public.team_tasks FOR SELECT USING (true);
CREATE POLICY "Anyone can create tasks" ON public.team_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tasks" ON public.team_tasks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete tasks" ON public.team_tasks FOR DELETE USING (true);

ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subtasks" ON public.task_subtasks FOR SELECT USING (true);
CREATE POLICY "Anyone can create subtasks" ON public.task_subtasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update subtasks" ON public.task_subtasks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete subtasks" ON public.task_subtasks FOR DELETE USING (true);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON public.task_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can create comments" ON public.task_comments FOR INSERT WITH CHECK (true);

ALTER TABLE public.project_calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events" ON public.project_calendar_events FOR SELECT USING (true);
CREATE POLICY "Anyone can create events" ON public.project_calendar_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update events" ON public.project_calendar_events FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete events" ON public.project_calendar_events FOR DELETE USING (true);

ALTER TABLE public.feedback_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view feedback" ON public.feedback_items FOR SELECT USING (true);
CREATE POLICY "Anyone can create feedback" ON public.feedback_items FOR INSERT WITH CHECK (true);

ALTER TABLE public.idea_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ideas" ON public.idea_items FOR SELECT USING (true);
CREATE POLICY "Anyone can create ideas" ON public.idea_items FOR INSERT WITH CHECK (true);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_team_tasks_owner ON public.team_tasks(owner_id);
CREATE INDEX idx_team_tasks_status ON public.team_tasks(status);
CREATE INDEX idx_team_tasks_priority ON public.team_tasks(priority);
CREATE INDEX idx_team_tasks_due_date ON public.team_tasks(due_date);
CREATE INDEX idx_team_tasks_created ON public.team_tasks(created_at DESC);
CREATE INDEX idx_subtasks_parent ON public.task_subtasks(parent_task_id);
CREATE INDEX idx_subtasks_order ON public.task_subtasks(order_index);
CREATE INDEX idx_task_comments_task ON public.task_comments(task_id);
CREATE INDEX idx_task_comments_subtask ON public.task_comments(subtask_id);
CREATE INDEX idx_project_events_date ON public.project_calendar_events(event_date);
CREATE INDEX idx_project_events_project ON public.project_calendar_events(project_id);

-- =====================================================
-- STORAGE BUCKET FOR TASK PROOFS
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-proofs', 'task-proofs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view task proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-proofs');

CREATE POLICY "Anyone can upload task proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-proofs');

CREATE POLICY "Anyone can update task proofs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'task-proofs');

CREATE POLICY "Anyone can delete task proofs"
ON storage.objects FOR DELETE
USING (bucket_id = 'task-proofs');
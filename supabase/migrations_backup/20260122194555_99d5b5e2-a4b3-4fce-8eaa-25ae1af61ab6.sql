-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', true);

-- RLS policies for the bucket
CREATE POLICY "Anyone can upload task attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-attachments');

CREATE POLICY "Anyone can view task attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-attachments');

CREATE POLICY "Anyone can delete task attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'task-attachments');

-- Create task attachments table
CREATE TABLE public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.team_tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view task attachments" 
ON public.task_attachments FOR SELECT USING (true);

CREATE POLICY "Anyone can create task attachments" 
ON public.task_attachments FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete task attachments" 
ON public.task_attachments FOR DELETE USING (true);

-- Index for faster lookups
CREATE INDEX idx_task_attachments_task ON public.task_attachments(task_id);
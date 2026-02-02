-- Create project_videos table
CREATE TABLE public.project_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  duration_seconds INTEGER,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  file_size BIGINT,
  is_visible_to_customer BOOLEAN NOT NULL DEFAULT false
);

-- Create index for faster lookups
CREATE INDEX idx_project_videos_project_id ON public.project_videos(project_id);

-- Enable RLS
ALTER TABLE public.project_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view videos for accessible projects"
  ON public.project_videos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_team_assignments
      WHERE project_team_assignments.project_id = project_videos.project_id
      AND project_team_assignments.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_videos.project_id
      AND projects.created_by = auth.uid()
    )
    OR
    public.is_admin()
  );

CREATE POLICY "Users can insert videos for assigned projects"
  ON public.project_videos FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.project_team_assignments
        WHERE project_team_assignments.project_id = project_videos.project_id
        AND project_team_assignments.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_videos.project_id
        AND projects.created_by = auth.uid()
      )
      OR
      public.is_admin()
    )
  );

CREATE POLICY "Users can delete their own videos or as admin"
  ON public.project_videos FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR
    public.is_admin()
  );

-- Create storage bucket for project videos
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('project-videos', 'project-videos', true, 104857600)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Anyone can view project videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-videos');

CREATE POLICY "Authenticated users can upload project videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own project videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'project-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
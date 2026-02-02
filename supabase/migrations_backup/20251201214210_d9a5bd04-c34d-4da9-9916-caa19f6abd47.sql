-- Create team_updates table for company-wide announcements
CREATE TABLE public.team_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL,
  background_color TEXT NOT NULL DEFAULT '#FCD34D',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'archived')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_update_interactions table for likes and views
CREATE TABLE public.team_update_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  update_id UUID NOT NULL REFERENCES public.team_updates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  liked BOOLEAN NOT NULL DEFAULT false,
  viewed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(update_id, user_id)
);

-- Create team_update_comments table
CREATE TABLE public.team_update_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  update_id UUID NOT NULL REFERENCES public.team_updates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_update_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_update_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_updates
CREATE POLICY "Team members can view published updates"
  ON public.team_updates
  FOR SELECT
  USING (
    status = 'published' AND
    (EXISTS (
      SELECT 1 FROM team_directory
      WHERE team_directory.user_id = auth.uid()
      AND team_directory.status = 'active'
    ) OR is_admin())
  );

CREATE POLICY "Team members can view archived updates"
  ON public.team_updates
  FOR SELECT
  USING (
    status = 'archived' AND
    (EXISTS (
      SELECT 1 FROM team_directory
      WHERE team_directory.user_id = auth.uid()
      AND team_directory.status = 'active'
    ) OR is_admin())
  );

CREATE POLICY "Active team members can create updates"
  ON public.team_updates
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    (EXISTS (
      SELECT 1 FROM team_directory
      WHERE team_directory.user_id = auth.uid()
      AND team_directory.status = 'active'
    ) OR is_admin())
  );

CREATE POLICY "Creators and admins can update their updates"
  ON public.team_updates
  FOR UPDATE
  USING (created_by = auth.uid() OR is_admin());

CREATE POLICY "Creators and admins can delete their updates"
  ON public.team_updates
  FOR DELETE
  USING (created_by = auth.uid() OR is_admin());

-- RLS Policies for team_update_interactions
CREATE POLICY "Users can view all interactions"
  ON public.team_update_interactions
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own interactions"
  ON public.team_update_interactions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for team_update_comments
CREATE POLICY "Users can view all comments"
  ON public.team_update_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.team_update_comments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON public.team_update_comments
  FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

-- Create indexes for performance
CREATE INDEX idx_team_updates_status ON public.team_updates(status);
CREATE INDEX idx_team_updates_created_by ON public.team_updates(created_by);
CREATE INDEX idx_team_update_interactions_update_id ON public.team_update_interactions(update_id);
CREATE INDEX idx_team_update_interactions_user_id ON public.team_update_interactions(user_id);
CREATE INDEX idx_team_update_comments_update_id ON public.team_update_comments(update_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_update_interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_update_comments;

-- Set replica identity for realtime
ALTER TABLE public.team_updates REPLICA IDENTITY FULL;
ALTER TABLE public.team_update_interactions REPLICA IDENTITY FULL;
ALTER TABLE public.team_update_comments REPLICA IDENTITY FULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_team_updates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_team_updates_updated_at
  BEFORE UPDATE ON public.team_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_team_updates_updated_at();
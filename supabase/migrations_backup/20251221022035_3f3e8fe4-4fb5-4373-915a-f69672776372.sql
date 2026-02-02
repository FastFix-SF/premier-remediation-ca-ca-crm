-- Create team_board_items table
CREATE TABLE public.team_board_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'idea' CHECK (category IN ('problem', 'idea', 'question')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_discussion', 'approved', 'in_progress', 'done', 'rejected')),
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  feedback_id UUID REFERENCES public.admin_feedback(id),
  votes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_board_comments table for discussion threads
CREATE TABLE public.team_board_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.team_board_items(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_board_votes table for upvoting items
CREATE TABLE public.team_board_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.team_board_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(item_id, user_id)
);

-- Enable RLS
ALTER TABLE public.team_board_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_board_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_board_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_board_items (all active team members can view and create)
CREATE POLICY "Team members can view all items" ON public.team_board_items
  FOR SELECT USING (public.is_active_team_member());

CREATE POLICY "Team members can create items" ON public.team_board_items
  FOR INSERT WITH CHECK (public.is_active_team_member() AND auth.uid() = created_by);

CREATE POLICY "Admins can update items" ON public.team_board_items
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete items" ON public.team_board_items
  FOR DELETE USING (public.is_admin());

-- RLS Policies for team_board_comments
CREATE POLICY "Team members can view comments" ON public.team_board_comments
  FOR SELECT USING (public.is_active_team_member());

CREATE POLICY "Team members can create comments" ON public.team_board_comments
  FOR INSERT WITH CHECK (public.is_active_team_member() AND auth.uid() = created_by);

CREATE POLICY "Users can update own comments" ON public.team_board_comments
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete comments" ON public.team_board_comments
  FOR DELETE USING (public.is_admin());

-- RLS Policies for team_board_votes
CREATE POLICY "Team members can view votes" ON public.team_board_votes
  FOR SELECT USING (public.is_active_team_member());

CREATE POLICY "Team members can vote" ON public.team_board_votes
  FOR INSERT WITH CHECK (public.is_active_team_member() AND auth.uid() = user_id);

CREATE POLICY "Users can remove own votes" ON public.team_board_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_team_board_items_status ON public.team_board_items(status);
CREATE INDEX idx_team_board_items_category ON public.team_board_items(category);
CREATE INDEX idx_team_board_items_created_by ON public.team_board_items(created_by);
CREATE INDEX idx_team_board_comments_item_id ON public.team_board_comments(item_id);

-- Trigger for updated_at
CREATE TRIGGER update_team_board_items_updated_at
  BEFORE UPDATE ON public.team_board_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_board_comments_updated_at
  BEFORE UPDATE ON public.team_board_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update votes count
CREATE OR REPLACE FUNCTION public.update_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.team_board_items SET votes_count = votes_count + 1 WHERE id = NEW.item_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.team_board_items SET votes_count = votes_count - 1 WHERE id = OLD.item_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_item_votes_count
  AFTER INSERT OR DELETE ON public.team_board_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_votes_count();
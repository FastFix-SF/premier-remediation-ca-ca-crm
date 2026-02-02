-- Create table for photo annotations/markings
CREATE TABLE public.photo_annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES public.project_photos(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  annotation_type TEXT NOT NULL DEFAULT 'marker', -- 'marker', 'circle', 'arrow', 'rectangle'
  x_position NUMERIC NOT NULL, -- percentage from left (0-100)
  y_position NUMERIC NOT NULL, -- percentage from top (0-100)
  width NUMERIC, -- for rectangles/circles
  height NUMERIC, -- for rectangles
  color TEXT DEFAULT '#ef4444', -- red by default
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for photo comments (linked to annotations or standalone)
CREATE TABLE public.photo_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES public.project_photos(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  annotation_id UUID REFERENCES public.photo_annotations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_by_name TEXT, -- Store name for display (customer might not have profile)
  created_by_type TEXT DEFAULT 'customer', -- 'customer', 'team_member'
  comment_text TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.photo_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for photo_annotations
-- Anyone with project access can view
CREATE POLICY "Team members and customers can view annotations"
ON public.photo_annotations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_team_assignments
    WHERE project_id = photo_annotations.project_id
    AND user_id = auth.uid()
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = photo_annotations.project_id
    AND customer_access_granted = true
  )
);

-- Anyone with project access can create
CREATE POLICY "Team members and customers can create annotations"
ON public.photo_annotations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_team_assignments
    WHERE project_id = photo_annotations.project_id
    AND user_id = auth.uid()
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = photo_annotations.project_id
    AND customer_access_granted = true
  )
);

-- Creator can update their own annotations
CREATE POLICY "Creators can update their annotations"
ON public.photo_annotations FOR UPDATE
USING (created_by = auth.uid());

-- Creator or team can delete annotations
CREATE POLICY "Creators and team can delete annotations"
ON public.photo_annotations FOR DELETE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.project_team_assignments
    WHERE project_id = photo_annotations.project_id
    AND user_id = auth.uid()
  )
);

-- RLS policies for photo_comments
CREATE POLICY "Team members and customers can view comments"
ON public.photo_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_team_assignments
    WHERE project_id = photo_comments.project_id
    AND user_id = auth.uid()
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = photo_comments.project_id
    AND customer_access_granted = true
  )
);

CREATE POLICY "Team members and customers can create comments"
ON public.photo_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_team_assignments
    WHERE project_id = photo_comments.project_id
    AND user_id = auth.uid()
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = photo_comments.project_id
    AND customer_access_granted = true
  )
);

CREATE POLICY "Creators can update their comments"
ON public.photo_comments FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Creators and team can delete comments"
ON public.photo_comments FOR DELETE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.project_team_assignments
    WHERE project_id = photo_comments.project_id
    AND user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_photo_annotations_photo_id ON public.photo_annotations(photo_id);
CREATE INDEX idx_photo_annotations_project_id ON public.photo_annotations(project_id);
CREATE INDEX idx_photo_comments_photo_id ON public.photo_comments(photo_id);
CREATE INDEX idx_photo_comments_project_id ON public.photo_comments(project_id);
CREATE INDEX idx_photo_comments_annotation_id ON public.photo_comments(annotation_id);

-- Trigger for updated_at
CREATE TRIGGER update_photo_annotations_updated_at
BEFORE UPDATE ON public.photo_annotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_photo_comments_updated_at
BEFORE UPDATE ON public.photo_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create admin_feedback table for collecting user feedback
CREATE TABLE IF NOT EXISTS public.admin_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_read BOOLEAN DEFAULT false,
  admin_notes TEXT
);

-- Enable RLS
ALTER TABLE public.admin_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can submit feedback"
  ON public.admin_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON public.admin_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON public.admin_feedback
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Policy: Admins can update feedback (mark as read, add notes)
CREATE POLICY "Admins can update feedback"
  ON public.admin_feedback
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create index for faster queries
CREATE INDEX idx_admin_feedback_user_id ON public.admin_feedback(user_id);
CREATE INDEX idx_admin_feedback_created_at ON public.admin_feedback(created_at DESC);
CREATE INDEX idx_admin_feedback_is_read ON public.admin_feedback(is_read);

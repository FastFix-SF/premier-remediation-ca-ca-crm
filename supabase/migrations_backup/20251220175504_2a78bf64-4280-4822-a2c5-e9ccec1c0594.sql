-- Add triage fields to admin_feedback table
ALTER TABLE public.admin_feedback 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'new' CHECK (status IN ('new', 'under_review', 'approved', 'rejected', 'in_progress', 'fixed')),
ADD COLUMN IF NOT EXISTS category text DEFAULT 'uncategorized' CHECK (category IN ('bug', 'feature_request', 'question', 'improvement', 'uncategorized')),
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
ADD COLUMN IF NOT EXISTS fix_description text;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_admin_feedback_status ON public.admin_feedback(status);
CREATE INDEX IF NOT EXISTS idx_admin_feedback_priority ON public.admin_feedback(priority);
CREATE INDEX IF NOT EXISTS idx_admin_feedback_category ON public.admin_feedback(category);
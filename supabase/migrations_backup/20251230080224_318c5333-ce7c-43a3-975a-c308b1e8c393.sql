-- Create feedback_fix_diagnostics table
CREATE TABLE public.feedback_fix_diagnostics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID NOT NULL REFERENCES public.admin_feedback(id) ON DELETE CASCADE,
  diagnostic_type TEXT NOT NULL, -- 'build_check', 'type_check', 'console_errors', 'screenshot_comparison'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'passed', 'failed'
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.feedback_fix_diagnostics ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admin users can manage diagnostics"
ON public.feedback_fix_diagnostics
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Add index for faster lookups
CREATE INDEX idx_feedback_fix_diagnostics_feedback_id ON public.feedback_fix_diagnostics(feedback_id);
CREATE INDEX idx_feedback_fix_diagnostics_status ON public.feedback_fix_diagnostics(status);

-- Add fix_status column to admin_feedback for tracking fix lifecycle
ALTER TABLE public.admin_feedback 
ADD COLUMN IF NOT EXISTS fix_status TEXT DEFAULT 'pending';

-- Add comment explaining fix_status values
COMMENT ON COLUMN public.admin_feedback.fix_status IS 'Fix lifecycle: pending, fix_ready, fix_in_progress, fix_reviewing, fix_verified, fix_failed';
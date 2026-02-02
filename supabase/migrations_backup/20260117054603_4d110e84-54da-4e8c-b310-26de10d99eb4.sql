-- Drop the existing check constraint and add a new one that includes 'deleted'
ALTER TABLE public.admin_feedback DROP CONSTRAINT IF EXISTS admin_feedback_status_check;

ALTER TABLE public.admin_feedback ADD CONSTRAINT admin_feedback_status_check 
CHECK (status IN ('new', 'under_review', 'approved', 'rejected', 'in_progress', 'fixed', 'deleted'));
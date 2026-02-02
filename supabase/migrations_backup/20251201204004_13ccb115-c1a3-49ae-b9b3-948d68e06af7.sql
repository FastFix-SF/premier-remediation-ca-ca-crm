-- Add AI suggestion fields to admin_feedback table
ALTER TABLE admin_feedback
ADD COLUMN IF NOT EXISTS ai_suggestion jsonb,
ADD COLUMN IF NOT EXISTS ai_analyzed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS suggestion_status text DEFAULT 'pending' CHECK (suggestion_status IN ('pending', 'analyzing', 'completed', 'failed'));
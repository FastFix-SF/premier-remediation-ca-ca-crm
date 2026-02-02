-- Add SMS notification preference to team_directory
ALTER TABLE public.team_directory 
ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT true;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_team_directory_sms_notifications 
ON public.team_directory(user_id, sms_notifications_enabled);
-- Add priority column to team_member_notifications if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_member_notifications' 
    AND column_name = 'priority'
  ) THEN
    ALTER TABLE public.team_member_notifications 
    ADD COLUMN priority TEXT DEFAULT 'normal';
  END IF;
END $$;

-- Enable realtime for team_member_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE team_member_notifications;
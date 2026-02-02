-- Add attachments column to team_messages table for direct message file support
ALTER TABLE public.team_messages 
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;
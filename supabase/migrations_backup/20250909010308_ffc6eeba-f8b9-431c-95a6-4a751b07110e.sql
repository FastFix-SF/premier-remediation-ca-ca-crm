-- Add sender_user_id to team_chats table to properly track message ownership
ALTER TABLE public.team_chats 
ADD COLUMN sender_user_id uuid REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX idx_team_chats_sender_user_id ON public.team_chats(sender_user_id);

-- Update existing records to link them to users where possible
-- This will match based on email from team_directory
UPDATE public.team_chats 
SET sender_user_id = td.user_id
FROM public.team_directory td
WHERE td.email LIKE team_chats.sender || '@%'
  AND team_chats.sender_user_id IS NULL;
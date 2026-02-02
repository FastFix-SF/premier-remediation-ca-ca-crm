-- Add INSERT policy for team members to send messages
CREATE POLICY "Team members can send messages"
ON public.team_chats
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = sender_user_id 
  AND EXISTS (
    SELECT 1 
    FROM team_directory 
    WHERE team_directory.user_id = auth.uid() 
    AND team_directory.status = 'active'
  )
);
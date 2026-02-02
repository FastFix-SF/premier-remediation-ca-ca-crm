-- Add RLS policy to allow all active team members to view other active team members for messaging
CREATE POLICY "Active team members can view other active members"
ON public.team_directory
FOR SELECT
USING (
  status = 'active' 
  AND EXISTS (
    SELECT 1 FROM team_directory td
    WHERE td.user_id = auth.uid() 
    AND td.status = 'active'
  )
);
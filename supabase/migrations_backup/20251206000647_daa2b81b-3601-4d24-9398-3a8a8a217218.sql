-- Drop the problematic policy that filters by status='active'
DROP POLICY IF EXISTS "Active team members can view other active members" ON public.team_directory;

-- Re-create the policy to only apply for non-admin active team members viewing other active members
-- This policy allows active team members to see OTHER active team members (for messaging)
-- But it doesn't restrict what admins can see (other policies handle that)
CREATE POLICY "Team members can view active colleagues for messaging"
ON public.team_directory
FOR SELECT
USING (
  -- Allow viewing active members if viewer is also an active team member
  (
    status = 'active' 
    AND EXISTS (
      SELECT 1 FROM team_directory td
      WHERE td.user_id = auth.uid() 
      AND td.status = 'active'
    )
  )
  -- OR viewer is an admin (they can see everything via other policies)
  OR is_admin()
  -- OR it's the user's own record
  OR user_id = auth.uid()
);
-- Drop the restrictive INSERT policy that only allows admin_users table entries
DROP POLICY IF EXISTS "Only admins can create recognitions" ON recognitions;

-- Create new policy allowing any authenticated team member to send recognitions
-- This includes the security check that from_user_id must match the authenticated user
CREATE POLICY "Team members can create recognitions"
  ON recognitions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- The sender must be the authenticated user (prevents impersonation)
    from_user_id = auth.uid()
    -- And must be an active team member
    AND EXISTS (
      SELECT 1 FROM team_directory 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );
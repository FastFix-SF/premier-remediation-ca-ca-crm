-- Create security definer function to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_active_team_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM team_directory
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
$$;

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Team members can view active colleagues for messaging" ON public.team_directory;

-- Create a new policy that uses the security definer function
CREATE POLICY "Team members can view active colleagues"
ON public.team_directory
FOR SELECT
USING (
  -- Active team members can see other active team members
  (status = 'active' AND is_active_team_member())
  -- Admins can see all users
  OR is_admin()
  -- Users can always see their own record
  OR user_id = auth.uid()
);
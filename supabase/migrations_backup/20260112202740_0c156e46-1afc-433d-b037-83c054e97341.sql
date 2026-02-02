-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Admins can view all call logs" ON public.call_logs;

-- Create a new SELECT policy that checks both admin_users table AND team_directory for admin/owner roles
CREATE POLICY "Admins can view all call logs" 
ON public.call_logs 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  )
  OR
  EXISTS (
    SELECT 1 FROM team_directory
    WHERE team_directory.user_id = auth.uid() 
    AND team_directory.status = 'active'
    AND team_directory.role IN ('admin', 'owner')
  )
);

-- Also update INSERT policy to match
DROP POLICY IF EXISTS "Admins can insert call logs" ON public.call_logs;

CREATE POLICY "Admins can insert call logs" 
ON public.call_logs 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  )
  OR
  EXISTS (
    SELECT 1 FROM team_directory
    WHERE team_directory.user_id = auth.uid() 
    AND team_directory.status = 'active'
    AND team_directory.role IN ('admin', 'owner')
  )
);

-- Also update UPDATE policy to match
DROP POLICY IF EXISTS "Admins can update call logs" ON public.call_logs;

CREATE POLICY "Admins can update call logs" 
ON public.call_logs 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  )
  OR
  EXISTS (
    SELECT 1 FROM team_directory
    WHERE team_directory.user_id = auth.uid() 
    AND team_directory.status = 'active'
    AND team_directory.role IN ('admin', 'owner')
  )
);
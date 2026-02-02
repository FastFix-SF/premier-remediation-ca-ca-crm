-- Drop the existing insert policy
DROP POLICY IF EXISTS "Admins/owners can create projects" ON projects;

-- Create a security definer function to check if user is sales
CREATE OR REPLACE FUNCTION public.check_user_is_sales()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_directory
    WHERE user_id = auth.uid()
    AND status = 'active'
    AND role = 'sales'
  )
$$;

-- Create new insert policy that includes sales users
CREATE POLICY "Admins/owners/sales can create projects"
ON projects
FOR INSERT
WITH CHECK (
  check_user_admin_or_owner() OR check_user_is_sales()
);

-- Also allow sales users to insert their own team assignment when creating a project
DROP POLICY IF EXISTS "Users can manage team assignments if admin/owner or assigned to" ON project_team_assignments;

CREATE POLICY "Users can manage team assignments if admin/owner/sales or assigned to"
ON project_team_assignments
FOR ALL
USING (
  check_user_admin_or_owner() OR 
  check_user_assigned_to_project(project_id) OR
  (check_user_is_sales() AND user_id = auth.uid())
)
WITH CHECK (
  check_user_admin_or_owner() OR 
  check_user_assigned_to_project(project_id) OR
  (check_user_is_sales() AND user_id = auth.uid())
);
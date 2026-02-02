-- Create security definer function to check if user is admin or owner
CREATE OR REPLACE FUNCTION public.check_user_admin_or_owner()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM public.team_directory
    WHERE user_id = auth.uid() 
      AND status = 'active' 
      AND role IN ('owner', 'admin')
  );
END;
$$;

-- Create security definer function to check if user is assigned to a project
CREATE OR REPLACE FUNCTION public.check_user_assigned_to_project(project_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_team_assignments
    WHERE project_id = project_id_param 
      AND user_id = auth.uid()
  );
END;
$$;

-- Update RLS policies for projects table
DROP POLICY IF EXISTS "Users can view projects they are assigned to" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects they are assigned to" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects they are assigned to" ON public.projects;

CREATE POLICY "Users can view assigned projects or if admin/owner"
ON public.projects FOR SELECT
TO authenticated
USING (
  public.check_user_admin_or_owner() OR 
  public.check_user_assigned_to_project(id)
);

CREATE POLICY "Users can update assigned projects or if admin/owner"
ON public.projects FOR UPDATE
TO authenticated
USING (
  public.check_user_admin_or_owner() OR 
  public.check_user_assigned_to_project(id)
);

CREATE POLICY "Admins/owners can delete projects"
ON public.projects FOR DELETE
TO authenticated
USING (public.check_user_admin_or_owner());

CREATE POLICY "Admins/owners can create projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (public.check_user_admin_or_owner());

-- Update RLS policies for project_team_assignments table
DROP POLICY IF EXISTS "Users can view team assignments for their projects" ON public.project_team_assignments;
DROP POLICY IF EXISTS "Users can manage team assignments" ON public.project_team_assignments;

CREATE POLICY "Users can view team assignments for accessible projects"
ON public.project_team_assignments FOR SELECT
TO authenticated
USING (
  public.check_user_admin_or_owner() OR 
  public.check_user_assigned_to_project(project_id) OR
  user_id = auth.uid()
);

CREATE POLICY "Users can manage team assignments if admin/owner or assigned to project"
ON public.project_team_assignments FOR ALL
TO authenticated
USING (
  public.check_user_admin_or_owner() OR 
  public.check_user_assigned_to_project(project_id)
)
WITH CHECK (
  public.check_user_admin_or_owner() OR 
  public.check_user_assigned_to_project(project_id)
);

-- Update RLS policies for project_photos table
DROP POLICY IF EXISTS "Users can view photos for their projects" ON public.project_photos;
DROP POLICY IF EXISTS "Users can manage photos for their projects" ON public.project_photos;

CREATE POLICY "Users can view photos for accessible projects"
ON public.project_photos FOR SELECT
TO authenticated
USING (
  public.check_user_admin_or_owner() OR 
  public.check_user_assigned_to_project(project_id) OR
  uploaded_by = auth.uid()
);

CREATE POLICY "Users can upload photos to accessible projects"
ON public.project_photos FOR INSERT
TO authenticated
WITH CHECK (
  public.check_user_admin_or_owner() OR 
  public.check_user_assigned_to_project(project_id)
);

CREATE POLICY "Users can update/delete own photos or if admin/assigned"
ON public.project_photos FOR ALL
TO authenticated
USING (
  uploaded_by = auth.uid() OR
  public.check_user_admin_or_owner() OR 
  public.check_user_assigned_to_project(project_id)
)
WITH CHECK (
  uploaded_by = auth.uid() OR
  public.check_user_admin_or_owner() OR 
  public.check_user_assigned_to_project(project_id)
);
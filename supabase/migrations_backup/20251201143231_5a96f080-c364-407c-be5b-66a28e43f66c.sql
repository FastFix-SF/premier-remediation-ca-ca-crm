-- Clean up old duplicate RLS policies on projects table
DROP POLICY IF EXISTS "Owners and admins can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Owners and admins can create projects" ON public.projects;
DROP POLICY IF EXISTS "Owners and admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Owners and admins can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Sales can create projects" ON public.projects;
DROP POLICY IF EXISTS "Team members see assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Sales can view assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Sales can update assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can manage all projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects they are assigned to" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects they are assigned to" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects they are assigned to" ON public.projects;

-- Clean up old duplicate policies on project_photos table
DROP POLICY IF EXISTS "Users can view photos for their projects" ON public.project_photos;
DROP POLICY IF EXISTS "Users can manage photos for their projects" ON public.project_photos;
DROP POLICY IF EXISTS "team_members_can_view_assigned_photos" ON public.project_photos;
DROP POLICY IF EXISTS "team_members_can_insert_photos" ON public.project_photos;

-- Clean up old duplicate policies on project_team_assignments table  
DROP POLICY IF EXISTS "Users can view team assignments for their projects" ON public.project_team_assignments;
DROP POLICY IF EXISTS "Users can manage team assignments" ON public.project_team_assignments;
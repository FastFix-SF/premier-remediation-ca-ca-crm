-- Drop the existing public view policy for projects
DROP POLICY IF EXISTS "Public can view published projects" ON public.projects;

-- Recreate the public policy to only apply to anonymous users
CREATE POLICY "Anonymous users can view published projects"
ON public.projects
FOR SELECT
TO anon
USING (is_public = true);

-- Ensure the employee policy is correctly set
DROP POLICY IF EXISTS "employees_see_assigned_projects" ON public.projects;

CREATE POLICY "Team members see assigned projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  -- Only show projects where user is assigned via project_team_assignments
  EXISTS (
    SELECT 1
    FROM project_team_assignments pta
    WHERE pta.project_id = projects.id
    AND pta.user_id = auth.uid()
  )
);
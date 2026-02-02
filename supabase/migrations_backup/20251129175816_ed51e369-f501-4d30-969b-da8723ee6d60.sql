-- Update project_tasks RLS policies to use centralized is_admin() function

-- Drop existing policies
DROP POLICY IF EXISTS "Team members can create project tasks" ON project_tasks;
DROP POLICY IF EXISTS "Team members can view project tasks" ON project_tasks;
DROP POLICY IF EXISTS "Team members can update project tasks" ON project_tasks;
DROP POLICY IF EXISTS "Team members can delete project tasks" ON project_tasks;

-- Recreate policies with is_admin() function
CREATE POLICY "Team members can create project tasks"
ON project_tasks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_team_assignments pta
    WHERE pta.project_id = project_tasks.project_id
    AND pta.user_id = auth.uid()
  )
  OR is_admin()
);

CREATE POLICY "Team members can view project tasks"
ON project_tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_team_assignments pta
    WHERE pta.project_id = project_tasks.project_id
    AND pta.user_id = auth.uid()
  )
  OR is_admin()
);

CREATE POLICY "Team members can update project tasks"
ON project_tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_team_assignments pta
    WHERE pta.project_id = project_tasks.project_id
    AND pta.user_id = auth.uid()
  )
  OR is_admin()
);

CREATE POLICY "Team members can delete project tasks"
ON project_tasks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_team_assignments pta
    WHERE pta.project_id = project_tasks.project_id
    AND pta.user_id = auth.uid()
  )
  OR is_admin()
);
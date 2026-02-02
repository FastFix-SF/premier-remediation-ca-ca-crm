-- Drop existing policies on project_status_updates
DROP POLICY IF EXISTS "Team members can create status updates" ON project_status_updates;
DROP POLICY IF EXISTS "Team members can view status updates" ON project_status_updates;
DROP POLICY IF EXISTS "Team members can update status updates" ON project_status_updates;
DROP POLICY IF EXISTS "Team members can delete status updates" ON project_status_updates;

-- Recreate INSERT policy with team_directory check
CREATE POLICY "Team members can create status updates"
ON project_status_updates FOR INSERT
WITH CHECK (
  (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true))
  OR
  (EXISTS (SELECT 1 FROM project_team_assignments WHERE project_team_assignments.project_id = project_status_updates.project_id AND project_team_assignments.user_id = auth.uid()))
  OR
  (EXISTS (SELECT 1 FROM team_directory WHERE team_directory.user_id = auth.uid() AND team_directory.status = 'active' AND team_directory.role IN ('owner', 'admin')))
);

-- Recreate SELECT policy with team_directory check
CREATE POLICY "Team members can view status updates"
ON project_status_updates FOR SELECT
USING (
  (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true))
  OR
  (EXISTS (SELECT 1 FROM project_team_assignments WHERE project_team_assignments.project_id = project_status_updates.project_id AND project_team_assignments.user_id = auth.uid()))
  OR
  (EXISTS (SELECT 1 FROM team_directory WHERE team_directory.user_id = auth.uid() AND team_directory.status = 'active' AND team_directory.role IN ('owner', 'admin')))
);

-- Recreate UPDATE policy with team_directory check
CREATE POLICY "Team members can update status updates"
ON project_status_updates FOR UPDATE
USING (
  (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true))
  OR
  (EXISTS (SELECT 1 FROM project_team_assignments WHERE project_team_assignments.project_id = project_status_updates.project_id AND project_team_assignments.user_id = auth.uid()))
  OR
  (EXISTS (SELECT 1 FROM team_directory WHERE team_directory.user_id = auth.uid() AND team_directory.status = 'active' AND team_directory.role IN ('owner', 'admin')))
);

-- Recreate DELETE policy with team_directory check
CREATE POLICY "Team members can delete status updates"
ON project_status_updates FOR DELETE
USING (
  (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true))
  OR
  (EXISTS (SELECT 1 FROM project_team_assignments WHERE project_team_assignments.project_id = project_status_updates.project_id AND project_team_assignments.user_id = auth.uid()))
  OR
  (EXISTS (SELECT 1 FROM team_directory WHERE team_directory.user_id = auth.uid() AND team_directory.status = 'active' AND team_directory.role IN ('owner', 'admin')))
);
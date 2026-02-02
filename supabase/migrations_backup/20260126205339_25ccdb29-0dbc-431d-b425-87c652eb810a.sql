-- UPDATE policy for project_status_updates
CREATE POLICY "Team members can update status updates"
ON project_status_updates FOR UPDATE
USING (
  (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true))
  OR
  (EXISTS (SELECT 1 FROM project_team_assignments WHERE project_team_assignments.project_id = project_status_updates.project_id AND project_team_assignments.user_id = auth.uid()))
);

-- DELETE policy for project_status_updates
CREATE POLICY "Team members can delete status updates"
ON project_status_updates FOR DELETE
USING (
  (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true))
  OR
  (EXISTS (SELECT 1 FROM project_team_assignments WHERE project_team_assignments.project_id = project_status_updates.project_id AND project_team_assignments.user_id = auth.uid()))
);
-- Drop the existing admin-only policy
DROP POLICY IF EXISTS "Admins can manage project materials" ON project_materials;

-- Create policies that allow team members to manage project materials
CREATE POLICY "Team members can view project materials" ON project_materials
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
    OR
    EXISTS (SELECT 1 FROM team_directory WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team members can insert project materials" ON project_materials
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
    OR
    EXISTS (SELECT 1 FROM team_directory WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team members can update project materials" ON project_materials
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
    OR
    EXISTS (SELECT 1 FROM team_directory WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Admins can delete project materials" ON project_materials
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
  );
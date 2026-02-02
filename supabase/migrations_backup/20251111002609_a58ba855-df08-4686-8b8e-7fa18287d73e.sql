-- Create project_tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  display_order INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for project tasks
CREATE POLICY "Team members can view project tasks"
  ON project_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_team_assignments
      WHERE project_team_assignments.project_id = project_tasks.project_id
        AND project_team_assignments.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
  );

CREATE POLICY "Team members can create project tasks"
  ON project_tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_team_assignments
      WHERE project_team_assignments.project_id = project_tasks.project_id
        AND project_team_assignments.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
  );

CREATE POLICY "Team members can update project tasks"
  ON project_tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_team_assignments
      WHERE project_team_assignments.project_id = project_tasks.project_id
        AND project_team_assignments.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
  );

CREATE POLICY "Team members can delete project tasks"
  ON project_tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_team_assignments
      WHERE project_team_assignments.project_id = project_tasks.project_id
        AND project_team_assignments.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
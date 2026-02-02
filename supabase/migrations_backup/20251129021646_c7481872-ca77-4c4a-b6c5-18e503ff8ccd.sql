-- Add 'sales' as a valid role in team_directory
-- Drop existing check constraint on role if it exists
ALTER TABLE team_directory DROP CONSTRAINT IF EXISTS team_directory_role_check;

-- Add new check constraint that includes 'sales' role
ALTER TABLE team_directory ADD CONSTRAINT team_directory_role_check 
  CHECK (role IN ('owner', 'admin', 'leader', 'contributor', 'sales'));

-- Drop existing sales policies if they exist
DROP POLICY IF EXISTS "Sales can view assigned projects" ON projects;
DROP POLICY IF EXISTS "Sales can update assigned projects" ON projects;
DROP POLICY IF EXISTS "Sales can create projects" ON projects;

-- Sales users can view projects they're assigned to
CREATE POLICY "Sales can view assigned projects"
ON projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_team_assignments pta
    JOIN team_directory td ON td.user_id = pta.user_id
    WHERE pta.project_id = projects.id
    AND pta.user_id = auth.uid()
    AND td.role = 'sales'
    AND td.status = 'active'
  )
);

-- Sales users can update projects they're assigned to
CREATE POLICY "Sales can update assigned projects"
ON projects
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_team_assignments pta
    JOIN team_directory td ON td.user_id = pta.user_id
    WHERE pta.project_id = projects.id
    AND pta.user_id = auth.uid()
    AND td.role = 'sales'
    AND td.status = 'active'
  )
);

-- Sales users can create new projects
CREATE POLICY "Sales can create projects"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_directory td
    WHERE td.user_id = auth.uid()
    AND td.role = 'sales'
    AND td.status = 'active'
  )
);
-- Create policy for owners and admins to view all projects
CREATE POLICY "Owners and admins can view all projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_directory
    WHERE team_directory.user_id = auth.uid()
      AND team_directory.status = 'active'
      AND team_directory.role IN ('owner', 'admin')
  )
);

-- Create policy for owners and admins to create projects
CREATE POLICY "Owners and admins can create projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_directory
    WHERE team_directory.user_id = auth.uid()
      AND team_directory.status = 'active'
      AND team_directory.role IN ('owner', 'admin')
  )
);

-- Create policy for owners and admins to update projects
CREATE POLICY "Owners and admins can update projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_directory
    WHERE team_directory.user_id = auth.uid()
      AND team_directory.status = 'active'
      AND team_directory.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_directory
    WHERE team_directory.user_id = auth.uid()
      AND team_directory.status = 'active'
      AND team_directory.role IN ('owner', 'admin')
  )
);

-- Create policy for owners and admins to delete projects
CREATE POLICY "Owners and admins can delete projects"
ON public.projects
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_directory
    WHERE team_directory.user_id = auth.uid()
      AND team_directory.status = 'active'
      AND team_directory.role IN ('owner', 'admin')
  )
);
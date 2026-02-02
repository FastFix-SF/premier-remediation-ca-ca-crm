-- Add RLS policies for mobile employee access to projects and photos

-- Policy for employees to see projects they are assigned to
CREATE POLICY "employees_see_assigned_projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_team_assignments pta
    WHERE pta.project_id = projects.id 
    AND pta.user_id = auth.uid()
  )
);

-- Policy for employees to insert photos they take
CREATE POLICY "employees_insert_own_photos"
ON public.project_photos
FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.project_team_assignments pta
    WHERE pta.project_id = project_id 
    AND pta.user_id = auth.uid()
  )
);

-- Policy for employees to see photos from assigned projects
CREATE POLICY "employees_see_assigned_project_photos"
ON public.project_photos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_team_assignments pta
    WHERE pta.project_id = project_id 
    AND pta.user_id = auth.uid()
  )
  OR uploaded_by = auth.uid()
);
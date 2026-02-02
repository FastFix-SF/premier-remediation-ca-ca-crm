-- Fix the broken INSERT policy for team members
DROP POLICY IF EXISTS "employees_insert_own_photos" ON project_photos;

CREATE POLICY "team_members_can_insert_photos"
ON project_photos
FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM project_team_assignments pta
    WHERE pta.project_id = project_photos.project_id 
    AND pta.user_id = auth.uid()
  )
);

-- Fix the broken SELECT policy for team members
DROP POLICY IF EXISTS "employees_see_assigned_project_photos" ON project_photos;

CREATE POLICY "team_members_can_view_assigned_photos"
ON project_photos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_team_assignments pta
    WHERE pta.project_id = project_photos.project_id 
    AND pta.user_id = auth.uid()
  )
  OR uploaded_by = auth.uid()
);
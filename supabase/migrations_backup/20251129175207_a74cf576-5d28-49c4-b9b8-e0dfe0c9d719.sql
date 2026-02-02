-- Add storage policies for team members to upload photos to assigned projects

-- Allow team members to upload photos to projects they're assigned to
CREATE POLICY "team_members_upload_assigned_project_photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-photos'
  AND (
    -- Extract project_id from path: projects/{project_id}/{filename}
    EXISTS (
      SELECT 1 FROM project_team_assignments pta
      WHERE pta.project_id::text = (string_to_array(name, '/'))[2]
      AND pta.user_id = auth.uid()
    )
    OR
    -- Also allow admins/owners
    is_admin()
  )
);

-- Allow team members to view photos from projects they're assigned to
CREATE POLICY "team_members_view_assigned_project_photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-photos'
  AND (
    EXISTS (
      SELECT 1 FROM project_team_assignments pta
      WHERE pta.project_id::text = (string_to_array(name, '/'))[2]
      AND pta.user_id = auth.uid()
    )
    OR
    is_admin()
  )
);

-- Allow team members to delete photos they uploaded from assigned projects
CREATE POLICY "team_members_delete_own_project_photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-photos'
  AND (
    (
      -- Can delete if they uploaded it AND are assigned to the project
      owner = auth.uid()
      AND EXISTS (
        SELECT 1 FROM project_team_assignments pta
        WHERE pta.project_id::text = (string_to_array(name, '/'))[2]
        AND pta.user_id = auth.uid()
      )
    )
    OR
    is_admin()
  )
);
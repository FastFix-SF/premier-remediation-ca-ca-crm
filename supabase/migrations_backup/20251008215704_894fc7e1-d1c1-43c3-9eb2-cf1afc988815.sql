-- Allow admins to upload thumbnail images to roi-images bucket
CREATE POLICY "Admins can upload to roi-images bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'roi-images' 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.is_active = true
  )
);

-- Allow admins to update files in roi-images bucket
CREATE POLICY "Admins can update roi-images bucket files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'roi-images' 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.is_active = true
  )
);

-- Allow admins to delete files in roi-images bucket
CREATE POLICY "Admins can delete from roi-images bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'roi-images' 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.is_active = true
  )
);
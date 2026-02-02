-- Add storage policies for submittal-attachments bucket
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to submittal-attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'submittal-attachments');

-- Allow public read access to submittal-attachments (bucket is public)
CREATE POLICY "Allow public read access to submittal-attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'submittal-attachments');

-- Allow authenticated users to update their files
CREATE POLICY "Allow authenticated update to submittal-attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'submittal-attachments');

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated delete from submittal-attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'submittal-attachments');
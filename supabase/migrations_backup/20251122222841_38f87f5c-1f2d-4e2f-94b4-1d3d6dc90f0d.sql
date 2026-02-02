-- Update CORS settings for project-photos bucket to allow image fetching
UPDATE storage.buckets
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'project-photos';

-- Drop existing policy if it exists and recreate
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can view project photos" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create RLS policy to allow authenticated users to read from project-photos
CREATE POLICY "Authenticated users can view project photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-photos');
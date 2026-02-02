-- Create a new storage bucket for AI training data that accepts PDFs and images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training-data',
  'training-data',
  false,
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
);

-- Allow authenticated users to upload training data
CREATE POLICY "Authenticated users can upload training files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'training-data');

-- Allow authenticated users to read training data
CREATE POLICY "Authenticated users can read training files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'training-data');

-- Allow authenticated users to delete their own training files
CREATE POLICY "Users can delete training files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'training-data');
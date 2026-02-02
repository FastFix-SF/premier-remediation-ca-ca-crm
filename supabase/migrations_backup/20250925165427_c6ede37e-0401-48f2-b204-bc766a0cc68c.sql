-- Fix storage policies for admin background uploads
-- First, ensure we have the avatars bucket with proper policies

-- Create policy to allow authenticated users to upload admin backgrounds
CREATE POLICY "Allow admin background uploads" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL 
  AND name LIKE 'admin-bg-%'
);

-- Create policy to allow reading admin background images
CREATE POLICY "Allow reading admin backgrounds" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'avatars' 
  AND name LIKE 'admin-bg-%'
);

-- Create policy to allow updating admin background images
CREATE POLICY "Allow updating admin backgrounds" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL 
  AND name LIKE 'admin-bg-%'
);

-- Create policy to allow deleting admin background images
CREATE POLICY "Allow deleting admin backgrounds" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL 
  AND name LIKE 'admin-bg-%'
);
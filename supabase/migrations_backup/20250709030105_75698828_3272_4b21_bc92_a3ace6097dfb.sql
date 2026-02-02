
-- Create the project-photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-photos',
  'project-photos', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- Create storage policy for admins to upload photos
CREATE POLICY "Admins can upload project photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-photos' AND
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- Create storage policy for admins to view all photos
CREATE POLICY "Admins can view all project photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'project-photos' AND
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- Create storage policy for public to view published photos
CREATE POLICY "Public can view published project photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'project-photos' AND
  EXISTS (
    SELECT 1 FROM project_photos 
    WHERE project_photos.photo_url = storage.objects.name
    AND project_photos.is_visible_to_customer = true
  )
);

-- Create storage policy for admins to delete photos
CREATE POLICY "Admins can delete project photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-photos' AND
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

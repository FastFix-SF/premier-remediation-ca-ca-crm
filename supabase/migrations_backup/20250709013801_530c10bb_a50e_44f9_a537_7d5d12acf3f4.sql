
-- Add admin controls and photo visibility tracking
ALTER TABLE companycam_photos 
ADD COLUMN is_public BOOLEAN DEFAULT false,
ADD COLUMN published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN admin_notes TEXT;

-- Add project-level visibility controls
ALTER TABLE companycam_projects 
ADD COLUMN is_public BOOLEAN DEFAULT false,
ADD COLUMN published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN admin_notes TEXT;

-- Create indexes for better performance
CREATE INDEX idx_companycam_photos_is_public ON companycam_photos(is_public);
CREATE INDEX idx_companycam_projects_is_public ON companycam_projects(is_public);

-- Update RLS policies for photos to respect public visibility
DROP POLICY IF EXISTS "Anyone can view project photos" ON companycam_photos;
DROP POLICY IF EXISTS "Public can view project photos" ON companycam_photos;

-- Create new RLS policy for public photo access
CREATE POLICY "Public can view published project photos" 
ON companycam_photos 
FOR SELECT 
USING (
  is_public = true 
  AND EXISTS (
    SELECT 1 FROM companycam_projects 
    WHERE id = companycam_photos.project_id 
    AND is_public = true
  )
);

-- Create admin policy for managing photos
CREATE POLICY "Admins can manage all photos" 
ON companycam_photos 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- Update projects RLS policies
DROP POLICY IF EXISTS "Anyone can view completed projects" ON companycam_projects;
DROP POLICY IF EXISTS "Public can view completed projects" ON companycam_projects;

-- Create new RLS policy for public project access
CREATE POLICY "Public can view published projects" 
ON companycam_projects 
FOR SELECT 
USING (is_public = true);

-- Create admin policy for managing projects
CREATE POLICY "Admins can manage all projects" 
ON companycam_projects 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

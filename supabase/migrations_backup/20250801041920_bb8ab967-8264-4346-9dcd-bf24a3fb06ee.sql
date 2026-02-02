-- Update RLS policies for project_photos to ensure untagged photos are only visible to admins

-- Drop existing customer visibility policies
DROP POLICY IF EXISTS "Customers can view their project photos via email" ON public.project_photos;
DROP POLICY IF EXISTS "Customers can view visible project photos" ON public.project_photos;
DROP POLICY IF EXISTS "Public can view photos from public projects" ON public.project_photos;

-- Create new policies that only show tagged photos to customers/public
CREATE POLICY "Customers can view tagged project photos via email" 
ON public.project_photos 
FOR SELECT 
USING (
  photo_tag IS NOT NULL 
  AND is_visible_to_customer = true 
  AND EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_photos.project_id 
    AND projects.customer_email = auth.email()
  )
);

CREATE POLICY "Customers can view tagged visible project photos" 
ON public.project_photos 
FOR SELECT 
USING (
  photo_tag IS NOT NULL 
  AND is_visible_to_customer = true 
  AND EXISTS (
    SELECT 1 FROM project_assignments 
    WHERE project_assignments.project_id = project_photos.project_id 
    AND (project_assignments.customer_id = auth.uid() OR project_assignments.customer_email = auth.email())
  )
);

CREATE POLICY "Public can view tagged photos from public projects" 
ON public.project_photos 
FOR SELECT 
USING (
  photo_tag IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_photos.project_id 
    AND projects.is_public = true
  )
);
-- Add RLS policy to allow public access to photos from public projects
CREATE POLICY "Public can view photos from public projects" 
ON public.project_photos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.projects 
    WHERE projects.id = project_photos.project_id 
    AND projects.is_public = true
  )
);
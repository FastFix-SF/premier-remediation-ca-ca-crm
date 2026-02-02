
-- Drop the problematic admin policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can manage all projects" ON public.companycam_projects;
DROP POLICY IF EXISTS "Admins can manage all photos" ON public.companycam_photos;

-- Create simpler policies that don't cause recursion
-- For now, we'll make projects and photos publicly readable and only allow service role to manage them
CREATE POLICY "Anyone can view completed projects" 
  ON public.companycam_projects 
  FOR SELECT 
  USING (status = 'completed');

CREATE POLICY "Anyone can view project photos" 
  ON public.companycam_photos 
  FOR SELECT 
  USING (true);

-- Service role can manage all (this will be used by the sync function)
CREATE POLICY "Service role can manage projects" 
  ON public.companycam_projects 
  FOR ALL 
  USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage photos" 
  ON public.companycam_photos 
  FOR ALL 
  USING (current_setting('role') = 'service_role');

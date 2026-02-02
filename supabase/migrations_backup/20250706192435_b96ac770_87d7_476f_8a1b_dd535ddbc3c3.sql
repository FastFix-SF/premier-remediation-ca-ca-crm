
-- Fix the infinite recursion in RLS policies by removing the problematic policies
-- and creating simpler ones that don't reference themselves

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can manage all projects" ON public.companycam_projects;
DROP POLICY IF EXISTS "Admins can manage all photos" ON public.companycam_photos;

-- Create simpler policies that allow public read access for completed projects
-- and service role management for syncing
CREATE POLICY "Anyone can view completed projects" 
  ON public.companycam_projects 
  FOR SELECT 
  USING (status = 'completed');

CREATE POLICY "Anyone can view project photos" 
  ON public.companycam_photos 
  FOR SELECT 
  USING (true);

-- Service role can manage all data (used by sync function)
CREATE POLICY "Service role can manage projects" 
  ON public.companycam_projects 
  FOR ALL 
  USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage photos" 
  ON public.companycam_photos 
  FOR ALL 
  USING (current_setting('role') = 'service_role');

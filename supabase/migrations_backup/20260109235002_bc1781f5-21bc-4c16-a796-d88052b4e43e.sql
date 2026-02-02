-- Drop existing restrictive invoice policies
DROP POLICY IF EXISTS "Admins can upload invoices" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read invoices" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update invoices" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete invoices" ON storage.objects;

-- Create new policies that allow authenticated team members
CREATE POLICY "Team members can upload invoices" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'invoices' AND
    (
      EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
      OR
      EXISTS (SELECT 1 FROM team_directory WHERE user_id = auth.uid() AND status = 'active')
    )
  );

CREATE POLICY "Team members can read invoices" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'invoices' AND
    (
      EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
      OR
      EXISTS (SELECT 1 FROM team_directory WHERE user_id = auth.uid() AND status = 'active')
    )
  );

CREATE POLICY "Team members can update invoices" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'invoices' AND
    (
      EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
      OR
      EXISTS (SELECT 1 FROM team_directory WHERE user_id = auth.uid() AND status = 'active')
    )
  );

CREATE POLICY "Admins can delete invoices" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'invoices' AND
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
  );
-- Drop existing admin-only policy on material_bills
DROP POLICY IF EXISTS "Admins can manage all material bills" ON material_bills;

-- Create SELECT policy for team members
CREATE POLICY "Team members can view material bills"
  ON material_bills FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
    OR EXISTS (SELECT 1 FROM team_directory WHERE user_id = auth.uid() AND status = 'active')
  );

-- Create INSERT policy for team members
CREATE POLICY "Team members can insert material bills"
  ON material_bills FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
    OR EXISTS (SELECT 1 FROM team_directory WHERE user_id = auth.uid() AND status = 'active')
  );

-- Create UPDATE policy for team members  
CREATE POLICY "Team members can update material bills"
  ON material_bills FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
    OR EXISTS (SELECT 1 FROM team_directory WHERE user_id = auth.uid() AND status = 'active')
  );

-- Create DELETE policy for admins only
CREATE POLICY "Admins can delete material bills"
  ON material_bills FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
  );
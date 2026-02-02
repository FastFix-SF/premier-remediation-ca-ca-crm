-- Fix the recursive policy issue on admin_users table
DROP POLICY IF EXISTS "Admins only" ON admin_users;

-- Add unique constraint on user_id
ALTER TABLE admin_users ADD CONSTRAINT admin_users_user_id_unique UNIQUE (user_id);

-- Create a simpler policy that allows users to view their own admin record
CREATE POLICY "Users can view their own admin status" ON admin_users 
FOR SELECT USING (user_id = auth.uid());

-- Allow service role to manage admin_users for system operations
CREATE POLICY "Service role can manage admin_users" ON admin_users 
FOR ALL USING (current_setting('role') = 'service_role');

-- Ensure the admin user record exists
INSERT INTO admin_users (user_id, email, is_active)
VALUES ('11ad4349-7569-4e9a-a5b8-0483d13dcef8', 'fastrackfix@gmail.com', true)
ON CONFLICT (user_id) DO UPDATE SET 
  email = EXCLUDED.email,
  is_active = EXCLUDED.is_active;
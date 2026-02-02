-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can manage edge categories" ON edge_categories;

-- Create a new policy with both USING and WITH CHECK clauses
CREATE POLICY "Admins can manage edge categories"
ON edge_categories
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);
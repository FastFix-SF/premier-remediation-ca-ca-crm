-- Add Sabin Potter to admin_users table for full admin access
INSERT INTO admin_users (user_id, email, is_active)
VALUES (
  '6fa2ae96-184a-43a1-8de6-a3ce2018f93a',
  '19189991414',
  true
)
ON CONFLICT (user_id) DO UPDATE SET is_active = true;
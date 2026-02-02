-- Update RLS policy to only allow admins to create recognitions
DROP POLICY IF EXISTS "Authenticated users can create recognitions" ON public.recognitions;

CREATE POLICY "Only admins can create recognitions"
  ON public.recognitions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
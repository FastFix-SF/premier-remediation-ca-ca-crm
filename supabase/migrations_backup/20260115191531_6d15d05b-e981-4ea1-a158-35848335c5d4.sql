-- Add DELETE policy for admin_feedback table so admins can delete feedback items
CREATE POLICY "Admins can delete feedback"
  ON public.admin_feedback
  FOR DELETE
  TO authenticated
  USING (is_admin());
-- Add INSERT, UPDATE, and DELETE policies for quotes table
CREATE POLICY "Admins can insert quotes"
ON public.quotes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admins can update quotes"
ON public.quotes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admins can delete quotes"
ON public.quotes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);
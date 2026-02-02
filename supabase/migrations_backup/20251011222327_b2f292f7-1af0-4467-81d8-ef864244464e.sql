-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can update quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can delete quotes" ON public.quotes;

-- Create security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
$$;

-- Recreate policies using the security definer function
CREATE POLICY "Admins can insert quotes"
ON public.quotes
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update quotes"
ON public.quotes
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete quotes"
ON public.quotes
FOR DELETE
TO authenticated
USING (public.is_admin());
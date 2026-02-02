-- Drop policies that depend on the function
DROP POLICY IF EXISTS "Admins can insert quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can update quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can delete quotes" ON public.quotes;

-- Drop the function
DROP FUNCTION IF EXISTS public.is_admin();

-- Create a new security definer function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  -- Query admin_users directly, bypassing RLS since this is SECURITY DEFINER
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  ) INTO is_admin_user;
  
  RETURN is_admin_user;
END;
$$;

-- Recreate the policies
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
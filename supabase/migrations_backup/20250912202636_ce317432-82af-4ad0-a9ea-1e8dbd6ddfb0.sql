-- Fix recursive RLS policy on team_directory causing 42P17 errors
-- 1) Ensure helper functions exist and are SECURITY DEFINER (idempotent)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_team_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_directory 
    WHERE user_id = auth.uid() 
      AND status = 'active' 
      AND role IN ('owner','admin')
  );
END;
$$;

-- 2) Replace recursive SELECT policy with function-based check
DROP POLICY IF EXISTS "Team admins can read team directory" ON public.team_directory;

CREATE POLICY "Team admins can read team directory"
ON public.team_directory
FOR SELECT
USING (
  public.is_admin_user() OR public.is_team_admin()
);

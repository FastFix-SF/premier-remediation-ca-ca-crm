
-- Update is_admin() function to also check team_directory for owner/admin roles
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_admin_user boolean;
BEGIN
  -- Check admin_users table first
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  ) INTO is_admin_user;
  
  -- If not found in admin_users, check team_directory for owner/admin role
  IF NOT is_admin_user THEN
    SELECT EXISTS (
      SELECT 1
      FROM team_directory
      WHERE user_id = auth.uid() 
        AND status = 'active' 
        AND role IN ('owner', 'admin')
    ) INTO is_admin_user;
  END IF;
  
  RETURN is_admin_user;
END;
$function$;

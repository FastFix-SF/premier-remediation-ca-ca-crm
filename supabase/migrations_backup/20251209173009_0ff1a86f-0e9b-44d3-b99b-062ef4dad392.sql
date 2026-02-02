CREATE OR REPLACE FUNCTION public.grant_admin_to_phone()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the new user has an admin phone number
  IF NEW.phone IN ('+15106196839', '+15102003693') THEN
    -- Insert into admin_users if not exists
    INSERT INTO public.admin_users (user_id, is_active)
    VALUES (NEW.id, true)
    ON CONFLICT (user_id) 
    DO UPDATE SET is_active = true;
    
    -- Also ensure they're in team_directory with owner role
    INSERT INTO public.team_directory (user_id, email, full_name, role, status)
    VALUES (
      NEW.id, 
      COALESCE(NEW.email, NEW.phone),
      COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.raw_user_meta_data->>'display_name', 'Admin User'),
      'owner',
      'active'
    )
    ON CONFLICT (email) 
    DO UPDATE SET 
      role = 'owner',
      status = 'active',
      user_id = EXCLUDED.user_id,
      full_name = COALESCE(EXCLUDED.full_name, team_directory.full_name);
  END IF;
  
  RETURN NEW;
END;
$function$
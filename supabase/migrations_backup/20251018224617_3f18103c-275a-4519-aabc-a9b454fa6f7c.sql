-- First, update the check constraint to include 'pending_approval' status
ALTER TABLE public.team_directory 
DROP CONSTRAINT IF EXISTS team_directory_status_check;

ALTER TABLE public.team_directory 
ADD CONSTRAINT team_directory_status_check 
CHECK (status = ANY (ARRAY['active'::text, 'invited'::text, 'disabled'::text, 'pending_approval'::text]));

-- Now update the grant_admin_to_phone function to handle conflicts better
CREATE OR REPLACE FUNCTION public.grant_admin_to_phone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the new user has the admin phone number
  IF NEW.phone = '+15106196839' THEN
    -- Insert into admin_users if not exists
    INSERT INTO public.admin_users (user_id, is_active)
    VALUES (NEW.id, true)
    ON CONFLICT (user_id) 
    DO UPDATE SET is_active = true;
    
    -- Also ensure they're in team_directory with owner role
    -- Use the phone or email as the identifier
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
$$;
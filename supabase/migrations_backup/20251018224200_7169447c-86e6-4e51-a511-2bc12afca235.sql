-- Add phone number +15106196839 as admin user
-- First, we need to find if this user exists in auth.users by phone
-- This migration will be run after the user signs up with this phone

-- Create a function to grant admin access to specific phone number
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
      user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically grant admin access on signup
DROP TRIGGER IF EXISTS on_admin_phone_signup ON auth.users;
CREATE TRIGGER on_admin_phone_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.grant_admin_to_phone();
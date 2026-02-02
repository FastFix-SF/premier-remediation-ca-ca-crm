-- Add trigger to auto-create pending approval record for phone signups
CREATE OR REPLACE FUNCTION public.handle_phone_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process phone signups (phone exists, typically email is same as phone for phone auth)
  IF NEW.phone IS NOT NULL THEN
    INSERT INTO public.team_directory (
      user_id,
      email,
      full_name,
      role,
      status,
      invited_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.email, NEW.phone),
      COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.raw_user_meta_data->>'display_name', 'Phone User'),
      'contributor',
      'pending_approval',
      NOW()
    )
    ON CONFLICT (email) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_phone_user_signup ON auth.users;

CREATE TRIGGER on_phone_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_phone_signup();
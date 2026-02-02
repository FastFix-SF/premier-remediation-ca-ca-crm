-- Create a function to get user's phone number from auth
CREATE OR REPLACE FUNCTION get_user_phone(user_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_phone TEXT;
BEGIN
  -- Get phone from auth.users
  SELECT phone INTO user_phone
  FROM auth.users
  WHERE id = user_id_param;
  
  RETURN user_phone;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_phone(UUID) TO authenticated;
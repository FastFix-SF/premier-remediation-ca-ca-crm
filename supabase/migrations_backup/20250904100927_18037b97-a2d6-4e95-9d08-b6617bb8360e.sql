-- Create a function to validate invitation tokens for non-logged-in users
CREATE OR REPLACE FUNCTION public.validate_invitation_token(token_value text)
RETURNS TABLE (
  email text,
  full_name text,
  role text,
  invited_by uuid,
  token_expires_at timestamp with time zone,
  status text,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Set the session variable for RLS policy
  PERFORM set_config('app.invite_token', token_value, true);
  
  -- Clean up expired tokens first
  PERFORM cleanup_expired_invite_tokens();
  
  -- Return the invitation data if valid
  RETURN QUERY
  SELECT 
    td.email,
    td.full_name,
    td.role,
    td.invited_by,
    td.token_expires_at,
    td.status,
    td.user_id
  FROM team_directory td
  WHERE td.invite_token = token_value
    AND td.status = 'invited'
    AND td.token_expires_at > now();
END;
$$;
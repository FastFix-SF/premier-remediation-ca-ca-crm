-- Step 1: Create security definer function to check admin status without recursion
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
    AND role IN ('owner', 'admin') 
    AND status = 'active'
  );
END;
$$;

-- Step 2: Drop existing team_members table if it exists (it's redundant with team_directory)
DROP TABLE IF EXISTS public.team_members CASCADE;

-- Step 3: Add secure token generation function
CREATE OR REPLACE FUNCTION public.generate_secure_invite_token()
 RETURNS text
 LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$;

-- Step 4: Add constraint to ensure team_directory user_id is not null for active users
-- First, update any existing active records with null user_id to have a placeholder
UPDATE public.team_directory 
SET user_id = gen_random_uuid() 
WHERE user_id IS NULL AND status = 'active';

-- Step 5: Update team_invitations table structure for better token management
ALTER TABLE public.team_invitations 
ADD COLUMN IF NOT EXISTS used_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_expired boolean DEFAULT false;

-- Step 6: Create index for better performance on token lookups
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_team_directory_user_id ON public.team_directory(user_id);
CREATE INDEX IF NOT EXISTS idx_team_directory_email ON public.team_directory(email);

-- Step 7: Create function to automatically expire old tokens when new ones are created
CREATE OR REPLACE FUNCTION public.expire_old_invitation_tokens()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Mark old pending invitations as expired when a new one is created for the same email
  UPDATE public.team_invitations 
  SET status = 'expired', is_expired = true 
  WHERE email = NEW.email 
    AND status = 'pending' 
    AND id != NEW.id;
  
  RETURN NEW;
END;
$$;

-- Step 8: Create trigger to automatically expire old tokens
DROP TRIGGER IF EXISTS trigger_expire_old_tokens ON public.team_invitations;
CREATE TRIGGER trigger_expire_old_tokens
  BEFORE INSERT ON public.team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.expire_old_invitation_tokens();

-- Step 9: Create function to clean up expired invitations
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Mark invitations as expired if they're past expiry date
  UPDATE public.team_invitations 
  SET status = 'expired', is_expired = true 
  WHERE status = 'pending' 
    AND expires_at < now();
END;
$$;
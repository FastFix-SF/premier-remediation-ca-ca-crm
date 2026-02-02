-- Add invite token and expiration fields to team_directory
ALTER TABLE public.team_directory 
ADD COLUMN invite_token TEXT NULL,
ADD COLUMN token_expires_at TIMESTAMP WITH TIME ZONE NULL;

-- Create index for efficient token lookups
CREATE INDEX idx_team_directory_invite_token ON public.team_directory(invite_token) WHERE invite_token IS NOT NULL;

-- Create function to generate secure invite tokens
CREATE OR REPLACE FUNCTION public.generate_secure_invite_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_invite_tokens()
RETURNS void AS $$
BEGIN
  UPDATE public.team_directory 
  SET invite_token = NULL, token_expires_at = NULL
  WHERE invite_token IS NOT NULL 
    AND token_expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically cleanup expired tokens on updates
CREATE OR REPLACE FUNCTION public.auto_cleanup_expired_tokens()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean up expired tokens before any operation
  PERFORM public.cleanup_expired_invite_tokens();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_cleanup_expired_tokens_trigger
  BEFORE INSERT OR UPDATE ON public.team_directory
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.auto_cleanup_expired_tokens();
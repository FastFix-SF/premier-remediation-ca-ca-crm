-- Fix search path for newly created functions
CREATE OR REPLACE FUNCTION public.generate_secure_invite_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix search path for cleanup function  
CREATE OR REPLACE FUNCTION public.auto_cleanup_expired_tokens()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean up expired tokens before any operation
  PERFORM public.cleanup_expired_invite_tokens();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;
-- Enable pgcrypto extension (just in case, though gen_random_uuid is built-in)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the generate_secure_invite_token function to use gen_random_uuid instead of gen_random_bytes
CREATE OR REPLACE FUNCTION public.generate_secure_invite_token()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN gen_random_uuid()::text;
END;
$function$;
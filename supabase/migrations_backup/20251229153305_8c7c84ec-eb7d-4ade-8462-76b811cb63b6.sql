-- Drop and recreate the function to use gen_random_uuid() instead of gen_random_bytes
DROP FUNCTION IF EXISTS public.generate_service_ticket_token(UUID);

CREATE OR REPLACE FUNCTION public.generate_service_ticket_token(p_ticket_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate a secure random token using gen_random_uuid which is always available
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  
  -- Update the ticket with the new token
  UPDATE public.service_tickets
  SET customer_access_token = v_token
  WHERE id = p_ticket_id;
  
  RETURN v_token;
END;
$$;
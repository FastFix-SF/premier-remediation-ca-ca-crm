-- Add customer_access_token column for secure shareable links
ALTER TABLE public.service_tickets 
ADD COLUMN IF NOT EXISTS customer_access_token TEXT UNIQUE;

-- Create index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_service_tickets_customer_access_token 
ON public.service_tickets(customer_access_token) 
WHERE customer_access_token IS NOT NULL;

-- Create RLS policy to allow public read access via token
CREATE POLICY "Allow public read access with valid token" 
ON public.service_tickets 
FOR SELECT 
USING (
  customer_access_token IS NOT NULL 
  AND customer_access_token = current_setting('app.access_token', true)
);

-- Function to generate access token for a service ticket
CREATE OR REPLACE FUNCTION public.generate_service_ticket_token(p_ticket_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate a secure random token
  v_token := encode(gen_random_bytes(24), 'base64url');
  
  -- Update the ticket with the new token
  UPDATE public.service_tickets
  SET customer_access_token = v_token
  WHERE id = p_ticket_id;
  
  RETURN v_token;
END;
$$;
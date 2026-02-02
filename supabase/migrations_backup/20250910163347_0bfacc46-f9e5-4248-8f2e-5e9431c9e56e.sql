-- Fix security issues introduced by the previous migration
-- Remove the potentially problematic view that triggered security warnings

DROP VIEW IF EXISTS public.quote_submission;

-- The secure function for quote submission remains and is properly secured
-- It already has SECURITY DEFINER with SET search_path = public which is correct

-- Add additional security: Ensure the function is only accessible to appropriate roles
REVOKE ALL ON FUNCTION public.submit_quote_request FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_quote_request(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- Optional: Add rate limiting metadata to the function (for application-level rate limiting)
COMMENT ON FUNCTION public.submit_quote_request IS 'Secure quote submission function with input validation. Rate limit: 5 submissions per hour per IP.';

-- Verify RLS is properly configured on quote_requests
-- This query will help confirm our security settings
DO $$
BEGIN
  -- Check if RLS is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_class 
    WHERE relname = 'quote_requests' 
    AND relrowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on quote_requests table';
  END IF;
  
  RAISE NOTICE 'Security verification passed: RLS is enabled on quote_requests';
END $$;
-- Fix security vulnerability in project_proposals RLS policies
-- The current policy "Anyone can view proposals with valid access token" is too permissive
-- It allows anyone to view ALL proposals since access_token is never null

-- Drop the insecure policy
DROP POLICY IF EXISTS "Anyone can view proposals with valid access token" ON public.project_proposals;

-- Create a secure policy that requires the exact access token to be provided
-- This uses a custom header or query parameter to verify the token
CREATE POLICY "Proposals viewable with correct access token" 
ON public.project_proposals 
FOR SELECT 
USING (
  -- Only allow access if the provided token matches the proposal's access_token
  -- The token should be provided via a custom header or similar secure method
  access_token = current_setting('request.headers', true)::json->>'x-proposal-token' OR
  access_token = current_setting('request.query', true)::json->>'token'
);

-- Also ensure clients can still view their own proposals when authenticated
-- (This policy already exists but keeping it for clarity)
-- CREATE POLICY "Clients can view their proposals via email" 
-- ON public.project_proposals 
-- FOR SELECT 
-- USING (client_email = auth.email());
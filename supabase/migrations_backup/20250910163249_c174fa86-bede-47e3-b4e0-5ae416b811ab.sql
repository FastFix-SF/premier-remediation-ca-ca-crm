-- Security Fix: Ensure quote_requests table has proper RLS protection
-- This prevents competitors from harvesting customer email addresses and contact data

-- First, ensure RLS is enabled on quote_requests
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might allow public access
DROP POLICY IF EXISTS "Public can view quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Anyone can view quote requests" ON public.quote_requests;

-- Ensure only admins can manage quote requests (recreate to be safe)
DROP POLICY IF EXISTS "Admins can manage all quote requests" ON public.quote_requests;

CREATE POLICY "Admins can manage all quote requests"
ON public.quote_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.is_active = true
  )
);

-- Allow customers to view only their own quote requests (if authenticated)
CREATE POLICY "Customers can view their own quote requests"
ON public.quote_requests
FOR SELECT
TO authenticated
USING (auth.email() = email);

-- Allow anonymous users to INSERT their own quote requests (for the quote form)
-- but restrict what data they can see
CREATE POLICY "Anonymous users can create quote requests"
ON public.quote_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Ensure no other policies allow broader access
-- Check for any service role policies that might be too permissive
CREATE POLICY "Service role can manage quote requests"
ON public.quote_requests
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create a view for public quote form submission that doesn't expose sensitive data
CREATE OR REPLACE VIEW public.quote_submission AS
SELECT 
  id,
  created_at,
  status,
  property_type,
  project_type,
  timeline
FROM public.quote_requests
WHERE false; -- This view should never return data directly

-- Grant appropriate permissions on the view
GRANT SELECT ON public.quote_submission TO anon, authenticated;

-- Create a function for secure quote submission
CREATE OR REPLACE FUNCTION public.submit_quote_request(
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_property_address TEXT DEFAULT NULL,
  p_project_type TEXT DEFAULT NULL,
  p_property_type TEXT DEFAULT NULL,
  p_timeline TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quote_id UUID;
BEGIN
  -- Validate required fields
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  
  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  
  -- Basic email validation
  IF NOT p_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Insert the quote request
  INSERT INTO public.quote_requests (
    name,
    email,
    phone,
    property_address,
    project_type,
    property_type,
    timeline,
    notes,
    status
  ) VALUES (
    trim(p_name),
    trim(lower(p_email)),
    CASE WHEN trim(p_phone) = '' THEN NULL ELSE trim(p_phone) END,
    CASE WHEN trim(p_property_address) = '' THEN NULL ELSE trim(p_property_address) END,
    p_project_type,
    p_property_type,
    p_timeline,
    CASE WHEN trim(p_notes) = '' THEN NULL ELSE trim(p_notes) END,
    'new'
  ) RETURNING id INTO quote_id;
  
  RETURN quote_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.submit_quote_request TO anon, authenticated;
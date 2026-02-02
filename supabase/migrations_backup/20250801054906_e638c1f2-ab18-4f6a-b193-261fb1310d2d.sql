-- Fix RLS policy for mug_requests to allow project-based access
-- First, drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Customers can create mug requests for their projects" ON mug_requests;

-- Create a more permissive INSERT policy that allows:
-- 1. Direct email match (for authenticated users)
-- 2. Project invitation access (for customers viewing via invitation links)
CREATE POLICY "Customers can create mug requests via project access" 
ON mug_requests 
FOR INSERT 
WITH CHECK (
  -- Allow if customer email matches authenticated user
  (customer_email = auth.email())
  OR 
  -- Allow if the customer email matches the project's customer email
  -- (this covers invitation link scenarios)
  (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = mug_requests.project_id 
    AND projects.customer_email = mug_requests.customer_email
  ))
);

-- Also update the UPDATE policy to be more permissive
DROP POLICY IF EXISTS "Customers can update their own mug requests" ON mug_requests;

CREATE POLICY "Customers can update mug requests via project access" 
ON mug_requests 
FOR UPDATE 
USING (
  -- Allow if customer email matches authenticated user
  (customer_email = auth.email())
  OR 
  -- Allow if the customer email matches the project's customer email
  (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = mug_requests.project_id 
    AND projects.customer_email = mug_requests.customer_email
  ))
)
WITH CHECK (
  -- Same conditions for the updated data
  (customer_email = auth.email())
  OR 
  (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = mug_requests.project_id 
    AND projects.customer_email = mug_requests.customer_email
  ))
);
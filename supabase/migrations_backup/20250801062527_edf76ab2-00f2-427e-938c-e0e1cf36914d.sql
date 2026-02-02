-- Update RLS policies for mug_requests to handle both authenticated and token-based access
DROP POLICY IF EXISTS "Customers can create mug requests via project access" ON public.mug_requests;
DROP POLICY IF EXISTS "Customers can update mug requests via project access" ON public.mug_requests;

-- Create new INSERT policy that works for both authenticated and unauthenticated users
CREATE POLICY "Customers can create mug requests via project access" 
ON public.mug_requests 
FOR INSERT 
WITH CHECK (
  -- Allow if authenticated user email matches
  (auth.email() IS NOT NULL AND customer_email = auth.email()) OR 
  -- Allow if there's a project assignment with matching email (for token access)
  (EXISTS (
    SELECT 1 
    FROM project_assignments 
    WHERE project_assignments.project_id = mug_requests.project_id 
    AND project_assignments.customer_email = mug_requests.customer_email
  ))
);

-- Create new UPDATE policy that works for both authenticated and unauthenticated users
CREATE POLICY "Customers can update mug requests via project access" 
ON public.mug_requests 
FOR UPDATE 
USING (
  -- Allow if authenticated user email matches
  (auth.email() IS NOT NULL AND customer_email = auth.email()) OR 
  -- Allow if there's a project assignment with matching email (for token access)
  (EXISTS (
    SELECT 1 
    FROM project_assignments 
    WHERE project_assignments.project_id = mug_requests.project_id 
    AND project_assignments.customer_email = mug_requests.customer_email
  ))
) 
WITH CHECK (
  -- Allow if authenticated user email matches
  (auth.email() IS NOT NULL AND customer_email = auth.email()) OR 
  -- Allow if there's a project assignment with matching email (for token access)
  (EXISTS (
    SELECT 1 
    FROM project_assignments 
    WHERE project_assignments.project_id = mug_requests.project_id 
    AND project_assignments.customer_email = mug_requests.customer_email
  ))
);
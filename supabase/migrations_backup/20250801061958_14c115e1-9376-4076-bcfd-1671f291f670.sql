-- Update RLS policies for mug_requests to use project_assignments instead of projects
DROP POLICY IF EXISTS "Customers can create mug requests via project access" ON public.mug_requests;
DROP POLICY IF EXISTS "Customers can update mug requests via project access" ON public.mug_requests;

-- Create new INSERT policy using project_assignments
CREATE POLICY "Customers can create mug requests via project access" 
ON public.mug_requests 
FOR INSERT 
WITH CHECK (
  (customer_email = auth.email()) OR 
  (EXISTS (
    SELECT 1 
    FROM project_assignments 
    WHERE project_assignments.project_id = mug_requests.project_id 
    AND project_assignments.customer_email = mug_requests.customer_email
  ))
);

-- Create new UPDATE policy using project_assignments
CREATE POLICY "Customers can update mug requests via project access" 
ON public.mug_requests 
FOR UPDATE 
USING (
  (customer_email = auth.email()) OR 
  (EXISTS (
    SELECT 1 
    FROM project_assignments 
    WHERE project_assignments.project_id = mug_requests.project_id 
    AND project_assignments.customer_email = mug_requests.customer_email
  ))
) 
WITH CHECK (
  (customer_email = auth.email()) OR 
  (EXISTS (
    SELECT 1 
    FROM project_assignments 
    WHERE project_assignments.project_id = mug_requests.project_id 
    AND project_assignments.customer_email = mug_requests.customer_email
  ))
);
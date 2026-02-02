-- Drop the problematic RLS policy
DROP POLICY IF EXISTS "Users can insert their own training data" ON public.edge_training_data;

-- Create correct policies for edge_training_data
CREATE POLICY "Authenticated users can insert training data"
ON public.edge_training_data
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can view training data"
ON public.edge_training_data
FOR SELECT
TO authenticated
USING (true);
-- Add UPDATE policy for users to update their own time clock entries
CREATE POLICY "Users can update their own time clock entries" 
ON public.time_clock 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
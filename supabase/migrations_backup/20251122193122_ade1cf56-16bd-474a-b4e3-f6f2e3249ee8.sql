-- Add INSERT policy for users to clock in themselves
CREATE POLICY "Users can insert their own time clock entries"
ON public.time_clock
FOR INSERT
TO public
WITH CHECK (user_id = auth.uid());
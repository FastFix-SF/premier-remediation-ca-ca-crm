-- Drop the existing update policy that's too restrictive
DROP POLICY IF EXISTS "Assigned technicians can update their tickets" ON public.service_tickets;

-- Create a more permissive update policy for team members
CREATE POLICY "Team members can update service tickets"
ON public.service_tickets
FOR UPDATE
USING (is_active_team_member() OR is_admin())
WITH CHECK (is_active_team_member() OR is_admin());
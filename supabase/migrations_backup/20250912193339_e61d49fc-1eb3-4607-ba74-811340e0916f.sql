-- Enable RLS on project_team_assignments if not already enabled
ALTER TABLE public.project_team_assignments ENABLE ROW LEVEL SECURITY;

-- Allow team admins (admin_users + team owners/admins) to manage team assignments
CREATE POLICY "Team admins can manage team assignments" 
ON public.project_team_assignments 
FOR ALL 
USING (
  -- Admin users can manage all
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  ) 
  OR 
  -- Team owners/admins can manage assignments for their projects
  EXISTS (
    SELECT 1 FROM team_directory td
    WHERE td.user_id = auth.uid() 
    AND td.status = 'active'
    AND td.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  -- Same permissions for INSERT/UPDATE
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM team_directory td
    WHERE td.user_id = auth.uid() 
    AND td.status = 'active'
    AND td.role IN ('owner', 'admin')
  )
);

-- Allow team admins to read team_directory for member selection
CREATE POLICY "Team admins can read team directory" 
ON public.team_directory 
FOR SELECT 
USING (
  -- Admin users can read all
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  ) 
  OR 
  -- Team owners/admins can read directory
  EXISTS (
    SELECT 1 FROM team_directory td2
    WHERE td2.user_id = auth.uid() 
    AND td2.status = 'active'
    AND td2.role IN ('owner', 'admin')
  )
);
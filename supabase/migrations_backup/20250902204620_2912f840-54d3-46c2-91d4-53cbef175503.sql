-- Fix the team_directory RLS recursion issue
-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "team_directory_admin_access" ON public.team_directory;

-- Create new non-recursive policies
-- Policy 1: Users can view their own team directory record
CREATE POLICY "Users can view own team record" 
ON public.team_directory 
FOR SELECT 
USING (user_id = auth.uid());

-- Policy 2: Users can update their own team directory record (for login timestamp, etc.)
CREATE POLICY "Users can update own team record" 
ON public.team_directory 
FOR UPDATE 
USING (user_id = auth.uid());

-- Policy 3: Admin users can manage all team directory records
-- Use a direct check against admin_users table to avoid recursion
CREATE POLICY "Direct admin access to team directory" 
ON public.team_directory 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- Policy 4: Service role can manage everything (for system operations)
CREATE POLICY "Service role full access" 
ON public.team_directory 
FOR ALL 
USING (current_setting('role') = 'service_role');

-- Policy 5: Allow invited users to view their invitation record by token
CREATE POLICY "Token-based invitation access" 
ON public.team_directory 
FOR SELECT 
USING (
  invite_token IS NOT NULL 
  AND invite_token = current_setting('app.invite_token', true)
  AND token_expires_at > now()
);
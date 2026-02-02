-- Fix RLS policies to prevent infinite recursion and ensure proper team member authentication

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "team_dir_admin_read" ON public.team_directory;
DROP POLICY IF EXISTS "team_dir_admin_write" ON public.team_directory;

-- Create security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  );
END;
$$;

-- Add RLS policies using the security definer function
CREATE POLICY "team_directory_admin_access" ON public.team_directory
FOR ALL USING (public.is_admin_user());

-- Ensure admin_users table has proper policies for invite acceptance
CREATE POLICY "admin_users_self_insert" ON public.admin_users
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add invited_by field to team_directory if it doesn't exist
ALTER TABLE public.team_directory 
ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id);

-- Update team_invitations table to ensure proper constraints
ALTER TABLE public.team_invitations 
ADD COLUMN IF NOT EXISTS accepted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email_status ON public.team_invitations(email, status);
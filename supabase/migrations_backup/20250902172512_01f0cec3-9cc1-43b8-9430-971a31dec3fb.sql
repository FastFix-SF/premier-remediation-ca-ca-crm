-- Create team_members table with hierarchical roles
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  role text NOT NULL CHECK (role IN ('Owner', 'Admin', 'Leader', 'Contributor')),
  is_active boolean DEFAULT true,
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_invitations table for invite flow
CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('Admin', 'Leader', 'Contributor')),
  token text UNIQUE NOT NULL,
  invited_by uuid REFERENCES auth.users(id) NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

-- Enable RLS on both tables
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_members
CREATE POLICY "Team members can view all team members" 
ON public.team_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() AND tm.is_active = true
  ) OR
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() AND au.is_active = true
  )
);

CREATE POLICY "Owners and Admins can manage team members" 
ON public.team_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('Owner', 'Admin') 
    AND tm.is_active = true
  ) OR
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() AND au.is_active = true
  )
);

-- RLS policies for team_invitations
CREATE POLICY "Team members can view invitations" 
ON public.team_invitations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() AND tm.is_active = true
  ) OR
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() AND au.is_active = true
  )
);

CREATE POLICY "Owners and Admins can manage invitations" 
ON public.team_invitations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('Owner', 'Admin') 
    AND tm.is_active = true
  ) OR
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() AND au.is_active = true
  )
);

-- Public policy for invite acceptance (anyone with valid token)
CREATE POLICY "Anyone can view valid invitations with token" 
ON public.team_invitations 
FOR SELECT 
USING (
  status = 'pending' AND expires_at > now()
);

-- Function to generate secure invite tokens
CREATE OR REPLACE FUNCTION public.generate_invite_token()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.user_has_role(user_uuid uuid, required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = user_uuid 
    AND role = required_role 
    AND is_active = true
  );
END;
$$;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create initial Owner record for existing admin users
INSERT INTO public.team_members (user_id, email, full_name, role, is_active, created_at)
SELECT 
  au.user_id,
  au.email,
  COALESCE(p.display_name, 'Admin User'),
  'Owner',
  true,
  au.created_at
FROM public.admin_users au
LEFT JOIN public.profiles p ON p.id = au.user_id
WHERE au.is_active = true
ON CONFLICT (email) DO NOTHING;
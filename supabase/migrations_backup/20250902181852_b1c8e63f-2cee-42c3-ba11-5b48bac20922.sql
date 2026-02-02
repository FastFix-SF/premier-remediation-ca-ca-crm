-- Create team_invitations table for secure invite token management
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_invitations
CREATE POLICY "Admins can manage all invitations" ON public.team_invitations
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Users can view their own invitations" ON public.team_invitations
FOR SELECT TO anon, authenticated
USING (email = auth.email() OR token IS NOT NULL);

-- Add updated_at trigger
CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON public.team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on token for fast lookups
CREATE INDEX idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX idx_team_invitations_email_status ON public.team_invitations(email, status);
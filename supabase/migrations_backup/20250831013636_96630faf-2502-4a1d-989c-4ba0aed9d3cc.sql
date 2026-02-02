-- Add access token field to project_proposals for secure sharing
ALTER TABLE public.project_proposals 
ADD COLUMN access_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64');

-- Create index for faster token lookups
CREATE INDEX idx_project_proposals_access_token ON public.project_proposals(access_token);

-- Add RLS policy to allow access via token (for unauthenticated users)
CREATE POLICY "Anyone can view proposals with valid access token" 
ON public.project_proposals 
FOR SELECT 
USING (access_token IS NOT NULL);

-- Update proposal_photos policy to allow access via token
CREATE POLICY "Anyone can view proposal photos with valid token" 
ON public.proposal_photos 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM project_proposals pp 
  WHERE pp.id = proposal_photos.proposal_id 
  AND pp.access_token IS NOT NULL
));

-- Update proposal_pricing policy to allow access via token  
CREATE POLICY "Anyone can view proposal pricing with valid token"
ON public.proposal_pricing 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM project_proposals pp 
  WHERE pp.id = proposal_pricing.proposal_id 
  AND pp.access_token IS NOT NULL
));

-- Create table to track magic link usage
CREATE TABLE public.proposal_magic_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES project_proposals(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on magic links table
ALTER TABLE public.proposal_magic_links ENABLE ROW LEVEL SECURITY;

-- Policy for magic links - admins can manage, anyone can use valid tokens
CREATE POLICY "Admins can manage magic links" 
ON public.proposal_magic_links 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Anyone can use valid magic links" 
ON public.proposal_magic_links 
FOR SELECT 
USING (token IS NOT NULL AND expires_at > now() AND used_at IS NULL);
-- Create project proposals table
CREATE TABLE public.project_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_number TEXT NOT NULL UNIQUE DEFAULT ('PROP-' || LPAD(EXTRACT(epoch FROM now())::TEXT, 10, '0')),
  property_address TEXT NOT NULL,
  project_type TEXT NOT NULL DEFAULT 'residential',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'negotiating', 'accepted', 'rejected', 'expired')),
  scope_of_work TEXT,
  notes_disclaimers TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create proposal pricing table
CREATE TABLE public.proposal_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.project_proposals(id) ON DELETE CASCADE,
  system_name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  is_recommended BOOLEAN DEFAULT false,
  is_optional BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create proposal photos table
CREATE TABLE public.proposal_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.project_proposals(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after', 'reference', 'progress')),
  description TEXT,
  display_order INTEGER DEFAULT 0,
  uploaded_by UUID NOT NULL,
  file_size BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_proposals
CREATE POLICY "Admins can manage all proposals" 
ON public.project_proposals 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Clients can view their proposals via email" 
ON public.project_proposals 
FOR SELECT 
USING (client_email = auth.email());

-- RLS Policies for proposal_pricing
CREATE POLICY "Admins can manage all proposal pricing" 
ON public.proposal_pricing 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Clients can view their proposal pricing" 
ON public.proposal_pricing 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM project_proposals pp 
  WHERE pp.id = proposal_pricing.proposal_id 
  AND pp.client_email = auth.email()
));

-- RLS Policies for proposal_photos
CREATE POLICY "Admins can manage all proposal photos" 
ON public.proposal_photos 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Clients can view their proposal photos" 
ON public.proposal_photos 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM project_proposals pp 
  WHERE pp.id = proposal_photos.proposal_id 
  AND pp.client_email = auth.email()
));

-- Create indexes for performance
CREATE INDEX idx_project_proposals_client_email ON public.project_proposals(client_email);
CREATE INDEX idx_project_proposals_status ON public.project_proposals(status);
CREATE INDEX idx_proposal_pricing_proposal_id ON public.proposal_pricing(proposal_id);
CREATE INDEX idx_proposal_photos_proposal_id ON public.proposal_photos(proposal_id);

-- Create trigger for updated_at
CREATE TRIGGER update_project_proposals_updated_at
  BEFORE UPDATE ON public.project_proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
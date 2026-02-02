-- Create directory_contacts table for all contact types
CREATE TABLE public.directory_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('vendor', 'contractor', 'customer', 'lead', 'miscellaneous')),
  company TEXT,
  contact_name TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  cell TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_directory_contacts_type ON public.directory_contacts(contact_type);
CREATE INDEX idx_directory_contacts_company ON public.directory_contacts(company);
CREATE INDEX idx_directory_contacts_email ON public.directory_contacts(email);
CREATE INDEX idx_directory_contacts_is_active ON public.directory_contacts(is_active);

-- Enable Row Level Security
ALTER TABLE public.directory_contacts ENABLE ROW LEVEL SECURITY;

-- Admins can manage all contacts
CREATE POLICY "Admins can manage directory contacts"
ON public.directory_contacts
FOR ALL
USING (is_admin());

-- Active team members can view contacts
CREATE POLICY "Team members can view directory contacts"
ON public.directory_contacts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_directory
    WHERE team_directory.user_id = auth.uid()
    AND team_directory.status = 'active'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_directory_contacts_updated_at
BEFORE UPDATE ON public.directory_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
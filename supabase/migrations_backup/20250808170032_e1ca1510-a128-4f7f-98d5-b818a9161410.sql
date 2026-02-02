-- Create quote_requests table
CREATE TABLE IF NOT EXISTS public.quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  project_type TEXT,
  property_type TEXT,
  timeline TEXT,
  notes TEXT,
  property_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Admins can manage all quote requests
CREATE POLICY "Admins can manage all quote requests"
ON public.quote_requests
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  )
);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_quote_requests_updated_at ON public.quote_requests;
CREATE TRIGGER update_quote_requests_updated_at
BEFORE UPDATE ON public.quote_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add quote_request_id to aerial_images for association
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'aerial_images' AND column_name = 'quote_request_id'
  ) THEN
    ALTER TABLE public.aerial_images ADD COLUMN quote_request_id UUID;
  END IF;
END $$;

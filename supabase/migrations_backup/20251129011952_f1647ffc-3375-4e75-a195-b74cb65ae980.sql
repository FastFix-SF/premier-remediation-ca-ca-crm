-- Create quote_attachments table to store screenshots and files
CREATE TABLE IF NOT EXISTS public.quote_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_quote_attachments_quote_id ON public.quote_attachments(quote_id);

-- Enable RLS
ALTER TABLE public.quote_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all attachments"
  ON public.quote_attachments
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert attachments"
  ON public.quote_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete attachments"
  ON public.quote_attachments
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Create storage bucket for quote attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-attachments', 'quote-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for quote-attachments bucket
CREATE POLICY "Admins can upload quote attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'quote-attachments' AND
    public.is_admin()
  );

CREATE POLICY "Anyone can view quote attachments"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'quote-attachments');

CREATE POLICY "Admins can delete quote attachments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'quote-attachments' AND
    public.is_admin()
  );

-- Add updated_at trigger
CREATE TRIGGER update_quote_attachments_updated_at
  BEFORE UPDATE ON public.quote_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
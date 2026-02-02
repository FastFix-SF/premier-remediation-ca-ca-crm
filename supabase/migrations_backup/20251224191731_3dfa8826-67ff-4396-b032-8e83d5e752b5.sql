
-- Create storage bucket for payment files
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-files', 'payment-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for payment files bucket
CREATE POLICY "Allow public read access to payment files"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-files');

CREATE POLICY "Allow authenticated users to upload payment files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-files');

CREATE POLICY "Allow authenticated users to delete payment files"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-files');

-- Create payment_files table to track uploaded files
CREATE TABLE public.payment_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_files ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Allow all access to payment_files" ON public.payment_files FOR ALL USING (true) WITH CHECK (true);

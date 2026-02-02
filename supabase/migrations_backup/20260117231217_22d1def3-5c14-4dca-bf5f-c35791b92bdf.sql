-- Add photo_url column to invoice_items table
ALTER TABLE public.invoice_items 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create storage bucket for invoice item photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoice-item-photos', 'invoice-item-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload invoice item photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoice-item-photos');

-- Allow public read access to invoice item photos
CREATE POLICY "Public can view invoice item photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoice-item-photos');

-- Allow authenticated users to delete their uploaded photos
CREATE POLICY "Authenticated users can delete invoice item photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'invoice-item-photos');
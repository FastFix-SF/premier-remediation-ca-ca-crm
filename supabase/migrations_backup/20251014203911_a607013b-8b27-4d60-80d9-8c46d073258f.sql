-- Create invoices storage bucket that supports PDFs and images
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for invoices bucket
CREATE POLICY "Admins can upload invoices"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'invoices' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  )
);

CREATE POLICY "Admins can read invoices"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'invoices' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  )
);

CREATE POLICY "Admins can update invoices"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'invoices' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  )
);

CREATE POLICY "Admins can delete invoices"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'invoices' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  )
);
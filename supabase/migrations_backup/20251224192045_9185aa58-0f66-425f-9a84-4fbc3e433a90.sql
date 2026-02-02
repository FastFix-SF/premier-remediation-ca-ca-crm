
-- Create storage bucket for expense files
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-files', 'expense-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for expense files bucket
CREATE POLICY "Allow public read access to expense files"
ON storage.objects FOR SELECT
USING (bucket_id = 'expense-files');

CREATE POLICY "Allow authenticated users to upload expense files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'expense-files');

CREATE POLICY "Allow authenticated users to delete expense files"
ON storage.objects FOR DELETE
USING (bucket_id = 'expense-files');

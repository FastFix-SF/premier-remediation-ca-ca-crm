-- Create storage bucket for feedback screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-screenshots', 'feedback-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view feedback screenshots (public bucket)
CREATE POLICY "Public read access for feedback screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'feedback-screenshots');

-- Allow authenticated users to upload feedback screenshots
CREATE POLICY "Authenticated users can upload feedback screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'feedback-screenshots' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to update their own feedback screenshots
CREATE POLICY "Authenticated users can update feedback screenshots"
ON storage.objects FOR UPDATE
USING (bucket_id = 'feedback-screenshots' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to delete feedback screenshots
CREATE POLICY "Authenticated users can delete feedback screenshots"
ON storage.objects FOR DELETE
USING (bucket_id = 'feedback-screenshots' AND auth.uid() IS NOT NULL);
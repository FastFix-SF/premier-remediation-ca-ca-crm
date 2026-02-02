-- Create project-reports bucket for storing field reports
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('project-reports', 'project-reports', true, false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated team members to upload reports
CREATE POLICY "Team members can upload reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-reports' AND
  auth.uid() IS NOT NULL
);

-- Allow authenticated users to read reports
CREATE POLICY "Authenticated users can read reports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-reports' AND
  auth.uid() IS NOT NULL
);

-- Allow authenticated users to update their reports
CREATE POLICY "Authenticated users can update reports"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-reports' AND
  auth.uid() IS NOT NULL
);

-- Allow authenticated users to delete reports  
CREATE POLICY "Authenticated users can delete reports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-reports' AND
  auth.uid() IS NOT NULL
);
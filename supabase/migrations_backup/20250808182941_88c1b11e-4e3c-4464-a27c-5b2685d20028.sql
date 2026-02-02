
-- 1) Add ROI and AI measurement fields to quote_requests
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS roof_roi jsonb NULL,
  ADD COLUMN IF NOT EXISTS roi_image_url text NULL,
  ADD COLUMN IF NOT EXISTS ai_measurements jsonb NULL,
  ADD COLUMN IF NOT EXISTS ai_measurements_status text NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS ai_measurements_updated_at timestamp with time zone NULL;

-- Helpful index for status filtering
CREATE INDEX IF NOT EXISTS quote_requests_ai_measurements_status_idx
  ON public.quote_requests (ai_measurements_status);

-- 2) Create a public storage bucket for ROI images (cropped roof images)
INSERT INTO storage.buckets (id, name, public)
SELECT 'roi-images', 'roi-images', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'roi-images');

-- Public read policy for ROI images (read-only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public can read ROI images'
  ) THEN
    CREATE POLICY "Public can read ROI images"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'roi-images');
  END IF;
END$$;

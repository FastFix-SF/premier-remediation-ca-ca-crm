-- Add crop_meta to quote_requests for ROI/crop metadata persistence
ALTER TABLE public.quote_requests
ADD COLUMN IF NOT EXISTS crop_meta JSONB;
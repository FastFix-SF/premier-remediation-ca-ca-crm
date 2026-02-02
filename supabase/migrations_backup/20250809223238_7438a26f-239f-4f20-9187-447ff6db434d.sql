-- Add selected_imagery and pitch_schema to quote_requests
ALTER TABLE public.quote_requests
ADD COLUMN IF NOT EXISTS selected_imagery JSONB,
ADD COLUMN IF NOT EXISTS pitch_schema JSONB;

-- Optional: ensure ai_measurements_status has default (already set), no changes here.

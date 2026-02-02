-- 1) Add roof_seed column to quote_requests
ALTER TABLE public.quote_requests
ADD COLUMN IF NOT EXISTS roof_seed jsonb NULL;
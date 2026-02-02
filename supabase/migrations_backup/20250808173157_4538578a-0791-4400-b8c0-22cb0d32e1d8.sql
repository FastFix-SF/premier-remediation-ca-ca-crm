-- Extend quote_requests to support conversion and measurements
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS measurements jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS converted_to_project_at timestamptz,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS quote_requests_status_idx ON public.quote_requests (status);
CREATE INDEX IF NOT EXISTS quote_requests_created_at_idx ON public.quote_requests (created_at DESC);

-- Create solar_analyses table to store Google Solar API results
CREATE TABLE IF NOT EXISTS public.solar_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  raw_api_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  parsed_roof_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_area_sqft NUMERIC,
  total_area_squares NUMERIC,
  imagery_date DATE,
  imagery_quality TEXT CHECK (imagery_quality IN ('HIGH', 'MEDIUM', 'LOW')),
  confidence_score NUMERIC DEFAULT 0.0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'complete', 'error')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups by quote_request_id
CREATE INDEX idx_solar_analyses_quote_request_id ON public.solar_analyses(quote_request_id);

-- Enable RLS
ALTER TABLE public.solar_analyses ENABLE ROW LEVEL SECURITY;

-- Admins can manage all solar analyses
CREATE POLICY "Admins can manage all solar analyses"
  ON public.solar_analyses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
    )
  );

-- Service role can insert/update (for edge function)
CREATE POLICY "Service role can manage solar analyses"
  ON public.solar_analyses
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Users can view solar analyses for their quotes
CREATE POLICY "Users can view their solar analyses"
  ON public.solar_analyses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quote_requests
      WHERE quote_requests.id = solar_analyses.quote_request_id
      AND quote_requests.email = auth.email()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_solar_analyses_updated_at
  BEFORE UPDATE ON public.solar_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Add rf_items column to quote_requests table
ALTER TABLE public.quote_requests 
ADD COLUMN IF NOT EXISTS rf_items JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.quote_requests.rf_items IS 'RF (Re-Roof) items for the quote request';

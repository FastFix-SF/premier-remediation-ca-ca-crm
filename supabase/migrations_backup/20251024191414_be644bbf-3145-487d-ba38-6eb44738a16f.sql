-- Add shingles_items column to quote_requests table
ALTER TABLE public.quote_requests 
ADD COLUMN IF NOT EXISTS shingles_items JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.quote_requests.shingles_items IS 'Shingles items for the quote request';
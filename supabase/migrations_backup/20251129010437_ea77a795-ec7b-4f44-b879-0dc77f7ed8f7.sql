-- Add roof detail columns to quote_requests table
ALTER TABLE public.quote_requests
ADD COLUMN IF NOT EXISTS existing_roof TEXT,
ADD COLUMN IF NOT EXISTS wanted_roof TEXT,
ADD COLUMN IF NOT EXISTS existing_roof_deck TEXT,
ADD COLUMN IF NOT EXISTS wanted_roof_deck TEXT,
ADD COLUMN IF NOT EXISTS insulation TEXT;
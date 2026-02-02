-- Add services_items column to quote_requests table
ALTER TABLE public.quote_requests 
ADD COLUMN IF NOT EXISTS services_items JSONB DEFAULT '[]'::jsonb;
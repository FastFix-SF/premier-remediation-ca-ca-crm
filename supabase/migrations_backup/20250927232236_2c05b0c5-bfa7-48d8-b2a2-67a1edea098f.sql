-- Add imagery transform field to quote_requests table
ALTER TABLE public.quote_requests 
ADD COLUMN imagery_transform JSONB DEFAULT NULL,
ADD COLUMN imagery_scale_meta JSONB DEFAULT NULL;
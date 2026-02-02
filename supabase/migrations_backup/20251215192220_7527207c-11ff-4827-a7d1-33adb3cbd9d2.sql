-- Add break_location column to time_clock table
ALTER TABLE public.time_clock 
ADD COLUMN IF NOT EXISTS break_location TEXT;
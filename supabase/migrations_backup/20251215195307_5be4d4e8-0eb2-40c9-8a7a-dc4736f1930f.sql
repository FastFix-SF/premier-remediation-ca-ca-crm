-- Add clock_out_location column to time_clock table
ALTER TABLE public.time_clock 
ADD COLUMN IF NOT EXISTS clock_out_location text;
-- Add break_start_time column to track when breaks begin
ALTER TABLE public.time_clock
ADD COLUMN IF NOT EXISTS break_start_time TIMESTAMP WITH TIME ZONE;
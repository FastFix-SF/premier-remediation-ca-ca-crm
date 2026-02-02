-- Create recognitions table
CREATE TABLE IF NOT EXISTS public.recognitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_ids UUID[] NOT NULL,
  badge_name TEXT NOT NULL,
  badge_emoji TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.recognitions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can view recognitions
CREATE POLICY "Anyone can view recognitions"
  ON public.recognitions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can create recognitions
CREATE POLICY "Authenticated users can create recognitions"
  ON public.recognitions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

-- Policy: Users can update their own recognitions
CREATE POLICY "Users can update own recognitions"
  ON public.recognitions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = from_user_id);

-- Policy: Users can delete their own recognitions
CREATE POLICY "Users can delete own recognitions"
  ON public.recognitions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = from_user_id);

-- Add updated_at trigger
CREATE TRIGGER update_recognitions_updated_at
  BEFORE UPDATE ON public.recognitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
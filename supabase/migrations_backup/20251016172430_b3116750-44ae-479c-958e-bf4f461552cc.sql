-- Create help_requests table
CREATE TABLE public.help_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  message_text TEXT,
  audio_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own help requests
CREATE POLICY "Users can create help requests"
ON public.help_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own help requests
CREATE POLICY "Users can view own help requests"
ON public.help_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view and manage all help requests
CREATE POLICY "Admins can manage help requests"
ON public.help_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Create index for faster queries
CREATE INDEX idx_help_requests_user_id ON public.help_requests(user_id);
CREATE INDEX idx_help_requests_status ON public.help_requests(status);
CREATE INDEX idx_help_requests_created_at ON public.help_requests(created_at DESC);

-- Create storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public)
VALUES ('help-voice-notes', 'help-voice-notes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for voice notes
CREATE POLICY "Users can upload their voice notes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'help-voice-notes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their voice notes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'help-voice-notes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all voice notes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'help-voice-notes' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);
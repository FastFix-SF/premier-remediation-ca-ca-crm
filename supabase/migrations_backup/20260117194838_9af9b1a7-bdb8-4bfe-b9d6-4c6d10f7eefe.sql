-- Phase 1: Video Calls, Meeting Chat, Recordings, and Daily Scores

-- 1. Add camera/call status columns to team_directory if not exists
ALTER TABLE public.team_directory 
ADD COLUMN IF NOT EXISTS camera_on BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS in_call_with UUID,
ADD COLUMN IF NOT EXISTS current_room_id UUID;

-- 2. Create video_calls table for 1:1 calls
CREATE TABLE IF NOT EXISTS public.video_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID NOT NULL,
  callee_id UUID NOT NULL,
  status TEXT DEFAULT 'ringing' CHECK (status IN ('ringing', 'connected', 'ended')),
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view video calls"
ON public.video_calls FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create video calls"
ON public.video_calls FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update video calls"
ON public.video_calls FOR UPDATE
TO authenticated
USING (true);

CREATE INDEX IF NOT EXISTS idx_video_calls_status ON public.video_calls(status) WHERE status != 'ended';
CREATE INDEX IF NOT EXISTS idx_video_calls_caller ON public.video_calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_callee ON public.video_calls(callee_id);

-- 3. Create meeting_chat_messages table
CREATE TABLE IF NOT EXISTS public.meeting_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.meeting_rooms(id) ON DELETE CASCADE,
  sender_id UUID,
  content TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view meeting chat"
ON public.meeting_chat_messages FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can send meeting chat"
ON public.meeting_chat_messages FOR INSERT
TO authenticated
WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_chat_messages;

CREATE INDEX IF NOT EXISTS idx_meeting_chat_room_created ON public.meeting_chat_messages(room_id, created_at DESC);

-- 4. Create meeting_recordings table
CREATE TABLE IF NOT EXISTS public.meeting_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  room_name TEXT,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  duration_seconds INTEGER,
  participants TEXT[] DEFAULT '{}',
  recording_type TEXT DEFAULT 'meeting' CHECK (recording_type IN ('meeting', 'sales_call', 'audio', 'video')),
  transcript TEXT,
  extracted_items JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.meeting_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view recordings"
ON public.meeting_recordings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert recordings"
ON public.meeting_recordings FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can delete own recordings"
ON public.meeting_recordings FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 5. Create team_daily_scores table for leaderboard
CREATE TABLE IF NOT EXISTS public.team_daily_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL,
  score_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_points INTEGER DEFAULT 0,
  tasks_created INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  time_logged_minutes INTEGER DEFAULT 0,
  recordings_made INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(member_id, score_date)
);

ALTER TABLE public.team_daily_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view daily scores"
ON public.team_daily_scores FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage daily scores"
ON public.team_daily_scores FOR ALL
TO authenticated
USING (true);

CREATE INDEX IF NOT EXISTS idx_daily_scores_date ON public.team_daily_scores(score_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_scores_member_date ON public.team_daily_scores(member_id, score_date);

-- 6. Create function to update daily scores when activity is logged
CREATE OR REPLACE FUNCTION public.update_daily_score_on_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_daily_scores (member_id, score_date, total_points)
  VALUES (NEW.member_id, CURRENT_DATE, NEW.points)
  ON CONFLICT (member_id, score_date)
  DO UPDATE SET
    total_points = team_daily_scores.total_points + NEW.points,
    tasks_created = team_daily_scores.tasks_created + CASE WHEN NEW.action_type = 'task_created' THEN 1 ELSE 0 END,
    tasks_completed = team_daily_scores.tasks_completed + CASE WHEN NEW.action_type = 'task_completed' THEN 1 ELSE 0 END,
    time_logged_minutes = team_daily_scores.time_logged_minutes + CASE WHEN NEW.action_type = 'time_logged' THEN COALESCE((NEW.action_data->>'minutes')::integer, 0) ELSE 0 END,
    recordings_made = team_daily_scores.recordings_made + CASE WHEN NEW.action_type = 'recording_made' THEN 1 ELSE 0 END,
    messages_sent = team_daily_scores.messages_sent + CASE WHEN NEW.action_type = 'message_sent' THEN 1 ELSE 0 END,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_activity_log_insert ON public.team_activity_log;

CREATE TRIGGER on_activity_log_insert
AFTER INSERT ON public.team_activity_log
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_score_on_activity();

-- 7. Create storage buckets for attachments and recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-attachments', 'meeting-attachments', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-recordings', 'meeting-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage policies for meeting-attachments
CREATE POLICY "Authenticated users can upload meeting attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'meeting-attachments');

CREATE POLICY "Anyone can view meeting attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'meeting-attachments');

-- 9. Storage policies for meeting-recordings
CREATE POLICY "Authenticated users can upload recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'meeting-recordings');

CREATE POLICY "Anyone can view meeting recordings"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'meeting-recordings');

CREATE POLICY "Users can delete own recording files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'meeting-recordings');
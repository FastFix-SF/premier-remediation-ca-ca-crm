-- Team Sessions (Online Presence Tracking)
CREATE TABLE team_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE team_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all sessions (for presence)
CREATE POLICY "Users can view all sessions" ON team_sessions
  FOR SELECT USING (true);

-- Policy: Users can manage their own sessions
CREATE POLICY "Users can manage own sessions" ON team_sessions
  FOR ALL USING (auth.uid() = member_id);

-- Index for quick lookups
CREATE INDEX idx_team_sessions_member_id ON team_sessions(member_id);
CREATE INDEX idx_team_sessions_is_active ON team_sessions(is_active);

-- Team Activity Log (Gamification)
CREATE TABLE team_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_description TEXT,
  action_data JSONB,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE team_activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all activity (for leaderboard)
CREATE POLICY "Users can view all activity" ON team_activity_log
  FOR SELECT USING (true);

-- Policy: Users can insert their own activity
CREATE POLICY "Users can insert own activity" ON team_activity_log
  FOR INSERT WITH CHECK (auth.uid() = member_id);

-- Indexes
CREATE INDEX idx_team_activity_log_member_id ON team_activity_log(member_id);
CREATE INDEX idx_team_activity_log_created_at ON team_activity_log(created_at DESC);

-- Meeting Rooms (Virtual Office)
CREATE TABLE meeting_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  max_capacity INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE meeting_rooms ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can view rooms
CREATE POLICY "Anyone can view rooms" ON meeting_rooms
  FOR SELECT USING (true);

-- Room Participants
CREATE TABLE room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES meeting_rooms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  is_camera_on BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view participants
CREATE POLICY "Anyone can view participants" ON room_participants
  FOR SELECT USING (true);

-- Policy: Users can manage their own participation
CREATE POLICY "Users can manage own participation" ON room_participants
  FOR ALL USING (auth.uid() = member_id);

-- Index
CREATE INDEX idx_room_participants_room_id ON room_participants(room_id);

-- Team Member Notifications (In-app alerts)
CREATE TABLE team_member_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE team_member_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own notifications
CREATE POLICY "Users can view own notifications" ON team_member_notifications
  FOR SELECT USING (auth.uid() = member_id);

-- Policy: Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON team_member_notifications
  FOR UPDATE USING (auth.uid() = member_id);

-- Policy: Authenticated users can insert notifications
CREATE POLICY "Authenticated users can insert notifications" ON team_member_notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Index
CREATE INDEX idx_team_member_notifications_member_id ON team_member_notifications(member_id);
CREATE INDEX idx_team_member_notifications_is_read ON team_member_notifications(is_read);

-- Seed default meeting rooms
INSERT INTO meeting_rooms (name, description, max_capacity) VALUES
  ('Conference Room', 'Main team meetings and all-hands', 10),
  ('Focus Room', 'Quiet work and 1:1 conversations', 4),
  ('Meeting Room A', 'General meetings', 6),
  ('Meeting Room B', 'General meetings', 6),
  ('Lounge', 'Casual conversations and breaks', 8);
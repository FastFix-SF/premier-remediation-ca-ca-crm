-- Add end_time column to team_tasks for scheduled duration
ALTER TABLE team_tasks ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- Add client_id column to team_tasks if not exists
ALTER TABLE team_tasks ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES sales_clients(id);

-- Add due_date column to task_subtasks for subtask deadlines
ALTER TABLE task_subtasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- Create task/event reminders table for automated SMS notifications
CREATE TABLE IF NOT EXISTS task_event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL CHECK (item_type IN ('task', 'event')),
  item_id UUID NOT NULL,
  member_id UUID,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_type, item_id, member_id, scheduled_for)
);

-- Enable RLS on task_event_reminders
ALTER TABLE task_event_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policy for authenticated users to view all reminders (admin functionality)
CREATE POLICY "Authenticated users can view reminders"
ON task_event_reminders FOR SELECT
USING (auth.role() = 'authenticated');

-- RLS policy for authenticated users to manage reminders
CREATE POLICY "Authenticated users can manage reminders"
ON task_event_reminders FOR ALL
USING (auth.role() = 'authenticated');

-- Add index for efficient reminder queries
CREATE INDEX IF NOT EXISTS idx_task_event_reminders_scheduled 
ON task_event_reminders(scheduled_for, status) 
WHERE status = 'pending';
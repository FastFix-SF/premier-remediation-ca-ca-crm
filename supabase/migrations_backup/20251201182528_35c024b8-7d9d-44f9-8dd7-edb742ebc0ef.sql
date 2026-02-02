-- Add assignment confirmation fields to project_team_assignments
ALTER TABLE project_team_assignments
ADD COLUMN IF NOT EXISTS assignment_status TEXT DEFAULT 'pending' CHECK (assignment_status IN ('pending', 'confirmed', 'rejected')),
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Add index for faster queries on pending assignments
CREATE INDEX IF NOT EXISTS idx_project_assignments_status ON project_team_assignments(user_id, assignment_status) WHERE assignment_status = 'pending';
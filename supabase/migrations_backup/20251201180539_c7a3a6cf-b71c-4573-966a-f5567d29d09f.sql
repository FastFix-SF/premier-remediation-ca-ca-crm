-- Add confirmation status to job_schedules
ALTER TABLE job_schedules 
ADD COLUMN IF NOT EXISTS assignment_status TEXT DEFAULT 'pending' CHECK (assignment_status IN ('pending', 'confirmed', 'rejected'));

-- Add index for faster queries on pending assignments
CREATE INDEX IF NOT EXISTS idx_job_schedules_assignment_status ON job_schedules(assignment_status);

-- Add timestamp for when assignment was confirmed/rejected
ALTER TABLE job_schedules
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE;
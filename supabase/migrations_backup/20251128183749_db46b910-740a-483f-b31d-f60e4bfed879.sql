-- Drop and recreate job_schedules admin policy to use is_admin() function
DROP POLICY IF EXISTS "Admins can manage all job schedules" ON job_schedules;
CREATE POLICY "Admins can manage all job schedules" ON job_schedules FOR ALL USING (is_admin());
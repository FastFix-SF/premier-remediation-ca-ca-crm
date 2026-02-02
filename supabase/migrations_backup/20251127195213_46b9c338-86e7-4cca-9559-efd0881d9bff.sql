
-- Update RLS policies to use is_admin() function instead of direct admin_users check
-- This ensures owners/admins from team_directory also have access

-- LEADS
DROP POLICY IF EXISTS "Admins can manage all leads" ON leads;
CREATE POLICY "Admins can manage all leads" ON leads FOR ALL USING (is_admin());

-- PROJECTS
DROP POLICY IF EXISTS "Admins can manage all projects" ON projects;
CREATE POLICY "Admins can manage all projects" ON projects FOR ALL USING (is_admin());

-- QUOTE_REQUESTS
DROP POLICY IF EXISTS "Admins can manage all quote requests" ON quote_requests;
CREATE POLICY "Admins can manage all quote requests" ON quote_requests FOR ALL USING (is_admin());

-- TEAM_DIRECTORY
DROP POLICY IF EXISTS "Admins can manage team directory" ON team_directory;
CREATE POLICY "Admins can manage team directory" ON team_directory FOR ALL USING (is_admin());

-- INVOICES
DROP POLICY IF EXISTS "Admins can manage all invoices" ON invoices;
CREATE POLICY "Admins can manage all invoices" ON invoices FOR ALL USING (is_admin());

-- PROJECT_PROPOSALS
DROP POLICY IF EXISTS "Admins can manage all proposals" ON project_proposals;
CREATE POLICY "Admins can manage all proposals" ON project_proposals FOR ALL USING (is_admin());

-- PROPOSAL_PRICING
DROP POLICY IF EXISTS "Admins can manage all proposal pricing" ON proposal_pricing;
CREATE POLICY "Admins can manage all proposal pricing" ON proposal_pricing FOR ALL USING (is_admin());

-- EMPLOYEE_REQUESTS
DROP POLICY IF EXISTS "Admins can manage all employee requests" ON employee_requests;
CREATE POLICY "Admins can manage all employee requests" ON employee_requests FOR ALL USING (is_admin());

-- TIME_CLOCK
DROP POLICY IF EXISTS "Admins can manage all time clock entries" ON time_clock;
CREATE POLICY "Admins can manage all time clock entries" ON time_clock FOR ALL USING (is_admin());

-- APP_CONFIG
DROP POLICY IF EXISTS "Admins can manage config" ON app_config;
CREATE POLICY "Admins can manage config" ON app_config FOR ALL USING (is_admin());

-- CRM_CUSTOMER_PROGRESS
DROP POLICY IF EXISTS "Admins can manage all customer progress" ON crm_customer_progress;
CREATE POLICY "Admins can manage all customer progress" ON crm_customer_progress FOR ALL USING (is_admin());

-- CRM_WORKFLOWS
DROP POLICY IF EXISTS "Admins can manage workflows" ON crm_workflows;
CREATE POLICY "Admins can manage workflows" ON crm_workflows FOR ALL USING (is_admin());

-- COMPANYCAM_PROJECTS
DROP POLICY IF EXISTS "Admins can manage all projects" ON companycam_projects;
CREATE POLICY "Admins can manage all companycam projects" ON companycam_projects FOR ALL USING (is_admin());

-- COMPANYCAM_PHOTOS
DROP POLICY IF EXISTS "Admins can manage all photos" ON companycam_photos;
CREATE POLICY "Admins can manage all companycam photos" ON companycam_photos FOR ALL USING (is_admin());

-- PROJECT_PHOTOS
DROP POLICY IF EXISTS "Admins can manage all project photos" ON project_photos;
CREATE POLICY "Admins can manage all project photos" ON project_photos FOR ALL USING (is_admin());

-- MATERIALS
DROP POLICY IF EXISTS "Admins can manage all materials" ON materials;
CREATE POLICY "Admins can manage all materials" ON materials FOR ALL USING (is_admin());

-- WORK_ACTIVITIES
DROP POLICY IF EXISTS "Admins can manage work activities" ON work_activities;
CREATE POLICY "Admins can manage work activities" ON work_activities FOR ALL USING (is_admin());

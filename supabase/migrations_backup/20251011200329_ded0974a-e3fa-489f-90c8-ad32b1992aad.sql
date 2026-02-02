-- First, drop the old constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Now update any existing leads with old statuses to new ones
UPDATE leads SET status = 'proposal_sent' WHERE status = 'proposal';
UPDATE leads SET status = 'paid' WHERE status = 'won';
UPDATE leads SET status = 'quoted' WHERE status = 'qualified';
UPDATE leads SET status = 'new' WHERE status = 'lost';

-- Add the new constraint with updated statuses
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
CHECK (status IN ('new', 'contacted', 'quoted', 'proposal_sent', 'contract_sent', 'in_production', 'inspected', 'paid'));
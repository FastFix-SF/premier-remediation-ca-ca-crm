-- Add quote_request_id to project_proposals to link proposals to their source quotes
ALTER TABLE project_proposals 
ADD COLUMN IF NOT EXISTS quote_request_id UUID REFERENCES quote_requests(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_project_proposals_quote_request_id 
ON project_proposals(quote_request_id);
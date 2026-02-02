-- Add RLS policy to allow users to view proposals they created
CREATE POLICY "Users can view proposals they created"
ON project_proposals 
FOR SELECT 
USING (created_by = auth.uid());

-- Also add policies for related tables to allow creators to access
CREATE POLICY "Users can view pricing for proposals they created"
ON proposal_pricing
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM project_proposals pp 
  WHERE pp.id = proposal_pricing.proposal_id 
  AND pp.created_by = auth.uid()
));

CREATE POLICY "Users can view photos for proposals they created"
ON proposal_photos
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM project_proposals pp 
  WHERE pp.id = proposal_photos.proposal_id 
  AND pp.created_by = auth.uid()
));
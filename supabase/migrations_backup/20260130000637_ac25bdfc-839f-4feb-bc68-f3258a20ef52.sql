-- Create proposal_commissions table for tracking sales commissions
CREATE TABLE proposal_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES project_proposals(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL,
  team_member_name TEXT NOT NULL,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(proposal_id, team_member_id)
);

-- Enable RLS
ALTER TABLE proposal_commissions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage commissions
CREATE POLICY "Authenticated users can manage commissions"
  ON proposal_commissions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_proposal_commissions_updated_at
  BEFORE UPDATE ON proposal_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Create table for custom edge actions
CREATE TABLE IF NOT EXISTS edge_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE edge_actions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all edge actions
CREATE POLICY "Admins can manage all edge actions"
ON edge_actions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- Service role can manage edge actions
CREATE POLICY "Service role can manage edge actions"
ON edge_actions
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_edge_actions_quote_id ON edge_actions(quote_id);
-- Create envelope_drafts table to store signature envelope drafts
CREATE TABLE IF NOT EXISTS public.envelope_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.project_proposals(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(proposal_id)
);

-- Enable RLS
ALTER TABLE public.envelope_drafts ENABLE ROW LEVEL SECURITY;

-- Admins can manage all drafts
CREATE POLICY "Admins can manage envelope drafts"
  ON public.envelope_drafts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Users can manage drafts for proposals they created
CREATE POLICY "Users can manage their envelope drafts"
  ON public.envelope_drafts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.project_proposals
      WHERE id = envelope_drafts.proposal_id
      AND created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_proposals
      WHERE id = envelope_drafts.proposal_id
      AND created_by = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_envelope_drafts_updated_at
  BEFORE UPDATE ON public.envelope_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
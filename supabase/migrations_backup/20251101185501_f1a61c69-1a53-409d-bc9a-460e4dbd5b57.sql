-- Add proposal_id to quotes table to link quotes to proposals
ALTER TABLE public.quotes ADD COLUMN proposal_id UUID REFERENCES public.project_proposals(id) ON DELETE CASCADE;

-- Add quote option name/label
ALTER TABLE public.quotes ADD COLUMN option_name TEXT DEFAULT 'Standard';

-- Add display order for sorting quote options
ALTER TABLE public.quotes ADD COLUMN display_order INTEGER DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX idx_quotes_proposal_id ON public.quotes(proposal_id);

-- Add RLS policy for quotes linked to proposals
CREATE POLICY "Users can view quotes linked to their proposals"
ON public.quotes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_proposals
    WHERE project_proposals.id = quotes.proposal_id
    AND project_proposals.created_by = auth.uid()
  )
);

CREATE POLICY "Users can create quotes for their proposals"
ON public.quotes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_proposals
    WHERE project_proposals.id = quotes.proposal_id
    AND project_proposals.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update quotes linked to their proposals"
ON public.quotes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.project_proposals
    WHERE project_proposals.id = quotes.proposal_id
    AND project_proposals.created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete quotes linked to their proposals"
ON public.quotes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.project_proposals
    WHERE project_proposals.id = quotes.proposal_id
    AND project_proposals.created_by = auth.uid()
  )
);
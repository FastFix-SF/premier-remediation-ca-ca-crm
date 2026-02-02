-- Add contract tracking fields to project_proposals table
ALTER TABLE public.project_proposals 
ADD COLUMN IF NOT EXISTS contract_url TEXT,
ADD COLUMN IF NOT EXISTS contract_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS agreement_number TEXT,
ADD COLUMN IF NOT EXISTS contract_price NUMERIC,
ADD COLUMN IF NOT EXISTS payment_schedule JSONB DEFAULT '{}'::jsonb;

-- Add index for agreement_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_proposals_agreement_number 
ON public.project_proposals(agreement_number);

-- Add comment for documentation
COMMENT ON COLUMN public.project_proposals.payment_schedule IS 'Stores payment breakdown: deposit_percent, deposit_amount, material_percent, material_amount, progress_percent, progress_amount, final_amount';

-- Create storage bucket for contracts if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the contracts bucket
CREATE POLICY "Admins can upload contracts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contracts' 
  AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admins can update contracts"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contracts'
  AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admins can delete contracts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contracts'
  AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Public can view contracts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contracts');
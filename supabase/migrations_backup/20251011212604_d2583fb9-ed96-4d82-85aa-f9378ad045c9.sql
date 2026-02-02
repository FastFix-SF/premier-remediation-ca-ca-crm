-- Add 'ready_to_quote' status to the leads table status check constraint
ALTER TABLE public.leads 
DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE public.leads 
ADD CONSTRAINT leads_status_check 
CHECK (status IN ('new', 'contacted', 'ready_to_quote', 'quoted', 'proposal_sent', 'contract_sent', 'in_production', 'inspected', 'paid'));
-- Enable real-time on leads table for CRM automation
ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD table public.leads;

-- Enable real-time on crm_customer_progress table for workflow automation  
ALTER TABLE public.crm_customer_progress REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD table public.crm_customer_progress;
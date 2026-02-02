-- Add client_access_settings column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS client_access_settings JSONB DEFAULT '{
  "photos": true,
  "schedule": true,
  "daily_logs": false,
  "documents": false,
  "estimates": false,
  "invoices": true,
  "messaging": true,
  "notes": false,
  "change_orders": false,
  "submittals": false,
  "financial_summary": false,
  "work_orders": false,
  "show_phone": false,
  "show_email": false
}'::jsonb;
-- Insert automation rule for creating proposals when leads are qualified
INSERT INTO public.crm_automations (
  name,
  trigger_event, 
  action_type, 
  action_data, 
  condition_data,
  is_active
) VALUES (
  'Auto-create proposal on qualified lead',
  'lead_qualified',
  'create_proposal', 
  '{"auto_generate": true, "expires_in_days": 30}',
  '{}',
  true
) ON CONFLICT DO NOTHING;
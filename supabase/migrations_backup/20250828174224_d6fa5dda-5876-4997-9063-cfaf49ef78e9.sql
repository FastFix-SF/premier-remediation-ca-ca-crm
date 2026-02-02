-- Insert CompanyCam OAuth credentials into app_config table as backup
INSERT INTO app_config (key, value, description) 
VALUES 
  ('COMPANYCAM_CLIENT_ID', 'yR4GzwUfDd_BHczkAyUXtkJQ1OEzAzjqFgng5Do0z9g', 'CompanyCam OAuth Client ID')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description;

INSERT INTO app_config (key, value, description) 
VALUES 
  ('COMPANYCAM_CLIENT_SECRET', 'WBk-olQn4UsbFAwRA3EuUYLGVrtcj0Q3ghzJ9omjTWc', 'CompanyCam OAuth Client Secret')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description;

INSERT INTO app_config (key, value, description) 
VALUES 
  ('COMPANYCAM_REDIRECT_URI', 'https://mnitzgoythqqevhtkitj.supabase.co/functions/v1/companycam-oauth?action=callback', 'CompanyCam OAuth Redirect URI')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description;
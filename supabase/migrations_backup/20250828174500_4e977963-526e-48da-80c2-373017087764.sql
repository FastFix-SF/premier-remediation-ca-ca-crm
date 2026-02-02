-- Add policy to allow service role to read app_config for edge functions
CREATE POLICY "Service role can read app config" 
ON app_config 
FOR SELECT 
TO service_role 
USING (true);
-- Fix employee records where phone numbers were incorrectly stored in email field
-- Move phone numbers from email to phone_number column and set a placeholder email

-- First, update phone_number with the value from email where email looks like a phone number
UPDATE team_directory 
SET phone_number = email
WHERE email ~ '^\d+$' 
  AND (phone_number IS NULL OR phone_number = '');

-- Set email to a generated placeholder for records where email is actually a phone number
UPDATE team_directory 
SET email = 'phone-user-' || user_id || '@placeholder.local'
WHERE email ~ '^\d+$';
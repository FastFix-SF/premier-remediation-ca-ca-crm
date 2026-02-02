-- Clean up placeholder emails from team_directory
-- Replace placeholder emails with phone numbers for phone-only users
UPDATE team_directory 
SET email = phone_number 
WHERE email LIKE '%@placeholder.local' AND phone_number IS NOT NULL;
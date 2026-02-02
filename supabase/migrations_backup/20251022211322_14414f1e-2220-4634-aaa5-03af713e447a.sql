-- Clean up duplicate phone number entries
-- Delete entries with "11" prefix when a corresponding "1" prefix exists

DELETE FROM team_directory 
WHERE email IN (
  SELECT td1.email
  FROM team_directory td1
  WHERE td1.email ~ '^11[0-9]+$'  -- Matches entries starting with "11" followed by digits
    AND EXISTS (
      SELECT 1 FROM team_directory td2 
      WHERE td2.email = SUBSTRING(td1.email FROM 2)
        AND td2.user_id != td1.user_id
    )
);

-- Update the phone signup handler to normalize phone numbers
CREATE OR REPLACE FUNCTION public.handle_phone_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  normalized_phone TEXT;
BEGIN
  -- Only process phone signups (phone exists)
  IF NEW.phone IS NOT NULL THEN
    -- Normalize phone number: remove +, spaces, and ensure single country code
    normalized_phone := regexp_replace(NEW.phone, '[^0-9]', '', 'g');
    
    -- If phone starts with multiple 1s (like 115106...), keep only one
    IF normalized_phone ~ '^1{2,}' THEN
      normalized_phone := regexp_replace(normalized_phone, '^1+', '1', '');
    END IF;
    
    -- Use normalized phone as email identifier
    INSERT INTO public.team_directory (
      user_id,
      email,
      full_name,
      role,
      status,
      invited_at
    ) VALUES (
      NEW.id,
      normalized_phone,
      COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.raw_user_meta_data->>'display_name', 'Phone User'),
      'contributor',
      'pending_approval',
      NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      full_name = COALESCE(EXCLUDED.full_name, team_directory.full_name),
      status = CASE 
        WHEN team_directory.status = 'active' THEN team_directory.status 
        ELSE EXCLUDED.status 
      END;
  END IF;
  
  RETURN NEW;
END;
$function$;
-- Fix existing "Unknown" employee names by updating from team_directory
UPDATE time_clock tc
SET employee_name = td.full_name
FROM team_directory td
WHERE tc.user_id = td.user_id
  AND (tc.employee_name = 'Unknown' OR tc.employee_name IS NULL)
  AND td.full_name IS NOT NULL;

-- Create function to auto-populate employee_name from team_directory
CREATE OR REPLACE FUNCTION set_employee_name_from_directory()
RETURNS TRIGGER AS $$
BEGIN
  -- If employee_name is not provided or is 'Unknown', look it up
  IF NEW.employee_name IS NULL OR NEW.employee_name = 'Unknown' THEN
    SELECT full_name INTO NEW.employee_name
    FROM team_directory
    WHERE user_id = NEW.user_id
    LIMIT 1;
    
    -- If still null, default to 'Unknown'
    IF NEW.employee_name IS NULL THEN
      NEW.employee_name := 'Unknown';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-populate employee_name on insert
CREATE TRIGGER set_employee_name_on_insert
BEFORE INSERT ON time_clock
FOR EACH ROW
EXECUTE FUNCTION set_employee_name_from_directory();
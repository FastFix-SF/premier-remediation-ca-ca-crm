-- Fix the sync function to not reference created_by
CREATE OR REPLACE FUNCTION public.sync_shift_to_project_assignments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record jsonb;
  user_id_val uuid;
  assigner_id uuid;
BEGIN
  -- Only process if the shift has a project_id
  IF NEW.project_id IS NOT NULL THEN
    -- Get the assigner (current user)
    assigner_id := auth.uid();
    
    -- For each user in assigned_users, ensure they have project access
    IF NEW.assigned_users IS NOT NULL AND jsonb_array_length(NEW.assigned_users) > 0 THEN
      FOR user_record IN SELECT * FROM jsonb_array_elements(NEW.assigned_users)
      LOOP
        BEGIN
          -- Extract user_id from the jsonb object
          IF jsonb_typeof(user_record) = 'object' THEN
            user_id_val := (user_record->>'id')::uuid;
          ELSIF jsonb_typeof(user_record) = 'string' THEN
            user_id_val := (user_record#>>'{}')::uuid;
          ELSE
            CONTINUE;
          END IF;
          
          -- Skip if user_id is null
          IF user_id_val IS NULL THEN
            CONTINUE;
          END IF;
          
          -- Insert if not exists (upsert)
          INSERT INTO public.project_team_assignments (project_id, user_id, role, assigned_by)
          VALUES (NEW.project_id, user_id_val, 'contributor', assigner_id)
          ON CONFLICT (project_id, user_id) DO NOTHING;
          
        EXCEPTION WHEN OTHERS THEN
          -- Log error but continue processing other users
          RAISE NOTICE 'Error processing user assignment: %', SQLERRM;
          CONTINUE;
        END;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS sync_shift_assignments_trigger ON public.job_schedules;

CREATE TRIGGER sync_shift_assignments_trigger
  AFTER INSERT OR UPDATE OF assigned_users, project_id ON public.job_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_shift_to_project_assignments();

-- One-time sync of existing shift assignments (without created_by)
DO $$
DECLARE
  shift_record RECORD;
  user_record jsonb;
  user_id_val uuid;
BEGIN
  FOR shift_record IN 
    SELECT id, project_id, assigned_users 
    FROM public.job_schedules 
    WHERE project_id IS NOT NULL 
      AND assigned_users IS NOT NULL 
      AND jsonb_array_length(assigned_users) > 0
  LOOP
    FOR user_record IN SELECT * FROM jsonb_array_elements(shift_record.assigned_users)
    LOOP
      BEGIN
        IF jsonb_typeof(user_record) = 'object' THEN
          user_id_val := (user_record->>'id')::uuid;
        ELSIF jsonb_typeof(user_record) = 'string' THEN
          user_id_val := (user_record#>>'{}')::uuid;
        ELSE
          CONTINUE;
        END IF;
        
        IF user_id_val IS NULL THEN
          CONTINUE;
        END IF;
        
        INSERT INTO public.project_team_assignments (project_id, user_id, role)
        VALUES (shift_record.project_id, user_id_val, 'contributor')
        ON CONFLICT (project_id, user_id) DO NOTHING;
        
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error syncing user % for shift %: %', user_id_val, shift_record.id, SQLERRM;
        CONTINUE;
      END;
    END LOOP;
  END LOOP;
END $$;
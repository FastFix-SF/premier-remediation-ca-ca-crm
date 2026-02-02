-- Fix: Re-sync all job_schedules assigned_users to project_team_assignments
-- This handles both object format {id: uuid} and direct uuid strings

DO $$
DECLARE
  shift_record RECORD;
  user_record jsonb;
  user_id_text text;
  user_id_val uuid;
  sync_count integer := 0;
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
        -- Try to extract user_id from different JSON formats
        IF jsonb_typeof(user_record) = 'object' THEN
          -- Format: {id: "uuid", name: "...", email: "..."}
          user_id_text := user_record->>'id';
        ELSIF jsonb_typeof(user_record) = 'string' THEN
          -- Format: "uuid"
          user_id_text := trim(both '"' from user_record::text);
        ELSE
          CONTINUE;
        END IF;
        
        -- Skip if null or empty
        IF user_id_text IS NULL OR user_id_text = '' THEN
          CONTINUE;
        END IF;
        
        -- Try to convert to UUID
        BEGIN
          user_id_val := user_id_text::uuid;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Could not convert to UUID: %', user_id_text;
          CONTINUE;
        END;
        
        -- Insert assignment if not exists
        INSERT INTO public.project_team_assignments (project_id, user_id, role)
        VALUES (shift_record.project_id, user_id_val, 'contributor')
        ON CONFLICT (project_id, user_id) DO NOTHING;
        
        sync_count := sync_count + 1;
        
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error syncing user for shift %: %', shift_record.id, SQLERRM;
        CONTINUE;
      END;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Synced % user-project assignments', sync_count;
END $$;
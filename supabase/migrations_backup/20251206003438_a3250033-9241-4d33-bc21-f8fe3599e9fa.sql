-- Sync all job_schedules assigned_users to project_team_assignments
-- Only for valid projects AND valid users that exist

DO $$
DECLARE
  default_assigner uuid;
BEGIN
  -- Get an admin user to use as default assigner
  SELECT user_id INTO default_assigner 
  FROM admin_users 
  WHERE is_active = true 
  LIMIT 1;
  
  -- If no admin found, get any user from team_directory
  IF default_assigner IS NULL THEN
    SELECT user_id INTO default_assigner 
    FROM team_directory 
    WHERE status = 'active' AND role IN ('owner', 'admin')
    LIMIT 1;
  END IF;
  
  -- Sync all job_schedules assigned_users - only for EXISTING projects and users
  INSERT INTO project_team_assignments (project_id, user_id, role, assigned_by)
  SELECT DISTINCT 
    js.project_id,
    (elem->>'id')::uuid as user_id,
    'contributor' as role,
    default_assigner as assigned_by
  FROM job_schedules js
  JOIN projects p ON p.id = js.project_id -- Only valid projects
  CROSS JOIN jsonb_array_elements(js.assigned_users) as elem
  WHERE js.project_id IS NOT NULL
    AND js.assigned_users IS NOT NULL
    AND jsonb_array_length(js.assigned_users) > 0
    AND elem->>'id' IS NOT NULL
    AND elem->>'id' != ''
    -- Only include users that exist in auth.users
    AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = (elem->>'id')::uuid)
  ON CONFLICT (project_id, user_id) DO NOTHING;
END $$;

-- Also update the sync trigger function to validate users exist
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
          
          -- Verify user exists in auth.users before inserting
          IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id_val) THEN
            CONTINUE;
          END IF;
          
          -- Insert if not exists (upsert)
          INSERT INTO public.project_team_assignments (project_id, user_id, role, assigned_by)
          VALUES (NEW.project_id, user_id_val, 'contributor', COALESCE(assigner_id, user_id_val))
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
-- Update calculate_all_employee_scores to only process contributors
CREATE OR REPLACE FUNCTION public.calculate_all_employee_scores()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER := 0;
  v_user_id UUID;
BEGIN
  -- Only calculate scores for contributors
  FOR v_user_id IN 
    SELECT user_id FROM team_directory 
    WHERE status = 'active' 
      AND user_id IS NOT NULL
      AND role = 'contributor'
  LOOP
    PERFORM calculate_employee_score(v_user_id);
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$function$;

-- Create function to initialize baseline scores for all contributors
CREATE OR REPLACE FUNCTION public.initialize_contributor_scores()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER := 0;
  v_user_id UUID;
BEGIN
  -- Initialize scores for all contributors with baseline values
  FOR v_user_id IN 
    SELECT user_id FROM team_directory 
    WHERE status = 'active' 
      AND user_id IS NOT NULL
      AND role = 'contributor'
  LOOP
    -- Insert baseline score: Safety starts at 15, all others at 0
    INSERT INTO employee_scores (
      user_id, 
      experience_score, 
      performance_score, 
      reliability_score,
      skills_score, 
      safety_score, 
      total_score, 
      score_breakdown, 
      calculated_at
    ) VALUES (
      v_user_id, 
      0, 
      0, 
      0,
      0, 
      15, 
      15, 
      jsonb_build_object(
        'initialized', true,
        'initialized_at', now(),
        'note', 'Baseline score - scoring starts now'
      ), 
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      experience_score = 0,
      performance_score = 0,
      reliability_score = 0,
      skills_score = 0,
      safety_score = 15,
      total_score = 15,
      score_breakdown = jsonb_build_object(
        'initialized', true,
        'initialized_at', now(),
        'note', 'Baseline score - scoring starts now'
      ),
      calculated_at = NOW(),
      updated_at = NOW();
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$function$;
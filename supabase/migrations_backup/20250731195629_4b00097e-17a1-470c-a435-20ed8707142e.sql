-- Fix Function Search Path Mutable security warnings
-- Update all functions to set secure search_path

-- 1. Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$function$;

-- 2. Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 3. Update generate_invitation_token function
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$function$;

-- 4. Update generate_quote_number function
CREATE OR REPLACE FUNCTION public.generate_quote_number()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  next_num INTEGER;
  quote_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 'Q-(\d+)') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.quotes
  WHERE quote_number ~ '^Q-\d+$';
  
  quote_num := 'Q-' || LPAD(next_num::TEXT, 6, '0');
  RETURN quote_num;
END;
$function$;

-- 5. Update recover_missed_leads function
CREATE OR REPLACE FUNCTION public.recover_missed_leads()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  recovered_count INTEGER := 0;
  missed_lead RECORD;
  new_lead_id UUID;
BEGIN
  FOR missed_lead IN 
    SELECT DISTINCT ON (mrf_prospect_id) 
      mrf_prospect_id,
      user_message,
      assistant_response,
      interest_score,
      created_at
    FROM chat_conversations_mrf c
    WHERE c.interest_score >= 5 
      AND c.mrf_prospect_id NOT IN (SELECT DISTINCT mrf_prospect_id FROM leads WHERE mrf_prospect_id IS NOT NULL)
    ORDER BY mrf_prospect_id, interest_score DESC, created_at DESC
  LOOP
    INSERT INTO leads (
      mrf_prospect_id,
      name,
      status,
      source,
      notes,
      created_at
    ) VALUES (
      missed_lead.mrf_prospect_id,
      'Recovered Lead',
      'new',
      'lead_recovery',
      'Auto-recovered from high-interest conversation: ' || LEFT(missed_lead.user_message, 200),
      missed_lead.created_at
    ) RETURNING id INTO new_lead_id;
    
    recovered_count := recovered_count + 1;
  END LOOP;
  
  RETURN recovered_count;
END;
$function$;

-- 6. Update create_project_invitation function
CREATE OR REPLACE FUNCTION public.create_project_invitation(p_project_id uuid, p_customer_email text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  invitation_id UUID;
  invitation_token TEXT;
BEGIN
  -- Generate secure token
  invitation_token := generate_invitation_token();
  
  -- Insert invitation record
  INSERT INTO project_invitations (project_id, customer_email, invitation_token)
  VALUES (p_project_id, p_customer_email, invitation_token)
  ON CONFLICT (project_id, customer_email) 
  DO UPDATE SET 
    invitation_token = EXCLUDED.invitation_token,
    expires_at = now() + interval '7 days',
    created_at = now()
  RETURNING id INTO invitation_id;
  
  -- Update project with customer email
  UPDATE projects 
  SET customer_email = p_customer_email, 
      invitation_sent_at = now(),
      customer_access_granted = true
  WHERE id = p_project_id;
  
  RETURN invitation_id;
END;
$function$;

-- 7. Update send_project_invitation function
CREATE OR REPLACE FUNCTION public.send_project_invitation(project_id_param uuid, customer_email_param text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- This function will be called from the frontend to trigger email sending
  -- The actual email sending will be handled by an edge function
  INSERT INTO project_assignments (project_id, customer_email, assigned_by)
  VALUES (project_id_param, customer_email_param, auth.uid())
  ON CONFLICT (project_id, customer_email) DO NOTHING;
END;
$function$;

-- 8. Update get_unread_feedback_count function
CREATE OR REPLACE FUNCTION public.get_unread_feedback_count(p_project_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM customer_feedback
    WHERE project_id = p_project_id AND is_read = false
  );
END;
$function$;

-- 9. Update mark_feedback_as_read function
CREATE OR REPLACE FUNCTION public.mark_feedback_as_read(p_feedback_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE customer_feedback 
  SET is_read = true 
  WHERE id = p_feedback_id 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  );
END;
$function$;

-- 10. Update ensure_single_highlight function
CREATE OR REPLACE FUNCTION public.ensure_single_highlight()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- If setting is_highlighted_before to true, clear other highlighted before photos in the same project
    IF NEW.is_highlighted_before = true AND (OLD.is_highlighted_before IS NULL OR OLD.is_highlighted_before = false) THEN
        UPDATE public.project_photos 
        SET is_highlighted_before = false 
        WHERE project_id = NEW.project_id 
          AND id != NEW.id 
          AND is_highlighted_before = true;
    END IF;
    
    -- If setting is_highlighted_after to true, clear other highlighted after photos in the same project
    IF NEW.is_highlighted_after = true AND (OLD.is_highlighted_after IS NULL OR OLD.is_highlighted_after = false) THEN
        UPDATE public.project_photos 
        SET is_highlighted_after = false 
        WHERE project_id = NEW.project_id 
          AND id != NEW.id 
          AND is_highlighted_after = true;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Add performance indexes for frequent queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_photos_uploaded_at ON public.project_photos(uploaded_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_photos_customer_visible ON public.project_photos(is_visible_to_customer);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_customer_email ON public.projects(customer_email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_mrf_prospect ON public.leads(mrf_prospect_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_conversations_prospect ON public.chat_conversations_mrf(mrf_prospect_id);

-- Add trigger for ensure_single_highlight if not exists
DROP TRIGGER IF EXISTS ensure_single_highlight_trigger ON public.project_photos;
CREATE TRIGGER ensure_single_highlight_trigger
    BEFORE UPDATE OF is_highlighted_before, is_highlighted_after ON public.project_photos
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_single_highlight();
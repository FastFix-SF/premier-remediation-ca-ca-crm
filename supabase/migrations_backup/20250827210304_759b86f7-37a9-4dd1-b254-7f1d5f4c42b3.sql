-- Fix security issues by setting search_path for functions
CREATE OR REPLACE FUNCTION public.create_progress_on_lead_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    default_workflow_id UUID;
    lead_capture_phase_id UUID;
BEGIN
    -- Get the default workflow ID
    SELECT id INTO default_workflow_id 
    FROM crm_workflows 
    WHERE name = 'Default Roofing Workflow' AND is_active = true
    LIMIT 1;
    
    -- Get the Lead Capture phase ID
    SELECT id INTO lead_capture_phase_id
    FROM crm_workflow_phases 
    WHERE workflow_id = default_workflow_id AND name = 'Lead Capture'
    LIMIT 1;
    
    -- Create progress record if workflow and phase exist
    IF default_workflow_id IS NOT NULL AND lead_capture_phase_id IS NOT NULL THEN
        INSERT INTO crm_customer_progress (
            customer_id,
            workflow_id,
            current_phase_id,
            status,
            progress_percentage
        ) VALUES (
            NEW.id,
            default_workflow_id,
            lead_capture_phase_id,
            'active',
            10
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Fix crm_move_customer function
CREATE OR REPLACE FUNCTION public.crm_move_customer(
    p_lead_id UUID,
    p_phase_name TEXT,
    p_step_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_progress_id UUID;
    v_workflow_id UUID;
    v_target_phase_id UUID;
    v_target_step_id UUID;
    v_phase_order INTEGER;
    v_total_phases INTEGER;
    v_progress_pct INTEGER;
BEGIN
    -- Get the customer progress record
    SELECT cp.id, cp.workflow_id 
    INTO v_progress_id, v_workflow_id
    FROM crm_customer_progress cp
    WHERE cp.customer_id = p_lead_id AND cp.status = 'active'
    LIMIT 1;
    
    IF v_progress_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get target phase
    SELECT cwp.id, cwp.phase_order
    INTO v_target_phase_id, v_phase_order
    FROM crm_workflow_phases cwp
    WHERE cwp.workflow_id = v_workflow_id AND cwp.name = p_phase_name
    LIMIT 1;
    
    IF v_target_phase_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get target step if specified
    IF p_step_name IS NOT NULL THEN
        SELECT cws.id
        INTO v_target_step_id
        FROM crm_workflow_steps cws
        WHERE cws.phase_id = v_target_phase_id AND cws.name = p_step_name
        LIMIT 1;
    END IF;
    
    -- Calculate progress percentage
    SELECT COUNT(*) INTO v_total_phases
    FROM crm_workflow_phases
    WHERE workflow_id = v_workflow_id;
    
    v_progress_pct := CASE 
        WHEN v_total_phases > 0 THEN (v_phase_order * 100 / v_total_phases)
        ELSE 0
    END;
    
    -- Update customer progress
    UPDATE crm_customer_progress
    SET 
        current_phase_id = v_target_phase_id,
        current_step_id = v_target_step_id,
        progress_percentage = v_progress_pct,
        updated_at = NOW(),
        status = CASE WHEN p_phase_name = 'Close-Out' THEN 'completed' ELSE 'active' END,
        completed_at = CASE WHEN p_phase_name = 'Close-Out' THEN NOW() ELSE NULL END
    WHERE id = v_progress_id;
    
    -- Log the step history
    INSERT INTO crm_step_history (
        customer_progress_id,
        step_id,
        status,
        completed_at,
        completed_by,
        notes
    ) VALUES (
        v_progress_id,
        COALESCE(v_target_step_id, (SELECT id FROM crm_workflow_steps WHERE phase_id = v_target_phase_id ORDER BY step_order LIMIT 1)),
        'complete',
        NOW(),
        auth.uid(),
        'Moved to ' || p_phase_name || CASE WHEN p_step_name IS NOT NULL THEN ' - ' || p_step_name ELSE '' END
    );
    
    RETURN TRUE;
END;
$$;
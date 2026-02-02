-- Create skill_levels reference table with all competencies
CREATE TABLE public.skill_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level integer NOT NULL UNIQUE,
  name text NOT NULL,
  short_name text NOT NULL,
  description text NOT NULL,
  color text NOT NULL,
  can_work_alone boolean NOT NULL DEFAULT false,
  can_lead_crew boolean NOT NULL DEFAULT false,
  competencies jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert the 4 skill levels with competencies
INSERT INTO public.skill_levels (level, name, short_name, description, color, can_work_alone, can_lead_crew, competencies) VALUES
(1, 'Helper / Entry', 'Helper', 'Learner – Cannot work alone', '#9CA3AF', false, false, '[
  {"id": "follow_instructions", "category": "must_do", "text": "Follow instructions"},
  {"id": "ladder_safety", "category": "must_do", "text": "Use ladder safely"},
  {"id": "roof_access", "category": "must_do", "text": "Access roof safely"},
  {"id": "carry_materials", "category": "must_do", "text": "Carry materials"},
  {"id": "basic_tools", "category": "must_do", "text": "Use basic tools (hammer, drill, snips)"},
  {"id": "clean_jobsite", "category": "must_do", "text": "Keep job site clean"},
  {"id": "safety_ppe", "category": "must_do", "text": "Understand basic safety & PPE"},
  {"id": "assist_tearoff", "category": "may_assist", "text": "Tear-off"},
  {"id": "assist_loading", "category": "may_assist", "text": "Loading / unloading"},
  {"id": "assist_passing", "category": "may_assist", "text": "Passing materials"},
  {"id": "assist_fastening", "category": "may_assist", "text": "Basic fastening (supervised)"}
]'::jsonb),
(2, 'Roofer (Basic Skilled)', 'Roofer', 'Can work independently on standard tasks', '#22C55E', true, false, '[
  {"id": "install_shingles", "category": "must_know", "text": "Install shingles correctly"},
  {"id": "install_underlayment", "category": "must_know", "text": "Install underlayment"},
  {"id": "install_basic_flashing", "category": "must_know", "text": "Install basic flashing"},
  {"id": "nail_gun_safety", "category": "must_know", "text": "Use nail gun safely"},
  {"id": "follow_layout", "category": "must_know", "text": "Follow layout lines"},
  {"id": "identify_leaks", "category": "must_know", "text": "Identify obvious leaks"},
  {"id": "metal_handle", "category": "metal_basic", "text": "Handle panels"},
  {"id": "metal_cut", "category": "metal_basic", "text": "Cut panels"},
  {"id": "metal_fasten", "category": "metal_basic", "text": "Fasten panels correctly"},
  {"id": "metal_overlaps", "category": "metal_basic", "text": "Understand overlaps"},
  {"id": "work_alone", "category": "can_do", "text": "Work alone on assigned areas"},
  {"id": "complete_unsupervised", "category": "can_do", "text": "Complete tasks without supervision"}
]'::jsonb),
(3, 'Senior Roofer / Lead Installer', 'Senior', 'High skill – trusted execution', '#3B82F6', true, false, '[
  {"id": "diagnose_leaks", "category": "must_know", "text": "Diagnose leaks (non-obvious)"},
  {"id": "install_full_systems", "category": "must_know", "text": "Install full roofing systems"},
  {"id": "valleys_hips_ridges", "category": "must_know", "text": "Handle valleys, hips, ridges"},
  {"id": "advanced_flashing", "category": "must_know", "text": "Install advanced flashing (chimney, skylights)"},
  {"id": "read_plans", "category": "must_know", "text": "Read plans & specs"},
  {"id": "fix_mistakes", "category": "must_know", "text": "Fix others'' mistakes"},
  {"id": "metal_standing_seam", "category": "metal_advanced", "text": "Standing seam systems"},
  {"id": "metal_trim", "category": "metal_advanced", "text": "Trim details (eave, rake, ridge)"},
  {"id": "metal_expansion", "category": "metal_advanced", "text": "Expansion / contraction issues"},
  {"id": "metal_identify_bad", "category": "metal_advanced", "text": "Identify bad installs"},
  {"id": "train_others", "category": "can_do", "text": "Train Level 1–2"},
  {"id": "protect_materials", "category": "can_do", "text": "Protect materials"},
  {"id": "prevent_waste", "category": "can_do", "text": "Prevent waste"},
  {"id": "communicate_issues", "category": "can_do", "text": "Communicate issues clearly"}
]'::jsonb),
(4, 'Foreman / Crew Leader', 'Foreman', 'Leadership + technical authority', '#F59E0B', true, true, '[
  {"id": "lead_crews", "category": "must_do", "text": "Lead crews efficiently"},
  {"id": "assign_by_skill", "category": "must_do", "text": "Assign tasks by skill"},
  {"id": "enforce_safety", "category": "must_do", "text": "Enforce safety"},
  {"id": "verify_materials", "category": "must_do", "text": "Verify materials before start"},
  {"id": "ensure_punctuality", "category": "must_do", "text": "Ensure punctuality"},
  {"id": "report_daily", "category": "must_do", "text": "Report job status daily"},
  {"id": "prevent_delays", "category": "must_do", "text": "Prevent delays & mistakes"},
  {"id": "crew_performance", "category": "responsible_for", "text": "Crew performance"},
  {"id": "quality_control", "category": "responsible_for", "text": "Quality control"},
  {"id": "attendance", "category": "responsible_for", "text": "Attendance"},
  {"id": "site_cleanliness", "category": "responsible_for", "text": "Site cleanliness"},
  {"id": "communication", "category": "responsible_for", "text": "Communication with Area Manager"}
]'::jsonb);

-- Create skill_level_evaluations table
CREATE TABLE public.skill_level_evaluations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL,
  evaluator_id uuid NOT NULL,
  assigned_level integer NOT NULL REFERENCES public.skill_levels(level),
  competency_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  evaluation_notes text,
  evaluated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_current boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_skill_evaluations_employee ON public.skill_level_evaluations(employee_id);
CREATE INDEX idx_skill_evaluations_current ON public.skill_level_evaluations(employee_id, is_current) WHERE is_current = true;

-- Enable RLS
ALTER TABLE public.skill_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_level_evaluations ENABLE ROW LEVEL SECURITY;

-- Skill levels are viewable by all authenticated users
CREATE POLICY "Anyone can view skill levels"
ON public.skill_levels FOR SELECT
USING (true);

-- Admins can manage skill levels
CREATE POLICY "Admins can manage skill levels"
ON public.skill_levels FOR ALL
USING (is_admin());

-- Team members can view all evaluations
CREATE POLICY "Team members can view evaluations"
ON public.skill_level_evaluations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_directory
    WHERE team_directory.user_id = auth.uid()
    AND team_directory.status = 'active'
  )
);

-- Crew leaders and admins can insert evaluations
CREATE POLICY "Crew leaders can insert evaluations"
ON public.skill_level_evaluations FOR INSERT
WITH CHECK (
  is_admin() OR
  EXISTS (
    SELECT 1 FROM crew_memberships
    WHERE crew_memberships.user_id = auth.uid()
    AND crew_memberships.role IN ('lead', 'foreman')
  )
);

-- Crew leaders and admins can update evaluations
CREATE POLICY "Crew leaders can update evaluations"
ON public.skill_level_evaluations FOR UPDATE
USING (
  is_admin() OR
  evaluator_id = auth.uid()
);

-- Function to mark previous evaluations as not current when new one is inserted
CREATE OR REPLACE FUNCTION public.update_current_evaluation()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark all previous evaluations for this employee as not current
  UPDATE public.skill_level_evaluations
  SET is_current = false, updated_at = now()
  WHERE employee_id = NEW.employee_id
  AND id != NEW.id
  AND is_current = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update is_current flag
CREATE TRIGGER tr_update_current_evaluation
AFTER INSERT ON public.skill_level_evaluations
FOR EACH ROW
EXECUTE FUNCTION public.update_current_evaluation();
-- =====================================================
-- EMPLOYEE SCORING & LEADERBOARD SYSTEM
-- Phase 1: Database Tables (All NEW - No modifications)
-- =====================================================

-- 1. Employee Skills Table
CREATE TABLE public.employee_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  skill_name TEXT NOT NULL,
  skill_category TEXT NOT NULL DEFAULT 'general', -- 'roof_type', 'equipment', 'general', 'safety'
  proficiency_level INTEGER NOT NULL DEFAULT 1 CHECK (proficiency_level BETWEEN 1 AND 5),
  years_experience NUMERIC DEFAULT 0,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_skill UNIQUE (user_id, skill_name)
);

-- 2. Employee Certifications Table
CREATE TABLE public.employee_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  certification_name TEXT NOT NULL,
  certification_type TEXT NOT NULL DEFAULT 'trade', -- 'safety', 'manufacturer', 'trade', 'license'
  issued_date DATE,
  expiry_date DATE,
  issuing_body TEXT,
  document_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_certification UNIQUE (user_id, certification_name)
);

-- 3. Crews Table
CREATE TABLE public.crews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_name TEXT NOT NULL UNIQUE,
  crew_lead_id UUID,
  specialty TEXT, -- Primary roof type specialty
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Crew Memberships Table
CREATE TABLE public.crew_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'lead', 'senior', 'member', 'apprentice'
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_crew_member UNIQUE (crew_id, user_id)
);

-- 5. Employee Scores Table
CREATE TABLE public.employee_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  experience_score NUMERIC NOT NULL DEFAULT 0 CHECK (experience_score BETWEEN 0 AND 25),
  performance_score NUMERIC NOT NULL DEFAULT 0 CHECK (performance_score BETWEEN 0 AND 25),
  reliability_score NUMERIC NOT NULL DEFAULT 0 CHECK (reliability_score BETWEEN 0 AND 20),
  skills_score NUMERIC NOT NULL DEFAULT 0 CHECK (skills_score BETWEEN 0 AND 15),
  safety_score NUMERIC NOT NULL DEFAULT 15 CHECK (safety_score BETWEEN 0 AND 15),
  total_score NUMERIC NOT NULL DEFAULT 0 CHECK (total_score BETWEEN 0 AND 100),
  score_breakdown JSONB DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Safety Incidents Table
CREATE TABLE public.safety_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID,
  incident_date DATE NOT NULL,
  incident_type TEXT NOT NULL DEFAULT 'near_miss', -- 'near_miss', 'minor', 'reportable', 'serious'
  severity INTEGER NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  description TEXT,
  resolution TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  reported_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_skills
CREATE POLICY "Admins can manage employee skills" ON public.employee_skills
  FOR ALL USING (is_admin());

CREATE POLICY "Team members can view skills" ON public.employee_skills
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_directory WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Users can view their own skills" ON public.employee_skills
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for employee_certifications
CREATE POLICY "Admins can manage certifications" ON public.employee_certifications
  FOR ALL USING (is_admin());

CREATE POLICY "Team members can view certifications" ON public.employee_certifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_directory WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Users can view their own certifications" ON public.employee_certifications
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for crews
CREATE POLICY "Admins can manage crews" ON public.crews
  FOR ALL USING (is_admin());

CREATE POLICY "Team members can view crews" ON public.crews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_directory WHERE user_id = auth.uid() AND status = 'active')
  );

-- RLS Policies for crew_memberships
CREATE POLICY "Admins can manage crew memberships" ON public.crew_memberships
  FOR ALL USING (is_admin());

CREATE POLICY "Team members can view crew memberships" ON public.crew_memberships
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_directory WHERE user_id = auth.uid() AND status = 'active')
  );

-- RLS Policies for employee_scores
CREATE POLICY "Admins can manage employee scores" ON public.employee_scores
  FOR ALL USING (is_admin());

CREATE POLICY "Team members can view scores" ON public.employee_scores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_directory WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Users can view their own score" ON public.employee_scores
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for safety_incidents
CREATE POLICY "Admins can manage safety incidents" ON public.safety_incidents
  FOR ALL USING (is_admin());

CREATE POLICY "Team members can view safety incidents" ON public.safety_incidents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_directory WHERE user_id = auth.uid() AND status = 'active')
  );

-- =====================================================
-- Phase 2: Score Calculation Function
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_employee_score(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_experience_score NUMERIC := 0;
  v_performance_score NUMERIC := 0;
  v_reliability_score NUMERIC := 0;
  v_skills_score NUMERIC := 0;
  v_safety_score NUMERIC := 15; -- Start with perfect safety score
  v_total_score NUMERIC := 0;
  v_breakdown JSONB := '{}'::jsonb;
  v_total_hours NUMERIC;
  v_project_count INTEGER;
  v_avg_rating NUMERIC;
  v_attendance_rate NUMERIC;
  v_skills_count INTEGER;
  v_certs_count INTEGER;
  v_incident_count INTEGER;
  v_days_since_incident INTEGER;
BEGIN
  -- ===== EXPERIENCE SCORE (0-25 points) =====
  -- Based on total hours worked and projects completed
  
  -- Get total hours from time_clock
  SELECT COALESCE(SUM(total_hours), 0)
  INTO v_total_hours
  FROM time_clock
  WHERE user_id = p_user_id;
  
  -- Get project count from project_team_assignments
  SELECT COUNT(DISTINCT project_id)
  INTO v_project_count
  FROM project_team_assignments
  WHERE user_id = p_user_id;
  
  -- Calculate experience score
  -- Hours: Up to 15 points (1000+ hours = max)
  -- Projects: Up to 10 points (50+ projects = max)
  v_experience_score := LEAST(15, (v_total_hours / 1000) * 15) + 
                        LEAST(10, (v_project_count / 50.0) * 10);
  
  v_breakdown := v_breakdown || jsonb_build_object(
    'experience', jsonb_build_object(
      'total_hours', v_total_hours,
      'project_count', v_project_count,
      'hours_points', LEAST(15, (v_total_hours / 1000) * 15),
      'project_points', LEAST(10, (v_project_count / 50.0) * 10)
    )
  );

  -- ===== PERFORMANCE SCORE (0-25 points) =====
  -- Based on project ratings where employee was assigned
  
  SELECT AVG(p.customer_rating)
  INTO v_avg_rating
  FROM projects p
  JOIN project_team_assignments pta ON p.id = pta.project_id
  WHERE pta.user_id = p_user_id
    AND p.customer_rating IS NOT NULL;
  
  -- Convert 5-star rating to 25-point scale
  v_performance_score := COALESCE((v_avg_rating / 5.0) * 25, 12.5); -- Default to middle if no ratings
  
  v_breakdown := v_breakdown || jsonb_build_object(
    'performance', jsonb_build_object(
      'avg_rating', v_avg_rating,
      'rated_projects', (SELECT COUNT(*) FROM projects p 
                         JOIN project_team_assignments pta ON p.id = pta.project_id 
                         WHERE pta.user_id = p_user_id AND p.customer_rating IS NOT NULL)
    )
  );

  -- ===== RELIABILITY SCORE (0-20 points) =====
  -- Based on attendance consistency from time_clock data
  
  -- Calculate attendance rate (shifts with full clock-in/out vs expected)
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 80 -- Default for new employees
      ELSE (COUNT(CASE WHEN clock_out IS NOT NULL THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100
    END
  INTO v_attendance_rate
  FROM time_clock
  WHERE user_id = p_user_id
    AND clock_in >= NOW() - INTERVAL '90 days';
  
  -- Convert to 20-point scale (90%+ = perfect)
  v_reliability_score := LEAST(20, (v_attendance_rate / 100) * 20);
  
  v_breakdown := v_breakdown || jsonb_build_object(
    'reliability', jsonb_build_object(
      'attendance_rate', v_attendance_rate,
      'recent_shifts', (SELECT COUNT(*) FROM time_clock WHERE user_id = p_user_id AND clock_in >= NOW() - INTERVAL '90 days')
    )
  );

  -- ===== SKILLS SCORE (0-15 points) =====
  -- Based on verified skills and certifications
  
  SELECT COUNT(*)
  INTO v_skills_count
  FROM employee_skills
  WHERE user_id = p_user_id
    AND verified_at IS NOT NULL;
  
  SELECT COUNT(*)
  INTO v_certs_count
  FROM employee_certifications
  WHERE user_id = p_user_id
    AND is_active = true
    AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE);
  
  -- Skills: Up to 10 points (5+ verified skills = max)
  -- Certifications: Up to 5 points (3+ active certs = max)
  v_skills_score := LEAST(10, (v_skills_count / 5.0) * 10) + 
                    LEAST(5, (v_certs_count / 3.0) * 5);
  
  v_breakdown := v_breakdown || jsonb_build_object(
    'skills', jsonb_build_object(
      'verified_skills', v_skills_count,
      'active_certifications', v_certs_count,
      'skill_points', LEAST(10, (v_skills_count / 5.0) * 10),
      'cert_points', LEAST(5, (v_certs_count / 3.0) * 5)
    )
  );

  -- ===== SAFETY SCORE (0-15 points) =====
  -- Starts at 15, deducted based on incidents
  
  SELECT COUNT(*), 
         MIN(EXTRACT(DAY FROM NOW() - incident_date::timestamp))
  INTO v_incident_count, v_days_since_incident
  FROM safety_incidents
  WHERE user_id = p_user_id
    AND incident_date >= CURRENT_DATE - INTERVAL '1 year';
  
  -- Deduct points based on incidents: minor=-2, reportable=-5, serious=-10
  v_safety_score := 15 - LEAST(15, v_incident_count * 3); -- Simplified: 3 points per incident
  
  -- Bonus for long incident-free periods
  IF v_incident_count = 0 AND v_total_hours > 500 THEN
    v_safety_score := 15; -- Perfect safety bonus
  END IF;
  
  v_breakdown := v_breakdown || jsonb_build_object(
    'safety', jsonb_build_object(
      'incidents_last_year', v_incident_count,
      'days_since_incident', COALESCE(v_days_since_incident, 999)
    )
  );

  -- ===== CALCULATE TOTAL =====
  v_total_score := v_experience_score + v_performance_score + v_reliability_score + v_skills_score + v_safety_score;
  
  -- Ensure scores are within bounds
  v_experience_score := GREATEST(0, LEAST(25, v_experience_score));
  v_performance_score := GREATEST(0, LEAST(25, v_performance_score));
  v_reliability_score := GREATEST(0, LEAST(20, v_reliability_score));
  v_skills_score := GREATEST(0, LEAST(15, v_skills_score));
  v_safety_score := GREATEST(0, LEAST(15, v_safety_score));
  v_total_score := GREATEST(0, LEAST(100, v_total_score));

  -- ===== UPSERT SCORE RECORD =====
  INSERT INTO employee_scores (
    user_id, experience_score, performance_score, reliability_score, 
    skills_score, safety_score, total_score, score_breakdown, calculated_at
  ) VALUES (
    p_user_id, v_experience_score, v_performance_score, v_reliability_score,
    v_skills_score, v_safety_score, v_total_score, v_breakdown, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    experience_score = EXCLUDED.experience_score,
    performance_score = EXCLUDED.performance_score,
    reliability_score = EXCLUDED.reliability_score,
    skills_score = EXCLUDED.skills_score,
    safety_score = EXCLUDED.safety_score,
    total_score = EXCLUDED.total_score,
    score_breakdown = EXCLUDED.score_breakdown,
    calculated_at = NOW(),
    updated_at = NOW();

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'total_score', v_total_score,
    'experience', v_experience_score,
    'performance', v_performance_score,
    'reliability', v_reliability_score,
    'skills', v_skills_score,
    'safety', v_safety_score,
    'breakdown', v_breakdown
  );
END;
$$;

-- Create function to calculate all employee scores
CREATE OR REPLACE FUNCTION public.calculate_all_employee_scores()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER := 0;
  v_user_id UUID;
BEGIN
  FOR v_user_id IN 
    SELECT user_id FROM team_directory WHERE status = 'active' AND user_id IS NOT NULL
  LOOP
    PERFORM calculate_employee_score(v_user_id);
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- Create indexes for better query performance
CREATE INDEX idx_employee_skills_user_id ON public.employee_skills(user_id);
CREATE INDEX idx_employee_certifications_user_id ON public.employee_certifications(user_id);
CREATE INDEX idx_employee_certifications_expiry ON public.employee_certifications(expiry_date) WHERE is_active = true;
CREATE INDEX idx_crew_memberships_user_id ON public.crew_memberships(user_id);
CREATE INDEX idx_crew_memberships_crew_id ON public.crew_memberships(crew_id);
CREATE INDEX idx_employee_scores_total ON public.employee_scores(total_score DESC);
CREATE INDEX idx_safety_incidents_user_id ON public.safety_incidents(user_id);
CREATE INDEX idx_safety_incidents_date ON public.safety_incidents(incident_date DESC);

-- Add updated_at triggers
CREATE TRIGGER update_employee_skills_timestamp BEFORE UPDATE ON public.employee_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_certifications_timestamp BEFORE UPDATE ON public.employee_certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crews_timestamp BEFORE UPDATE ON public.crews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_scores_timestamp BEFORE UPDATE ON public.employee_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_incidents_timestamp BEFORE UPDATE ON public.safety_incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Edge Training Data: Store every line drawn with context
CREATE TABLE IF NOT EXISTS edge_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  -- Line geometry and classification
  line_geometry JSONB NOT NULL, -- {start: [lng, lat], end: [lng, lat], coords: [...]}
  edge_type TEXT NOT NULL, -- EAVE, RAKE, RIDGE, HIP, VALLEY, etc.
  length_ft NUMERIC,
  angle_degrees NUMERIC,
  
  -- Context for learning
  neighboring_lines JSONB, -- Array of nearby line data
  imagery_metadata JSONB, -- {source: 'nearmap', type: 'satellite', zoom: 19, etc.}
  roof_context JSONB, -- {roof_type, building_type, complexity, etc.}
  
  -- Learning metrics
  confidence_score NUMERIC DEFAULT 0, -- AI confidence if this was suggested
  was_ai_suggestion BOOLEAN DEFAULT false,
  user_accepted BOOLEAN, -- Did user accept AI suggestion?
  correction_applied BOOLEAN DEFAULT false, -- Was this a correction of AI?
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id UUID -- Group actions from same drawing session
);

-- Quote Training Sessions: Capture complete workflow
CREATE TABLE IF NOT EXISTS quote_training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  -- Session metadata
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Workflow tracking
  actions_sequence JSONB NOT NULL DEFAULT '[]'::jsonb, -- Ordered list of all actions
  total_actions INTEGER DEFAULT 0,
  undo_count INTEGER DEFAULT 0,
  redo_count INTEGER DEFAULT 0,
  
  -- Results
  total_lines_drawn INTEGER DEFAULT 0,
  total_facets_created INTEGER DEFAULT 0,
  total_measurements INTEGER DEFAULT 0,
  final_estimate NUMERIC,
  
  -- Learning data
  difficulty_rating INTEGER, -- 1-5, user can rate
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Actions Log: Granular tracking of every interaction
CREATE TABLE IF NOT EXISTS user_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quote_requests(id) ON DELETE CASCADE,
  session_id UUID REFERENCES quote_training_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  -- Action details
  action_type TEXT NOT NULL, -- 'draw_line', 'classify_edge', 'create_facet', 'measure', etc.
  action_data JSONB NOT NULL, -- Full context of the action
  
  -- Before/After state
  state_before JSONB,
  state_after JSONB,
  
  -- Timing
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  time_since_last_action_ms INTEGER,
  
  -- Context
  tool_active TEXT, -- Which tool was active
  view_state JSONB -- Map position, zoom, bearing, etc.
);

-- AI Learning Metrics: Track model performance over time
CREATE TABLE IF NOT EXISTS ai_learning_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metric tracking
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_training_samples INTEGER DEFAULT 0,
  samples_by_edge_type JSONB DEFAULT '{}'::jsonb,
  
  -- Accuracy metrics
  overall_accuracy NUMERIC,
  accuracy_by_edge_type JSONB DEFAULT '{}'::jsonb,
  
  -- Model info
  model_version TEXT,
  last_trained_at TIMESTAMPTZ,
  training_sample_count INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(metric_date)
);

-- AI Suggestions: Store predictions and track acceptance
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  session_id UUID REFERENCES quote_training_sessions(id),
  user_id UUID REFERENCES auth.users(id),
  
  -- Suggestion details
  suggestion_type TEXT NOT NULL, -- 'edge_classification', 'facet_detection', 'measurement', etc.
  suggested_data JSONB NOT NULL,
  confidence_score NUMERIC NOT NULL,
  
  -- User response
  user_action TEXT, -- 'accepted', 'rejected', 'modified', 'ignored'
  modified_data JSONB, -- If user modified the suggestion
  feedback_notes TEXT,
  
  -- Context
  context_data JSONB, -- What the AI saw when making suggestion
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_edge_training_quote ON edge_training_data(quote_id);
CREATE INDEX idx_edge_training_session ON edge_training_data(session_id);
CREATE INDEX idx_edge_training_type ON edge_training_data(edge_type);
CREATE INDEX idx_edge_training_created ON edge_training_data(created_at DESC);

CREATE INDEX idx_quote_sessions_quote ON quote_training_sessions(quote_id);
CREATE INDEX idx_quote_sessions_user ON quote_training_sessions(user_id);
CREATE INDEX idx_quote_sessions_dates ON quote_training_sessions(started_at, completed_at);

CREATE INDEX idx_actions_log_session ON user_actions_log(session_id);
CREATE INDEX idx_actions_log_quote ON user_actions_log(quote_id);
CREATE INDEX idx_actions_log_type ON user_actions_log(action_type);
CREATE INDEX idx_actions_log_timestamp ON user_actions_log(timestamp DESC);

CREATE INDEX idx_ai_suggestions_quote ON ai_suggestions(quote_id);
CREATE INDEX idx_ai_suggestions_session ON ai_suggestions(session_id);
CREATE INDEX idx_ai_suggestions_created ON ai_suggestions(created_at DESC);

-- RLS Policies
ALTER TABLE edge_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all training data
CREATE POLICY "Admins can manage edge training data" ON edge_training_data
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Admins can manage quote training sessions" ON quote_training_sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Admins can manage user actions log" ON user_actions_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Admins can manage AI metrics" ON ai_learning_metrics
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Admins can manage AI suggestions" ON ai_suggestions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

-- Users can insert their own training data
CREATE POLICY "Users can insert their own training data" ON edge_training_data
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own sessions" ON quote_training_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own actions" ON user_actions_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own suggestion responses" ON ai_suggestions
  FOR INSERT WITH CHECK (user_id = auth.uid());
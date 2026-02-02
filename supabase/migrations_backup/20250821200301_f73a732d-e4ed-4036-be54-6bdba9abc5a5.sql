-- Create analytics tables for simple built-in analytics
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'page_view', 'visit_start', etc.
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  session_id TEXT,
  visitor_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analytics_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  visitors INTEGER DEFAULT 0,
  pageviews INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,4) DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date)
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_summary ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics (admin only)
CREATE POLICY "Analytics events are viewable by admins only" 
ON public.analytics_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = auth.users.id 
    AND auth.users.email IN (
      SELECT email FROM profiles WHERE is_admin = true
    )
  )
);

CREATE POLICY "Analytics events can be inserted by anyone" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Analytics summary is viewable by admins only" 
ON public.analytics_summary 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = auth.users.id 
    AND auth.users.email IN (
      SELECT email FROM profiles WHERE is_admin = true
    )
  )
);

CREATE POLICY "Analytics summary can be managed by system" 
ON public.analytics_summary 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_date ON public.analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page ON public.analytics_events (page_path);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_date ON public.analytics_summary (date);
-- Clear fake sample analytics data and reset tables for real data collection
DELETE FROM analytics_events;

-- Reset the analytics_summary table to be empty initially
DROP TABLE IF EXISTS analytics_summary;

-- Add a tracking script setup instruction for admins
INSERT INTO app_settings (key, value, description) 
VALUES (
    'analytics_setup_required', 
    '{"status": "pending", "message": "Real visitor tracking not yet configured"}'::jsonb,
    'Indicates that real analytics tracking needs to be set up to show actual visitor data'
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    description = EXCLUDED.description;
-- Enable required extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Clean up any existing scheduled-sms-reminders jobs first
SELECT cron.unschedule(jobid) 
FROM cron.job 
WHERE jobname LIKE 'sms-reminder-%';

-- 7:00 AM PT Clock-In Reminder (Mon-Sat)
-- PT is UTC-8 (winter) or UTC-7 (summer), using UTC-8 for consistency
-- 7 AM PT = 15:00 UTC (winter) / 14:00 UTC (summer)
-- Using 15:00 UTC (3 PM UTC) for standard time
SELECT cron.schedule(
  'sms-reminder-clock-in',
  '0 15 * * 1-6',
  $$
  SELECT net.http_post(
    url := 'https://mnitzgoythqqevhtkitj.supabase.co/functions/v1/scheduled-sms-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uaXR6Z295dGhxcWV2aHRraXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxOTA5MzUsImV4cCI6MjA2NTc2NjkzNX0.Jr38d0BgEIztZfIz2ZZ4fj-r0eKhfBEjwob5WWDXG2U'
    ),
    body := jsonb_build_object('reminder_type', 'clock_in')
  ) AS request_id;
  $$
);

-- 11:00 AM PT Break Reminder (Mon-Sat)
-- 11 AM PT = 19:00 UTC (winter) / 18:00 UTC (summer)
-- Using 19:00 UTC (7 PM UTC) for standard time
SELECT cron.schedule(
  'sms-reminder-break',
  '0 19 * * 1-6',
  $$
  SELECT net.http_post(
    url := 'https://mnitzgoythqqevhtkitj.supabase.co/functions/v1/scheduled-sms-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uaXR6Z295dGhxcWV2aHRraXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxOTA5MzUsImV4cCI6MjA2NTc2NjkzNX0.Jr38d0BgEIztZfIz2ZZ4fj-r0eKhfBEjwob5WWDXG2U'
    ),
    body := jsonb_build_object('reminder_type', 'break')
  ) AS request_id;
  $$
);

-- 6:00 PM PT Timesheet Review Reminder (Mon-Sat)
-- 6 PM PT = 02:00 UTC next day (winter) / 01:00 UTC next day (summer)
-- Using 02:00 UTC (2 AM UTC) for standard time
-- Mon-Sat 6 PM PT = Tue-Sun 2 AM UTC
SELECT cron.schedule(
  'sms-reminder-timesheet',
  '0 2 * * 2-7',
  $$
  SELECT net.http_post(
    url := 'https://mnitzgoythqqevhtkitj.supabase.co/functions/v1/scheduled-sms-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uaXR6Z295dGhxcWV2aHRraXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxOTA5MzUsImV4cCI6MjA2NTc2NjkzNX0.Jr38d0BgEIztZfIz2ZZ4fj-r0eKhfBEjwob5WWDXG2U'
    ),
    body := jsonb_build_object('reminder_type', 'timesheet')
  ) AS request_id;
  $$
);
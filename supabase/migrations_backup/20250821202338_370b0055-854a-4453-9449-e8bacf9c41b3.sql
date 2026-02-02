-- Remove the analytics setup required flag to enable real analytics
DELETE FROM app_settings WHERE key = 'analytics_setup_required';
-- Add element selection data to admin_feedback table
ALTER TABLE public.admin_feedback
ADD COLUMN IF NOT EXISTS selected_element JSONB,
ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

COMMENT ON COLUMN public.admin_feedback.selected_element IS 'Stores information about the selected UI element: position, selector, text content, etc.';
COMMENT ON COLUMN public.admin_feedback.screenshot_url IS 'Optional screenshot URL showing the selected element';

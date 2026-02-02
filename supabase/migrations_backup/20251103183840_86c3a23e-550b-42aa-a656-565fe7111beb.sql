-- Add missing correction_metadata column to edge_training_data table
ALTER TABLE public.edge_training_data 
ADD COLUMN IF NOT EXISTS correction_metadata jsonb DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.edge_training_data.correction_metadata IS 'Stores detailed correction information including original prediction, confidence score, reason for correction, and user hesitation time for AI learning';

-- Add missing columns that the code expects
ALTER TABLE public.edge_training_data 
ADD COLUMN IF NOT EXISTS drawing_sequence jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS training_quality_score numeric DEFAULT 1.0;

COMMENT ON COLUMN public.edge_training_data.drawing_sequence IS 'Stores drawing workflow context like order in session, time since start, and expected next edge type';
COMMENT ON COLUMN public.edge_training_data.training_quality_score IS 'Quality score for prioritizing training examples (1.0-5.0), higher values indicate better training data';
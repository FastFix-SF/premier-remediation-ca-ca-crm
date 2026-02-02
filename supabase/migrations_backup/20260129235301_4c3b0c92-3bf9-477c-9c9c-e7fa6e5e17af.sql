-- Add unit column to proposal_pricing
ALTER TABLE proposal_pricing 
ADD COLUMN unit TEXT NOT NULL DEFAULT 'SQ FT';
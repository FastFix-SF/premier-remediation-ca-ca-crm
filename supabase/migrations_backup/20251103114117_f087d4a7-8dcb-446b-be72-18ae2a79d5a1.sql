-- Remove unwanted duplicate and test categories
DELETE FROM edge_categories 
WHERE key = 'ascasc' 
   OR (key = 'pitch_change' AND display_order > 8);
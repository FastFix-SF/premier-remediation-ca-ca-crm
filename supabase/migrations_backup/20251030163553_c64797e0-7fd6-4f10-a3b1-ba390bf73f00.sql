-- Populate material templates from the current quote's materials
-- First delete existing templates
DELETE FROM material_templates WHERE id != '00000000-0000-0000-0000-000000000000';

-- Insert the materials from the source quote as templates
INSERT INTO material_templates (category, items)
SELECT 
  'shingles',
  shingles_items
FROM quote_requests 
WHERE id = 'd38f1c58-c166-4aad-8348-ad91c4c01b44'
UNION ALL
SELECT 
  'services',
  services_items
FROM quote_requests 
WHERE id = 'd38f1c58-c166-4aad-8348-ad91c4c01b44'
UNION ALL
SELECT 
  'other-materials',
  rf_items
FROM quote_requests 
WHERE id = 'd38f1c58-c166-4aad-8348-ad91c4c01b44';

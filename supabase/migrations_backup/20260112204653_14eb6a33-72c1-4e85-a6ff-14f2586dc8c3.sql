-- Add unit_type column to inventory_items for roofing/construction materials
ALTER TABLE public.inventory_items 
ADD COLUMN unit_type text DEFAULT 'unit';

-- Add a comment to document the expected values
COMMENT ON COLUMN public.inventory_items.unit_type IS 'Unit type for inventory items: unit, box, bag, roll, bundle, pallet, gallon, bucket, tube, piece, square, linear_foot, sheet, case, pack, spool, pair, set';
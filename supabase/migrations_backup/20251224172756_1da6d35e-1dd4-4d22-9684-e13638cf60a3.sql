-- Remove the restrictive check constraint on inventory_items.category
-- This allows any category value, relying on the inventory_categories table for valid categories
ALTER TABLE public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_category_check;
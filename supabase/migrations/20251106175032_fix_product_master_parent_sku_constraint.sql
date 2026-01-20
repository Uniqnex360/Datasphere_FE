/*
  # Fix product_master parent SKU foreign key constraint

  1. Changes
    - Drop incorrect foreign key constraint on sku column
    - The constraint was incorrectly applied to sku instead of parent_sku
    - SKU should be a regular unique field, not a foreign key to product_code
    
  2. Notes
    - This allows products to have any SKU value without requiring a parent
    - If parent-child relationships are needed, they should use a separate parent_sku column
*/

-- Drop the incorrect foreign key constraint
ALTER TABLE product_master DROP CONSTRAINT IF EXISTS product_master_parent_sku_fkey;

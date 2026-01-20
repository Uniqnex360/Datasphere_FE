/*
  # Add Features 9 and 10 to Product Master

  1. Changes
    - Add features_9 column to product_master table
    - Add features_10 column to product_master table
    
  2. Notes
    - These columns extend the existing features columns (1-8)
    - Allow null values for flexibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_master' AND column_name = 'features_9'
  ) THEN
    ALTER TABLE product_master ADD COLUMN features_9 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_master' AND column_name = 'features_10'
  ) THEN
    ALTER TABLE product_master ADD COLUMN features_10 text;
  END IF;
END $$;

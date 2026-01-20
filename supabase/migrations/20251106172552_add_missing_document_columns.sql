/*
  # Add Missing Document Columns to Product Master

  1. Changes
    - Add document_1_name, document_1_url columns
    - Add document_2_name, document_2_url columns
    - Add document_3_name, document_3_url columns
    
  2. Notes
    - These columns were missing but are referenced in the import process
    - Completes the document storage for products (1-5)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_master' AND column_name = 'document_1_name'
  ) THEN
    ALTER TABLE product_master ADD COLUMN document_1_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_master' AND column_name = 'document_1_url'
  ) THEN
    ALTER TABLE product_master ADD COLUMN document_1_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_master' AND column_name = 'document_2_name'
  ) THEN
    ALTER TABLE product_master ADD COLUMN document_2_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_master' AND column_name = 'document_2_url'
  ) THEN
    ALTER TABLE product_master ADD COLUMN document_2_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_master' AND column_name = 'document_3_name'
  ) THEN
    ALTER TABLE product_master ADD COLUMN document_3_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_master' AND column_name = 'document_3_url'
  ) THEN
    ALTER TABLE product_master ADD COLUMN document_3_url text;
  END IF;
END $$;

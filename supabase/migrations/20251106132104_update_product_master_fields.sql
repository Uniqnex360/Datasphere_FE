/*
  # Update Product Master Fields

  ## Overview
  Adds additional fields and renames datasheet fields to document fields (1-5)

  ## Changes
  - Add ean field for EAN barcode
  - Add model_no field for model number
  - Rename datasheet fields to document fields (1-5)
  - Add document_4 and document_5 fields
  - Add related_product_mpn and related_product_name fields (1-5)
  - Add pairs_well_with_mpn and pairs_well_with_name fields (1-5)
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_master' AND column_name = 'ean') THEN
    ALTER TABLE product_master ADD COLUMN ean text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_master' AND column_name = 'model_no') THEN
    ALTER TABLE product_master ADD COLUMN model_no text DEFAULT '';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_master' AND column_name = 'datasheet_1_name') THEN
    ALTER TABLE product_master RENAME COLUMN datasheet_1_name TO document_1_name;
    ALTER TABLE product_master RENAME COLUMN datasheet_1_url TO document_1_url;
    ALTER TABLE product_master RENAME COLUMN datasheet_2_name TO document_2_name;
    ALTER TABLE product_master RENAME COLUMN datasheet_2_url TO document_2_url;
    ALTER TABLE product_master RENAME COLUMN datasheet_3_name TO document_3_name;
    ALTER TABLE product_master RENAME COLUMN datasheet_3_url TO document_3_url;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_master' AND column_name = 'document_4_name') THEN
    ALTER TABLE product_master ADD COLUMN document_4_name text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN document_4_url text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN document_5_name text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN document_5_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_master' AND column_name = 'related_product_1_mpn') THEN
    ALTER TABLE product_master ADD COLUMN related_product_1_mpn text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN related_product_1_name text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN related_product_2_mpn text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN related_product_2_name text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN related_product_3_mpn text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN related_product_3_name text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN related_product_4_mpn text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN related_product_4_name text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN related_product_5_mpn text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN related_product_5_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_master' AND column_name = 'pairs_well_with_1_mpn') THEN
    ALTER TABLE product_master ADD COLUMN pairs_well_with_1_mpn text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN pairs_well_with_1_name text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN pairs_well_with_2_mpn text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN pairs_well_with_2_name text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN pairs_well_with_3_mpn text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN pairs_well_with_3_name text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN pairs_well_with_4_mpn text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN pairs_well_with_4_name text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN pairs_well_with_5_mpn text DEFAULT '';
    ALTER TABLE product_master ADD COLUMN pairs_well_with_5_name text DEFAULT '';
  END IF;
END $$;
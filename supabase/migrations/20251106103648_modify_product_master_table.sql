/*
  # Modify Product Master Table

  ## Overview
  Drop and recreate the product_master table with comprehensive fields for:
  - Product identification and relationships
  - Detailed descriptions (short, long, features)
  - 40 dynamic attribute name/value/UOM sets
  - SEO metadata (meta title, description, keywords)
  - Product recommendations (related products, pairs well with)
  - 5 image name/URL pairs
  - 3 video name/URL pairs
  - 5 datasheet name/URL pairs

  ## Changes Made

  ### Fields Added:
  - Split gtin_upc into separate gtin and upc fields
  - Added unspc for classification
  - Added prod_short_desc and prod_long_desc
  - Added features_1 through features_8
  - Added attribute_name_1 through attribute_name_40
  - Added attribute_value_1 through attribute_value_40
  - Added attribute_uom_1 through attribute_uom_40
  - Added meta_title, meta_desc, meta_keywords for SEO
  - Added related_products_1 through related_products_5
  - Added pairs_well_with_1 through pairs_well_with_5
  - Added image_name_1 through image_name_5
  - Added image_url_1 through image_url_5
  - Added video_name_1 through video_name_3
  - Added video_url_1 through video_url_3
  - Added datasheet_name_1 through datasheet_name_5
  - Added datasheet_url_1 through datasheet_url_5

  ### Fields Removed:
  - Removed old image_url_2 and datasheet_url (replaced with numbered sets)
  - Removed color, material, size_dimension, power_w, price, currency (can be stored in attributes)

  ## Security
  - RLS enabled with same policies as before
  - Indexes maintained for performance
*/

-- Drop the existing product_master table and recreate with new structure
DROP TABLE IF EXISTS product_master CASCADE;

CREATE TABLE product_master (
  product_code text PRIMARY KEY,
  parent_sku text REFERENCES product_master(product_code) ON DELETE SET NULL,
  product_name text NOT NULL,
  brand_code text REFERENCES brand_master(brand_code) ON DELETE SET NULL,
  vendor_code text REFERENCES vendor_master(vendor_code) ON DELETE SET NULL,
  category_code text REFERENCES category_master(category_code) ON DELETE SET NULL,
  brand_name text DEFAULT '',
  vendor_name text DEFAULT '',
  mfg_name text DEFAULT '',
  mfg_code text DEFAULT '',
  industry_name text DEFAULT '',
  industry_code text DEFAULT '',
  category_1 text DEFAULT '',
  category_2 text DEFAULT '',
  category_3 text DEFAULT '',
  category_4 text DEFAULT '',
  category_5 text DEFAULT '',
  category_6 text DEFAULT '',
  category_7 text DEFAULT '',
  category_8 text DEFAULT '',
  product_type text DEFAULT '',
  variant_sku text DEFAULT '',
  description text DEFAULT '',
  model_series text DEFAULT '',
  mpn text DEFAULT '',
  gtin text DEFAULT '',
  upc text DEFAULT '',
  unspc text DEFAULT '',
  prod_short_desc text DEFAULT '',
  prod_long_desc text DEFAULT '',
  
  -- Features 1-8
  features_1 text DEFAULT '',
  features_2 text DEFAULT '',
  features_3 text DEFAULT '',
  features_4 text DEFAULT '',
  features_5 text DEFAULT '',
  features_6 text DEFAULT '',
  features_7 text DEFAULT '',
  features_8 text DEFAULT '',
  
  -- Attributes 1-40 (name, value, uom)
  attribute_name_1 text DEFAULT '',
  attribute_value_1 text DEFAULT '',
  attribute_uom_1 text DEFAULT '',
  attribute_name_2 text DEFAULT '',
  attribute_value_2 text DEFAULT '',
  attribute_uom_2 text DEFAULT '',
  attribute_name_3 text DEFAULT '',
  attribute_value_3 text DEFAULT '',
  attribute_uom_3 text DEFAULT '',
  attribute_name_4 text DEFAULT '',
  attribute_value_4 text DEFAULT '',
  attribute_uom_4 text DEFAULT '',
  attribute_name_5 text DEFAULT '',
  attribute_value_5 text DEFAULT '',
  attribute_uom_5 text DEFAULT '',
  attribute_name_6 text DEFAULT '',
  attribute_value_6 text DEFAULT '',
  attribute_uom_6 text DEFAULT '',
  attribute_name_7 text DEFAULT '',
  attribute_value_7 text DEFAULT '',
  attribute_uom_7 text DEFAULT '',
  attribute_name_8 text DEFAULT '',
  attribute_value_8 text DEFAULT '',
  attribute_uom_8 text DEFAULT '',
  attribute_name_9 text DEFAULT '',
  attribute_value_9 text DEFAULT '',
  attribute_uom_9 text DEFAULT '',
  attribute_name_10 text DEFAULT '',
  attribute_value_10 text DEFAULT '',
  attribute_uom_10 text DEFAULT '',
  attribute_name_11 text DEFAULT '',
  attribute_value_11 text DEFAULT '',
  attribute_uom_11 text DEFAULT '',
  attribute_name_12 text DEFAULT '',
  attribute_value_12 text DEFAULT '',
  attribute_uom_12 text DEFAULT '',
  attribute_name_13 text DEFAULT '',
  attribute_value_13 text DEFAULT '',
  attribute_uom_13 text DEFAULT '',
  attribute_name_14 text DEFAULT '',
  attribute_value_14 text DEFAULT '',
  attribute_uom_14 text DEFAULT '',
  attribute_name_15 text DEFAULT '',
  attribute_value_15 text DEFAULT '',
  attribute_uom_15 text DEFAULT '',
  attribute_name_16 text DEFAULT '',
  attribute_value_16 text DEFAULT '',
  attribute_uom_16 text DEFAULT '',
  attribute_name_17 text DEFAULT '',
  attribute_value_17 text DEFAULT '',
  attribute_uom_17 text DEFAULT '',
  attribute_name_18 text DEFAULT '',
  attribute_value_18 text DEFAULT '',
  attribute_uom_18 text DEFAULT '',
  attribute_name_19 text DEFAULT '',
  attribute_value_19 text DEFAULT '',
  attribute_uom_19 text DEFAULT '',
  attribute_name_20 text DEFAULT '',
  attribute_value_20 text DEFAULT '',
  attribute_uom_20 text DEFAULT '',
  attribute_name_21 text DEFAULT '',
  attribute_value_21 text DEFAULT '',
  attribute_uom_21 text DEFAULT '',
  attribute_name_22 text DEFAULT '',
  attribute_value_22 text DEFAULT '',
  attribute_uom_22 text DEFAULT '',
  attribute_name_23 text DEFAULT '',
  attribute_value_23 text DEFAULT '',
  attribute_uom_23 text DEFAULT '',
  attribute_name_24 text DEFAULT '',
  attribute_value_24 text DEFAULT '',
  attribute_uom_24 text DEFAULT '',
  attribute_name_25 text DEFAULT '',
  attribute_value_25 text DEFAULT '',
  attribute_uom_25 text DEFAULT '',
  attribute_name_26 text DEFAULT '',
  attribute_value_26 text DEFAULT '',
  attribute_uom_26 text DEFAULT '',
  attribute_name_27 text DEFAULT '',
  attribute_value_27 text DEFAULT '',
  attribute_uom_27 text DEFAULT '',
  attribute_name_28 text DEFAULT '',
  attribute_value_28 text DEFAULT '',
  attribute_uom_28 text DEFAULT '',
  attribute_name_29 text DEFAULT '',
  attribute_value_29 text DEFAULT '',
  attribute_uom_29 text DEFAULT '',
  attribute_name_30 text DEFAULT '',
  attribute_value_30 text DEFAULT '',
  attribute_uom_30 text DEFAULT '',
  attribute_name_31 text DEFAULT '',
  attribute_value_31 text DEFAULT '',
  attribute_uom_31 text DEFAULT '',
  attribute_name_32 text DEFAULT '',
  attribute_value_32 text DEFAULT '',
  attribute_uom_32 text DEFAULT '',
  attribute_name_33 text DEFAULT '',
  attribute_value_33 text DEFAULT '',
  attribute_uom_33 text DEFAULT '',
  attribute_name_34 text DEFAULT '',
  attribute_value_34 text DEFAULT '',
  attribute_uom_34 text DEFAULT '',
  attribute_name_35 text DEFAULT '',
  attribute_value_35 text DEFAULT '',
  attribute_uom_35 text DEFAULT '',
  attribute_name_36 text DEFAULT '',
  attribute_value_36 text DEFAULT '',
  attribute_uom_36 text DEFAULT '',
  attribute_name_37 text DEFAULT '',
  attribute_value_37 text DEFAULT '',
  attribute_uom_37 text DEFAULT '',
  attribute_name_38 text DEFAULT '',
  attribute_value_38 text DEFAULT '',
  attribute_uom_38 text DEFAULT '',
  attribute_name_39 text DEFAULT '',
  attribute_value_39 text DEFAULT '',
  attribute_uom_39 text DEFAULT '',
  attribute_name_40 text DEFAULT '',
  attribute_value_40 text DEFAULT '',
  attribute_uom_40 text DEFAULT '',
  
  -- SEO Metadata
  meta_title text DEFAULT '',
  meta_desc text DEFAULT '',
  meta_keywords text DEFAULT '',
  
  -- Related Products
  related_products_1 text DEFAULT '',
  related_products_2 text DEFAULT '',
  related_products_3 text DEFAULT '',
  related_products_4 text DEFAULT '',
  related_products_5 text DEFAULT '',
  
  -- Pairs Well With
  pairs_well_with_1 text DEFAULT '',
  pairs_well_with_2 text DEFAULT '',
  pairs_well_with_3 text DEFAULT '',
  pairs_well_with_4 text DEFAULT '',
  pairs_well_with_5 text DEFAULT '',
  
  -- Images 1-5
  image_name_1 text DEFAULT '',
  image_url_1 text DEFAULT '',
  image_name_2 text DEFAULT '',
  image_url_2 text DEFAULT '',
  image_name_3 text DEFAULT '',
  image_url_3 text DEFAULT '',
  image_name_4 text DEFAULT '',
  image_url_4 text DEFAULT '',
  image_name_5 text DEFAULT '',
  image_url_5 text DEFAULT '',
  
  -- Videos 1-3
  video_name_1 text DEFAULT '',
  video_url_1 text DEFAULT '',
  video_name_2 text DEFAULT '',
  video_url_2 text DEFAULT '',
  video_name_3 text DEFAULT '',
  video_url_3 text DEFAULT '',
  
  -- Datasheets 1-5
  datasheet_name_1 text DEFAULT '',
  datasheet_url_1 text DEFAULT '',
  datasheet_name_2 text DEFAULT '',
  datasheet_url_2 text DEFAULT '',
  datasheet_name_3 text DEFAULT '',
  datasheet_url_3 text DEFAULT '',
  datasheet_name_4 text DEFAULT '',
  datasheet_url_4 text DEFAULT '',
  datasheet_name_5 text DEFAULT '',
  datasheet_url_5 text DEFAULT '',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_master ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY IF NOT EXISTS "Allow authenticated users to view products"
  ON product_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert products"
  ON product_master FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to update products"
  ON product_master FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete products"
  ON product_master FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_master_parent_sku ON product_master(parent_sku);
CREATE INDEX IF NOT EXISTS idx_product_master_brand_code ON product_master(brand_code);
CREATE INDEX IF NOT EXISTS idx_product_master_vendor_code ON product_master(vendor_code);
CREATE INDEX IF NOT EXISTS idx_product_master_category_code ON product_master(category_code);
CREATE INDEX IF NOT EXISTS idx_product_master_industry_name ON product_master(industry_name);
CREATE INDEX IF NOT EXISTS idx_product_master_gtin ON product_master(gtin);
CREATE INDEX IF NOT EXISTS idx_product_master_upc ON product_master(upc);
CREATE INDEX IF NOT EXISTS idx_product_master_mpn ON product_master(mpn);
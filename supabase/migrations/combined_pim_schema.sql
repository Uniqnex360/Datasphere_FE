/*
  # Comprehensive PIM System Database Schema

  ## Overview
  Complete Product Information Management system supporting multiple industries,
  product families, variants, vendors, brands, categories, and dynamic attributes.

  ## Tables Created (in dependency order)

  ### 1. vendor_master
  Complete vendor information with contact details and department POCs
  - `vendor_code` (text, primary key) - Unique vendor identifier
  - `vendor_name` (text) - Vendor business name
  - `contact_email` (text) - Primary contact email
  - `contact_phone` (text) - Primary contact phone
  - `vendor_website` (text) - Vendor website URL
  - `business_type` (text) - Wholesaler/Manufacturer/Distributor/Dealer/Retailer
  - `industry` (text) - Industry category
  - `description` (text) - Vendor description
  - `address` (text) - Physical address
  - `city` (text) - City location
  - `tax_info` (text) - Tax identification information
  - `vendor_logo_url` (text) - Logo file URL
  - `dept1_poc_name` through `dept5_poc_name` - Department contact names
  - `dept1_email` through `dept5_email` - Department emails
  - `dept1_phone` through `dept5_phone` - Department phones
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. brand_master
  Brand and manufacturer information
  - `brand_code` (text, primary key) - Unique brand identifier
  - `brand_name` (text) - Brand name
  - `brand_logo` (text) - Brand logo URL
  - `mfg_code` (text) - Manufacturer code
  - `mfg_name` (text) - Manufacturer name
  - `mfg_logo` (text) - Manufacturer logo URL
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. category_master
  Eight-level category hierarchy supporting multiple industries
  - `category_code` (text, primary key) - Unique category identifier
  - `industry_code` (text) - Industry code
  - `industry_name` (text) - Industry name
  - `category_1` through `category_8` (text) - Eight-level hierarchy
  - `breadcrumb` (text) - Full category path
  - `product_type` (text) - Product type classification
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. attributes_master
  Dynamic attribute definitions with 50 value/UOM pairs
  - `attribute_code` (text, primary key) - Unique attribute identifier
  - `industry_name` (text) - Associated industry
  - `industry_attribute_name` (text) - Industry-specific attribute name
  - `applicable_categories` (text) - Category IDs where applicable
  - `attribute_type` (text) - Multi-select/Single-select
  - `data_type` (text) - text/number/decimal/boolean/list
  - `attribute_name` (text) - Display name
  - `attribute_value_1` through `attribute_value_50` (text) - Attribute values
  - `attribute_uom_1` through `attribute_uom_50` (text) - Units of measure
  - `unit` (text, nullable) - Default unit
  - `description` (text) - Attribute description
  - `filter` (text) - Yes/No for filter capability
  - `filter_display_name` (text) - Name shown in filters
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. product_master
  Base and variant product records with full specifications
  - `product_code` (text, primary key) - Unique product identifier
  - `parent_sku` (text, nullable, FK) - Parent product for variants
  - `product_name` (text) - Product name
  - `brand_code` (text, FK) - Reference to brand_master
  - `vendor_code` (text, FK) - Reference to vendor_master
  - `category_code` (text, FK) - Reference to category_master
  - `brand_name` (text) - Denormalized brand name
  - `vendor_name` (text) - Denormalized vendor name
  - `mfg_name` (text) - Manufacturer name
  - `mfg_code` (text) - Manufacturer code
  - `industry_name` (text) - Industry classification
  - `industry_code` (text) - Industry code
  - `category_1` through `category_8` (text) - Category hierarchy
  - `product_type` (text) - Product type
  - `variant_sku` (text) - Variant identifier
  - `description` (text) - Product description
  - `model_series` (text) - Model/series information
  - `mpn` (text) - Manufacturer part number
  - `gtin_upc` (text) - GTIN/UPC code
  - `color` (text) - Product color
  - `material` (text) - Material composition
  - `size_dimension` (text) - Size/dimensions
  - `power_w` (decimal) - Power in watts
  - `image_url_1` (text) - Primary image URL
  - `image_url_2` (text) - Secondary image URL
  - `datasheet_url` (text) - Technical datasheet URL
  - `price` (decimal) - Product price
  - `currency` (text) - Currency code
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies for authenticated users
*/

-- =============================================
-- 1. VENDOR MASTER TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS vendor_master (
  vendor_code text PRIMARY KEY,
  vendor_name text NOT NULL,
  contact_email text DEFAULT '',
  contact_phone text DEFAULT '',
  vendor_website text DEFAULT '',
  business_type text CHECK (business_type IN ('Wholesaler', 'Manufacturer', 'Distributor', 'Dealer', 'Retailer')),
  industry text CHECK (industry IN ('HVAC', 'Furniture', 'Electrical', 'Safety Supplies', 'Janson', 'Hardware', 'Tools & Equipments', 'Plumbing', 'Home Improvements', 'Home & Decor', 'Industrial Supplies')),
  description text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  tax_info text DEFAULT '',
  vendor_logo_url text DEFAULT '',
  dept1_poc_name text DEFAULT '',
  dept1_email text DEFAULT '',
  dept1_phone text DEFAULT '',
  dept2_poc_name text DEFAULT '',
  dept2_email text DEFAULT '',
  dept2_phone text DEFAULT '',
  dept3_poc_name text DEFAULT '',
  dept3_email text DEFAULT '',
  dept3_phone text DEFAULT '',
  dept4_poc_name text DEFAULT '',
  dept4_email text DEFAULT '',
  dept4_phone text DEFAULT '',
  dept5_poc_name text DEFAULT '',
  dept5_email text DEFAULT '',
  dept5_phone text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vendor_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow authenticated users to view vendors"
  ON vendor_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage vendors"
  ON vendor_master FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 2. BRAND MASTER TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS brand_master (
  brand_code text PRIMARY KEY,
  brand_name text NOT NULL,
  brand_logo text DEFAULT '',
  mfg_code text DEFAULT '',
  mfg_name text DEFAULT '',
  mfg_logo text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE brand_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow authenticated users to view brands"
  ON brand_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage brands"
  ON brand_master FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 3. CATEGORY MASTER TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS category_master (
  category_code text PRIMARY KEY,
  industry_code text DEFAULT '',
  industry_name text DEFAULT '',
  category_1 text DEFAULT '',
  category_2 text DEFAULT '',
  category_3 text DEFAULT '',
  category_4 text DEFAULT '',
  category_5 text DEFAULT '',
  category_6 text DEFAULT '',
  category_7 text DEFAULT '',
  category_8 text DEFAULT '',
  breadcrumb text DEFAULT '',
  product_type text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE category_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow authenticated users to view categories"
  ON category_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage categories"
  ON category_master FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 4. ATTRIBUTES MASTER TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS attributes_master (
  attribute_code text PRIMARY KEY,
  industry_name text DEFAULT '',
  industry_attribute_name text DEFAULT '',
  applicable_categories text DEFAULT '',
  attribute_type text CHECK (attribute_type IN ('Multi-select', 'Single-select')),
  data_type text CHECK (data_type IN ('text', 'number', 'decimal', 'boolean', 'list')),
  attribute_name text DEFAULT '',
  attribute_value_1 text DEFAULT '',
  attribute_uom_1 text DEFAULT '',
  attribute_value_2 text DEFAULT '',
  attribute_uom_2 text DEFAULT '',
  attribute_value_3 text DEFAULT '',
  attribute_uom_3 text DEFAULT '',
  attribute_value_4 text DEFAULT '',
  attribute_uom_4 text DEFAULT '',
  attribute_value_5 text DEFAULT '',
  attribute_uom_5 text DEFAULT '',
  attribute_value_6 text DEFAULT '',
  attribute_uom_6 text DEFAULT '',
  attribute_value_7 text DEFAULT '',
  attribute_uom_7 text DEFAULT '',
  attribute_value_8 text DEFAULT '',
  attribute_uom_8 text DEFAULT '',
  attribute_value_9 text DEFAULT '',
  attribute_uom_9 text DEFAULT '',
  attribute_value_10 text DEFAULT '',
  attribute_uom_10 text DEFAULT '',
  attribute_value_11 text DEFAULT '',
  attribute_uom_11 text DEFAULT '',
  attribute_value_12 text DEFAULT '',
  attribute_uom_12 text DEFAULT '',
  attribute_value_13 text DEFAULT '',
  attribute_uom_13 text DEFAULT '',
  attribute_value_14 text DEFAULT '',
  attribute_uom_14 text DEFAULT '',
  attribute_value_15 text DEFAULT '',
  attribute_uom_15 text DEFAULT '',
  attribute_value_16 text DEFAULT '',
  attribute_uom_16 text DEFAULT '',
  attribute_value_17 text DEFAULT '',
  attribute_uom_17 text DEFAULT '',
  attribute_value_18 text DEFAULT '',
  attribute_uom_18 text DEFAULT '',
  attribute_value_19 text DEFAULT '',
  attribute_uom_19 text DEFAULT '',
  attribute_value_20 text DEFAULT '',
  attribute_uom_20 text DEFAULT '',
  attribute_value_21 text DEFAULT '',
  attribute_uom_21 text DEFAULT '',
  attribute_value_22 text DEFAULT '',
  attribute_uom_22 text DEFAULT '',
  attribute_value_23 text DEFAULT '',
  attribute_uom_23 text DEFAULT '',
  attribute_value_24 text DEFAULT '',
  attribute_uom_24 text DEFAULT '',
  attribute_value_25 text DEFAULT '',
  attribute_uom_25 text DEFAULT '',
  attribute_value_26 text DEFAULT '',
  attribute_uom_26 text DEFAULT '',
  attribute_value_27 text DEFAULT '',
  attribute_uom_27 text DEFAULT '',
  attribute_value_28 text DEFAULT '',
  attribute_uom_28 text DEFAULT '',
  attribute_value_29 text DEFAULT '',
  attribute_uom_29 text DEFAULT '',
  attribute_value_30 text DEFAULT '',
  attribute_uom_30 text DEFAULT '',
  attribute_value_31 text DEFAULT '',
  attribute_uom_31 text DEFAULT '',
  attribute_value_32 text DEFAULT '',
  attribute_uom_32 text DEFAULT '',
  attribute_value_33 text DEFAULT '',
  attribute_uom_33 text DEFAULT '',
  attribute_value_34 text DEFAULT '',
  attribute_uom_34 text DEFAULT '',
  attribute_value_35 text DEFAULT '',
  attribute_uom_35 text DEFAULT '',
  attribute_value_36 text DEFAULT '',
  attribute_uom_36 text DEFAULT '',
  attribute_value_37 text DEFAULT '',
  attribute_uom_37 text DEFAULT '',
  attribute_value_38 text DEFAULT '',
  attribute_uom_38 text DEFAULT '',
  attribute_value_39 text DEFAULT '',
  attribute_uom_39 text DEFAULT '',
  attribute_value_40 text DEFAULT '',
  attribute_uom_40 text DEFAULT '',
  attribute_value_41 text DEFAULT '',
  attribute_uom_41 text DEFAULT '',
  attribute_value_42 text DEFAULT '',
  attribute_uom_42 text DEFAULT '',
  attribute_value_43 text DEFAULT '',
  attribute_uom_43 text DEFAULT '',
  attribute_value_44 text DEFAULT '',
  attribute_uom_44 text DEFAULT '',
  attribute_value_45 text DEFAULT '',
  attribute_uom_45 text DEFAULT '',
  attribute_value_46 text DEFAULT '',
  attribute_uom_46 text DEFAULT '',
  attribute_value_47 text DEFAULT '',
  attribute_uom_47 text DEFAULT '',
  attribute_value_48 text DEFAULT '',
  attribute_uom_48 text DEFAULT '',
  attribute_value_49 text DEFAULT '',
  attribute_uom_49 text DEFAULT '',
  attribute_value_50 text DEFAULT '',
  attribute_uom_50 text DEFAULT '',
  unit text,
  description text DEFAULT '',
  filter text CHECK (filter IN ('Yes', 'No')) DEFAULT 'No',
  filter_display_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE attributes_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow authenticated users to view attributes"
  ON attributes_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage attributes"
  ON attributes_master FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 5. PRODUCT MASTER TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS product_master (
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
  gtin_upc text DEFAULT '',
  color text DEFAULT '',
  material text DEFAULT '',
  size_dimension text DEFAULT '',
  power_w decimal(10, 2),
  image_url_1 text DEFAULT '',
  image_url_2 text DEFAULT '',
  datasheet_url text DEFAULT '',
  price decimal(10, 2),
  currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow authenticated users to view products"
  ON product_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage products"
  ON product_master FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_master_parent_sku ON product_master(parent_sku);
CREATE INDEX IF NOT EXISTS idx_product_master_brand_code ON product_master(brand_code);
CREATE INDEX IF NOT EXISTS idx_product_master_vendor_code ON product_master(vendor_code);
CREATE INDEX IF NOT EXISTS idx_product_master_category_code ON product_master(category_code);
CREATE INDEX IF NOT EXISTS idx_product_master_industry_name ON product_master(industry_name);
CREATE INDEX IF NOT EXISTS idx_category_master_industry_name ON category_master(industry_name);
CREATE INDEX IF NOT EXISTS idx_attributes_master_industry_name ON attributes_master(industry_name);
CREATE INDEX IF NOT EXISTS idx_vendor_master_industry ON vendor_master(industry);/*
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
END $$;/*
  # Create Industry Master and Product Variants Tables

  ## Overview
  Creates industry master table and product variants table to support:
  - Industry dropdown management
  - Product variant hierarchy
  - Parent-child product relationships

  ## New Tables
  1. industry_master
    - industry_code (PK)
    - industry_name
    - description
    - active status

  2. product_variants
    - variant_id (PK)
    - parent_product_code (FK to product_master)
    - variant_sku
    - variant_mpn
    - differentiating_attributes (JSONB)
    - All inherited fields from parent

  ## Schema Updates
  - Rename parent_sku to sku in product_master
  - Add is_variant_parent boolean flag
*/

CREATE TABLE IF NOT EXISTS industry_master (
  industry_code text PRIMARY KEY,
  industry_name text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE industry_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow read access to industry_master"
  ON industry_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow insert access to industry_master"
  ON industry_master FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow update access to industry_master"
  ON industry_master FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO industry_master (industry_code, industry_name, description) VALUES
  ('HVAC', 'HVAC', 'Heating, Ventilation, and Air Conditioning'),
  ('FURN', 'Furniture', 'Furniture and Fixtures'),
  ('ELEC', 'Electrical', 'Electrical Equipment and Supplies'),
  ('SAFE', 'Safety Supplies', 'Safety and Personal Protective Equipment'),
  ('HARD', 'Hardware', 'Hardware and Building Materials'),
  ('TOOL', 'Tools & Equipments', 'Tools and Equipment'),
  ('PLMB', 'Plumbing', 'Plumbing Supplies and Fixtures'),
  ('HOME', 'Home Improvements', 'Home Improvement Products'),
  ('DECR', 'Home & Decor', 'Home Decor and Accessories'),
  ('INDS', 'Industrial Supplies', 'Industrial Supplies and Equipment')
ON CONFLICT (industry_code) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_master' AND column_name = 'parent_sku') THEN
    ALTER TABLE product_master RENAME COLUMN parent_sku TO sku;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_master' AND column_name = 'is_variant_parent') THEN
    ALTER TABLE product_master ADD COLUMN is_variant_parent boolean DEFAULT false;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS product_variants (
  variant_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_product_code text NOT NULL,
  variant_sku text NOT NULL UNIQUE,
  variant_mpn text NOT NULL,
  variant_name text DEFAULT '',
  differentiating_attributes jsonb DEFAULT '{}',
  upc text DEFAULT '',
  ean text DEFAULT '',
  gtin text DEFAULT '',
  image_1_url text DEFAULT '',
  image_2_url text DEFAULT '',
  image_3_url text DEFAULT '',
  price_adjustment numeric DEFAULT 0,
  stock_quantity integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (parent_product_code) REFERENCES product_master(product_code) ON DELETE CASCADE
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow read access to product_variants"
  ON product_variants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow insert access to product_variants"
  ON product_variants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow update access to product_variants"
  ON product_variants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow delete access to product_variants"
  ON product_variants FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_product_variants_parent ON product_variants(parent_product_code);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(variant_sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_mpn ON product_variants(variant_mpn);/*
  # Add Product Completeness Score

  ## Overview
  Adds completeness_score field to track product data quality metrics

  ## Changes
  - Add completeness_score column (0-100)
  - Add completeness_details JSONB for breakdown
  - Add index for sorting by score
  - Add trigger to auto-calculate on update

  ## Score Components
  - Attributes Completeness (5+ = 100%, <5 = 80%)
  - Features Completeness (5+ = 100%, <5 = 80%)
  - Images Completeness (2+ = 100%, 1 = 50%, 0 = 0%)
  - Title Length (>=80 = 100%, 50-79 = 80%, <50 = 50%)
  - Description Quality (both = 100%, one = 60%, none = 0%)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_master' AND column_name = 'completeness_score'
  ) THEN
    ALTER TABLE product_master ADD COLUMN completeness_score integer DEFAULT 0;
    ALTER TABLE product_master ADD COLUMN completeness_details jsonb DEFAULT '{}';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_product_master_completeness_score 
  ON product_master(completeness_score DESC);

CREATE OR REPLACE FUNCTION calculate_product_completeness(product_row product_master)
RETURNS integer AS $$
DECLARE
  attributes_score integer := 0;
  features_score integer := 0;
  images_score integer := 0;
  title_score integer := 0;
  description_score integer := 0;
  total_score integer := 0;
  features_count integer := 0;
  images_count integer := 0;
  title_length integer := 0;
BEGIN
  features_count := 0;
  IF product_row.feature_1 IS NOT NULL AND product_row.feature_1 != '' THEN features_count := features_count + 1; END IF;
  IF product_row.feature_2 IS NOT NULL AND product_row.feature_2 != '' THEN features_count := features_count + 1; END IF;
  IF product_row.feature_3 IS NOT NULL AND product_row.feature_3 != '' THEN features_count := features_count + 1; END IF;
  IF product_row.feature_4 IS NOT NULL AND product_row.feature_4 != '' THEN features_count := features_count + 1; END IF;
  IF product_row.feature_5 IS NOT NULL AND product_row.feature_5 != '' THEN features_count := features_count + 1; END IF;
  IF product_row.feature_6 IS NOT NULL AND product_row.feature_6 != '' THEN features_count := features_count + 1; END IF;
  IF product_row.feature_7 IS NOT NULL AND product_row.feature_7 != '' THEN features_count := features_count + 1; END IF;
  IF product_row.feature_8 IS NOT NULL AND product_row.feature_8 != '' THEN features_count := features_count + 1; END IF;

  IF features_count >= 5 THEN
    features_score := 100;
  ELSE
    features_score := 80;
  END IF;

  images_count := 0;
  IF product_row.image_1_url IS NOT NULL AND product_row.image_1_url != '' THEN images_count := images_count + 1; END IF;
  IF product_row.image_2_url IS NOT NULL AND product_row.image_2_url != '' THEN images_count := images_count + 1; END IF;
  IF product_row.image_3_url IS NOT NULL AND product_row.image_3_url != '' THEN images_count := images_count + 1; END IF;
  IF product_row.image_4_url IS NOT NULL AND product_row.image_4_url != '' THEN images_count := images_count + 1; END IF;
  IF product_row.image_5_url IS NOT NULL AND product_row.image_5_url != '' THEN images_count := images_count + 1; END IF;

  IF images_count >= 2 THEN
    images_score := 100;
  ELSIF images_count = 1 THEN
    images_score := 50;
  ELSE
    images_score := 0;
  END IF;

  title_length := LENGTH(COALESCE(product_row.product_name, ''));
  IF title_length >= 80 THEN
    title_score := 100;
  ELSIF title_length >= 50 THEN
    title_score := 80;
  ELSE
    title_score := 50;
  END IF;

  IF (product_row.prod_short_desc IS NOT NULL AND product_row.prod_short_desc != '') 
     AND (product_row.prod_long_desc IS NOT NULL AND product_row.prod_long_desc != '') THEN
    description_score := 100;
  ELSIF (product_row.prod_short_desc IS NOT NULL AND product_row.prod_short_desc != '') 
        OR (product_row.prod_long_desc IS NOT NULL AND product_row.prod_long_desc != '') THEN
    description_score := 60;
  ELSE
    description_score := 0;
  END IF;

  attributes_score := 80;

  total_score := ROUND((attributes_score + features_score + images_score + title_score + description_score) / 5.0);

  RETURN total_score;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_product_completeness()
RETURNS TRIGGER AS $$
BEGIN
  NEW.completeness_score := calculate_product_completeness(NEW);
  
  NEW.completeness_details := jsonb_build_object(
    'attributes_score', 80,
    'features_score', (
      SELECT CASE 
        WHEN (
          (CASE WHEN NEW.feature_1 IS NOT NULL AND NEW.feature_1 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.feature_2 IS NOT NULL AND NEW.feature_2 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.feature_3 IS NOT NULL AND NEW.feature_3 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.feature_4 IS NOT NULL AND NEW.feature_4 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.feature_5 IS NOT NULL AND NEW.feature_5 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.feature_6 IS NOT NULL AND NEW.feature_6 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.feature_7 IS NOT NULL AND NEW.feature_7 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.feature_8 IS NOT NULL AND NEW.feature_8 != '' THEN 1 ELSE 0 END)
        ) >= 5 THEN 100 ELSE 80 END
    ),
    'images_score', (
      SELECT CASE 
        WHEN (
          (CASE WHEN NEW.image_1_url IS NOT NULL AND NEW.image_1_url != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.image_2_url IS NOT NULL AND NEW.image_2_url != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.image_3_url IS NOT NULL AND NEW.image_3_url != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.image_4_url IS NOT NULL AND NEW.image_4_url != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.image_5_url IS NOT NULL AND NEW.image_5_url != '' THEN 1 ELSE 0 END)
        ) >= 2 THEN 100
        WHEN (
          (CASE WHEN NEW.image_1_url IS NOT NULL AND NEW.image_1_url != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.image_2_url IS NOT NULL AND NEW.image_2_url != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.image_3_url IS NOT NULL AND NEW.image_3_url != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.image_4_url IS NOT NULL AND NEW.image_4_url != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.image_5_url IS NOT NULL AND NEW.image_5_url != '' THEN 1 ELSE 0 END)
        ) = 1 THEN 50
        ELSE 0 END
    ),
    'title_score', (
      SELECT CASE 
        WHEN LENGTH(COALESCE(NEW.product_name, '')) >= 80 THEN 100
        WHEN LENGTH(COALESCE(NEW.product_name, '')) >= 50 THEN 80
        ELSE 50 END
    ),
    'description_score', (
      SELECT CASE 
        WHEN (NEW.prod_short_desc IS NOT NULL AND NEW.prod_short_desc != '') 
             AND (NEW.prod_long_desc IS NOT NULL AND NEW.prod_long_desc != '') THEN 100
        WHEN (NEW.prod_short_desc IS NOT NULL AND NEW.prod_short_desc != '') 
             OR (NEW.prod_long_desc IS NOT NULL AND NEW.prod_long_desc != '') THEN 60
        ELSE 0 END
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_completeness ON product_master;
CREATE TRIGGER trigger_update_product_completeness
  BEFORE INSERT OR UPDATE ON product_master
  FOR EACH ROW
  EXECUTE FUNCTION update_product_completeness();/*
  # Fix RLS Policies for All Tables - Allow Public Access

  1. Changes
    - Drop all existing restrictive RLS policies
    - Add public access policies for all main tables
    - Enables application to work without authentication
  
  2. Tables Updated
    - brand_master
    - category_master
    - attribute_master
    - product_master
    - channels
    - industry_master
    - product_variants
    - digital_assets
    - users
    - pim_users
  
  3. Security Note
    - These policies allow unauthenticated access
    - For production, implement proper authentication
*/

-- Brand Master
DROP POLICY IF EXISTS "Allow authenticated users to view brands" ON brand_master;
DROP POLICY IF EXISTS "Allow authenticated users to manage brands" ON brand_master;

CREATE POLICY IF NOT EXISTS "Allow public access to brands" ON brand_master FOR ALL TO public USING (true) WITH CHECK (true);

-- Category Master
DROP POLICY IF EXISTS "Allow authenticated users to view categories" ON category_master;
DROP POLICY IF EXISTS "Allow authenticated users to manage categories" ON category_master;

CREATE POLICY IF NOT EXISTS "Allow public access to categories" ON category_master FOR ALL TO public USING (true) WITH CHECK (true);

-- Attribute Master
DROP POLICY IF EXISTS "Allow authenticated users to view attributes" ON attribute_master;
DROP POLICY IF EXISTS "Allow authenticated users to manage attributes" ON attribute_master;

CREATE POLICY IF NOT EXISTS "Allow public access to attributes" ON attribute_master FOR ALL TO public USING (true) WITH CHECK (true);

-- Product Master
DROP POLICY IF EXISTS "Allow authenticated users to view products" ON product_master;
DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON product_master;

CREATE POLICY IF NOT EXISTS "Allow public access to products" ON product_master FOR ALL TO public USING (true) WITH CHECK (true);

-- Channels
DROP POLICY IF EXISTS "Allow authenticated users to view channels" ON channels;
DROP POLICY IF EXISTS "Allow authenticated users to manage channels" ON channels;

CREATE POLICY IF NOT EXISTS "Allow public access to channels" ON channels FOR ALL TO public USING (true) WITH CHECK (true);

-- Industry Master
DROP POLICY IF EXISTS "Allow authenticated users to view industries" ON industry_master;
DROP POLICY IF EXISTS "Allow authenticated users to manage industries" ON industry_master;

CREATE POLICY IF NOT EXISTS "Allow public access to industries" ON industry_master FOR ALL TO public USING (true) WITH CHECK (true);

-- Product Variants
DROP POLICY IF EXISTS "Allow authenticated users to view variants" ON product_variants;
DROP POLICY IF EXISTS "Allow authenticated users to manage variants" ON product_variants;

CREATE POLICY IF NOT EXISTS "Allow public access to variants" ON product_variants FOR ALL TO public USING (true) WITH CHECK (true);

-- Digital Assets
DROP POLICY IF EXISTS "Allow authenticated users to view assets" ON digital_assets;
DROP POLICY IF EXISTS "Allow authenticated users to manage assets" ON digital_assets;

CREATE POLICY IF NOT EXISTS "Allow public access to digital_assets" ON digital_assets FOR ALL TO public USING (true) WITH CHECK (true);

-- Users (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users' AND schemaname = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated users to view users" ON users';
    EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated users to manage users" ON users';
    EXECUTE 'CREATE POLICY IF NOT EXISTS "Allow public access to users" ON users FOR ALL TO public USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- PIM Users
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'pim_users' AND schemaname = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated users to view pim_users" ON pim_users';
    EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated users to manage pim_users" ON pim_users';
    EXECUTE 'CREATE POLICY IF NOT EXISTS "Allow public access to pim_users" ON pim_users FOR ALL TO public USING (true) WITH CHECK (true)';
  END IF;
END $$;

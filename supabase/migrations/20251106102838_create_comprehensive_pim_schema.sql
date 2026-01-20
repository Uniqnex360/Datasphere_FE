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
CREATE INDEX IF NOT EXISTS idx_vendor_master_industry ON vendor_master(industry);
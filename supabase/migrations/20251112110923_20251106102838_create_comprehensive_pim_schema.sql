-- This migration creates the core PIM tables
-- Applying the comprehensive PIM schema

-- 1. VENDOR MASTER TABLE
CREATE TABLE IF NOT EXISTS vendor_master (
  vendor_code text PRIMARY KEY,
  vendor_name text NOT NULL,
  contact_email text DEFAULT '',
  contact_phone text DEFAULT '',
  vendor_website text DEFAULT '',
  business_type text,
  industry text,
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
CREATE POLICY IF NOT EXISTS "Allow public access to vendors" ON vendor_master FOR ALL TO public USING (true) WITH CHECK (true);

-- 2. BRAND MASTER TABLE
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
CREATE POLICY IF NOT EXISTS "Allow public access to brands" ON brand_master FOR ALL TO public USING (true) WITH CHECK (true);

-- 3. CATEGORY MASTER TABLE
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
CREATE POLICY IF NOT EXISTS "Allow public access to categories" ON category_master FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. INDUSTRY MASTER TABLE
CREATE TABLE IF NOT EXISTS industry_master (
  industry_code text PRIMARY KEY,
  industry_name text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE industry_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow public access to industries" ON industry_master FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. PRODUCT MASTER TABLE
CREATE TABLE IF NOT EXISTS product_master (
  product_code text PRIMARY KEY,
  sku text,
  parent_sku text,
  product_name text NOT NULL,
  brand_code text,
  brand_name text DEFAULT '',
  vendor_code text,
  vendor_name text DEFAULT '',
  category_code text,
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
  prod_short_desc text DEFAULT '',
  prod_long_desc text DEFAULT '',
  model_series text DEFAULT '',
  mpn text DEFAULT '',
  gtin_upc text DEFAULT '',
  color text DEFAULT '',
  material text DEFAULT '',
  size_dimension text DEFAULT '',
  power_w decimal(10, 2),
  image_url_1 text DEFAULT '',
  image_url_2 text DEFAULT '',
  image_url_3 text DEFAULT '',
  image_url_4 text DEFAULT '',
  image_url_5 text DEFAULT '',
  datasheet_url text DEFAULT '',
  price decimal(10, 2),
  currency text DEFAULT 'USD',
  completeness_score integer DEFAULT 0,
  attribute_name_1 text DEFAULT '', attribute_value_1 text DEFAULT '',
  attribute_name_2 text DEFAULT '', attribute_value_2 text DEFAULT '',
  attribute_name_3 text DEFAULT '', attribute_value_3 text DEFAULT '',
  attribute_name_4 text DEFAULT '', attribute_value_4 text DEFAULT '',
  attribute_name_5 text DEFAULT '', attribute_value_5 text DEFAULT '',
  attribute_name_6 text DEFAULT '', attribute_value_6 text DEFAULT '',
  attribute_name_7 text DEFAULT '', attribute_value_7 text DEFAULT '',
  attribute_name_8 text DEFAULT '', attribute_value_8 text DEFAULT '',
  attribute_name_9 text DEFAULT '', attribute_value_9 text DEFAULT '',
  attribute_name_10 text DEFAULT '', attribute_value_10 text DEFAULT '',
  attribute_name_11 text DEFAULT '', attribute_value_11 text DEFAULT '',
  attribute_name_12 text DEFAULT '', attribute_value_12 text DEFAULT '',
  attribute_name_13 text DEFAULT '', attribute_value_13 text DEFAULT '',
  attribute_name_14 text DEFAULT '', attribute_value_14 text DEFAULT '',
  attribute_name_15 text DEFAULT '', attribute_value_15 text DEFAULT '',
  attribute_name_16 text DEFAULT '', attribute_value_16 text DEFAULT '',
  attribute_name_17 text DEFAULT '', attribute_value_17 text DEFAULT '',
  attribute_name_18 text DEFAULT '', attribute_value_18 text DEFAULT '',
  attribute_name_19 text DEFAULT '', attribute_value_19 text DEFAULT '',
  attribute_name_20 text DEFAULT '', attribute_value_20 text DEFAULT '',
  attribute_name_21 text DEFAULT '', attribute_value_21 text DEFAULT '',
  attribute_name_22 text DEFAULT '', attribute_value_22 text DEFAULT '',
  attribute_name_23 text DEFAULT '', attribute_value_23 text DEFAULT '',
  attribute_name_24 text DEFAULT '', attribute_value_24 text DEFAULT '',
  attribute_name_25 text DEFAULT '', attribute_value_25 text DEFAULT '',
  attribute_name_26 text DEFAULT '', attribute_value_26 text DEFAULT '',
  attribute_name_27 text DEFAULT '', attribute_value_27 text DEFAULT '',
  attribute_name_28 text DEFAULT '', attribute_value_28 text DEFAULT '',
  attribute_name_29 text DEFAULT '', attribute_value_29 text DEFAULT '',
  attribute_name_30 text DEFAULT '', attribute_value_30 text DEFAULT '',
  attribute_name_31 text DEFAULT '', attribute_value_31 text DEFAULT '',
  attribute_name_32 text DEFAULT '', attribute_value_32 text DEFAULT '',
  attribute_name_33 text DEFAULT '', attribute_value_33 text DEFAULT '',
  attribute_name_34 text DEFAULT '', attribute_value_34 text DEFAULT '',
  attribute_name_35 text DEFAULT '', attribute_value_35 text DEFAULT '',
  attribute_name_36 text DEFAULT '', attribute_value_36 text DEFAULT '',
  attribute_name_37 text DEFAULT '', attribute_value_37 text DEFAULT '',
  attribute_name_38 text DEFAULT '', attribute_value_38 text DEFAULT '',
  attribute_name_39 text DEFAULT '', attribute_value_39 text DEFAULT '',
  attribute_name_40 text DEFAULT '', attribute_value_40 text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow public access to products" ON product_master FOR ALL TO public USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_master_brand_code ON product_master(brand_code);
CREATE INDEX IF NOT EXISTS idx_product_master_vendor_code ON product_master(vendor_code);
CREATE INDEX IF NOT EXISTS idx_product_master_category_code ON product_master(category_code);
CREATE INDEX IF NOT EXISTS idx_product_master_industry_name ON product_master(industry_name);
CREATE INDEX IF NOT EXISTS idx_category_master_industry_name ON category_master(industry_name);
/*
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
CREATE INDEX IF NOT EXISTS idx_product_variants_mpn ON product_variants(variant_mpn);
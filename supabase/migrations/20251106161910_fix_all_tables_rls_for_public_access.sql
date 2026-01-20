/*
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

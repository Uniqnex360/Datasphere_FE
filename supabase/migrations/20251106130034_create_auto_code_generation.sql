/*
  # Auto-Generate Entity Codes

  ## Overview
  Creates sequences and functions to automatically generate unique codes for entities:
  - Vendors: VEND-000001
  - Brands: BRND-000001
  - Categories: CAT-000001
  - Attributes: ATTR-000001
  - Products: SKU-000001

  ## Sequences Created
  - vendor_code_seq
  - brand_code_seq
  - category_code_seq
  - attribute_code_seq
  - product_code_seq

  ## Functions Created
  - generate_vendor_code()
  - generate_brand_code()
  - generate_category_code()
  - generate_attribute_code()
  - generate_product_code()

  ## Triggers
  - Auto-generate codes on INSERT if code is NULL or empty
*/

CREATE SEQUENCE IF NOT EXISTS vendor_code_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS brand_code_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS category_code_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS attribute_code_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS product_code_seq START WITH 1;

CREATE OR REPLACE FUNCTION generate_vendor_code()
RETURNS TEXT AS $$
DECLARE
  next_val INTEGER;
  new_code TEXT;
BEGIN
  SELECT nextval('vendor_code_seq') INTO next_val;
  new_code := 'VEND-' || LPAD(next_val::TEXT, 6, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_brand_code()
RETURNS TEXT AS $$
DECLARE
  next_val INTEGER;
  new_code TEXT;
BEGIN
  SELECT nextval('brand_code_seq') INTO next_val;
  new_code := 'BRND-' || LPAD(next_val::TEXT, 6, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_category_code()
RETURNS TEXT AS $$
DECLARE
  next_val INTEGER;
  new_code TEXT;
BEGIN
  SELECT nextval('category_code_seq') INTO next_val;
  new_code := 'CAT-' || LPAD(next_val::TEXT, 6, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_attribute_code()
RETURNS TEXT AS $$
DECLARE
  next_val INTEGER;
  new_code TEXT;
BEGIN
  SELECT nextval('attribute_code_seq') INTO next_val;
  new_code := 'ATTR-' || LPAD(next_val::TEXT, 6, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_product_code()
RETURNS TEXT AS $$
DECLARE
  next_val INTEGER;
  new_code TEXT;
BEGIN
  SELECT nextval('product_code_seq') INTO next_val;
  new_code := 'SKU-' || LPAD(next_val::TEXT, 6, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_generate_vendor_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vendor_code IS NULL OR NEW.vendor_code = '' THEN
    NEW.vendor_code := generate_vendor_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_generate_brand_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.brand_code IS NULL OR NEW.brand_code = '' THEN
    NEW.brand_code := generate_brand_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_generate_category_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category_code IS NULL OR NEW.category_code = '' THEN
    NEW.category_code := generate_category_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_generate_attribute_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.attribute_code IS NULL OR NEW.attribute_code = '' THEN
    NEW.attribute_code := generate_attribute_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_generate_product_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_code IS NULL OR NEW.product_code = '' THEN
    NEW.product_code := generate_product_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_vendor_code ON vendor_master;
CREATE TRIGGER trigger_auto_generate_vendor_code
  BEFORE INSERT ON vendor_master
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_vendor_code();

DROP TRIGGER IF EXISTS trigger_auto_generate_brand_code ON brand_master;
CREATE TRIGGER trigger_auto_generate_brand_code
  BEFORE INSERT ON brand_master
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_brand_code();

DROP TRIGGER IF EXISTS trigger_auto_generate_category_code ON category_master;
CREATE TRIGGER trigger_auto_generate_category_code
  BEFORE INSERT ON category_master
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_category_code();

DROP TRIGGER IF EXISTS trigger_auto_generate_attribute_code ON attribute_master;
CREATE TRIGGER trigger_auto_generate_attribute_code
  BEFORE INSERT ON attribute_master
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_attribute_code();

DROP TRIGGER IF EXISTS trigger_auto_generate_product_code ON product_master;
CREATE TRIGGER trigger_auto_generate_product_code
  BEFORE INSERT ON product_master
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_product_code();
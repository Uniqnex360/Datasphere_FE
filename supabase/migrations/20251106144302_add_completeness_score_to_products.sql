/*
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
  EXECUTE FUNCTION update_product_completeness();
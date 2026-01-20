/*
  # Fix Completeness Function to Use Correct Column Names

  1. Changes
    - Update calculate_product_completeness to use product_name instead of title
    - Update to use prod_short_desc and prod_long_desc instead of short_description and long_description
    - Update trigger function with correct column names
    
  2. Notes
    - Database has: product_name, prod_short_desc, prod_long_desc
    - Database does NOT have: title, short_description, long_description
*/

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
  IF product_row.features_1 IS NOT NULL AND product_row.features_1 != '' THEN features_count := features_count + 1; END IF;
  IF product_row.features_2 IS NOT NULL AND product_row.features_2 != '' THEN features_count := features_count + 1; END IF;
  IF product_row.features_3 IS NOT NULL AND product_row.features_3 != '' THEN features_count := features_count + 1; END IF;
  IF product_row.features_4 IS NOT NULL AND product_row.features_4 != '' THEN features_count := features_count + 1; END IF;
  IF product_row.features_5 IS NOT NULL AND product_row.features_5 != '' THEN features_count := features_count + 1; END IF;
  IF product_row.features_6 IS NOT NULL AND product_row.features_6 != '' THEN features_count := features_count + 1; END IF;
  IF product_row.features_7 IS NOT NULL AND product_row.features_7 != '' THEN features_count := features_count + 1; END IF;
  IF product_row.features_8 IS NOT NULL AND product_row.features_8 != '' THEN features_count := features_count + 1; END IF;
  IF product_row.features_9 IS NOT NULL AND product_row.features_9 != '' THEN features_count := features_count + 1; END IF;
  IF product_row.features_10 IS NOT NULL AND product_row.features_10 != '' THEN features_count := features_count + 1; END IF;

  IF features_count >= 5 THEN
    features_score := 100;
  ELSE
    features_score := 80;
  END IF;

  images_count := 0;
  IF product_row.image_url_1 IS NOT NULL AND product_row.image_url_1 != '' THEN images_count := images_count + 1; END IF;
  IF product_row.image_url_2 IS NOT NULL AND product_row.image_url_2 != '' THEN images_count := images_count + 1; END IF;
  IF product_row.image_url_3 IS NOT NULL AND product_row.image_url_3 != '' THEN images_count := images_count + 1; END IF;
  IF product_row.image_url_4 IS NOT NULL AND product_row.image_url_4 != '' THEN images_count := images_count + 1; END IF;
  IF product_row.image_url_5 IS NOT NULL AND product_row.image_url_5 != '' THEN images_count := images_count + 1; END IF;

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
          (CASE WHEN NEW.features_1 IS NOT NULL AND NEW.features_1 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.features_2 IS NOT NULL AND NEW.features_2 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.features_3 IS NOT NULL AND NEW.features_3 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.features_4 IS NOT NULL AND NEW.features_4 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.features_5 IS NOT NULL AND NEW.features_5 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.features_6 IS NOT NULL AND NEW.features_6 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.features_7 IS NOT NULL AND NEW.features_7 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.features_8 IS NOT NULL AND NEW.features_8 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.features_9 IS NOT NULL AND NEW.features_9 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.features_10 IS NOT NULL AND NEW.features_10 != '' THEN 1 ELSE 0 END)
        ) >= 5 THEN 100 ELSE 80 END
    ),
    'images_score', (
      SELECT CASE 
        WHEN (
          (CASE WHEN NEW.image_url_1 IS NOT NULL AND NEW.image_url_1 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.image_url_2 IS NOT NULL AND NEW.image_url_2 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.image_url_3 IS NOT NULL AND NEW.image_url_3 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.image_url_4 IS NOT NULL AND NEW.image_url_4 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.image_url_5 IS NOT NULL AND NEW.image_url_5 != '' THEN 1 ELSE 0 END)
        ) >= 2 THEN 100
        WHEN (
          (CASE WHEN NEW.image_url_1 IS NOT NULL AND NEW.image_url_1 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.image_url_2 IS NOT NULL AND NEW.image_url_2 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.image_url_3 IS NOT NULL AND NEW.image_url_3 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.image_url_4 IS NOT NULL AND NEW.image_url_4 != '' THEN 1 ELSE 0 END) +
          (CASE WHEN NEW.image_url_5 IS NOT NULL AND NEW.image_url_5 != '' THEN 1 ELSE 0 END)
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

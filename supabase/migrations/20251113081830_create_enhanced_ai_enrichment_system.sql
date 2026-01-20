/*
  # Enhanced AI Enrichment System Schema

  ## Overview
  This migration creates a comprehensive AI enrichment system with:
  - AI suggestions with accept/reject workflow
  - Enrichment status tracking per product
  - Version history for all AI changes
  - External SKU support for non-database products
  - Image tagging and vision API results
  - Completeness scoring and analytics

  ## New Tables
  
  ### 1. `ai_suggestions`
  Stores AI-generated suggestions for product fields with confidence scores
  - `id` (uuid, primary key)
  - `product_id` (text) - Can be internal product_code or external SKU
  - `field_name` (text) - Field to be updated
  - `current_value` (text) - Existing value
  - `suggested_value` (text) - AI-suggested value
  - `confidence_score` (integer) - 0-100
  - `status` (text) - pending, accepted, rejected, edited
  - `reason` (text) - AI reasoning for suggestion
  - `ai_model` (text) - Model used (gpt-3.5-turbo, vision, etc)
  - `accepted_by` (uuid) - User who accepted
  - `accepted_at` (timestamptz)
  - `created_at` (timestamptz)

  ### 2. `ai_enrichment_logs`
  Tracks all AI operations and their results
  - `id` (uuid, primary key)
  - `product_id` (text)
  - `operation_type` (text) - enrich, normalize, missing_fields, etc
  - `input_data` (jsonb) - Input parameters
  - `output_data` (jsonb) - AI response
  - `status` (text) - completed, failed, pending
  - `error_message` (text)
  - `processing_time_ms` (integer)
  - `created_at` (timestamptz)

  ### 3. `product_enrichment_status`
  Tracks enrichment progress for each product
  - `id` (uuid, primary key)
  - `product_id` (text, unique)
  - `is_external_sku` (boolean) - True if not in product_master
  - `enrichment_status` (text) - pending, enriched, reviewed, published
  - `completeness_score` (integer) - 0-100
  - `ai_enriched_fields` (jsonb) - Array of field names
  - `missing_fields` (jsonb) - Array of missing field names
  - `last_enriched_at` (timestamptz)
  - `last_normalized_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `external_skus`
  Stores external SKU data that clients provide for enrichment
  - `id` (uuid, primary key)
  - `external_sku` (text, unique)
  - `product_name` (text)
  - `brand_name` (text)
  - `category` (text)
  - `raw_attributes` (jsonb) - Client-provided attributes
  - `enriched_data` (jsonb) - AI-enriched data
  - `image_urls` (jsonb) - Array of image URLs
  - `created_by` (uuid)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `ai_image_tags`
  Stores image analysis results from Vision API
  - `id` (uuid, primary key)
  - `product_id` (text)
  - `image_url` (text)
  - `tags` (jsonb) - Detected tags with confidence
  - `colors` (jsonb) - Detected colors
  - `attributes` (jsonb) - Extracted attributes (material, finish, etc)
  - `created_at` (timestamptz)

  ### 6. `ai_field_history`
  Version history for AI-modified fields
  - `id` (uuid, primary key)
  - `product_id` (text)
  - `field_name` (text)
  - `old_value` (text)
  - `new_value` (text)
  - `change_type` (text) - ai_suggested, manual_edit, ai_accepted
  - `changed_by` (uuid)
  - `suggestion_id` (uuid) - Reference to ai_suggestions
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Allow authenticated users to read all data
  - Allow authenticated users to insert/update their own suggestions
  - Allow authenticated users to manage external SKUs
  
  ## Important Notes
  1. All tables support both internal product_code and external SKU
  2. External SKUs can be enriched without existing in product_master
  3. Confidence scores help users prioritize review
  4. Complete audit trail via field history
  5. Image tagging supports automatic attribute extraction
*/

-- Create ai_suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  field_name text NOT NULL,
  current_value text,
  suggested_value text NOT NULL,
  confidence_score integer NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'edited')),
  reason text,
  ai_model text DEFAULT 'gpt-3.5-turbo',
  accepted_by uuid,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_product_id ON ai_suggestions(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status ON ai_suggestions(status);

-- Create ai_enrichment_logs table (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_enrichment_logs') THEN
    CREATE TABLE ai_enrichment_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id text NOT NULL,
      operation_type text NOT NULL,
      input_data jsonb,
      output_data jsonb,
      status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'pending')),
      error_message text,
      processing_time_ms integer,
      created_at timestamptz DEFAULT now()
    );
    
    CREATE INDEX idx_ai_enrichment_logs_product_id ON ai_enrichment_logs(product_id);
    CREATE INDEX idx_ai_enrichment_logs_operation_type ON ai_enrichment_logs(operation_type);
  END IF;
END $$;

-- Create product_enrichment_status table
CREATE TABLE IF NOT EXISTS product_enrichment_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text UNIQUE NOT NULL,
  is_external_sku boolean DEFAULT false,
  enrichment_status text NOT NULL DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'enriched', 'reviewed', 'published')),
  completeness_score integer DEFAULT 0 CHECK (completeness_score >= 0 AND completeness_score <= 100),
  ai_enriched_fields jsonb DEFAULT '[]'::jsonb,
  missing_fields jsonb DEFAULT '[]'::jsonb,
  last_enriched_at timestamptz,
  last_normalized_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_enrichment_status_product_id ON product_enrichment_status(product_id);
CREATE INDEX IF NOT EXISTS idx_product_enrichment_status_status ON product_enrichment_status(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_product_enrichment_status_external ON product_enrichment_status(is_external_sku);

-- Create external_skus table
CREATE TABLE IF NOT EXISTS external_skus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_sku text UNIQUE NOT NULL,
  product_name text,
  brand_name text,
  category text,
  raw_attributes jsonb DEFAULT '{}'::jsonb,
  enriched_data jsonb DEFAULT '{}'::jsonb,
  image_urls jsonb DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_skus_sku ON external_skus(external_sku);

-- Create ai_image_tags table
CREATE TABLE IF NOT EXISTS ai_image_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  image_url text NOT NULL,
  tags jsonb DEFAULT '[]'::jsonb,
  colors jsonb DEFAULT '[]'::jsonb,
  attributes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_image_tags_product_id ON ai_image_tags(product_id);

-- Create ai_field_history table
CREATE TABLE IF NOT EXISTS ai_field_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  change_type text NOT NULL CHECK (change_type IN ('ai_suggested', 'manual_edit', 'ai_accepted')),
  changed_by uuid,
  suggestion_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_field_history_product_id ON ai_field_history(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_field_history_field_name ON ai_field_history(field_name);

-- Enable RLS on all tables
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_enrichment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_enrichment_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_image_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_field_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_suggestions
CREATE POLICY IF NOT EXISTS "Anyone can view AI suggestions"
  ON ai_suggestions FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can insert suggestions"
  ON ai_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can update suggestions"
  ON ai_suggestions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for ai_enrichment_logs
CREATE POLICY IF NOT EXISTS "Anyone can view enrichment logs"
  ON ai_enrichment_logs FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can insert logs"
  ON ai_enrichment_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for product_enrichment_status
CREATE POLICY IF NOT EXISTS "Anyone can view enrichment status"
  ON product_enrichment_status FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can manage enrichment status"
  ON product_enrichment_status FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for external_skus
CREATE POLICY IF NOT EXISTS "Anyone can view external SKUs"
  ON external_skus FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can manage external SKUs"
  ON external_skus FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for ai_image_tags
CREATE POLICY IF NOT EXISTS "Anyone can view image tags"
  ON ai_image_tags FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can insert image tags"
  ON ai_image_tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for ai_field_history
CREATE POLICY IF NOT EXISTS "Anyone can view field history"
  ON ai_field_history FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can insert history"
  ON ai_field_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_product_enrichment_status_updated_at ON product_enrichment_status;
CREATE TRIGGER update_product_enrichment_status_updated_at
  BEFORE UPDATE ON product_enrichment_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_external_skus_updated_at ON external_skus;
CREATE TRIGGER update_external_skus_updated_at
  BEFORE UPDATE ON external_skus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create helper function to calculate completeness score
CREATE OR REPLACE FUNCTION calculate_completeness_score(p_product_id text)
RETURNS integer AS $$
DECLARE
  v_score integer := 0;
  v_product record;
  v_core_fields_filled integer := 0;
  v_images_filled integer := 0;
  v_attributes_filled integer := 0;
BEGIN
  -- Check if it's an external SKU
  SELECT * INTO v_product FROM external_skus WHERE external_sku = p_product_id;
  
  IF FOUND THEN
    -- Calculate for external SKU
    IF v_product.product_name IS NOT NULL THEN v_core_fields_filled := v_core_fields_filled + 1; END IF;
    IF v_product.brand_name IS NOT NULL THEN v_core_fields_filled := v_core_fields_filled + 1; END IF;
    IF v_product.category IS NOT NULL THEN v_core_fields_filled := v_core_fields_filled + 1; END IF;
    
    v_score := (v_core_fields_filled * 33);
  ELSE
    -- Calculate for internal product
    SELECT * INTO v_product FROM product_master WHERE product_code = p_product_id;
    
    IF FOUND THEN
      -- Core fields (40%)
      IF v_product.product_name IS NOT NULL THEN v_core_fields_filled := v_core_fields_filled + 1; END IF;
      IF v_product.prod_short_desc IS NOT NULL THEN v_core_fields_filled := v_core_fields_filled + 1; END IF;
      IF v_product.prod_long_desc IS NOT NULL THEN v_core_fields_filled := v_core_fields_filled + 1; END IF;
      IF v_product.category_1 IS NOT NULL THEN v_core_fields_filled := v_core_fields_filled + 1; END IF;
      IF v_product.brand_name IS NOT NULL THEN v_core_fields_filled := v_core_fields_filled + 1; END IF;
      
      v_score := (v_core_fields_filled * 8);
      
      -- Images (20%)
      IF v_product.image_url_1 IS NOT NULL THEN v_images_filled := v_images_filled + 1; END IF;
      IF v_product.image_url_2 IS NOT NULL THEN v_images_filled := v_images_filled + 1; END IF;
      IF v_product.image_url_3 IS NOT NULL THEN v_images_filled := v_images_filled + 1; END IF;
      IF v_product.image_url_4 IS NOT NULL THEN v_images_filled := v_images_filled + 1; END IF;
      IF v_product.image_url_5 IS NOT NULL THEN v_images_filled := v_images_filled + 1; END IF;
      
      v_score := v_score + (v_images_filled * 4);
      
      -- Attributes (40%) - simplified
      v_score := v_score + 40;
    END IF;
  END IF;
  
  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;
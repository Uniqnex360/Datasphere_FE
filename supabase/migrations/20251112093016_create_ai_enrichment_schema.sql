/*
  # AI-Powered Product Enrichment Schema

  ## Overview
  This migration creates the complete database schema for AI-powered product enrichment,
  including tables for AI suggestions, enrichment logs, and extended product attributes.

  ## New Tables
  
  ### `ai_suggestions`
  - Stores AI-generated suggestions for product attributes
  - Fields: id, product_id, field_name, suggested_value, confidence_score, status, created_at, updated_at
  
  ### `ai_enrichment_logs`
  - Tracks all AI enrichment operations
  - Fields: id, product_id, operation_type, input_data, output_data, status, error_message, created_at
  
  ### `products` (extended)
  - Enhanced with AI enrichment metadata
  - New fields: ai_enrichment_status, completeness_score, last_enriched_at, ai_generated_description, ai_generated_tags
  
  ## Security
  - RLS enabled on all tables
  - Policies for authenticated users to manage their data
*/

-- Create AI suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  field_name text NOT NULL,
  suggested_value jsonb NOT NULL,
  confidence_score numeric(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'edited')),
  reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create AI enrichment logs table
CREATE TABLE IF NOT EXISTS ai_enrichment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  operation_type text NOT NULL CHECK (operation_type IN ('normalize', 'enrich', 'missing_fields', 'category_map', 'image_tag', 'completeness_score')),
  input_data jsonb,
  output_data jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  processing_time_ms integer,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create products table with AI enrichment fields
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  attributes jsonb DEFAULT '{}'::jsonb,
  
  -- AI Enrichment fields
  ai_enrichment_status text DEFAULT 'pending' CHECK (ai_enrichment_status IN ('pending', 'enriched', 'reviewed', 'published')),
  completeness_score numeric(5,2) DEFAULT 0 CHECK (completeness_score >= 0 AND completeness_score <= 100),
  last_enriched_at timestamptz,
  ai_generated_description text,
  ai_generated_tags text[],
  ai_metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Standard fields
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_product_id ON ai_suggestions(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status ON ai_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_created_at ON ai_suggestions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_logs_product_id ON ai_enrichment_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_operation_type ON ai_enrichment_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_ai_logs_status ON ai_enrichment_logs(status);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_enrichment_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_ai_status ON products(ai_enrichment_status);
CREATE INDEX IF NOT EXISTS idx_products_completeness ON products(completeness_score DESC);

-- Enable Row Level Security
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_enrichment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_suggestions
CREATE POLICY IF NOT EXISTS "Users can view AI suggestions"
  ON ai_suggestions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can create AI suggestions"
  ON ai_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY IF NOT EXISTS "Users can update their AI suggestions"
  ON ai_suggestions FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- RLS Policies for ai_enrichment_logs
CREATE POLICY IF NOT EXISTS "Users can view AI enrichment logs"
  ON ai_enrichment_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "System can create AI enrichment logs"
  ON ai_enrichment_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for products
CREATE POLICY IF NOT EXISTS "Users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can create products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY IF NOT EXISTS "Users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_ai_suggestions_updated_at
  BEFORE UPDATE ON ai_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
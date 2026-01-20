/*
  # Create Channels Schema

  ## Overview
  Creates tables for managing channel integrations, field mappings, and exports.

  ## Tables Created

  ### 1. channels
  - `id` (uuid, primary key) - Unique channel identifier
  - `channel_name` (text, required) - Display name
  - `channel_status` (text) - active/inactive
  - `template_headers` (jsonb) - Array of column headers from uploaded template
  - `last_export_date` (timestamptz) - Last successful export
  - `products_mapped_count` (integer) - Number of products mapped
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. channel_field_mappings
  - `id` (uuid, primary key) - Unique mapping identifier
  - `channel_id` (uuid, foreign key) - References channels
  - `pim_field` (text) - Source PIM field name
  - `channel_field` (text) - Target channel field name
  - `mapping_type` (text) - direct/static/concatenation
  - `static_value` (text) - For static mappings
  - `concatenation_pattern` (text) - For concatenation (e.g., "{field1} - {field2}")
  - `is_required` (boolean) - Whether field is required
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. channel_exports
  - `id` (uuid, primary key) - Unique export identifier
  - `channel_id` (uuid, foreign key) - References channels
  - `export_date` (timestamptz) - When export was created
  - `product_count` (integer) - Number of products exported
  - `file_url` (text) - URL to exported file
  - `filters_applied` (jsonb) - Export filters used
  - `status` (text) - success/failed/processing
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - RLS enabled on all tables
  - Policies for authenticated users to read/write
*/

CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_name text NOT NULL,
  channel_status text DEFAULT 'active',
  template_headers jsonb DEFAULT '[]'::jsonb,
  last_export_date timestamptz,
  products_mapped_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS channel_field_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES channels(id) ON DELETE CASCADE,
  pim_field text NOT NULL,
  channel_field text NOT NULL,
  mapping_type text DEFAULT 'direct',
  static_value text DEFAULT '',
  concatenation_pattern text DEFAULT '',
  is_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS channel_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES channels(id) ON DELETE CASCADE,
  export_date timestamptz DEFAULT now(),
  product_count integer DEFAULT 0,
  file_url text DEFAULT '',
  filters_applied jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'processing',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow authenticated users to view channels"
  ON channels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert channels"
  ON channels FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to update channels"
  ON channels FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete channels"
  ON channels FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to view field mappings"
  ON channel_field_mappings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert field mappings"
  ON channel_field_mappings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to update field mappings"
  ON channel_field_mappings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete field mappings"
  ON channel_field_mappings FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to view exports"
  ON channel_exports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert exports"
  ON channel_exports FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to update exports"
  ON channel_exports FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete exports"
  ON channel_exports FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_channels_status ON channels(channel_status);
CREATE INDEX IF NOT EXISTS idx_channel_field_mappings_channel_id ON channel_field_mappings(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_exports_channel_id ON channel_exports(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_exports_status ON channel_exports(status);

CREATE TABLE IF NOT EXISTS attribute_master (
  attribute_code text PRIMARY KEY,
  attribute_name text NOT NULL,
  industry_name text DEFAULT '',
  industry_attribute_name text DEFAULT '',
  description text DEFAULT '',
  applicable_categories text DEFAULT '',
  attribute_type text DEFAULT '',
  data_type text DEFAULT '',
  unit text DEFAULT '',

  attribute_value_1 text DEFAULT '',
  attribute_value_2 text DEFAULT '',
  attribute_value_3 text DEFAULT '',
  attribute_value_4 text DEFAULT '',
  attribute_value_5 text DEFAULT '',
  attribute_value_6 text DEFAULT '',
  attribute_value_7 text DEFAULT '',
  attribute_value_8 text DEFAULT '',
  attribute_value_9 text DEFAULT '',
  attribute_value_10 text DEFAULT '',
  attribute_value_11 text DEFAULT '',
  attribute_value_12 text DEFAULT '',
  attribute_value_13 text DEFAULT '',
  attribute_value_14 text DEFAULT '',
  attribute_value_15 text DEFAULT '',
  attribute_value_16 text DEFAULT '',
  attribute_value_17 text DEFAULT '',
  attribute_value_18 text DEFAULT '',
  attribute_value_19 text DEFAULT '',
  attribute_value_20 text DEFAULT '',
  attribute_value_21 text DEFAULT '',
  attribute_value_22 text DEFAULT '',
  attribute_value_23 text DEFAULT '',
  attribute_value_24 text DEFAULT '',
  attribute_value_25 text DEFAULT '',
  attribute_value_26 text DEFAULT '',
  attribute_value_27 text DEFAULT '',
  attribute_value_28 text DEFAULT '',
  attribute_value_29 text DEFAULT '',
  attribute_value_30 text DEFAULT '',
  attribute_value_31 text DEFAULT '',
  attribute_value_32 text DEFAULT '',
  attribute_value_33 text DEFAULT '',
  attribute_value_34 text DEFAULT '',
  attribute_value_35 text DEFAULT '',
  attribute_value_36 text DEFAULT '',
  attribute_value_37 text DEFAULT '',
  attribute_value_38 text DEFAULT '',
  attribute_value_39 text DEFAULT '',
  attribute_value_40 text DEFAULT '',
  attribute_value_41 text DEFAULT '',
  attribute_value_42 text DEFAULT '',
  attribute_value_43 text DEFAULT '',
  attribute_value_44 text DEFAULT '',
  attribute_value_45 text DEFAULT '',
  attribute_value_46 text DEFAULT '',
  attribute_value_47 text DEFAULT '',
  attribute_value_48 text DEFAULT '',
  attribute_value_49 text DEFAULT '',
  attribute_value_50 text DEFAULT '',

  attribute_uom_1 text DEFAULT '',
  attribute_uom_2 text DEFAULT '',
  attribute_uom_3 text DEFAULT '',
  attribute_uom_4 text DEFAULT '',
  attribute_uom_5 text DEFAULT '',
  attribute_uom_6 text DEFAULT '',
  attribute_uom_7 text DEFAULT '',
  attribute_uom_8 text DEFAULT '',
  attribute_uom_9 text DEFAULT '',
  attribute_uom_10 text DEFAULT '',
  attribute_uom_11 text DEFAULT '',
  attribute_uom_12 text DEFAULT '',
  attribute_uom_13 text DEFAULT '',
  attribute_uom_14 text DEFAULT '',
  attribute_uom_15 text DEFAULT '',
  attribute_uom_16 text DEFAULT '',
  attribute_uom_17 text DEFAULT '',
  attribute_uom_18 text DEFAULT '',
  attribute_uom_19 text DEFAULT '',
  attribute_uom_20 text DEFAULT '',
  attribute_uom_21 text DEFAULT '',
  attribute_uom_22 text DEFAULT '',
  attribute_uom_23 text DEFAULT '',
  attribute_uom_24 text DEFAULT '',
  attribute_uom_25 text DEFAULT '',
  attribute_uom_26 text DEFAULT '',
  attribute_uom_27 text DEFAULT '',
  attribute_uom_28 text DEFAULT '',
  attribute_uom_29 text DEFAULT '',
  attribute_uom_30 text DEFAULT '',
  attribute_uom_31 text DEFAULT '',
  attribute_uom_32 text DEFAULT '',
  attribute_uom_33 text DEFAULT '',
  attribute_uom_34 text DEFAULT '',
  attribute_uom_35 text DEFAULT '',
  attribute_uom_36 text DEFAULT '',
  attribute_uom_37 text DEFAULT '',
  attribute_uom_38 text DEFAULT '',
  attribute_uom_39 text DEFAULT '',
  attribute_uom_40 text DEFAULT '',
  attribute_uom_41 text DEFAULT '',
  attribute_uom_42 text DEFAULT '',
  attribute_uom_43 text DEFAULT '',
  attribute_uom_44 text DEFAULT '',
  attribute_uom_45 text DEFAULT '',
  attribute_uom_46 text DEFAULT '',
  attribute_uom_47 text DEFAULT '',
  attribute_uom_48 text DEFAULT '',
  attribute_uom_49 text DEFAULT '',
  attribute_uom_50 text DEFAULT '',

  filter text DEFAULT 'No',
  filter_display_name text DEFAULT '',

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE attribute_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow authenticated users to view attributes"
  ON attribute_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert attributes"
  ON attribute_master FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to update attributes"
  ON attribute_master FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete attributes"
  ON attribute_master FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_attribute_master_industry ON attribute_master(industry_name);
CREATE INDEX IF NOT EXISTS idx_attribute_master_type ON attribute_master(attribute_type);
CREATE INDEX IF NOT EXISTS idx_attribute_master_data_type ON attribute_master(data_type);
CREATE INDEX IF NOT EXISTS idx_attribute_master_filter ON attribute_master(filter);
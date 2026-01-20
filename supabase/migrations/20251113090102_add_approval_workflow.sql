/*
  # Add Approval Workflow for AI Suggestions

  1. Changes
    - Add approval-related columns to ai_suggestions table
    - Add approved_by and approved_at fields
    - Add rejection_reason field
    - Create approval status tracking

  2. Security
    - Maintain existing RLS policies
*/

-- Add approval fields to ai_suggestions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_suggestions' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE ai_suggestions 
    ADD COLUMN approved_by text,
    ADD COLUMN approved_at timestamptz,
    ADD COLUMN rejection_reason text;
  END IF;
END $$;

-- Update enrichment status values to include approval states
DO $$
BEGIN
  -- Update any existing 'enriched' status to 'enriched_pending_approval'
  UPDATE product_enrichment_status 
  SET enrichment_status = 'enriched_pending_approval' 
  WHERE enrichment_status = 'enriched' 
  AND is_external_sku = true;
END $$;
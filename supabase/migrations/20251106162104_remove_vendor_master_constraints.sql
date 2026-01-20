/*
  # Remove Restrictive Constraints from Vendor Master

  1. Changes
    - Drop business_type check constraint (was limiting to specific values)
    - Drop industry check constraint (was limiting to specific values)
    - Allow any text values for these columns
  
  2. Reason
    - Excel imports may have different business types and industries
    - Users should be able to add custom values
    - Constraints were too restrictive for real-world data
*/

-- Remove business_type constraint
ALTER TABLE vendor_master DROP CONSTRAINT IF EXISTS vendor_master_business_type_check;

-- Remove industry constraint
ALTER TABLE vendor_master DROP CONSTRAINT IF EXISTS vendor_master_industry_check;

import { useState } from "react";
import { clearFieldError } from "../utils/formHelpers";

export function useIndustryManager(
  industries: any[], 
  setFormData: any, 
  setErrors: any,
  fieldName: string = "industry" 
) {
  const [isCustom, setIsCustom] = useState(false);

  const handleIndustryChange = (name: string) => {
    const existing = industries.find(
      (i) => (i.name || i.industry_name || "").toLowerCase() === name.trim().toLowerCase()
    );

    if (existing) {
      setFormData((prev: any) => ({ ...prev, [fieldName]: (existing.name || existing.industry_name) }));
      setIsCustom(false);
    } else {
      setFormData((prev: any) => ({ ...prev, [fieldName]: name }));
    }
    
    clearFieldError(fieldName, setErrors);
  };

  const toggleCustom = (forcedValue?: boolean) => {
    const newValue = forcedValue !== undefined ? forcedValue : !isCustom;
    setIsCustom(newValue);
    if (!newValue) {
        setFormData((prev: any) => ({ ...prev, [fieldName]: "" }));
    }
  };

  return {
    isCustom,
    setIsCustom,
    handleIndustryChange,
    toggleCustom
  };
}
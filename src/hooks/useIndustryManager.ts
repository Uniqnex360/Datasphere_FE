import { useState } from "react";
import { clearFieldError } from "../utils/formHelpers";

export function useIndustryManager(
  industries: any[],
  setFormData: any,
  setErrors: any,
  fieldName: string = "industry",
) {
  const [isCustom, setIsCustom] = useState(false);

  const handleIndustryChange = (name: string) => {
    console.log("industry", industries);
    console.log("input name", name);
    const existing = industries.find(
      (i) =>
        (i.name || i.industry_name || "").toLowerCase().trim() ===
        name.trim().toLowerCase(),
    );
    console.log("exiging", existing);
    if (existing) {
      setFormData((prev: any) => ({
        ...prev,
        industry_name: existing.industry_name || existing.name,
        industry_id: existing.id,
      }));

      setIsCustom(false);
    } else {
      setFormData((prev: any) => ({
        ...prev,
        industry_name: name,
        industry_id: null,
      }));
    }

    clearFieldError(fieldName, setErrors);
  };

  const toggleCustom = (forcedValue?: boolean) => {
    const newValue = forcedValue !== undefined ? forcedValue : !isCustom;

    setIsCustom(newValue);

    if (!newValue) {
      setFormData((prev: any) => ({
        ...prev,
        industry: "",
        industry_id: null,
      }));
    }
  };

  return {
    isCustom,
    setIsCustom,
    handleIndustryChange,
    toggleCustom,
  };
}

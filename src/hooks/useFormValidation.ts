import { useState, useCallback } from 'react';

type ValidationRule<T> = {
  field: keyof T;
  required?: boolean;
  email?: boolean;
  custom?: (value: any, formData: T) => string | null;
  message?: string;
};

export function useFormValidation<T>(rules: ValidationRule<T>[]) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((formData: Partial<T>): boolean => {
    const newErrors: Record<string, string> = {};

    rules.forEach(rule => {
      const value = formData[rule.field];
      const fieldName = String(rule.field);

      if (rule.required && (!value || !String(value).trim())) {
        newErrors[fieldName] = rule.message || `${fieldName} is required`;
        return;
      }

      if (rule.email && value && !/\S+@\S+\.\S+/.test(String(value))) {
        newErrors[fieldName] = rule.message || 'Invalid email format';
        return;
      }

      if (rule.custom && value) {
        const customError = rule.custom(value, formData as T);
        if (customError) {
          newErrors[fieldName] = customError;
          return;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [rules]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validate,
    clearErrors,
    setErrors,
  };
}
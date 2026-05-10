'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ValidationResult } from '@/lib/validation';

export interface UseFieldValidationOptions {
  initialValue?: string;
  validators: Array<(value: string) => ValidationResult>;
  sanitizers?: Array<(value: string) => string>;
  debounceMs?: number;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
}

export interface FieldValidationState {
  value: string;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  error: string | null;
  isValidating: boolean;
}

export function useFieldValidation({
  initialValue = '',
  validators,
  sanitizers = [],
  debounceMs = 300,
  validateOnBlur = true,
  validateOnChange = false,
}: UseFieldValidationOptions) {
  const [state, setState] = useState<FieldValidationState>({
    value: initialValue,
    isValid: true,
    isDirty: false,
    isTouched: false,
    error: null,
    isValidating: false,
  });

  const validationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const sanitize = useCallback(
    (value: string) => {
      return sanitizers.reduce((acc, sanitizer) => sanitizer(acc), value);
    },
    [sanitizers],
  );

  const validate = useCallback(
    (value: string): ValidationResult => {
      for (const validator of validators) {
        const result = validator(value);
        if (!result.valid) {
          return result;
        }
      }
      return { valid: true };
    },
    [validators],
  );

  const performValidation = useCallback(
    (value: string) => {
      setState((prev) => ({ ...prev, isValidating: true }));

      const result = validate(value);
      setState((prev) => ({
        ...prev,
        isValid: result.valid,
        error: result.error || null,
        isValidating: false,
      }));
    },
    [validate],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const rawValue = e.target.value;
      const sanitizedValue = sanitize(rawValue);

      setState((prev) => ({
        ...prev,
        value: sanitizedValue,
        isDirty: true,
      }));

      if (validateOnChange) {
        // Clear existing timer
        if (validationTimerRef.current) {
          clearTimeout(validationTimerRef.current);
        }

        // Debounced validation
        validationTimerRef.current = setTimeout(() => {
          performValidation(sanitizedValue);
        }, debounceMs);
      }
    },
    [sanitize, validateOnChange, debounceMs, performValidation],
  );

  const handleBlur = useCallback(() => {
    setState((prev) => ({ ...prev, isTouched: true }));

    if (validateOnBlur) {
      performValidation(state.value);
    }
  }, [validateOnBlur, state.value, performValidation]);

  const setValue = useCallback(
    (value: string | ((prev: string) => string)) => {
      const newValue = typeof value === 'function' ? value(state.value) : value;
      const sanitizedValue = sanitize(newValue);

      setState((prev) => ({
        ...prev,
        value: sanitizedValue,
      }));
    },
    [state.value, sanitize],
  );

  const reset = useCallback(() => {
    setState({
      value: initialValue,
      isValid: true,
      isDirty: false,
      isTouched: false,
      error: null,
      isValidating: false,
    });

    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
    }
  }, [initialValue]);

  const validate_ = useCallback(() => {
    const result = validate(state.value);
    setState((prev) => ({
      ...prev,
      isValid: result.valid,
      error: result.error || null,
      isTouched: true,
    }));
    return result.valid;
  }, [validate, state.value]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    handleChange,
    handleBlur,
    setValue,
    reset,
    validate: validate_,
  };
}

/**
 * Hook for validating multiple form fields
 */
export interface FormValidationState {
  fields: Record<string, FieldValidationState>;
  isDirty: boolean;
  isTouched: boolean;
  isValid: boolean;
  isValidating: boolean;
}

export function useFormValidation(
  fieldConfigs: Record<string, UseFieldValidationOptions>,
) {
  const [fieldStates, setFieldStates] = useState<Record<string, FieldValidationState>>(() => {
    const initial: Record<string, FieldValidationState> = {};
    Object.entries(fieldConfigs).forEach(([name, config]) => {
      initial[name] = {
        value: config.initialValue || '',
        isValid: true,
        isDirty: false,
        isTouched: false,
        error: null,
        isValidating: false,
      };
    });
    return initial;
  });

  const updateField = useCallback((name: string, updates: Partial<FieldValidationState>) => {
    setFieldStates((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        ...updates,
      },
    }));
  }, []);

  const isValid = Object.values(fieldStates).every((field) => field.isValid);
  const isDirty = Object.values(fieldStates).some((field) => field.isDirty);
  const isTouched = Object.values(fieldStates).some((field) => field.isTouched);
  const isValidating = Object.values(fieldStates).some((field) => field.isValidating);

  const getFieldProps = useCallback(
    (name: string) => {
      const config = fieldConfigs[name];
      if (!config) {
        throw new Error(`Field config not found for field: ${name}`);
      }

      const fieldState = fieldStates[name];
      const sanitize = (value: string) => {
        return (config.sanitizers || []).reduce((acc, sanitizer) => sanitizer(acc), value);
      };

      return {
        value: fieldState.value,
        error: fieldState.error,
        isValid: fieldState.isValid,
        isTouched: fieldState.isTouched,
        isDirty: fieldState.isDirty,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          const rawValue = e.target.value;
          const sanitizedValue = sanitize(rawValue);
          updateField(name, { value: sanitizedValue, isDirty: true });
        },
        onBlur: () => {
          updateField(name, { isTouched: true });
        },
      };
    },
    [fieldConfigs, fieldStates, updateField],
  );

  const resetForm = useCallback(() => {
    const initial: Record<string, FieldValidationState> = {};
    Object.entries(fieldConfigs).forEach(([name, config]) => {
      initial[name] = {
        value: config.initialValue || '',
        isValid: true,
        isDirty: false,
        isTouched: false,
        error: null,
        isValidating: false,
      };
    });
    setFieldStates(initial);
  }, [fieldConfigs]);

  const getFormValues = useCallback(() => {
    const values: Record<string, string> = {};
    Object.entries(fieldStates).forEach(([name, field]) => {
      values[name] = field.value;
    });
    return values;
  }, [fieldStates]);

  return {
    fieldStates,
    isValid,
    isDirty,
    isTouched,
    isValidating,
    getFieldProps,
    resetForm,
    getFormValues,
  };
}

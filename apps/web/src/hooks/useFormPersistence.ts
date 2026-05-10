'use client';

import { useEffect, useCallback } from 'react';

export interface FormPersistenceOptions {
  key: string;
  debounceMs?: number;
  enabled?: boolean;
  version?: number;
}

export function useFormPersistence(options: FormPersistenceOptions) {
  const {
    key,
    debounceMs: _debounceMs = 500, // Future use for debounced saves
    enabled = true,
    version = 1,
  } = options;

  const storageKey = `form_${key}_v${version}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saveFormState = useCallback((formData: any) => {
    if (!enabled) return;

    try {
      const serialized = JSON.stringify({
        data: formData,
        timestamp: Date.now(),
        version,
      });
      localStorage.setItem(storageKey, serialized);
    } catch (error) {
      console.warn('Failed to save form state:', error);
    }
  }, [storageKey, enabled, version]);

  const restoreFormState = useCallback(() => {
    if (!enabled) return null;

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return parsed.data;
    } catch (error) {
      console.warn('Failed to restore form state:', error);
      return null;
    }
  }, [storageKey, enabled]);

  const clearFormState = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear form state:', error);
    }
  }, [storageKey]);

  return {
    saveFormState,
    restoreFormState,
    clearFormState,
  };
}

/**
 * Hook for useForm integration (works with react-hook-form)
 */
export function useFormPersistenceWithHook(
  formKey: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { watch, reset }: any, // react-hook-form methods
  options?: Omit<FormPersistenceOptions, 'key'>,
) {
  const { saveFormState, restoreFormState, clearFormState } = useFormPersistence({
    key: formKey,
    ...options,
  });

  // Restore on mount
  useEffect(() => {
    const savedData = restoreFormState();
    if (savedData) {
      reset(savedData);
    }
  }, []);

  // Save on changes
  useEffect(() => {
    const subscription = watch((data) => {
      saveFormState(data);
    });
    return () => subscription.unsubscribe();
  }, [watch, saveFormState]);

  return { clearFormState };
}

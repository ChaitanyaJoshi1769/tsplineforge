'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@/context/toast';

export interface AutoSaveOptions {
  interval?: number; // milliseconds
  enabled?: boolean;
  debounce?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave?: (data: any) => Promise<void>;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useAutoSave(data: any, options: AutoSaveOptions = {}) {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    debounce = 1000,
    onSave,
    onError,
    onSuccess,
  } = options;

  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef(data);

  const performSave = useCallback(async () => {
    if (!onSave || !enabled) return;

    setIsSaving(true);
    try {
      await onSave(data);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      lastDataRef.current = data;
      onSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to save');
      onError?.(err);
      addToast({
        type: 'error',
        title: 'Auto-save failed',
        message: err.message,
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  }, [data, onSave, enabled, onSuccess, onError, addToast]);

  // Detect changes
  useEffect(() => {
    if (JSON.stringify(lastDataRef.current) !== JSON.stringify(data)) {
      setHasUnsavedChanges(true);

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        // Trigger auto-save after interval
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        
        saveTimerRef.current = setTimeout(() => {
          performSave();
        }, interval - debounce);
      }, debounce);
    }
  }, [data, debounce, interval, performSave]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Manual save
  const manualSave = useCallback(async () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await performSave();
  }, [performSave]);

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    manualSave,
  };
}

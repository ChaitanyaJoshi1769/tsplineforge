'use client';

import { useEffect, useState, useCallback } from 'react';
import type { UserPreferences } from '@/lib/userPreferences';
import { getUserPreferences } from '@/lib/userPreferences';

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const manager = getUserPreferences();

  useEffect(() => {
    // Set initial preferences
    setPreferences(manager.getAll());

    // Subscribe to changes
    const unsubscribe = manager.onChange((prefs) => {
      setPreferences(prefs);
    });

    return unsubscribe;
  }, [manager]);

  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      manager.set(key, value);
    },
    [manager],
  );

  const updateNestedPreference = useCallback(
    <K extends keyof UserPreferences>(
      key: K,
      updates: Partial<UserPreferences[K]>,
    ) => {
      manager.updateNested(key, updates);
    },
    [manager],
  );

  const resetPreferences = useCallback(() => {
    manager.reset();
  }, [manager]);

  return {
    preferences,
    updatePreference,
    updateNestedPreference,
    resetPreferences,
  };
}

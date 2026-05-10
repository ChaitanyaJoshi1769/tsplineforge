'use client';

import { useEffect, useState, useCallback } from 'react';

export enum ServiceWorkerState {
  Unregistered = 'UNREGISTERED',
  Registered = 'REGISTERED',
  Updating = 'UPDATING',
  Error = 'ERROR',
}

export interface ServiceWorkerStatus {
  state: ServiceWorkerState;
  registration: ServiceWorkerRegistration | null;
  error: Error | null;
  updateAvailable: boolean;
}

/**
 * Register and manage Service Worker
 */
export function useServiceWorker(scriptUrl = '/sw.js') {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    state: ServiceWorkerState.Unregistered,
    registration: null,
    error: null,
    updateAvailable: false,
  });

  const register = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      setStatus((prev) => ({
        ...prev,
        error: new Error('Service Workers are not supported'),
      }));
      return;
    }

    try {
      setStatus((prev) => ({
        ...prev,
        state: ServiceWorkerState.Updating,
      }));

      const registration = await navigator.serviceWorker.register(scriptUrl, {
        scope: '/',
      });

      setStatus((prev) => ({
        ...prev,
        state: ServiceWorkerState.Registered,
        registration,
      }));

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            setStatus((prev) => ({
              ...prev,
              updateAvailable: true,
            }));
          }
        });
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setStatus((prev) => ({
        ...prev,
        state: ServiceWorkerState.Error,
        error: err,
      }));
      console.error('Service Worker registration failed:', err);
    }
  }, [scriptUrl]);

  const unregister = useCallback(async () => {
    if (!status.registration) return;

    try {
      await status.registration.unregister();
      setStatus((prev) => ({
        ...prev,
        state: ServiceWorkerState.Unregistered,
        registration: null,
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Service Worker unregistration failed:', err);
    }
  }, [status.registration]);

  const skipWaiting = useCallback(async () => {
    if (!status.registration?.waiting) return;

    status.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload the page when the new service worker takes over
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, [status.registration]);

  const clearCache = useCallback(async () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    }

    // Also clear all caches directly
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
  }, []);

  // Register on mount
  useEffect(() => {
    register();
  }, [register]);

  return {
    ...status,
    register,
    unregister,
    skipWaiting,
    clearCache,
  };
}

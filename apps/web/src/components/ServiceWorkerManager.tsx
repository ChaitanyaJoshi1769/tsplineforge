'use client';

import { useEffect } from 'react';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useToast } from '@/context/toast';

export function ServiceWorkerManager() {
  const { addToast } = useToast();
  const { updateAvailable, skipWaiting, error } = useServiceWorker();

  // Show notification when update is available
  useEffect(() => {
    if (updateAvailable) {
      addToast({
        type: 'info',
        title: 'Update Available',
        message: 'A new version of the app is available. Click to reload.',
        duration: 0,
        action: {
          label: 'Reload',
          onClick: skipWaiting,
        },
      });
    }
  }, [updateAvailable, addToast, skipWaiting]);

  // Show error notification
  useEffect(() => {
    if (error) {
      addToast({
        type: 'warning',
        title: 'Service Worker Error',
        message: 'Some offline features may not be available.',
        duration: 5000,
      });
    }
  }, [error, addToast]);

  return null;
}

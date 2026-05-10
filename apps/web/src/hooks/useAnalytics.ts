'use client';

import { useCallback, useEffect } from 'react';
import { getAnalytics, PerformanceMonitor, SessionAnalytics } from '@/lib/analytics';

/**
 * Hook for using analytics in React components
 */
export function useAnalytics() {
  const analytics = getAnalytics();

  const trackEvent = useCallback(
    (name: string, properties?: Record<string, unknown>) => {
      analytics.trackEvent(name, properties);
    },
    [analytics],
  );

  const trackError = useCallback(
    (message: string, stack?: string, context?: Record<string, unknown>) => {
      analytics.trackError(message, stack, context);
    },
    [analytics],
  );

  const trackInteraction = useCallback(
    (element: string, action: string) => {
      analytics.trackInteraction(element, action);
    },
    [analytics],
  );

  const trackFileOperation = useCallback(
    (operation: string, fileType?: string, fileSize?: number) => {
      analytics.trackFileOperation(operation, fileType, fileSize);
    },
    [analytics],
  );

  const setUserId = useCallback(
    (userId: string) => {
      analytics.setUserId(userId);
    },
    [analytics],
  );

  return {
    trackEvent,
    trackError,
    trackInteraction,
    trackFileOperation,
    setUserId,
  };
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitor() {
  const analytics = getAnalytics();

  useEffect(() => {
    const monitor = new PerformanceMonitor(analytics);
    monitor.trackWebVitals();
  }, [analytics]);

  return {
    start: (label: string) => {
      const monitor = new PerformanceMonitor(analytics);
      monitor.start(label);
      return () => monitor.end(label);
    },
  };
}

/**
 * Hook for session analytics
 */
export function useSessionAnalytics() {
  const analytics = getAnalytics();

  useEffect(() => {
    const session = new SessionAnalytics(analytics);

    const trackPageAction = () => {
      session.trackAction();
    };

    document.addEventListener('click', trackPageAction);
    document.addEventListener('change', trackPageAction);

    return () => {
      document.removeEventListener('click', trackPageAction);
      document.removeEventListener('change', trackPageAction);
      session.report();
    };
  }, [analytics]);
}

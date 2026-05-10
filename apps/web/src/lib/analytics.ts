/**
 * Analytics and event tracking utility
 * Integrates with external services like Sentry, Mixpanel, etc.
 */

export interface AnalyticsEvent {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties?: Record<string, any>;
  timestamp?: number;
}

export interface AnalyticsConfig {
  enabled: boolean;
  dsn?: string; // For Sentry
  apiKey?: string; // For Mixpanel
  userId?: string;
}

let config: AnalyticsConfig = {
  enabled: typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
};

/**
 * Initialize analytics
 */
export function initializeAnalytics(cfg: Partial<AnalyticsConfig>) {
  config = { ...config, ...cfg };

  if (config.enabled) {
    // Initialize Sentry if DSN is provided (optional dependency)
    if (config.dsn && typeof window !== 'undefined') {
      try {
        // Dynamic import with fallback for optional dependency
        // eslint-disable-next-line global-require,@typescript-eslint/no-var-requires
        const Sentry = require('@sentry/nextjs');
        Sentry.init({
          dsn: config.dsn,
          tracesSampleRate: 0.1,
          environment: process.env.NODE_ENV,
        });
      } catch {
        // Sentry not installed, skip initialization
      }
    }
  }
}

/**
 * Track analytics event
 */
export function trackEvent(event: AnalyticsEvent) {
  if (!config.enabled) return;

  const eventData = {
    ...event,
    timestamp: event.timestamp || Date.now(),
    userId: config.userId,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[Analytics]', eventData);
  }

  // Send to Mixpanel if configured
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (config.apiKey && typeof window !== 'undefined' && (window as any).mixpanel) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).mixpanel.track(event.name, event.properties);
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string) {
  trackEvent({
    name: 'page_view',
    properties: {
      path,
      title: title || document.title,
    },
  });
}

/**
 * Track user action
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trackUserAction(action: string, details?: Record<string, any>) {
  trackEvent({
    name: `user_${action}`,
    properties: details,
  });
}

/**
 * Track error
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trackError(error: Error, context?: Record<string, any>) {
  if (!config.enabled) return;

  const errorData = {
    name: 'error',
    message: error.message,
    stack: error.stack,
    ...context,
  };

  // Log to Sentry if available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== 'undefined' && (window as any).__SENTRY_RELEASE__) {
    try {
      // eslint-disable-next-line global-require,@typescript-eslint/no-var-requires
      const Sentry = require('@sentry/nextjs');
      Sentry.captureException(error, { extra: context });
    } catch {
      // Sentry not available
    }
  }

  // eslint-disable-next-line no-console
  console.error('[Analytics Error]', errorData);
}

/**
 * Set user identity
 */
export function setUserId(userId: string) {
  config.userId = userId;

  // Set in Sentry if available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== 'undefined' && (window as any).__SENTRY_RELEASE__) {
    try {
      // eslint-disable-next-line global-require,@typescript-eslint/no-var-requires
      const Sentry = require('@sentry/nextjs');
      Sentry.setUser({ id: userId });
    } catch {
      // Sentry not available
    }
  }
}

/**
 * Hook for tracking page views
 */
export function usePageTracker(path: string, title?: string) {
  React.useEffect(() => {
    trackPageView(path, title);
  }, [path, title]);
}

// React is used in the hook but not imported
import React from 'react';

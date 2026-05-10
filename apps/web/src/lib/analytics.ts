/**
 * Analytics and event tracking utility
 * Integrates with external services like Sentry, Mixpanel, etc.
 */

export interface AnalyticsEvent {
  name: string;
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
    // Initialize Sentry if DSN is provided
    if (config.dsn && typeof window !== 'undefined') {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.init({
          dsn: config.dsn,
          tracesSampleRate: 0.1,
          environment: process.env.NODE_ENV,
        });
      });
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
    console.log('[Analytics]', eventData);
  }

  // Send to Mixpanel if configured
  if (config.apiKey && typeof window !== 'undefined' && (window as any).mixpanel) {
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
export function trackUserAction(action: string, details?: Record<string, any>) {
  trackEvent({
    name: `user_${action}`,
    properties: details,
  });
}

/**
 * Track error
 */
export function trackError(error: Error, context?: Record<string, any>) {
  if (!config.enabled) return;

  const errorData = {
    name: 'error',
    message: error.message,
    stack: error.stack,
    ...context,
  };

  // Log to Sentry if available
  if (typeof window !== 'undefined' && (window as any).__SENTRY_RELEASE__) {
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureException(error, { extra: context });
    });
  }

  console.error('[Analytics Error]', errorData);
}

/**
 * Set user identity
 */
export function setUserId(userId: string) {
  config.userId = userId;

  // Set in Sentry if available
  if (typeof window !== 'undefined' && (window as any).__SENTRY_RELEASE__) {
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.setUser({ id: userId });
    });
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

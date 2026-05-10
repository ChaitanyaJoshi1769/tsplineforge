/**
 * Real User Monitoring (RUM) & Analytics Integration
 * Tracks user interactions, performance metrics, and errors
 */

export interface RUMConfig {
  enabled: boolean;
  apiKey?: string;
  environment?: string;
  sampleRate?: number;
  userId?: string;
  sessionId?: string;
  release?: string;
}

export interface PageViewEvent {
  type: 'pageview';
  pathname: string;
  title?: string;
  referrer?: string;
  timestamp: number;
}

export interface CustomEvent {
  type: 'event';
  name: string;
  properties?: Record<string, unknown>;
  timestamp: number;
}

export interface ErrorEvent {
  type: 'error';
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: number;
  level: 'error' | 'warning';
}

export interface PerformanceEvent {
  type: 'performance';
  metric: string;
  value: number;
  unit?: string;
  timestamp: number;
}

export type AnalyticsEvent = PageViewEvent | CustomEvent | ErrorEvent | PerformanceEvent;

/**
 * Analytics service for tracking user interactions and performance
 */
export class AnalyticsService {
  private config: RUMConfig;
  private queue: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private events: Map<string, number> = new Map();

  constructor(config: RUMConfig = { enabled: false }) {
    this.config = {
      sampleRate: 0.1,
      environment: 'production',
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.userId = config.userId;

    if (this.config.enabled) {
      this.initialize();
    }
  }

  private initialize(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('session', { action: 'pause' });
      } else {
        this.trackEvent('session', { action: 'resume' });
      }
    });

    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    window.addEventListener('error', (event) => {
      this.trackError(event.error?.message || 'Unknown error', event.error?.stack, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(
        event.reason?.message || String(event.reason),
        event.reason?.stack,
        { type: 'unhandledPromiseRejection' },
      );
    });

    this.trackPageView(window.location.pathname, document.title);
  }

  public trackPageView(pathname: string, title?: string): void {
    if (!this.shouldTrack()) return;

    const event: PageViewEvent = {
      type: 'pageview',
      pathname,
      title,
      referrer: document.referrer,
      timestamp: Date.now(),
    };

    this.queue.push(event);
    this.sendAnalyticsEvent(event);
  }

  public trackEvent(name: string, properties?: Record<string, unknown>): void {
    if (!this.shouldTrack()) return;

    const key = `${name}:${JSON.stringify(properties)}`;
    const lastTime = this.events.get(key) || 0;
    if (Date.now() - lastTime < 1000) {
      return;
    }
    this.events.set(key, Date.now());

    const event: CustomEvent = {
      type: 'event',
      name,
      properties,
      timestamp: Date.now(),
    };

    this.queue.push(event);
    this.sendAnalyticsEvent(event);
  }

  public trackError(
    message: string,
    stack?: string,
    context?: Record<string, unknown>,
    level: 'error' | 'warning' = 'error',
  ): void {
    if (!this.shouldTrack()) return;

    const event: ErrorEvent = {
      type: 'error',
      message,
      stack,
      context,
      timestamp: Date.now(),
      level,
    };

    this.queue.push(event);
    this.sendAnalyticsEvent(event);
  }

  public trackPerformance(metric: string, value: number, unit?: string): void {
    if (!this.shouldTrack()) return;

    const event: PerformanceEvent = {
      type: 'performance',
      metric,
      value,
      unit,
      timestamp: Date.now(),
    };

    this.queue.push(event);
    this.sendAnalyticsEvent(event);
  }

  public trackInteraction(element: string, action: string): void {
    if (!this.shouldTrack()) return;

    this.trackEvent('interaction', {
      element,
      action,
      url: window.location.pathname,
    });
  }

  public trackFileOperation(operation: string, fileType?: string, fileSize?: number): void {
    if (!this.shouldTrack()) return;

    this.trackEvent('file_operation', {
      operation,
      fileType,
      fileSize,
      url: window.location.pathname,
    });
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public setProperty(key: string, value: unknown): void {
    localStorage.setItem(`analytics:${key}`, JSON.stringify(value));
  }

  public getQueuedEvents(): AnalyticsEvent[] {
    return [...this.queue];
  }

  public clearQueue(): void {
    this.queue = [];
  }

  public flush(): void {
    if (this.queue.length === 0) return;

    const events = this.queue.splice(0, this.queue.length);
    this.sendBatch(events);
  }

  private sendAnalyticsEvent(_event: AnalyticsEvent): void {
    if (typeof window !== 'undefined' && 'console' in window) {
      // Event sent
    }
  }

  private sendBatch(events: AnalyticsEvent[]): void {
    if (!this.config.apiKey) return;

    const payload = {
      sessionId: this.sessionId,
      userId: this.userId,
      events,
      environment: this.config.environment,
      release: this.config.release,
      timestamp: Date.now(),
    };

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics', blob);
    }
  }

  private shouldTrack(): boolean {
    if (!this.config.enabled) return false;

    const sampleRate = this.config.sampleRate || 0.1;
    return Math.random() < sampleRate;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

let analyticsInstance: AnalyticsService | null = null;

export function getAnalytics(config?: RUMConfig): AnalyticsService {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsService(config);
  }
  return analyticsInstance;
}

export class PerformanceMonitor {
  private analytics: AnalyticsService;
  private marks: Map<string, number> = new Map();

  constructor(analytics: AnalyticsService) {
    this.analytics = analytics;
  }

  public start(label: string): void {
    this.marks.set(label, performance.now());
  }

  public end(label: string, unit: string = 'ms'): number {
    const startTime = this.marks.get(label);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.analytics.trackPerformance(label, duration, unit);
    this.marks.delete(label);

    return duration;
  }

  public trackWebVitals(): void {
    if (typeof window === 'undefined') return;

    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.analytics.trackPerformance('LCP', lastEntry.startTime, 'ms');
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch {
        // LCP not supported
      }
    }

    if (document.readyState === 'complete') {
      const pageLoadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      this.analytics.trackPerformance('page_load', pageLoadTime, 'ms');
    } else {
      window.addEventListener('load', () => {
        const pageLoadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        this.analytics.trackPerformance('page_load', pageLoadTime, 'ms');
      });
    }
  }
}

export class SessionAnalytics {
  private analytics: AnalyticsService;
  private sessionStartTime: number;
  private actionCount: number = 0;

  constructor(analytics: AnalyticsService) {
    this.analytics = analytics;
    this.sessionStartTime = Date.now();
  }

  public getDuration(): number {
    return Date.now() - this.sessionStartTime;
  }

  public trackAction(): void {
    this.actionCount++;
  }

  public getActionCount(): number {
    return this.actionCount;
  }

  public getSummary(): Record<string, unknown> {
    return {
      duration: this.getDuration(),
      actions: this.actionCount,
      avgActionsPerMinute: (this.actionCount / (this.getDuration() / 60000)).toFixed(2),
    };
  }

  public report(): void {
    this.analytics.trackEvent('session_end', this.getSummary());
  }
}

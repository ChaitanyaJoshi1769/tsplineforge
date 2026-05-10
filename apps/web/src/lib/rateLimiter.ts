/**
 * API Rate Limiting & Protection
 * Implements client-side rate limiting, request throttling, and protection
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  retryAfter?: number; // Retry-After header value
  message?: string;
  statusCode?: number;
}

export interface RateLimitStatus {
  remaining: number;
  limit: number;
  resetTime: number;
  isLimited: boolean;
}

/**
 * Token bucket rate limiter
 * Allows burst traffic up to maxRequests, then enforces rate limiting
 */
export class TokenBucketLimiter {
  private config: RateLimitConfig;
  private tokens: number;
  private lastRefillTime: number;
  private refillRate: number; // tokens per ms

  constructor(config: RateLimitConfig) {
    this.config = {
      statusCode: 429,
      ...config,
    };
    this.tokens = config.maxRequests;
    this.lastRefillTime = Date.now();
    this.refillRate = config.maxRequests / config.windowMs;
  }

  /**
   * Check if request is allowed
   */
  public isAllowed(): boolean {
    this.refillBucket();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  /**
   * Get current rate limit status
   */
  public getStatus(): RateLimitStatus {
    this.refillBucket();
    const resetTime = this.lastRefillTime + this.config.windowMs;

    return {
      remaining: Math.floor(this.tokens),
      limit: this.config.maxRequests,
      resetTime,
      isLimited: this.tokens < 1,
    };
  }

  /**
   * Refill bucket based on elapsed time
   */
  private refillBucket(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefillTime;

    if (timePassed >= this.config.windowMs) {
      // Reset bucket
      this.tokens = this.config.maxRequests;
      this.lastRefillTime = now;
    } else {
      // Add tokens based on time passed
      this.tokens = Math.min(
        this.config.maxRequests,
        this.tokens + timePassed * this.refillRate,
      );
    }
  }
}

/**
 * Sliding window rate limiter
 * More accurate but slightly more overhead than token bucket
 */
export class SlidingWindowLimiter {
  private config: RateLimitConfig;
  private requests: number[] = [];

  constructor(config: RateLimitConfig) {
    this.config = {
      statusCode: 429,
      ...config,
    };
  }

  /**
   * Check if request is allowed
   */
  public isAllowed(): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Remove old requests outside the window
    this.requests = this.requests.filter((time) => time > windowStart);

    if (this.requests.length < this.config.maxRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  /**
   * Get current rate limit status
   */
  public getStatus(): RateLimitStatus {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Count requests in window
    const recentRequests = this.requests.filter((time) => time > windowStart);
    const remaining = Math.max(0, this.config.maxRequests - recentRequests.length);

    return {
      remaining,
      limit: this.config.maxRequests,
      resetTime: now + this.config.windowMs,
      isLimited: remaining === 0,
    };
  }
}

/**
 * Per-endpoint rate limiter
 * Manages rate limits for different API endpoints
 */
export class EndpointRateLimiter {
  private limiters: Map<string, TokenBucketLimiter> = new Map();
  private defaultConfig: RateLimitConfig;
  private endpointConfigs: Map<string, RateLimitConfig> = new Map();

  constructor(defaultConfig: RateLimitConfig = { maxRequests: 60, windowMs: 60000 }) {
    this.defaultConfig = defaultConfig;
  }

  /**
   * Set custom rate limit for specific endpoint
   */
  public setEndpointLimit(endpoint: string, config: RateLimitConfig): void {
    this.endpointConfigs.set(endpoint, config);
    this.limiters.delete(endpoint); // Reset limiter
  }

  /**
   * Check if request to endpoint is allowed
   */
  public isAllowed(endpoint: string): boolean {
    let limiter = this.limiters.get(endpoint);

    if (!limiter) {
      const config = this.endpointConfigs.get(endpoint) || this.defaultConfig;
      limiter = new TokenBucketLimiter(config);
      this.limiters.set(endpoint, limiter);
    }

    return limiter.isAllowed();
  }

  /**
   * Get status for endpoint
   */
  public getStatus(endpoint: string): RateLimitStatus {
    let limiter = this.limiters.get(endpoint);

    if (!limiter) {
      const config = this.endpointConfigs.get(endpoint) || this.defaultConfig;
      limiter = new TokenBucketLimiter(config);
      this.limiters.set(endpoint, limiter);
    }

    return limiter.getStatus();
  }
}

/**
 * Request throttler with callback
 */
export class RequestThrottler {
  private lastCallTime: number = 0;
  private minInterval: number;
  private pending: (() => unknown) | null = null;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(minIntervalMs: number = 1000) {
    this.minInterval = minIntervalMs;
  }

  /**
   * Execute function with throttling
   */
  public execute<T>(fn: () => T): T | null {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;

    if (timeSinceLastCall >= this.minInterval) {
      this.lastCallTime = now;
      return fn();
    } else {
      // Schedule for later
      this.pending = fn;

      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      this.timeoutId = setTimeout(() => {
        if (this.pending) {
          this.lastCallTime = Date.now();
          this.pending();
          this.pending = null;
        }
      }, this.minInterval - timeSinceLastCall);

      return null;
    }
  }

  /**
   * Get time until next allowed request
   */
  public getTimeUntilNext(): number {
    const timeSinceLastCall = Date.now() - this.lastCallTime;
    return Math.max(0, this.minInterval - timeSinceLastCall);
  }
}

/**
 * Request debouncer (wait for silence before executing)
 */
export class RequestDebouncer<T> {
  private timeoutId: NodeJS.Timeout | null = null;
  private delayMs: number;
  private pendingFn: (() => Promise<T>) | null = null;
  private lastCallTime: number = 0;

  constructor(delayMs: number = 500) {
    this.delayMs = delayMs;
  }

  /**
   * Schedule function execution with debouncing
   */
  public async execute(fn: () => Promise<T>): Promise<T | null> {
    this.lastCallTime = Date.now();
    this.pendingFn = fn;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    return new Promise((resolve) => {
      this.timeoutId = setTimeout(async () => {
        if (this.pendingFn === fn) {
          try {
            const result = await fn();
            resolve(result);
          } catch (error) {
            resolve(null);
          }
        }
      }, this.delayMs);
    });
  }

  /**
   * Cancel pending execution
   */
  public cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.pendingFn = null;
  }

  /**
   * Get time until next execution
   */
  public getTimeUntilExecution(): number {
    if (!this.timeoutId) return 0;
    const timeSinceLastCall = Date.now() - this.lastCallTime;
    return Math.max(0, this.delayMs - timeSinceLastCall);
  }
}

/**
 * Adaptive rate limiter (adjusts based on response codes)
 */
export class AdaptiveRateLimiter {
  private baseLimiter: TokenBucketLimiter;
  private backoffMultiplier: number = 1;
  private maxBackoff: number = 10;
  private recoveryTime: number = 60000; // 1 minute
  private lastErrorTime: number = 0;

  constructor(baseConfig: RateLimitConfig) {
    this.baseLimiter = new TokenBucketLimiter(baseConfig);
  }

  /**
   * Check if allowed and handle backoff
   */
  public isAllowed(): boolean {
    // Check if we should recover from backoff
    if (this.backoffMultiplier > 1) {
      const timeSinceError = Date.now() - this.lastErrorTime;
      if (timeSinceError > this.recoveryTime) {
        this.backoffMultiplier = 1; // Reset backoff
      }
    }

    const allowed = this.baseLimiter.isAllowed();
    if (!allowed && this.backoffMultiplier < this.maxBackoff) {
      this.backoffMultiplier *= 1.5;
      this.lastErrorTime = Date.now();
    }

    return allowed;
  }

  /**
   * Handle error response (429, 503, etc.)
   */
  public handleError(statusCode: number): void {
    if (statusCode === 429 || statusCode === 503) {
      this.backoffMultiplier = Math.min(this.maxBackoff, this.backoffMultiplier * 2);
      this.lastErrorTime = Date.now();
    }
  }

  /**
   * Get backoff multiplier
   */
  public getBackoffMultiplier(): number {
    return this.backoffMultiplier;
  }

  /**
   * Get status
   */
  public getStatus(): RateLimitStatus {
    return this.baseLimiter.getStatus();
  }
}

// Global rate limiters
const globalEndpointLimiter = new EndpointRateLimiter({
  maxRequests: 100,
  windowMs: 60000,
});

export function getEndpointRateLimiter(): EndpointRateLimiter {
  return globalEndpointLimiter;
}

'use client';

import { useCallback, useRef, useState } from 'react';
import {
  TokenBucketLimiter,
  RequestThrottler,
  RequestDebouncer,
  AdaptiveRateLimiter,
  getEndpointRateLimiter,
  type RateLimitConfig,
  type RateLimitStatus,
} from '@/lib/rateLimiter';

/**
 * Hook for token bucket rate limiting
 */
export function useTokenBucketLimiter(config: RateLimitConfig) {
  const limiterRef = useRef(new TokenBucketLimiter(config));
  const [status, setStatus] = useState<RateLimitStatus>(limiterRef.current.getStatus());

  const checkLimit = useCallback(() => {
    const allowed = limiterRef.current.isAllowed();
    const newStatus = limiterRef.current.getStatus();
    setStatus(newStatus);
    return allowed;
  }, []);

  const getStatus = useCallback(() => {
    const newStatus = limiterRef.current.getStatus();
    setStatus(newStatus);
    return newStatus;
  }, []);

  return {
    checkLimit,
    getStatus,
    status,
  };
}

/**
 * Hook for endpoint-specific rate limiting
 */
export function useEndpointRateLimit(endpoint: string) {
  const limiter = getEndpointRateLimiter();
  const [status, setStatus] = useState<RateLimitStatus>(limiter.getStatus(endpoint));

  const checkLimit = useCallback(() => {
    const allowed = limiter.isAllowed(endpoint);
    const newStatus = limiter.getStatus(endpoint);
    setStatus(newStatus);
    return allowed;
  }, [endpoint, limiter]);

  const getStatus = useCallback(() => {
    const newStatus = limiter.getStatus(endpoint);
    setStatus(newStatus);
    return newStatus;
  }, [endpoint, limiter]);

  const setCustomLimit = useCallback(
    (config: RateLimitConfig) => {
      limiter.setEndpointLimit(endpoint, config);
    },
    [endpoint, limiter],
  );

  return {
    checkLimit,
    getStatus,
    setCustomLimit,
    status,
  };
}

/**
 * Hook for request throttling
 */
export function useRequestThrottler(minIntervalMs: number = 1000) {
  const throttlerRef = useRef(new RequestThrottler(minIntervalMs));
  const [timeUntilNext, setTimeUntilNext] = useState(0);

  const execute = useCallback(
    <T,>(fn: () => T): T | null => {
      const result = throttlerRef.current.execute(fn);
      setTimeUntilNext(throttlerRef.current.getTimeUntilNext());
      return result;
    },
    [],
  );

  const getTimeUntilNext = useCallback(() => {
    const time = throttlerRef.current.getTimeUntilNext();
    setTimeUntilNext(time);
    return time;
  }, []);

  return {
    execute,
    getTimeUntilNext,
    timeUntilNext,
  };
}

/**
 * Hook for request debouncing
 */
export function useRequestDebouncer<T>(delayMs: number = 500) {
  const debouncerRef = useRef(new RequestDebouncer<T>(delayMs));
  const [isWaiting, setIsWaiting] = useState(false);
  const [timeUntilExecution, setTimeUntilExecution] = useState(0);

  const execute = useCallback(
    async (fn: () => Promise<T>): Promise<T | null> => {
      setIsWaiting(true);
      const result = await debouncerRef.current.execute(fn);
      setIsWaiting(false);
      return result;
    },
    [],
  );

  const cancel = useCallback(() => {
    debouncerRef.current.cancel();
    setIsWaiting(false);
  }, []);

  const getTimeUntilExecution = useCallback(() => {
    const time = debouncerRef.current.getTimeUntilExecution();
    setTimeUntilExecution(time);
    return time;
  }, []);

  return {
    execute,
    cancel,
    getTimeUntilExecution,
    isWaiting,
    timeUntilExecution,
  };
}

/**
 * Hook for adaptive rate limiting
 */
export function useAdaptiveRateLimit(baseConfig: RateLimitConfig) {
  const limiterRef = useRef(new AdaptiveRateLimiter(baseConfig));
  const [status, setStatus] = useState<RateLimitStatus>(limiterRef.current.getStatus());
  const [backoffMultiplier, setBackoffMultiplier] = useState(1);

  const checkLimit = useCallback(() => {
    const allowed = limiterRef.current.isAllowed();
    const newStatus = limiterRef.current.getStatus();
    setStatus(newStatus);
    setBackoffMultiplier(limiterRef.current.getBackoffMultiplier());
    return allowed;
  }, []);

  const handleError = useCallback((statusCode: number) => {
    limiterRef.current.handleError(statusCode);
    const newStatus = limiterRef.current.getStatus();
    setStatus(newStatus);
    setBackoffMultiplier(limiterRef.current.getBackoffMultiplier());
  }, []);

  return {
    checkLimit,
    handleError,
    status,
    backoffMultiplier,
  };
}

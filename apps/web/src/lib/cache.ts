/**
 * Request caching layer for performance optimization
 * Supports multiple caching strategies and TTL-based expiration
 */

export type CacheStrategy = 'memory' | 'sessionStorage' | 'localStorage';

export interface CacheConfig {
  strategy?: CacheStrategy;
  ttl?: number; // Time to live in milliseconds
  key?: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number;
}

/**
 * In-memory cache for fast access
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    // Check TTL
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Storage-based cache (localStorage or sessionStorage)
 */
class StorageCache {
  constructor(private storage: Storage) {}

  set<T>(key: string, data: T, ttl?: number): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      this.storage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to set cache:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(key);
      if (!item) return null;

      const entry = JSON.parse(item) as CacheEntry<T>;

      // Check TTL
      if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
        this.storage.removeItem(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to get cache:', error);
      return null;
    }
  }

  has(key: string): boolean {
    const value = this.get(key);
    return value !== null;
  }

  delete(key: string): void {
    this.storage.removeItem(key);
  }

  clear(): void {
    this.storage.clear();
  }

  size(): number {
    return this.storage.length;
  }
}

/**
 * Main cache manager that supports multiple strategies
 */
class CacheManager {
  private memoryCache = new MemoryCache();
  private sessionCache = new StorageCache(
    typeof window !== 'undefined' ? window.sessionStorage : ({} as Storage),
  );
  private localCache = new StorageCache(
    typeof window !== 'undefined' ? window.localStorage : ({} as Storage),
  );

  private getCache(strategy: CacheStrategy) {
    switch (strategy) {
      case 'sessionStorage':
        return this.sessionCache;
      case 'localStorage':
        return this.localCache;
      case 'memory':
      default:
        return this.memoryCache;
    }
  }

  set<T>(key: string, data: T, config: CacheConfig = {}): void {
    const { strategy = 'memory', ttl } = config;
    const cache = this.getCache(strategy);
    cache.set(key, data, ttl);
  }

  get<T>(key: string, strategy: CacheStrategy = 'memory'): T | null {
    const cache = this.getCache(strategy);
    return cache.get<T>(key);
  }

  has(key: string, strategy: CacheStrategy = 'memory'): boolean {
    const cache = this.getCache(strategy);
    return cache.has(key);
  }

  delete(key: string, strategy: CacheStrategy = 'memory'): void {
    const cache = this.getCache(strategy);
    cache.delete(key);
  }

  clear(strategy?: CacheStrategy): void {
    if (strategy) {
      this.getCache(strategy).clear();
    } else {
      this.memoryCache.clear();
      this.sessionCache.clear();
      this.localCache.clear();
    }
  }

  size(strategy: CacheStrategy = 'memory'): number {
    const cache = this.getCache(strategy);
    return cache.size();
  }
}

// Global cache instance
export const cache = new CacheManager();

// ============= REQUEST CACHE MIDDLEWARE =============

/**
 * Generate cache key from request
 */
function generateCacheKey(url: string, options?: RequestInit): string {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.stringify(options.body) : '';
  return `${method}:${url}:${body}`;
}

/**
 * Cached fetch with configurable strategy
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit & CacheConfig,
): Promise<T> {
  const { strategy = 'memory', ttl = 5 * 60 * 1000, ...fetchOptions } = options || {};
  const cacheKey = generateCacheKey(url, fetchOptions);

  // Check cache
  const cached = cache.get<T>(cacheKey, strategy);
  if (cached !== null) {
    return cached;
  }

  // Fetch from network
  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  const data = (await response.json()) as T;

  // Store in cache
  cache.set(cacheKey, data, { strategy, ttl });

  return data;
}

// ============= REACT HOOK FOR CACHED REQUESTS =============

import { useState, useEffect, useCallback } from 'react';

export interface UseCachedFetchOptions extends CacheConfig {
  skip?: boolean;
  retryCount?: number;
  retryDelay?: number;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

export interface UseCachedFetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useCachedFetch<T>(
  url: string,
  options?: RequestInit & UseCachedFetchOptions,
): UseCachedFetchState<T> {
  const {
    skip = false,
    strategy = 'memory',
    ttl,
    retryCount = 0,
    retryDelay = 1000,
    onSuccess,
    onError,
    ...fetchOptions
  } = options || {};

  const [state, setState] = useState<UseCachedFetchState<T>>({
    data: null,
    loading: !skip,
    error: null,
    refetch: async () => {},
  });

  const fetchData = useCallback(async () => {
    if (skip) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const result = await cachedFetch<T>(url, {
          strategy,
          ttl,
          ...fetchOptions,
        });
        setState((prev) => ({
          ...prev,
          data: result,
          loading: false,
          error: null,
        }));
        onSuccess?.(result);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < retryCount) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    setState((prev) => ({
      ...prev,
      loading: false,
      error: lastError,
    }));
    onError?.(lastError!);
  }, [url, skip, strategy, ttl, retryCount, retryDelay, fetchOptions, onSuccess, onError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update refetch in state
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      refetch: fetchData,
    }));
  }, [fetchData]);

  return state;
}

// ============= CACHE INVALIDATION =============

/**
 * Invalidate cache by pattern matching
 */
export function invalidateCache(pattern?: string | RegExp, strategy?: CacheStrategy): void {
  if (!pattern) {
    cache.clear(strategy);
    return;
  }

  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  const allKeys = getAllCacheKeys();

  allKeys.forEach((key) => {
    if (regex.test(key)) {
      cache.delete(key, strategy || 'memory');
    }
  });
}

/**
 * Get all cache keys (simplified - in real implementation would track all keys)
 */
function getAllCacheKeys(): string[] {
  // This is a simplified implementation
  // In production, you'd need to track keys separately
  return [];
}

// ============= STALE-WHILE-REVALIDATE PATTERN =============

/**
 * Implements stale-while-revalidate caching pattern
 * Returns cached data immediately while fetching fresh data in the background
 */
export async function staleWhileRevalidate<T>(
  url: string,
  options?: RequestInit & CacheConfig,
): Promise<T> {
  const { strategy = 'memory', ttl = 5 * 60 * 1000, ...fetchOptions } = options || {};
  const cacheKey = generateCacheKey(url, fetchOptions);

  // Return cached data if available
  const cached = cache.get<T>(cacheKey, strategy);
  if (cached !== null) {
    // Revalidate in background (don't await)
    cachedFetch<T>(url, { strategy, ttl, ...fetchOptions }).catch((error) => {
      console.warn('Background revalidation failed:', error);
    });
    return cached;
  }

  // No cache, fetch normally
  return cachedFetch<T>(url, { strategy, ttl, ...fetchOptions });
}

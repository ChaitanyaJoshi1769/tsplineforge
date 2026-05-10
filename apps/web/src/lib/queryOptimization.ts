/**
 * Database Query Optimization Utilities
 * Best practices and utilities for optimized queries
 */

export interface QueryOptimizationStats {
  queryTime: number;
  cacheHit: boolean;
  resultCount: number;
  optimizationType: string;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Query optimizer with caching and batching
 */
export class QueryOptimizer {
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private cacheTTL: number; // milliseconds
  private pendingQueries: Map<string, Promise<unknown>> = new Map();

  constructor(cacheTTLMs: number = 5 * 60 * 1000) {
    this.cacheTTL = cacheTTLMs;
  }

  /**
   * Fetch with caching
   */
  public async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < (ttl || this.cacheTTL)) {
      return cached.data as T;
    }

    // Check pending
    let promise = this.pendingQueries.get(key);
    if (!promise) {
      promise = fetcher();
      this.pendingQueries.set(key, promise);

      try {
        const result = await promise;
        this.cache.set(key, { data: result, timestamp: Date.now() });
        return result as T;
      } finally {
        this.pendingQueries.delete(key);
      }
    }

    return promise as Promise<T>;
  }

  /**
   * Batch multiple queries
   */
  public async batch<T>(queries: Array<() => Promise<unknown>>): Promise<T[]> {
    return Promise.all(queries.map((q) => q())) as Promise<T[]>;
  }

  /**
   * Pagination helper
   */
  public getPaginationParams(config: PaginationConfig): {
    limit: number;
    offset: number;
    sort?: string;
  } {
    return {
      limit: config.pageSize,
      offset: (config.page - 1) * config.pageSize,
      sort: config.sort,
    };
  }

  /**
   * Clear cache
   */
  public clearCache(pattern?: string): void {
    if (pattern) {
      const keys = Array.from(this.cache.keys()).filter((k) => k.includes(pattern));
      keys.forEach((k) => this.cache.delete(k));
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    cacheSize: number;
    pendingQueries: number;
  } {
    return {
      cacheSize: this.cache.size,
      pendingQueries: this.pendingQueries.size,
    };
  }
}

/**
 * Index-aware query builder
 * Helps construct efficient queries that use indexes
 */
export class IndexAwareQueryBuilder {
  private indexes: Set<string> = new Set();

  /**
   * Register indexed columns
   */
  public registerIndexes(columns: string[]): void {
    columns.forEach((col) => this.indexes.add(col));
  }

  /**
   * Check if column is indexed
   */
  public isIndexed(column: string): boolean {
    return this.indexes.has(column);
  }

  /**
   * Build optimized query (should use indexed columns first)
   */
  public buildQuery(filters: Record<string, unknown>): {
    query: string;
    params: unknown[];
    isOptimal: boolean;
  } {
    const indexedFilters = Object.entries(filters).filter(([key]) => this.isIndexed(key));
    const otherFilters = Object.entries(filters).filter(([key]) => !this.isIndexed(key));

    const allFilters = [...indexedFilters, ...otherFilters];
    const whereClause = allFilters.map(([key]) => `${key} = ?`).join(' AND ');

    const params = allFilters.map(([, value]) => value);
    const isOptimal = indexedFilters.length > 0;

    return {
      query: `WHERE ${whereClause}`,
      params,
      isOptimal,
    };
  }
}

/**
 * Query result aggregator
 * Combines results from multiple sources efficiently
 */
export class QueryResultAggregator {
  /**
   * Aggregate results from multiple queries
   */
  public static aggregate<T>(results: T[][]): T[] {
    return results.reduce((acc, curr) => [...acc, ...curr], []);
  }

  /**
   * Deduplicate results
   */
  public static deduplicate<T>(results: T[], keyFn: (item: T) => unknown): T[] {
    const seen = new Set<unknown>();
    return results.filter((item) => {
      const key = keyFn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Sort results efficiently
   */
  public static sortResults<T>(
    results: T[],
    sortFn: (a: T, b: T) => number,
    reverse: boolean = false,
  ): T[] {
    const sorted = results.sort(sortFn);
    return reverse ? sorted.reverse() : sorted;
  }

  /**
   * Group results
   */
  public static groupResults<T, K>(
    results: T[],
    keyFn: (item: T) => K,
  ): Map<K, T[]> {
    const grouped = new Map<K, T[]>();
    results.forEach((item) => {
      const key = keyFn(item);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(item);
    });
    return grouped;
  }
}

/**
 * N+1 query problem preventer
 * Uses entity loading strategies to prevent multiple round-trips
 */
export class N1QueryPreventer {
  /**
   * Load related entities efficiently
   */
  public static async loadRelated<T, R>(
    items: T[],
    idFn: (item: T) => unknown,
    batchLoader: (ids: unknown[]) => Promise<Map<unknown, R>>,
    setRelatedFn: (item: T, related: R) => void,
  ): Promise<void> {
    const ids = items.map(idFn);
    const related = await batchLoader(ids);

    items.forEach((item) => {
      const id = idFn(item);
      const rel = related.get(id);
      if (rel) {
        setRelatedFn(item, rel);
      }
    });
  }
}

/**
 * Query performance monitoring
 */
export class QueryPerformanceMonitor {
  private metrics: Map<string, QueryOptimizationStats[]> = new Map();

  /**
   * Record query execution
   */
  public recordQuery(
    name: string,
    stats: Omit<QueryOptimizationStats, 'optimizationType'>,
    optimizationType: string = 'standard',
  ): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push({
      ...stats,
      optimizationType,
    });
  }

  /**
   * Get average query time
   */
  public getAverageTime(name: string): number {
    const stats = this.metrics.get(name) || [];
    if (stats.length === 0) return 0;

    const total = stats.reduce((sum, s) => sum + s.queryTime, 0);
    return total / stats.length;
  }

  /**
   * Get cache hit rate
   */
  public getCacheHitRate(name: string): number {
    const stats = this.metrics.get(name) || [];
    if (stats.length === 0) return 0;

    const hits = stats.filter((s) => s.cacheHit).length;
    return hits / stats.length;
  }

  /**
   * Get performance report
   */
  public getReport(): Record<string, { avgTime: number; cacheHitRate: number }> {
    const report: Record<string, { avgTime: number; cacheHitRate: number }> = {};

    for (const [name] of this.metrics) {
      report[name] = {
        avgTime: this.getAverageTime(name),
        cacheHitRate: this.getCacheHitRate(name),
      };
    }

    return report;
  }
}

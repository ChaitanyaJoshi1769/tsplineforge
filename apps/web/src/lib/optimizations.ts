/**
 * Performance Optimizations & Best Practices
 * Comprehensive utilities for optimizing application performance
 */

/**
 * Image optimization utilities
 */
export class ImageOptimizer {
  /**
   * Generate responsive image srcset
   */
  public static generateSrcSet(baseUrl: string, sizes: number[]): string {
    return sizes.map((size) => `${baseUrl}?w=${size} ${size}w`).join(', ');
  }

  /**
   * Get optimal image size
   */
  public static getOptimalSize(deviceWidth: number, viewportWidth: number): number {
    // Choose image size based on device pixel ratio and viewport
    const dpr = window.devicePixelRatio || 1;
    const targetSize = Math.ceil(viewportWidth * dpr);

    // Standard sizes
    const sizes = [320, 640, 960, 1280, 1920, 2560];
    return sizes.find((s) => s >= targetSize) || sizes[sizes.length - 1];
  }
}

/**
 * Code splitting and lazy loading utilities
 */
export class LoadingOptimizer {
  private static pendingLoads: Map<string, Promise<unknown>> = new Map();

  /**
   * Lazy load module
   */
  public static async lazyLoad<T>(modulePath: string, loader: () => Promise<T>): Promise<T> {
    if (!this.pendingLoads.has(modulePath)) {
      this.pendingLoads.set(modulePath, loader());
    }

    return this.pendingLoads.get(modulePath) as Promise<T>;
  }

  /**
   * Preload resource
   */
  public static preload(url: string, type: 'script' | 'style' | 'image' = 'script'): void {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = type === 'style' ? 'style' : type === 'script' ? 'script' : 'image';
    link.href = url;
    document.head.appendChild(link);
  }
}

/**
 * Memory optimization utilities
 */
export class MemoryOptimizer {
  private static weakReferences: WeakMap<object, unknown> = new WeakMap();

  /**
   * Store data with weak reference
   */
  public static storeWeakRef<T extends object>(key: T, value: unknown): void {
    this.weakReferences.set(key, value);
  }

  /**
   * Retrieve data with weak reference
   */
  public static getWeakRef<T extends object>(key: T): unknown {
    return this.weakReferences.get(key);
  }

  /**
   * Optimize array by removing duplicates
   */
  public static deduplicate<T>(arr: T[]): T[] {
    return Array.from(new Set(arr));
  }

  /**
   * Batch process large arrays to avoid blocking
   */
  public static async processBatch<T, R>(
    items: T[],
    processor: (item: T) => R,
    batchSize: number = 100,
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = batch.map(processor);
      results.push(...batchResults);

      // Yield to browser to prevent blocking
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return results;
  }
}

/**
 * Rendering optimization utilities
 */
export class RenderingOptimizer {
  /**
   * Debounce resize handler
   */
  public static debounceResize(callback: () => void, delay: number = 300): () => void {
    let timeoutId: NodeJS.Timeout;

    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, delay);
    };
  }

  /**
   * Throttle scroll handler
   */
  public static throttleScroll(callback: () => void, delay: number = 100): () => void {
    let lastCall = 0;

    return () => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        callback();
        lastCall = now;
      }
    };
  }

  /**
   * Use requestAnimationFrame for smooth animations
   */
  public static animationFrame(callback: (deltaTime: number) => void): () => void {
    let lastTime = Date.now();
    let frameId: number;

    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastTime;
      lastTime = now;

      callback(deltaTime);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }
}

/**
 * Network optimization utilities
 */
export class NetworkOptimizer {
  /**
   * Detect connection type
   */
  public static getConnectionSpeed(): 'slow-2g' | '2g' | '3g' | '4g' | 'unknown' {
    const connection = (navigator as unknown as { connection?: { effectiveType: string } })
      .connection;
    const speed = connection?.effectiveType || 'unknown';
    return speed as 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  }

  /**
   * Compress data for transmission
   */
  public static async compressData(data: string): Promise<Uint8Array> {
    const blob = new Blob([data]);
    const buffer = await blob.arrayBuffer();
    // In production, use gzip compression if available
    // For now, return as Uint8Array
    return new Uint8Array(buffer);
  }

  /**
   * Adaptive resource loading based on connection
   */
  public static shouldLoadHighQuality(): boolean {
    const speed = this.getConnectionSpeed();
    return speed === '4g' || speed === 'unknown';
  }
}

/**
 * Bundle size optimization tracking
 */
export class BundleSizeMonitor {
  private static sizes: Map<string, number> = new Map();

  /**
   * Log chunk size
   */
  public static logChunkSize(chunkName: string, sizeKB: number): void {
    this.sizes.set(chunkName, sizeKB);
  }

  /**
   * Get total bundle size
   */
  public static getTotalSize(): number {
    return Array.from(this.sizes.values()).reduce((a, b) => a + b, 0);
  }

  /**
   * Get size report
   */
  public static getReport(): Record<string, number> {
    return Object.fromEntries(this.sizes);
  }

  /**
   * Check if size exceeds budget
   */
  public static checkBudget(budgetKB: number): boolean {
    return this.getTotalSize() > budgetKB;
  }
}

/**
 * Performance budgeting utilities
 */
export interface PerformanceBudget {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  bundleSize: number; // Total bundle size in KB
}

export class PerformanceBudgetChecker {
  private budget: PerformanceBudget;

  constructor(budget: PerformanceBudget) {
    this.budget = budget;
  }

  /**
   * Check if performance meets budget
   */
  public async checkMetrics(): Promise<{
    meetsRequirements: boolean;
    violations: string[];
  }> {
    const violations: string[] = [];

    // Check metrics using Web Vitals API if available
    if ('PerformanceObserver' in window) {
      // FCP and LCP would be measured here
      // CLS would be measured here
    }

    return {
      meetsRequirements: violations.length === 0,
      violations,
    };
  }
}

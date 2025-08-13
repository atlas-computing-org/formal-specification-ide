import { performance } from 'perf_hooks';

// Performance monitoring and optimization utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();
  private memoryUsage: number[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(operation: string): void {
    this.startTimes.set(operation, performance.now());
  }

  endTimer(operation: string): number {
    const startTime = this.startTimes.get(operation);
    if (!startTime) {
      throw new Error(`Timer for operation '${operation}' was not started`);
    }

    const duration = performance.now() - startTime;
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);
    this.startTimes.delete(operation);

    // Track memory usage
    if (global.gc) {
      global.gc();
      this.memoryUsage.push(process.memoryUsage().heapUsed);
    }

    return duration;
  }

  getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [operation, times] of this.metrics) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      result[operation] = { avg, min, max, count: times.length };
    }
    
    return result;
  }

  getMemoryUsage(): { current: number; avg: number; peak: number } {
    const current = process.memoryUsage().heapUsed;
    const avg = this.memoryUsage.length > 0 
      ? this.memoryUsage.reduce((a, b) => a + b, 0) / this.memoryUsage.length 
      : current;
    const peak = Math.max(current, ...this.memoryUsage);
    
    return { current, avg, peak };
  }

  reset(): void {
    this.metrics.clear();
    this.startTimes.clear();
    this.memoryUsage = [];
  }
}

// Advanced LRU Cache with TTL and memory management
export class LRUCache<K, V> {
  private capacity: number;
  private ttl: number;
  private cache: Map<K, { value: V; timestamp: number }>;
  private accessOrder: K[] = [];

  constructor(capacity: number = 1000, ttl: number = 300000) { // 5 minutes default TTL
    this.capacity = capacity;
    this.ttl = ttl;
    this.cache = new Map();
  }

  set(key: K, value: V): void {
    const now = Date.now();
    
    // Clean expired entries first
    this.cleanup();
    
    if (this.cache.has(key)) {
      // Update existing entry
      this.cache.set(key, { value, timestamp: now });
      this.moveToFront(key);
    } else {
      // Add new entry
      if (this.cache.size >= this.capacity) {
        this.evictLRU();
      }
      this.cache.set(key, { value, timestamp: now });
      this.accessOrder.unshift(key);
    }
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.delete(key);
      return undefined;
    }

    this.moveToFront(key);
    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    }
    return deleted;
  }

  private moveToFront(key: K): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.unshift(key);
    }
  }

  private evictLRU(): void {
    const lruKey = this.accessOrder.pop();
    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: K[] = [];
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.ttl) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.delete(key));
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }
}

// High-performance string utilities
export class StringOptimizer {
  private static readonly commonPatterns = new Map<string, RegExp>();
  
  static getRegex(pattern: string, flags: string = 'g'): RegExp {
    const key = `${pattern}:${flags}`;
    if (!this.commonPatterns.has(key)) {
      this.commonPatterns.set(key, new RegExp(pattern, flags));
    }
    return this.commonPatterns.get(key)!;
  }

  static fastReplace(text: string, search: string, replace: string): string {
    if (search.length === 1) {
      // Single character replacement - use split/join for better performance
      return text.split(search).join(replace);
    }
    return text.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
  }

  static fastSplit(text: string, separator: string): string[] {
    if (separator.length === 1) {
      return text.split(separator);
    }
    // For multi-character separators, use regex
    return text.split(new RegExp(separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
  }

  static sanitizeHTML(text: string): string {
    // Optimized HTML sanitization using pre-compiled regex
    return text
      .replace(StringOptimizer.getRegex('<script[^>]*>.*?</script>', 'gis'), '')
      .replace(StringOptimizer.getRegex('javascript:', 'gi'), '')
      .replace(StringOptimizer.getRegex('on\\w+\\s*=', 'gi'), '');
  }
}

// Memory pool for frequently allocated objects
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  constructor(factory: () => T, reset: (obj: T) => void, maxSize: number = 100) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool.length = 0;
  }
}

// Performance decorator for method timing
export function measurePerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const monitor = PerformanceMonitor.getInstance();
    const operationName = `${target.constructor.name}.${propertyKey}`;
    
    monitor.startTimer(operationName);
    try {
      const result = await originalMethod.apply(this, args);
      return result;
    } finally {
      monitor.endTimer(operationName);
    }
  };

  return descriptor;
}

// Batch processing utility for large datasets
export class BatchProcessor<T, R> {
  static async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 100,
    concurrency: number = 4
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize * concurrency) {
      const batch = items.slice(i, i + batchSize * concurrency);
      const batchPromises = batch.map(processor);
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }
}

// Performance constants
export const PERFORMANCE_CONSTANTS = {
  MAX_CACHE_SIZE: 10000,
  DEFAULT_TTL: 300000, // 5 minutes
  BATCH_SIZE: 100,
  MAX_CONCURRENCY: 8,
  MEMORY_THRESHOLD: 0.8, // 80% memory usage threshold
  GC_INTERVAL: 60000, // 1 minute
} as const;

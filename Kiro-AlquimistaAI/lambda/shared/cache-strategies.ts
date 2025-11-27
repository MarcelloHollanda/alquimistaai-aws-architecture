import { CacheManager } from './cache-manager';
import { Logger, EnhancedLogger } from './logger';

/**
 * Cache Strategies - Padrões comuns de cache
 */

// Cache-Aside (Lazy Loading)
export async function cacheAside<T>(
  cache: CacheManager,
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number,
  logger?: EnhancedLogger
): Promise<T> {
  return cache.getOrSet(key, fetcher, ttl);
}

// Write-Through
export async function writeThrough<T>(
  cache: CacheManager,
  key: string,
  value: T,
  persister: (value: T) => Promise<void>,
  ttl?: number,
  logger?: EnhancedLogger
): Promise<T> {
  // Write to database first
  await persister(value);
  
  // Then write to cache
  await cache.set(key, value, ttl);
  
  logger?.debug('Write-through completed', {
    operation: 'cache.write-through',
    customMetrics: { key }
  });
  
  return value;
}

// Write-Behind (Write-Back)
export async function writeBehind<T>(
  cache: CacheManager,
  key: string,
  value: T,
  persister: (value: T) => Promise<void>,
  ttl?: number,
  logger?: EnhancedLogger
): Promise<T> {
  // Write to cache immediately
  await cache.set(key, value, ttl);
  
  // Write to database asynchronously (fire and forget)
  persister(value).catch(error => {
    logger?.error('Write-behind persister failed', error as Error, {
      operation: 'cache.write-behind-error',
      customMetrics: { key }
    });
  });
  
  logger?.debug('Write-behind initiated', {
    operation: 'cache.write-behind',
    customMetrics: { key }
  });
  
  return value;
}

// Refresh-Ahead
export async function refreshAhead<T>(
  cache: CacheManager,
  key: string,
  fetcher: () => Promise<T>,
  ttl: number,
  refreshThreshold: number = 0.8, // Refresh when 80% of TTL has passed
  logger?: EnhancedLogger
): Promise<T> {
  const cached = await cache.get<T>(key);
  
  if (cached !== null) {
    // Check if we should refresh proactively
    // This would require storing metadata about when the cache was set
    // For now, just return cached value
    return cached;
  }
  
  // Cache miss - fetch and store
  const value = await fetcher();
  await cache.set(key, value, ttl);
  
  logger?.debug('Refresh-ahead cache miss', {
    operation: 'cache.refresh-ahead',
    customMetrics: { key }
  });
  
  return value;
}

/**
 * Cached Decorator - Automatically cache method results
 */
export function Cached(config: {
  ttl: number;
  keyGenerator?: (...args: any[]) => string;
  cacheName?: string;
}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = (this as any).logger as EnhancedLogger | undefined;
      const cache = (this as any).cache as CacheManager | undefined;

      if (!cache) {
        // No cache available, execute method normally
        return method.apply(this, args);
      }

      // Generate cache key
      const key = config.keyGenerator
        ? config.keyGenerator(...args)
        : `${target.constructor.name}.${propertyName}:${JSON.stringify(args)}`;

      // Try to get from cache
      return cache.getOrSet(
        key,
        () => method.apply(this, args),
        config.ttl
      );
    };

    return descriptor;
  };
}

/**
 * Cache Invalidation Patterns
 */

// Invalidate by pattern
export async function invalidateByPattern(
  cache: CacheManager,
  pattern: string,
  logger?: EnhancedLogger
): Promise<void> {
  // This would require Redis SCAN command for production
  // For now, just log
  logger?.info('Cache invalidation by pattern', {
    operation: 'cache.invalidate-pattern',
    customMetrics: { pattern }
  });
}

// Invalidate by tags
export async function invalidateByTags(
  cache: CacheManager,
  tags: string[],
  logger?: EnhancedLogger
): Promise<void> {
  // This would require maintaining a tag index
  // For now, just log
  logger?.info('Cache invalidation by tags', {
    operation: 'cache.invalidate-tags',
    customMetrics: { tags: tags.join(',') }
  });
}

/**
 * Multi-Level Cache
 */
export class MultiLevelCache {
  constructor(
    private l1Cache: CacheManager, // Fast, small (in-memory)
    private l2Cache: CacheManager, // Slower, larger (Redis)
    private logger?: EnhancedLogger
  ) {}

  async get<T>(key: string): Promise<T | null> {
    // Try L1 first
    let value = await this.l1Cache.get<T>(key);
    
    if (value !== null) {
      this.logger?.debug('L1 cache hit', {
        operation: 'cache.l1-hit',
        customMetrics: { key }
      });
      return value;
    }

    // Try L2
    value = await this.l2Cache.get<T>(key);
    
    if (value !== null) {
      this.logger?.debug('L2 cache hit, promoting to L1', {
        operation: 'cache.l2-hit',
        customMetrics: { key }
      });
      
      // Promote to L1
      await this.l1Cache.set(key, value);
      return value;
    }

    this.logger?.debug('Multi-level cache miss', {
      operation: 'cache.multi-miss',
      customMetrics: { key }
    });

    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Write to both levels
    await Promise.all([
      this.l1Cache.set(key, value, ttl),
      this.l2Cache.set(key, value, ttl)
    ]);

    this.logger?.debug('Multi-level cache set', {
      operation: 'cache.multi-set',
      customMetrics: { key }
    });
  }

  async delete(key: string): Promise<void> {
    // Delete from both levels
    await Promise.all([
      this.l1Cache.delete(key),
      this.l2Cache.delete(key)
    ]);

    this.logger?.debug('Multi-level cache delete', {
      operation: 'cache.multi-delete',
      customMetrics: { key }
    });
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch from source
    const value = await factory();
    
    // Store in both levels
    await this.set(key, value, ttl);
    
    return value;
  }
}

/**
 * Cache Presets for common scenarios
 */
export const CachePresets = {
  // User sessions
  session: {
    ttl: 3600, // 1 hour
    prefix: 'session',
    namespace: 'user'
  },

  // Database query results
  query: {
    ttl: 300, // 5 minutes
    prefix: 'query',
    namespace: 'db'
  },

  // Agent execution results
  agent: {
    ttl: 1800, // 30 minutes
    prefix: 'agent',
    namespace: 'execution'
  },

  // API responses
  api: {
    ttl: 60, // 1 minute
    prefix: 'api',
    namespace: 'response'
  },

  // Static content
  static: {
    ttl: 86400, // 24 hours
    prefix: 'static',
    namespace: 'content'
  },

  // User preferences
  preferences: {
    ttl: 7200, // 2 hours
    prefix: 'prefs',
    namespace: 'user'
  },

  // Rate limiting
  rateLimit: {
    ttl: 60, // 1 minute
    prefix: 'rate',
    namespace: 'limit'
  }
};

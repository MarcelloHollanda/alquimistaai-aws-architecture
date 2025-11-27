import { Logger, EnhancedLogger } from './logger';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  prefix?: string;
  namespace?: string;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

/**
 * Cache Manager abstrato - pode ser implementado com Redis, ElastiCache, ou in-memory
 */
export abstract class CacheManager {
  protected metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0
  };

  constructor(
    protected name: string,
    protected config: CacheConfig,
    protected logger?: EnhancedLogger
  ) {
    this.logger?.info('Cache manager initialized', {
      operation: 'cache.init',
      customMetrics: {
        name: this.name,
        ttl: this.config.ttl,
        prefix: this.config.prefix
      }
    });
  }

  abstract get<T>(key: string): Promise<T | null>;
  abstract set<T>(key: string, value: T, ttl?: number): Promise<void>;
  abstract delete(key: string): Promise<void>;
  abstract clear(): Promise<void>;
  abstract exists(key: string): Promise<boolean>;

  protected buildKey(key: string): string {
    const parts = [
      this.config.prefix,
      this.config.namespace,
      key
    ].filter(Boolean);
    
    return parts.join(':');
  }

  protected updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0
    };

    this.logger?.info('Cache metrics reset', {
      operation: 'cache.reset-metrics',
      customMetrics: {
        name: this.name
      }
    });
  }

  // Helper method for cache-aside pattern
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
    this.logger?.debug('Cache miss, fetching from source', {
      operation: 'cache.get-or-set',
      customMetrics: {
        name: this.name,
        key: this.buildKey(key)
      }
    });

    const value = await factory();
    
    // Store in cache
    await this.set(key, value, ttl);
    
    return value;
  }

  // Helper method for write-through pattern
  async setAndReturn<T>(
    key: string,
    value: T,
    ttl?: number
  ): Promise<T> {
    await this.set(key, value, ttl);
    return value;
  }
}

/**
 * In-Memory Cache Implementation (para desenvolvimento e fallback)
 */
export class InMemoryCache extends CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor(
    name: string,
    config: CacheConfig,
    logger?: EnhancedLogger
  ) {
    super(name, config, logger);
    
    // Start cleanup interval
    this.startCleanup();
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.buildKey(key);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      this.metrics.misses++;
      this.updateHitRate();
      
      this.logger?.debug('Cache miss', {
        operation: 'cache.miss',
        customMetrics: {
          name: this.name,
          key: fullKey
        }
      });
      
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(fullKey);
      this.metrics.misses++;
      this.updateHitRate();
      
      this.logger?.debug('Cache expired', {
        operation: 'cache.expired',
        customMetrics: {
          name: this.name,
          key: fullKey
        }
      });
      
      return null;
    }

    this.metrics.hits++;
    this.updateHitRate();
    
    this.logger?.debug('Cache hit', {
      operation: 'cache.hit',
      customMetrics: {
        name: this.name,
        key: fullKey,
        age: Date.now() - entry.createdAt
      }
    });

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const fullKey = this.buildKey(key);
    const effectiveTtl = (ttl || this.config.ttl) * 1000; // Convert to ms

    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + effectiveTtl,
      createdAt: Date.now()
    };

    this.cache.set(fullKey, entry);
    this.metrics.sets++;

    this.logger?.debug('Cache set', {
      operation: 'cache.set',
      customMetrics: {
        name: this.name,
        key: fullKey,
        ttl: effectiveTtl / 1000
      }
    });
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.buildKey(key);
    const deleted = this.cache.delete(fullKey);
    
    if (deleted) {
      this.metrics.deletes++;
      
      this.logger?.debug('Cache delete', {
        operation: 'cache.delete',
        customMetrics: {
          name: this.name,
          key: fullKey
        }
      });
    }
  }

  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    
    this.logger?.info('Cache cleared', {
      operation: 'cache.clear',
      customMetrics: {
        name: this.name,
        entriesCleared: size
      }
    });
  }

  async exists(key: string): Promise<boolean> {
    const fullKey = this.buildKey(key);
    const entry = this.cache.get(fullKey);
    
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(fullKey);
      return false;
    }
    
    return true;
  }

  private startCleanup(): void {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger?.debug('Cache cleanup completed', {
        operation: 'cache.cleanup',
        customMetrics: {
          name: this.name,
          entriesCleaned: cleaned,
          remainingEntries: this.cache.size
        }
      });
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

/**
 * Redis Cache Implementation (para produção com ElastiCache)
 */
export class RedisCache extends CacheManager {
  private client: any; // Redis client (ioredis ou node-redis)

  constructor(
    name: string,
    config: CacheConfig,
    redisClient: any,
    logger?: EnhancedLogger
  ) {
    super(name, config, logger);
    this.client = redisClient;
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.buildKey(key);

    try {
      const value = await this.client.get(fullKey);

      if (value === null) {
        this.metrics.misses++;
        this.updateHitRate();
        
        this.logger?.debug('Cache miss', {
          operation: 'cache.miss',
          customMetrics: {
            name: this.name,
            key: fullKey
          }
        });
        
        return null;
      }

      this.metrics.hits++;
      this.updateHitRate();
      
      this.logger?.debug('Cache hit', {
        operation: 'cache.hit',
        customMetrics: {
          name: this.name,
          key: fullKey
        }
      });

      return JSON.parse(value) as T;
    } catch (error) {
      this.logger?.error('Cache get error', error as Error, {
        operation: 'cache.get-error',
        customMetrics: {
          name: this.name,
          key: fullKey
        }
      });
      
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const fullKey = this.buildKey(key);
    const effectiveTtl = ttl || this.config.ttl;

    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(fullKey, effectiveTtl, serialized);
      
      this.metrics.sets++;
      
      this.logger?.debug('Cache set', {
        operation: 'cache.set',
        customMetrics: {
          name: this.name,
          key: fullKey,
          ttl: effectiveTtl
        }
      });
    } catch (error) {
      this.logger?.error('Cache set error', error as Error, {
        operation: 'cache.set-error',
        customMetrics: {
          name: this.name,
          key: fullKey
        }
      });
    }
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.buildKey(key);

    try {
      const deleted = await this.client.del(fullKey);
      
      if (deleted > 0) {
        this.metrics.deletes++;
        
        this.logger?.debug('Cache delete', {
          operation: 'cache.delete',
          customMetrics: {
            name: this.name,
            key: fullKey
          }
        });
      }
    } catch (error) {
      this.logger?.error('Cache delete error', error as Error, {
        operation: 'cache.delete-error',
        customMetrics: {
          name: this.name,
          key: fullKey
        }
      });
    }
  }

  async clear(): Promise<void> {
    try {
      const pattern = this.buildKey('*');
      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        await this.client.del(...keys);
        
        this.logger?.info('Cache cleared', {
          operation: 'cache.clear',
          customMetrics: {
            name: this.name,
            entriesCleared: keys.length
          }
        });
      }
    } catch (error) {
      this.logger?.error('Cache clear error', error as Error, {
        operation: 'cache.clear-error',
        customMetrics: {
          name: this.name
        }
      });
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullKey = this.buildKey(key);

    try {
      const exists = await this.client.exists(fullKey);
      return exists === 1;
    } catch (error) {
      this.logger?.error('Cache exists error', error as Error, {
        operation: 'cache.exists-error',
        customMetrics: {
          name: this.name,
          key: fullKey
        }
      });
      
      return false;
    }
  }
}

/**
 * Cache Registry para gerenciar múltiplos caches
 */
export class CacheRegistry {
  private static instance: CacheRegistry;
  private caches: Map<string, CacheManager> = new Map();
  private logger?: EnhancedLogger;

  private constructor(logger?: EnhancedLogger) {
    this.logger = logger;
  }

  static getInstance(logger?: EnhancedLogger): CacheRegistry {
    if (!CacheRegistry.instance) {
      CacheRegistry.instance = new CacheRegistry(logger);
    }
    return CacheRegistry.instance;
  }

  register(name: string, cache: CacheManager): void {
    this.caches.set(name, cache);
    
    this.logger?.info('Cache registered', {
      operation: 'cache.register',
      customMetrics: {
        name,
        totalCaches: this.caches.size
      }
    });
  }

  get(name: string): CacheManager | undefined {
    return this.caches.get(name);
  }

  getAll(): Map<string, CacheManager> {
    return new Map(this.caches);
  }

  getAllMetrics(): Record<string, CacheMetrics> {
    const metrics: Record<string, CacheMetrics> = {};
    
    this.caches.forEach((cache, name) => {
      metrics[name] = cache.getMetrics();
    });

    return metrics;
  }

  async clearAll(): Promise<void> {
    for (const cache of this.caches.values()) {
      await cache.clear();
    }
    
    this.logger?.info('All caches cleared', {
      operation: 'cache.clear-all',
      customMetrics: {
        count: this.caches.size
      }
    });
  }
}

// Factory function
export function createCache(
  name: string,
  config: CacheConfig,
  redisClient?: any,
  logger?: EnhancedLogger
): CacheManager {
  if (redisClient) {
    return new RedisCache(name, config, redisClient, logger);
  }
  
  return new InMemoryCache(name, config, logger);
}

import { CacheManager } from './cache-manager';
import { Logger, EnhancedLogger } from './logger';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (identifier: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (identifier: string) => void;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export interface RateLimitMetrics {
  totalRequests: number;
  allowedRequests: number;
  blockedRequests: number;
  blockRate: number;
}

/**
 * Rate Limiter usando cache distribuído
 */
export class RateLimiter {
  private metrics: RateLimitMetrics = {
    totalRequests: 0,
    allowedRequests: 0,
    blockedRequests: 0,
    blockRate: 0
  };

  constructor(
    private name: string,
    private config: RateLimitConfig,
    private cache: CacheManager,
    private logger?: EnhancedLogger
  ) {
    this.logger?.info('Rate limiter initialized', {
      operation: 'rate-limiter.init',
      customMetrics: {
        name: this.name,
        maxRequests: this.config.maxRequests,
        windowMs: this.config.windowMs
      }
    });
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    this.metrics.totalRequests++;

    const key = this.config.keyGenerator
      ? this.config.keyGenerator(identifier)
      : `rate-limit:${this.name}:${identifier}`;

    // Get current count
    const current = await this.cache.get<number>(key) || 0;
    const windowSeconds = Math.ceil(this.config.windowMs / 1000);

    if (current >= this.config.maxRequests) {
      // Limit exceeded
      this.metrics.blockedRequests++;
      this.updateBlockRate();

      const resetAt = new Date(Date.now() + this.config.windowMs);
      const retryAfter = Math.ceil(this.config.windowMs / 1000);

      this.logger?.warn('Rate limit exceeded', {
        operation: 'rate-limiter.exceeded',
        customMetrics: {
          name: this.name,
          identifier,
          current,
          limit: this.config.maxRequests
        }
      });

      // Log metric
      this.logger?.logCustomMetric(
        `RateLimit.${this.name}.Exceeded`,
        1,
        { unit: 'Count' }
      );

      // Call callback if provided
      if (this.config.onLimitReached) {
        this.config.onLimitReached(identifier);
      }

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter
      };
    }

    // Increment counter
    await this.cache.set(key, current + 1, windowSeconds);

    this.metrics.allowedRequests++;
    this.updateBlockRate();

    const resetAt = new Date(Date.now() + this.config.windowMs);

    this.logger?.debug('Rate limit check passed', {
      operation: 'rate-limiter.allowed',
      customMetrics: {
        name: this.name,
        identifier,
        current: current + 1,
        remaining: this.config.maxRequests - current - 1
      }
    });

    return {
      allowed: true,
      remaining: this.config.maxRequests - current - 1,
      resetAt
    };
  }

  async recordSuccess(identifier: string): Promise<void> {
    if (this.config.skipSuccessfulRequests) {
      const key = this.config.keyGenerator
        ? this.config.keyGenerator(identifier)
        : `rate-limit:${this.name}:${identifier}`;

      const current = await this.cache.get<number>(key) || 0;
      if (current > 0) {
        await this.cache.set(
          key,
          current - 1,
          Math.ceil(this.config.windowMs / 1000)
        );
      }
    }
  }

  async recordFailure(identifier: string): Promise<void> {
    if (this.config.skipFailedRequests) {
      const key = this.config.keyGenerator
        ? this.config.keyGenerator(identifier)
        : `rate-limit:${this.name}:${identifier}`;

      const current = await this.cache.get<number>(key) || 0;
      if (current > 0) {
        await this.cache.set(
          key,
          current - 1,
          Math.ceil(this.config.windowMs / 1000)
        );
      }
    }
  }

  async reset(identifier: string): Promise<void> {
    const key = this.config.keyGenerator
      ? this.config.keyGenerator(identifier)
      : `rate-limit:${this.name}:${identifier}`;

    await this.cache.delete(key);

    this.logger?.info('Rate limit reset', {
      operation: 'rate-limiter.reset',
      customMetrics: {
        name: this.name,
        identifier
      }
    });
  }

  private updateBlockRate(): void {
    const total = this.metrics.totalRequests;
    this.metrics.blockRate = total > 0
      ? (this.metrics.blockedRequests / total) * 100
      : 0;
  }

  getMetrics(): RateLimitMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      blockRate: 0
    };
  }
}

/**
 * Sliding Window Rate Limiter (mais preciso)
 */
export class SlidingWindowRateLimiter {
  constructor(
    private name: string,
    private config: RateLimitConfig,
    private cache: CacheManager,
    private logger?: EnhancedLogger
  ) {}

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const key = `rate-limit:sliding:${this.name}:${identifier}`;

    // Get timestamps of requests in current window
    const timestamps = await this.cache.get<number[]>(key) || [];

    // Remove old timestamps outside the window
    const windowStart = now - this.config.windowMs;
    const validTimestamps = timestamps.filter(ts => ts > windowStart);

    if (validTimestamps.length >= this.config.maxRequests) {
      // Limit exceeded
      const oldestTimestamp = Math.min(...validTimestamps);
      const resetAt = new Date(oldestTimestamp + this.config.windowMs);
      const retryAfter = Math.ceil((resetAt.getTime() - now) / 1000);

      this.logger?.warn('Sliding window rate limit exceeded', {
        operation: 'rate-limiter.sliding.exceeded',
        customMetrics: {
          name: this.name,
          identifier,
          current: validTimestamps.length,
          limit: this.config.maxRequests
        }
      });

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter
      };
    }

    // Add current timestamp
    validTimestamps.push(now);
    await this.cache.set(
      key,
      validTimestamps,
      Math.ceil(this.config.windowMs / 1000)
    );

    const resetAt = new Date(now + this.config.windowMs);

    return {
      allowed: true,
      remaining: this.config.maxRequests - validTimestamps.length,
      resetAt
    };
  }
}

/**
 * Token Bucket Rate Limiter (permite bursts)
 */
export class TokenBucketRateLimiter {
  constructor(
    private name: string,
    private capacity: number,
    private refillRate: number, // tokens per second
    private cache: CacheManager,
    private logger?: EnhancedLogger
  ) {}

  async checkLimit(identifier: string, tokens: number = 1): Promise<RateLimitResult> {
    const now = Date.now();
    const key = `rate-limit:token:${this.name}:${identifier}`;

    // Get current bucket state
    const state = await this.cache.get<{
      tokens: number;
      lastRefill: number;
    }>(key) || {
      tokens: this.capacity,
      lastRefill: now
    };

    // Calculate tokens to add based on time passed
    const timePassed = (now - state.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    const currentTokens = Math.min(
      this.capacity,
      state.tokens + tokensToAdd
    );

    if (currentTokens < tokens) {
      // Not enough tokens
      const tokensNeeded = tokens - currentTokens;
      const timeToWait = tokensNeeded / this.refillRate;
      const resetAt = new Date(now + timeToWait * 1000);

      this.logger?.warn('Token bucket rate limit exceeded', {
        operation: 'rate-limiter.token.exceeded',
        customMetrics: {
          name: this.name,
          identifier,
          currentTokens,
          tokensNeeded: tokens
        }
      });

      return {
        allowed: false,
        remaining: Math.floor(currentTokens),
        resetAt,
        retryAfter: Math.ceil(timeToWait)
      };
    }

    // Consume tokens
    const newState = {
      tokens: currentTokens - tokens,
      lastRefill: now
    };

    await this.cache.set(key, newState, 3600); // 1 hour TTL

    return {
      allowed: true,
      remaining: Math.floor(newState.tokens),
      resetAt: new Date(now + 3600000)
    };
  }
}

/**
 * Rate Limiter Registry
 */
export class RateLimiterRegistry {
  private static instance: RateLimiterRegistry;
  private limiters: Map<string, RateLimiter> = new Map();
  private logger?: EnhancedLogger;

  private constructor(logger?: EnhancedLogger) {
    this.logger = logger;
  }

  static getInstance(logger?: EnhancedLogger): RateLimiterRegistry {
    if (!RateLimiterRegistry.instance) {
      RateLimiterRegistry.instance = new RateLimiterRegistry(logger);
    }
    return RateLimiterRegistry.instance;
  }

  register(name: string, limiter: RateLimiter): void {
    this.limiters.set(name, limiter);
    
    this.logger?.info('Rate limiter registered', {
      operation: 'rate-limiter.register',
      customMetrics: {
        name,
        totalLimiters: this.limiters.size
      }
    });
  }

  get(name: string): RateLimiter | undefined {
    return this.limiters.get(name);
  }

  getAll(): Map<string, RateLimiter> {
    return new Map(this.limiters);
  }

  getAllMetrics(): Record<string, RateLimitMetrics> {
    const metrics: Record<string, RateLimitMetrics> = {};
    
    this.limiters.forEach((limiter, name) => {
      metrics[name] = limiter.getMetrics();
    });

    return metrics;
  }
}

/**
 * Rate Limit Presets
 */
export const RateLimitPresets = {
  // API endpoints
  api: {
    maxRequests: 100,
    windowMs: 60000 // 100 requests per minute
  },

  // Authentication endpoints
  auth: {
    maxRequests: 5,
    windowMs: 300000 // 5 requests per 5 minutes
  },

  // Agent execution
  agent: {
    maxRequests: 10,
    windowMs: 60000 // 10 executions per minute
  },

  // Database operations
  database: {
    maxRequests: 50,
    windowMs: 60000 // 50 queries per minute
  },

  // External API calls
  external: {
    maxRequests: 20,
    windowMs: 60000 // 20 calls per minute
  },

  // File uploads
  upload: {
    maxRequests: 5,
    windowMs: 300000 // 5 uploads per 5 minutes
  },

  // Strict (for sensitive operations)
  strict: {
    maxRequests: 3,
    windowMs: 600000 // 3 requests per 10 minutes
  }
};

import { Pool, PoolClient, PoolConfig } from 'pg';
import { Logger } from './logger';
import { addMetadata, addAnnotations } from './xray-tracer';

const logger = new Logger('connection-pool');

/**
 * Connection pool metrics
 */
interface PoolMetrics {
  totalConnections: number;
  idleConnections: number;
  activeConnections: number;
  waitingClients: number;
  totalQueries: number;
  totalErrors: number;
  averageQueryTime: number;
  peakConnections: number;
  lastResetTime: Date;
}

/**
 * Enhanced connection pool with metrics and optimization
 */
export class EnhancedConnectionPool {
  private pool: Pool | null = null;
  private metrics: PoolMetrics;
  private queryTimes: number[] = [];
  private readonly maxQueryTimesSamples = 100;

  constructor(private config: PoolConfig) {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): PoolMetrics {
    return {
      totalConnections: 0,
      idleConnections: 0,
      activeConnections: 0,
      waitingClients: 0,
      totalQueries: 0,
      totalErrors: 0,
      averageQueryTime: 0,
      peakConnections: 0,
      lastResetTime: new Date(),
    };
  }

  /**
   * Get or create the connection pool
   */
  async getPool(): Promise<Pool> {
    if (!this.pool) {
      await this.initialize();
    }
    return this.pool!;
  }

  /**
   * Initialize the connection pool with optimized settings
   */
  private async initialize(): Promise<void> {
    logger.info('Initializing enhanced connection pool', {
      max: this.config.max,
      min: this.config.min,
      idleTimeoutMillis: this.config.idleTimeoutMillis,
    });

    // Optimized pool configuration
    const optimizedConfig: PoolConfig = {
      ...this.config,
      // Connection pool size optimization
      max: this.config.max || this.getOptimalMaxConnections(),
      min: this.config.min || 2, // Keep minimum connections warm
      
      // Timeout optimization
      idleTimeoutMillis: this.config.idleTimeoutMillis || 30000, // 30s
      connectionTimeoutMillis: this.config.connectionTimeoutMillis || 10000, // 10s
      
      // Statement timeout (prevent long-running queries)
      statement_timeout: 30000, // 30s max query time
      
      // Query timeout
      query_timeout: 25000, // 25s (less than statement_timeout)
      
      // Keep-alive settings for long-lived connections
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000, // 10s
      
      // Application name for monitoring
      application_name: `alquimista-${process.env.AWS_LAMBDA_FUNCTION_NAME || 'lambda'}`,
    };

    this.pool = new Pool(optimizedConfig);

    // Setup event listeners for metrics
    this.setupEventListeners();

    logger.info('Enhanced connection pool initialized successfully');
  }

  /**
   * Calculate optimal max connections based on Lambda memory
   */
  private getOptimalMaxConnections(): number {
    const lambdaMemoryMB = parseInt(process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || '1024');
    
    // Rule of thumb: 1 connection per 128MB of memory, max 10
    const calculated = Math.floor(lambdaMemoryMB / 128);
    const optimal = Math.min(Math.max(calculated, 2), 10);
    
    logger.debug('Calculated optimal max connections', {
      lambdaMemoryMB,
      calculated,
      optimal,
    });
    
    return optimal;
  }

  /**
   * Setup event listeners for pool monitoring
   */
  private setupEventListeners(): void {
    if (!this.pool) return;

    // Track connection acquisition
    this.pool.on('connect', (client) => {
      this.metrics.totalConnections++;
      this.metrics.activeConnections++;
      
      if (this.metrics.activeConnections > this.metrics.peakConnections) {
        this.metrics.peakConnections = this.metrics.activeConnections;
      }
      
      logger.debug('Client connected to pool', {
        activeConnections: this.metrics.activeConnections,
        totalConnections: this.metrics.totalConnections,
      });
    });

    // Track connection release
    this.pool.on('release', () => {
      this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
      this.metrics.idleConnections++;
      
      logger.debug('Client released to pool', {
        activeConnections: this.metrics.activeConnections,
        idleConnections: this.metrics.idleConnections,
      });
    });

    // Track connection removal
    this.pool.on('remove', () => {
      this.metrics.totalConnections = Math.max(0, this.metrics.totalConnections - 1);
      
      logger.debug('Client removed from pool', {
        totalConnections: this.metrics.totalConnections,
      });
    });

    // Track errors
    this.pool.on('error', (err, client) => {
      this.metrics.totalErrors++;
      logger.error('Unexpected error on idle client', err, {
        totalErrors: this.metrics.totalErrors,
      });
    });

    // Track acquisition queue
    this.pool.on('acquire', () => {
      logger.debug('Client acquired from pool');
    });
  }

  /**
   * Execute query with metrics tracking
   */
  async query<T = any>(text: string, params?: any[]): Promise<T> {
    const pool = await this.getPool();
    const startTime = Date.now();
    
    try {
      this.metrics.totalQueries++;
      
      const result = await pool.query(text, params);
      
      // Track query time
      const queryTime = Date.now() - startTime;
      this.trackQueryTime(queryTime);
      
      // Add metrics to X-Ray
      addMetadata({
        queryTime,
        totalQueries: this.metrics.totalQueries,
        activeConnections: this.metrics.activeConnections,
      }, 'connection-pool');
      
      // Warn on slow queries
      if (queryTime > 1000) {
        logger.warn('Slow query detected', {
          queryTime,
          query: text.substring(0, 100),
        });
        
        addAnnotations({ slowQuery: true });
      }
      
      return result as T;
    } catch (error) {
      this.metrics.totalErrors++;
      throw error;
    }
  }

  /**
   * Get a client from the pool with timeout
   */
  async getClient(timeoutMs: number = 10000): Promise<PoolClient> {
    const pool = await this.getPool();
    
    return Promise.race([
      pool.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Client acquisition timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Track query execution time
   */
  private trackQueryTime(time: number): void {
    this.queryTimes.push(time);
    
    // Keep only last N samples
    if (this.queryTimes.length > this.maxQueryTimesSamples) {
      this.queryTimes.shift();
    }
    
    // Calculate average
    const sum = this.queryTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageQueryTime = sum / this.queryTimes.length;
  }

  /**
   * Get current pool metrics
   */
  getMetrics(): PoolMetrics {
    if (this.pool) {
      // Update real-time metrics from pool
      this.metrics.totalConnections = this.pool.totalCount;
      this.metrics.idleConnections = this.pool.idleCount;
      this.metrics.waitingClients = this.pool.waitingCount;
    }
    
    return { ...this.metrics };
  }

  /**
   * Get pool health status
   */
  getHealthStatus(): {
    healthy: boolean;
    metrics: PoolMetrics;
    warnings: string[];
  } {
    const metrics = this.getMetrics();
    const warnings: string[] = [];
    
    // Check for issues
    if (metrics.waitingClients > 5) {
      warnings.push(`High number of waiting clients: ${metrics.waitingClients}`);
    }
    
    if (metrics.totalErrors > 10) {
      warnings.push(`High error count: ${metrics.totalErrors}`);
    }
    
    if (metrics.averageQueryTime > 1000) {
      warnings.push(`High average query time: ${metrics.averageQueryTime}ms`);
    }
    
    const healthy = warnings.length === 0;
    
    return { healthy, metrics, warnings };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    logger.info('Resetting connection pool metrics');
    this.metrics = this.initializeMetrics();
    this.queryTimes = [];
  }

  /**
   * Drain and close the pool gracefully
   */
  async close(timeoutMs: number = 10000): Promise<void> {
    if (!this.pool) return;
    
    logger.info('Closing connection pool gracefully', {
      activeConnections: this.metrics.activeConnections,
      timeoutMs,
    });
    
    try {
      // Wait for active connections to finish or timeout
      await Promise.race([
        this.pool.end(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Pool close timeout')), timeoutMs)
        ),
      ]);
      
      logger.info('Connection pool closed successfully');
    } catch (error) {
      logger.error('Error closing connection pool', error as Error);
      throw error;
    } finally {
      this.pool = null;
    }
  }

  /**
   * Warm up the pool by creating minimum connections
   */
  async warmUp(): Promise<void> {
    const pool = await this.getPool();
    const minConnections = this.config.min || 2;
    
    logger.info('Warming up connection pool', { minConnections });
    
    const clients: PoolClient[] = [];
    
    try {
      // Acquire minimum connections
      for (let i = 0; i < minConnections; i++) {
        const client = await pool.connect();
        clients.push(client);
      }
      
      logger.info('Connection pool warmed up successfully', {
        connections: clients.length,
      });
    } finally {
      // Release all clients
      clients.forEach((client) => client.release());
    }
  }

  /**
   * Test pool connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as test');
      return (result as any).rows?.[0]?.test === 1;
    } catch (error) {
      logger.error('Connection test failed', error as Error);
      return false;
    }
  }
}

/**
 * Create a singleton enhanced connection pool
 */
let poolInstance: EnhancedConnectionPool | null = null;

export function createEnhancedPool(config: PoolConfig): EnhancedConnectionPool {
  if (!poolInstance) {
    poolInstance = new EnhancedConnectionPool(config);
  }
  return poolInstance;
}

export function getEnhancedPool(): EnhancedConnectionPool | null {
  return poolInstance;
}

export async function closeEnhancedPool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.close();
    poolInstance = null;
  }
}

import { Pool, QueryResult, QueryResultRow } from 'pg';
import { Logger } from './logger';
import { addMetadata, addAnnotations } from './xray-tracer';

const logger = new Logger('query-optimizer');

/**
 * Query performance metrics
 */
interface QueryMetrics {
  query: string;
  executionTime: number;
  rowCount: number;
  timestamp: Date;
  planningTime?: number;
  executionTimeActual?: number;
}

/**
 * Query cache entry
 */
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

/**
 * Query optimizer with caching and performance monitoring
 */
export class QueryOptimizer {
  private queryCache: Map<string, CacheEntry> = new Map();
  private slowQueries: QueryMetrics[] = [];
  private readonly slowQueryThreshold = 500; // ms
  private readonly maxSlowQueries = 50;
  private readonly defaultCacheTTL = 60000; // 60s

  constructor(private pool: Pool) {}

  /**
   * Execute query with optimization and caching
   */
  async execute<T extends QueryResultRow = any>(
    query: string,
    params?: any[],
    options?: {
      cache?: boolean;
      cacheTTL?: number;
      explain?: boolean;
    }
  ): Promise<QueryResult<T>> {
    const cacheKey = this.getCacheKey(query, params);
    
    // Check cache if enabled
    if (options?.cache) {
      const cached = this.getFromCache<QueryResult<T>>(cacheKey);
      if (cached) {
        logger.debug('Query result returned from cache', {
          cacheKey: cacheKey.substring(0, 50),
          hits: cached.hits,
        });
        
        addAnnotations({ queryCacheHit: true });
        return cached.data;
      }
    }

    // Execute query with timing
    const startTime = Date.now();
    let result: QueryResult<T>;
    
    try {
      // Get explain plan if requested
      if (options?.explain) {
        await this.explainQuery(query, params);
      }
      
      result = await this.pool.query<T>(query, params);
      
      const executionTime = Date.now() - startTime;
      
      // Track metrics
      this.trackQueryMetrics({
        query,
        executionTime,
        rowCount: result.rowCount || 0,
        timestamp: new Date(),
      });
      
      // Cache result if enabled
      if (options?.cache) {
        this.setCache(
          cacheKey,
          result,
          options.cacheTTL || this.defaultCacheTTL
        );
      }
      
      // Add metadata to X-Ray
      addMetadata({
        queryExecutionTime: executionTime,
        queryRowCount: result.rowCount,
        queryCached: options?.cache || false,
      }, 'query-optimizer');
      
      return result;
    } catch (error) {
      logger.error('Query execution failed', error as Error, {
        query: query.substring(0, 100),
      });
      throw error;
    }
  }

  /**
   * Get EXPLAIN plan for query
   */
  async explainQuery(query: string, params?: any[]): Promise<any[]> {
    try {
      const explainQuery = `EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS) ${query}`;
      const result = await this.pool.query(explainQuery, params);
      
      const plan = result.rows[0]['QUERY PLAN'][0];
      
      logger.info('Query execution plan', {
        planningTime: plan['Planning Time'],
        executionTime: plan['Execution Time'],
        totalCost: plan.Plan['Total Cost'],
      });
      
      // Check for sequential scans on large tables
      this.analyzeQueryPlan(plan, query);
      
      return result.rows;
    } catch (error) {
      logger.warn('Failed to get query plan', {
        error: (error as Error).message,
      });
      return [];
    }
  }

  /**
   * Analyze query plan for optimization opportunities
   */
  private analyzeQueryPlan(plan: any, query: string): void {
    const warnings: string[] = [];
    
    // Check for sequential scans
    if (this.hasSequentialScan(plan.Plan)) {
      warnings.push('Sequential scan detected - consider adding index');
    }
    
    // Check for high cost
    if (plan.Plan['Total Cost'] > 1000) {
      warnings.push(`High query cost: ${plan.Plan['Total Cost']}`);
    }
    
    // Check for slow execution
    if (plan['Execution Time'] > this.slowQueryThreshold) {
      warnings.push(`Slow execution time: ${plan['Execution Time']}ms`);
    }
    
    if (warnings.length > 0) {
      logger.warn('Query optimization opportunities found', {
        query: query.substring(0, 100),
        warnings,
        planningTime: plan['Planning Time'],
        executionTime: plan['Execution Time'],
      });
      
      addAnnotations({ queryOptimizationNeeded: true });
    }
  }

  /**
   * Check if plan contains sequential scan
   */
  private hasSequentialScan(node: any): boolean {
    if (node['Node Type'] === 'Seq Scan') {
      return true;
    }
    
    if (node.Plans) {
      return node.Plans.some((child: any) => this.hasSequentialScan(child));
    }
    
    return false;
  }

  /**
   * Track query metrics
   */
  private trackQueryMetrics(metrics: QueryMetrics): void {
    // Track slow queries
    if (metrics.executionTime > this.slowQueryThreshold) {
      this.slowQueries.push(metrics);
      
      // Keep only last N slow queries
      if (this.slowQueries.length > this.maxSlowQueries) {
        this.slowQueries.shift();
      }
      
      logger.warn('Slow query detected', {
        query: metrics.query.substring(0, 100),
        executionTime: metrics.executionTime,
        rowCount: metrics.rowCount,
      });
      
      addAnnotations({
        slowQuery: true,
        queryTime: metrics.executionTime,
      });
    }
  }

  /**
   * Get cache key for query
   */
  private getCacheKey(query: string, params?: any[]): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${query}:${paramStr}`;
  }

  /**
   * Get value from cache
   */
  private getFromCache<T>(key: string): CacheEntry<T> | null {
    const entry = this.queryCache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.queryCache.delete(key);
      return null;
    }
    
    // Increment hit counter
    entry.hits++;
    
    return entry as CacheEntry<T>;
  }

  /**
   * Set value in cache
   */
  private setCache<T>(key: string, data: T, ttl: number): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
    });
    
    // Limit cache size
    if (this.queryCache.size > 100) {
      // Remove oldest entry
      const firstKey = this.queryCache.keys().next().value;
      if (firstKey) {
        this.queryCache.delete(firstKey);
      }
    }
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    logger.info('Clearing query cache', {
      size: this.queryCache.size,
    });
    this.queryCache.clear();
  }

  /**
   * Get slow queries report
   */
  getSlowQueries(): QueryMetrics[] {
    return [...this.slowQueries].sort((a, b) => b.executionTime - a.executionTime);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    totalHits: number;
    entries: Array<{ key: string; hits: number; age: number }>;
  } {
    const entries: Array<{ key: string; hits: number; age: number }> = [];
    let totalHits = 0;
    
    this.queryCache.forEach((entry, key) => {
      totalHits += entry.hits;
      entries.push({
        key: key.substring(0, 50),
        hits: entry.hits,
        age: Date.now() - entry.timestamp,
      });
    });
    
    return {
      size: this.queryCache.size,
      totalHits,
      entries: entries.sort((a, b) => b.hits - a.hits),
    };
  }

  /**
   * Suggest indexes based on slow queries
   */
  suggestIndexes(): string[] {
    const suggestions: string[] = [];
    const tableColumns = new Map<string, Set<string>>();
    
    // Analyze slow queries for patterns
    this.slowQueries.forEach((metrics) => {
      const query = metrics.query.toLowerCase();
      
      // Extract table and column from WHERE clauses
      const whereMatch = query.match(/where\s+(\w+)\.(\w+)/g);
      if (whereMatch) {
        whereMatch.forEach((match) => {
          const parts = match.replace('where ', '').split('.');
          if (parts.length === 2) {
            const [table, column] = parts;
            if (!tableColumns.has(table)) {
              tableColumns.set(table, new Set());
            }
            tableColumns.get(table)!.add(column);
          }
        });
      }
      
      // Extract table and column from JOIN clauses
      const joinMatch = query.match(/join\s+(\w+)\s+on\s+\w+\.(\w+)/g);
      if (joinMatch) {
        joinMatch.forEach((match) => {
          const parts = match.split(/\s+/);
          if (parts.length >= 4) {
            const table = parts[1];
            const column = parts[3].split('.')[1];
            if (!tableColumns.has(table)) {
              tableColumns.set(table, new Set());
            }
            tableColumns.get(table)!.add(column);
          }
        });
      }
    });
    
    // Generate index suggestions
    tableColumns.forEach((columns, table) => {
      columns.forEach((column) => {
        suggestions.push(
          `CREATE INDEX IF NOT EXISTS idx_${table}_${column} ON ${table}(${column});`
        );
      });
    });
    
    return suggestions;
  }

  /**
   * Batch execute queries for better performance
   */
  async batchExecute<T extends QueryResultRow = any>(
    queries: Array<{ query: string; params?: any[] }>
  ): Promise<QueryResult<T>[]> {
    logger.info('Executing batch queries', { count: queries.length });
    
    const startTime = Date.now();
    
    try {
      const results = await Promise.all(
        queries.map((q) => this.pool.query<T>(q.query, q.params))
      );
      
      const executionTime = Date.now() - startTime;
      
      logger.info('Batch queries completed', {
        count: queries.length,
        executionTime,
        averageTime: executionTime / queries.length,
      });
      
      addMetadata({
        batchSize: queries.length,
        batchExecutionTime: executionTime,
      }, 'query-optimizer');
      
      return results;
    } catch (error) {
      logger.error('Batch query execution failed', error as Error);
      throw error;
    }
  }

  /**
   * Prepare statement for repeated execution
   */
  async prepareStatement(
    name: string,
    query: string,
    paramTypes?: string[]
  ): Promise<void> {
    try {
      const prepareQuery = paramTypes
        ? `PREPARE ${name} (${paramTypes.join(', ')}) AS ${query}`
        : `PREPARE ${name} AS ${query}`;
      
      await this.pool.query(prepareQuery);
      
      logger.info('Statement prepared', { name });
    } catch (error) {
      logger.error('Failed to prepare statement', error as Error, { name });
      throw error;
    }
  }

  /**
   * Execute prepared statement
   */
  async executePrepared<T extends QueryResultRow = any>(
    name: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const paramStr = params ? `(${params.map((p) => `'${p}'`).join(', ')})` : '';
    const query = `EXECUTE ${name}${paramStr}`;
    
    return this.pool.query<T>(query) as Promise<QueryResult<T>>;
  }
}

/**
 * Create query optimizer instance
 */
export function createQueryOptimizer(pool: Pool): QueryOptimizer {
  return new QueryOptimizer(pool);
}

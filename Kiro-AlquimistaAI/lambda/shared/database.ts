import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { SecretsManager } from 'aws-sdk';
import { Logger } from './logger';
import { traceQuery, addAnnotations, addMetadata } from './xray-tracer';

const logger = new Logger('database');
const secretsManager = new SecretsManager();

/**
 * Database credentials interface
 */
interface DbCredentials {
  username: string;
  password: string;
  host: string;
  port: number;
  dbname: string;
}

/**
 * Database connection pool singleton
 */
class DatabasePool {
  private pool: Pool | null = null;
  private credentials: DbCredentials | null = null;
  private secretArn: string;

  constructor(secretArn?: string) {
    this.secretArn = secretArn || process.env.DB_SECRET_ARN || '';
  }

  /**
   * Get database credentials from Secrets Manager
   */
  private async getCredentials(): Promise<DbCredentials> {
    if (this.credentials) {
      return this.credentials;
    }

    try {
      logger.info('Fetching database credentials from Secrets Manager', {
        secretArn: this.secretArn,
      });

      const response = await secretsManager
        .getSecretValue({ SecretId: this.secretArn })
        .promise();

      if (!response.SecretString) {
        throw new Error('Secret string is empty');
      }

      const secret = JSON.parse(response.SecretString);
      this.credentials = {
        username: secret.username,
        password: secret.password,
        host: secret.host,
        port: secret.port || 5432,
        dbname: secret.dbname || 'fibonacci',
      };

      logger.info('Database credentials fetched successfully');
      return this.credentials;
    } catch (error) {
      logger.error('Failed to fetch database credentials', error as Error);
      throw error;
    }
  }

  /**
   * Initialize connection pool
   */
  private async initializePool(): Promise<Pool> {
    if (this.pool) {
      return this.pool;
    }

    const credentials = await this.getCredentials();

    logger.info('Initializing database connection pool', {
      host: credentials.host,
      port: credentials.port,
      database: credentials.dbname,
    });

    this.pool = new Pool({
      user: credentials.username,
      password: credentials.password,
      host: credentials.host,
      port: credentials.port,
      database: credentials.dbname,
      max: 10, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection cannot be established
      ssl: {
        rejectUnauthorized: false, // Required for Aurora
      },
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle database client', err);
    });

    logger.info('Database connection pool initialized');
    return this.pool;
  }

  /**
   * Get the connection pool
   */
  async getPool(): Promise<Pool> {
    return await this.initializePool();
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    if (this.pool) {
      logger.info('Closing database connection pool');
      await this.pool.end();
      this.pool = null;
      this.credentials = null;
    }
  }
}

// Singleton instance
const dbPool = new DatabasePool();

/**
 * Execute a query with retry logic and X-Ray tracing
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[],
  maxRetries: number = 3
): Promise<QueryResult<T>> {
  // Extract query operation for better tracing
  const operation = text.trim().split(' ')[0].toUpperCase();
  
  return traceQuery(
    operation,
    async () => {
      const pool = await dbPool.getPool();
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          logger.debug('Executing database query', {
            attempt,
            query: text.substring(0, 100), // Log first 100 chars
            paramCount: params?.length || 0,
          });

          // Add query metadata to X-Ray
          addMetadata({
            query: text.substring(0, 200),
            paramCount: params?.length || 0,
            attempt
          }, 'database');

          const startTime = Date.now();
          const result = await pool.query<T>(text, params);
          const duration = Date.now() - startTime;

          // Add success annotations
          addAnnotations({
            dbOperation: operation,
            dbRowCount: result.rowCount || 0,
            dbDuration: duration
          });

          logger.debug('Query executed successfully', {
            rowCount: result.rowCount,
            duration,
          });

          return result;
        } catch (error) {
          lastError = error as Error;
          logger.warn(`Query failed on attempt ${attempt}`, {
            attempt,
            maxRetries,
            error: lastError.message,
          });

          // Check if error is transient (connection issues)
          const isTransient = isTransientError(lastError);

          if (!isTransient || attempt === maxRetries) {
            // Add error annotations
            addAnnotations({
              dbOperation: operation,
              dbError: lastError.name
            });

            logger.error('Query failed permanently', lastError, {
              query: text.substring(0, 100),
              attempts: attempt,
            });
            throw lastError;
          }

          // Exponential backoff
          const delay = Math.pow(2, attempt) * 100;
          logger.debug(`Retrying query after ${delay}ms`);
          await sleep(delay);
        }
      }

      throw lastError || new Error('Query failed after retries');
    },
    {
      operation,
      paramCount: params?.length || 0
    }
  );
}

/**
 * Execute a transaction with automatic rollback on error and X-Ray tracing
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  return traceQuery(
    'TRANSACTION',
    async () => {
      const pool = await dbPool.getPool();
      const client = await pool.connect();

      try {
        logger.debug('Starting database transaction');
        await client.query('BEGIN');

        const result = await callback(client);

        await client.query('COMMIT');
        logger.debug('Transaction committed successfully');

        // Add success annotation
        addAnnotations({ dbTransactionStatus: 'committed' });

        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Transaction rolled back due to error', error as Error);
        
        // Add rollback annotation
        addAnnotations({ dbTransactionStatus: 'rolled_back' });
        
        throw error;
      } finally {
        client.release();
      }
    },
    { operation: 'transaction' }
  );
}

/**
 * Get the database connection pool
 * Useful for LGPD compliance functions that need direct pool access
 */
export async function getPool(): Promise<Pool> {
  return await dbPool.getPool();
}

/**
 * Get a client from the pool for manual transaction management
 */
export async function getClient(): Promise<PoolClient> {
  const pool = await dbPool.getPool();
  return await pool.connect();
}

/**
 * Close the database connection pool
 */
export async function closePool(): Promise<void> {
  await dbPool.close();
}

/**
 * Check if an error is transient (should retry)
 */
function isTransientError(error: Error): boolean {
  const transientErrorCodes = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    '57P03', // PostgreSQL: cannot connect now
    '53300', // PostgreSQL: too many connections
    '08006', // PostgreSQL: connection failure
    '08003', // PostgreSQL: connection does not exist
  ];

  const errorMessage = error.message.toLowerCase();
  const errorCode = (error as any).code;

  return (
    transientErrorCodes.includes(errorCode) ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('econnrefused')
  );
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Health check - verify database connectivity
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as health');
    return result.rows.length > 0 && result.rows[0].health === 1;
  } catch (error) {
    logger.error('Database health check failed', error as Error);
    return false;
  }
}

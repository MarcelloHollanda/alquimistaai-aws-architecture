// Type declarations for Node.js globals
declare const require: any;
declare const console: any;
declare const global: any;
declare class AbortController {
  signal: any;
  abort(): void;
}

// Use require for uuid to avoid type issues
const { v4: uuidv4 } = require('uuid');

/**
 * MCP Tool definition
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

/**
 * MCP Client configuration
 */
export interface MCPClientConfig {
  timeout?: number; // milliseconds
  maxRetries?: number;
  initialRetryDelay?: number; // milliseconds
  maxRetryDelay?: number; // milliseconds
  logger?: MCPLogger;
}

/**
 * Logger interface for MCP operations
 */
export interface MCPLogger {
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, error: Error, metadata?: Record<string, any>): void;
  debug(message: string, metadata?: Record<string, any>): void;
}

/**
 * MCP Error types
 */
export class MCPError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly server: string,
    public readonly method: string,
    public readonly traceId: string,
    public readonly isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export class MCPTimeoutError extends MCPError {
  constructor(server: string, method: string, traceId: string, timeout: number) {
    super(
      `MCP call timed out after ${timeout}ms`,
      'MCP_TIMEOUT',
      server,
      method,
      traceId,
      true
    );
    this.name = 'MCPTimeoutError';
  }
}

export class MCPNetworkError extends MCPError {
  constructor(server: string, method: string, traceId: string, originalError: Error) {
    super(
      `Network error during MCP call: ${originalError.message}`,
      'MCP_NETWORK_ERROR',
      server,
      method,
      traceId,
      true
    );
    this.name = 'MCPNetworkError';
  }
}

export class MCPServerError extends MCPError {
  constructor(server: string, method: string, traceId: string, statusCode: number) {
    super(
      `MCP server error: ${statusCode}`,
      'MCP_SERVER_ERROR',
      server,
      method,
      traceId,
      statusCode >= 500 && statusCode < 600 // 5xx errors are retryable
    );
    this.name = 'MCPServerError';
  }
}

/**
 * Default console logger implementation
 */
class ConsoleLogger implements MCPLogger {
  info(message: string, metadata?: Record<string, any>): void {
    console.log(JSON.stringify({ level: 'INFO', message, ...metadata }));
  }

  warn(message: string, metadata?: Record<string, any>): void {
    console.warn(JSON.stringify({ level: 'WARN', message, ...metadata }));
  }

  error(message: string, error: Error, metadata?: Record<string, any>): void {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        message,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        ...metadata,
      })
    );
  }

  debug(message: string, metadata?: Record<string, any>): void {
    console.debug(JSON.stringify({ level: 'DEBUG', message, ...metadata }));
  }
}

/**
 * Base MCP Client for integrating external tools via Model Context Protocol
 * 
 * Features:
 * - Retry logic with exponential backoff
 * - Configurable timeout
 * - Structured logging with trace_id
 * - Error classification (transient vs permanent)
 * 
 * Requirements: 13.1, 13.8, 13.9
 */
export class MCPClient {
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly initialRetryDelay: number;
  private readonly maxRetryDelay: number;
  private readonly logger: MCPLogger;

  constructor(config: MCPClientConfig = {}) {
    this.timeout = config.timeout ?? 30000; // 30 seconds default
    this.maxRetries = config.maxRetries ?? 3;
    this.initialRetryDelay = config.initialRetryDelay ?? 1000; // 1 second
    this.maxRetryDelay = config.maxRetryDelay ?? 30000; // 30 seconds
    this.logger = config.logger ?? new ConsoleLogger();
  }

  /**
   * Call an MCP server method with retry logic and exponential backoff
   * 
   * @param server - MCP server name (e.g., 'whatsapp', 'calendar')
   * @param method - Method name to call
   * @param params - Method parameters
   * @returns Promise with method result
   * @throws MCPError if call fails after all retries
   */
  async call<T = any>(
    server: string,
    method: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    const traceId = uuidv4();
    const startTime = Date.now();

    this.logger.info('MCP call initiated', {
      traceId,
      server,
      method,
      params: this.sanitizeParams(params),
    });

    let lastError: MCPError | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.executeCall<T>(server, method, params, traceId, attempt);

        const duration = Date.now() - startTime;
        this.logger.info('MCP call succeeded', {
          traceId,
          server,
          method,
          attempt,
          duration,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        if (error instanceof MCPError) {
          lastError = error;

          this.logger.warn('MCP call failed', {
            traceId,
            server,
            method,
            attempt,
            maxRetries: this.maxRetries,
            duration,
            error: error.message,
            code: error.code,
            isRetryable: error.isRetryable,
          });

          // Don't retry if error is not retryable
          if (!error.isRetryable) {
            this.logger.error('MCP call failed with non-retryable error', error, {
              traceId,
              server,
              method,
            });
            throw error;
          }

          // Don't retry if this was the last attempt
          if (attempt === this.maxRetries) {
            break;
          }

          // Calculate delay with exponential backoff
          const delay = this.calculateRetryDelay(attempt);
          this.logger.debug('Retrying MCP call after delay', {
            traceId,
            server,
            method,
            attempt,
            nextAttempt: attempt + 1,
            delayMs: delay,
          });

          await this.sleep(delay);
        } else {
          // Unexpected error - wrap it and don't retry
          const mcpError = new MCPError(
            `Unexpected error during MCP call: ${error}`,
            'MCP_UNEXPECTED_ERROR',
            server,
            method,
            traceId,
            false
          );
          this.logger.error('MCP call failed with unexpected error', mcpError, {
            traceId,
            server,
            method,
            originalError: error,
          });
          throw mcpError;
        }
      }
    }

    // All retries exhausted
    this.logger.error('MCP call failed after all retries', lastError!, {
      traceId,
      server,
      method,
      attempts: this.maxRetries,
    });

    throw lastError!;
  }

  /**
   * List available tools from an MCP server
   * 
   * @param server - MCP server name
   * @returns Promise with array of available tools
   */
  async listTools(server: string): Promise<MCPTool[]> {
    const traceId = uuidv4();

    this.logger.info('Listing MCP tools', {
      traceId,
      server,
    });

    try {
      // In a real implementation, this would call the MCP server's list_tools endpoint
      // For now, we'll return a mock implementation
      const tools = await this.executeListTools(server, traceId);

      this.logger.info('MCP tools listed successfully', {
        traceId,
        server,
        toolCount: tools.length,
      });

      return tools;
    } catch (error) {
      this.logger.error('Failed to list MCP tools', error as Error, {
        traceId,
        server,
      });
      throw error;
    }
  }

  /**
   * Execute the actual MCP call (to be implemented by specific integrations)
   * This is a placeholder that should be overridden or extended
   */
  private async executeCall<T>(
    server: string,
    method: string,
    params: Record<string, any>,
    traceId: string,
    attempt: number
  ): Promise<T> {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = global.setTimeout(() => controller.abort(), this.timeout);

    try {
      // In a real implementation, this would make an HTTP request to the MCP server
      // For now, we'll simulate the call
      const result = await this.simulateMCPCall<T>(
        server,
        method,
        params,
        controller.signal
      );

      global.clearTimeout(timeoutId);
      return result;
    } catch (error) {
      global.clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new MCPTimeoutError(server, method, traceId, this.timeout);
      }

      // Classify error type
      if (this.isNetworkError(error)) {
        throw new MCPNetworkError(server, method, traceId, error as Error);
      }

      throw error;
    }
  }

  /**
   * Execute list tools call (to be implemented by specific integrations)
   */
  private async executeListTools(server: string, traceId: string): Promise<MCPTool[]> {
    // In a real implementation, this would call the MCP server's list_tools endpoint
    // For now, return empty array
    return [];
  }

  /**
   * Simulate MCP call (placeholder for actual implementation)
   */
  private async simulateMCPCall<T>(
    server: string,
    method: string,
    params: Record<string, any>,
    signal: any
  ): Promise<T> {
    // This is a placeholder that should be replaced with actual MCP protocol implementation
    // In a real implementation, this would:
    // 1. Construct MCP request payload
    // 2. Make HTTP request to MCP server endpoint
    // 3. Parse and validate response
    // 4. Return result

    return new Promise((resolve, reject) => {
      // Check if already aborted
      if (signal.aborted) {
        reject(new Error('AbortError'));
        return;
      }

      // Listen for abort signal
      signal.addEventListener('abort', () => {
        reject(new Error('AbortError'));
      });

      // Simulate async operation
      global.setTimeout(() => {
        resolve({} as T);
      }, 100);
    });
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff: initialDelay * 2^(attempt-1)
    const exponentialDelay = this.initialRetryDelay * Math.pow(2, attempt - 1);

    // Add jitter (±25% random variation)
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
    const delayWithJitter = exponentialDelay + jitter;

    // Cap at maxRetryDelay
    return Math.min(delayWithJitter, this.maxRetryDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => global.setTimeout(resolve, ms));
  }

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: any): boolean {
    if (error instanceof Error) {
      const networkErrorCodes = [
        'ECONNREFUSED',
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'ENETUNREACH',
      ];
      return networkErrorCodes.some((code) => error.message.includes(code));
    }
    return false;
  }

  /**
   * Sanitize params for logging (remove sensitive data)
   */
  private sanitizeParams(params: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization'];
    const sanitized = { ...params };

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}

/**
 * Create a configured MCP client instance
 */
export function createMCPClient(config?: MCPClientConfig): MCPClient {
  return new MCPClient(config);
}

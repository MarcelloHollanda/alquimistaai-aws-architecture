import { Logger, EnhancedLogger } from './logger';

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

export interface RetryMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  retriedAttempts: number;
  averageAttempts: number;
}

export class RetryHandler {
  private metrics: RetryMetrics = {
    totalAttempts: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    retriedAttempts: 0,
    averageAttempts: 0
  };

  constructor(
    private name: string,
    private config: RetryConfig = {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2
    },
    private logger?: EnhancedLogger
  ) {
    this.logger?.info('Retry handler initialized', {
      operation: 'retry-handler.init',
      customMetrics: {
        name: this.name,
        config: this.config
      }
    });
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    let attempt = 0;

    this.metrics.totalAttempts++;

    while (attempt < this.config.maxAttempts) {
      attempt++;

      try {
        this.logger?.debug('Retry handler executing attempt', {
          operation: 'retry-handler.attempt',
          customMetrics: {
            name: this.name,
            attempt,
            maxAttempts: this.config.maxAttempts
          }
        });

        const result = await operation();

        // Success
        this.metrics.successfulAttempts++;
        if (attempt > 1) {
          this.metrics.retriedAttempts++;
        }

        this.updateAverageAttempts(attempt);

        this.logger?.info('Retry handler operation succeeded', {
          operation: 'retry-handler.success',
          customMetrics: {
            name: this.name,
            attempt,
            totalAttempts: attempt
          }
        });

        return result;
      } catch (error) {
        lastError = error as Error;

        this.logger?.warn('Retry handler attempt failed', {
          operation: 'retry-handler.attempt-failed',
          customMetrics: {
            name: this.name,
            attempt,
            maxAttempts: this.config.maxAttempts,
            errorType: lastError.name,
            errorMessage: lastError.message
          }
        });

        // Check if error is retryable
        if (!this.isRetryableError(lastError)) {
          this.logger?.error('Non-retryable error encountered', lastError, {
            operation: 'retry-handler.non-retryable',
            customMetrics: {
              name: this.name,
              attempt,
              errorType: lastError.name
            }
          });

          this.metrics.failedAttempts++;
          throw lastError;
        }

        // Last attempt failed
        if (attempt >= this.config.maxAttempts) {
          this.logger?.error('All retry attempts exhausted', lastError, {
            operation: 'retry-handler.exhausted',
            customMetrics: {
              name: this.name,
              totalAttempts: attempt,
              errorType: lastError.name
            }
          });

          this.metrics.failedAttempts++;
          this.updateAverageAttempts(attempt);

          throw new RetryExhaustedError(
            `Operation failed after ${attempt} attempts: ${lastError.message}`,
            lastError,
            attempt
          );
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt);

        this.logger?.info('Retrying operation after delay', {
          operation: 'retry-handler.retry',
          customMetrics: {
            name: this.name,
            attempt,
            delay,
            nextAttempt: attempt + 1
          }
        });

        // Call onRetry callback if provided
        if (this.config.onRetry) {
          this.config.onRetry(attempt, lastError, delay);
        }

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError!;
  }

  private calculateDelay(attempt: number): number {
    // Exponential backoff: initialDelay * (backoffMultiplier ^ (attempt - 1))
    const delay = this.config.initialDelay * Math.pow(
      this.config.backoffMultiplier,
      attempt - 1
    );

    // Add jitter (random variation) to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay; // 0-30% jitter

    // Cap at maxDelay
    return Math.min(delay + jitter, this.config.maxDelay);
  }

  private isRetryableError(error: Error): boolean {
    // If retryableErrors is specified, check if error matches
    if (this.config.retryableErrors && this.config.retryableErrors.length > 0) {
      return this.config.retryableErrors.includes(error.name);
    }

    // Default retryable errors
    const defaultRetryableErrors = [
      'TimeoutError',
      'NetworkError',
      'ServiceUnavailableError',
      'ThrottlingError',
      'TooManyRequestsError',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND'
    ];

    return defaultRetryableErrors.some(
      retryable => error.name === retryable || error.message.includes(retryable)
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateAverageAttempts(attempts: number): void {
    const total = this.metrics.successfulAttempts + this.metrics.failedAttempts;
    const currentTotal = this.metrics.averageAttempts * (total - 1);
    this.metrics.averageAttempts = (currentTotal + attempts) / total;
  }

  getMetrics(): RetryMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      retriedAttempts: 0,
      averageAttempts: 0
    };

    this.logger?.info('Retry handler metrics reset', {
      operation: 'retry-handler.reset',
      customMetrics: {
        name: this.name
      }
    });
  }
}

// Custom error
export class RetryExhaustedError extends Error {
  constructor(
    message: string,
    public readonly cause: Error,
    public readonly attempts: number
  ) {
    super(message);
    this.name = 'RetryExhaustedError';
  }
}

// Retry with circuit breaker integration
export async function retryWithCircuitBreaker<T>(
  operation: () => Promise<T>,
  retryConfig: RetryConfig,
  circuitBreakerName: string,
  logger?: EnhancedLogger
): Promise<T> {
  const { CircuitBreakerRegistry } = await import('./circuit-breaker');
  
  const registry = CircuitBreakerRegistry.getInstance(logger);
  const circuitBreaker = registry.getOrCreate(circuitBreakerName);
  
  const retryHandler = new RetryHandler(
    `${circuitBreakerName}-retry`,
    retryConfig,
    logger
  );

  return retryHandler.execute(() => circuitBreaker.execute(operation));
}

// Decorator for automatic retry
export function Retry(config?: Partial<RetryConfig>) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = (this as any).logger as EnhancedLogger | undefined;
      const retryHandler = new RetryHandler(
        `${target.constructor.name}.${propertyName}`,
        {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 30000,
          backoffMultiplier: 2,
          ...config
        },
        logger
      );

      return retryHandler.execute(() => method.apply(this, args));
    };

    return descriptor;
  };
}

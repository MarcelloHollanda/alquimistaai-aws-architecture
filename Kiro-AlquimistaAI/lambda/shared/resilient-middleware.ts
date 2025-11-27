import { Logger, EnhancedLogger } from './logger';
import { CircuitBreaker, CircuitBreakerRegistry, CircuitBreakerConfig } from './circuit-breaker';
import { RetryHandler, RetryConfig } from './retry-handler';
import { TimeoutManager, TimeoutConfig } from './timeout-manager';

export interface ResilientConfig {
  circuitBreaker?: CircuitBreakerConfig;
  retry?: RetryConfig;
  timeout?: TimeoutConfig;
  fallback?: <T>(error: Error) => Promise<T> | T;
}

export class ResilientOperation {
  private circuitBreaker?: CircuitBreaker;
  private retryHandler?: RetryHandler;
  private timeoutManager?: TimeoutManager;

  constructor(
    private name: string,
    private config: ResilientConfig,
    private logger?: EnhancedLogger
  ) {
    // Initialize circuit breaker if configured
    if (config.circuitBreaker) {
      const registry = CircuitBreakerRegistry.getInstance(logger);
      this.circuitBreaker = registry.getOrCreate(name, config.circuitBreaker);
    }

    // Initialize retry handler if configured
    if (config.retry) {
      this.retryHandler = new RetryHandler(name, config.retry, logger);
    }

    // Initialize timeout manager if configured
    if (config.timeout) {
      this.timeoutManager = new TimeoutManager(name, config.timeout, logger);
    }

    this.logger?.info('Resilient operation initialized', {
      operation: 'resilient.init',
      customMetrics: {
        name,
        hasCircuitBreaker: !!this.circuitBreaker,
        hasRetry: !!this.retryHandler,
        hasTimeout: !!this.timeoutManager,
        hasFallback: !!config.fallback
      }
    });
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      // Wrap operation with all resilience patterns
      let wrappedOperation = operation;

      // 1. Timeout (innermost)
      if (this.timeoutManager) {
        const timeoutOp = wrappedOperation;
        wrappedOperation = () => this.timeoutManager!.execute(timeoutOp);
      }

      // 2. Circuit Breaker
      if (this.circuitBreaker) {
        const cbOp = wrappedOperation;
        wrappedOperation = () => this.circuitBreaker!.execute(cbOp);
      }

      // 3. Retry (outermost)
      if (this.retryHandler) {
        const retryOp = wrappedOperation;
        wrappedOperation = () => this.retryHandler!.execute(retryOp);
      }

      return await wrappedOperation();
    } catch (error) {
      // Try fallback if configured
      if (this.config.fallback) {
        this.logger?.warn('Executing fallback', {
          operation: 'resilient.fallback',
          customMetrics: {
            name: this.name,
            errorType: (error as Error).name
          }
        });

        return await this.config.fallback(error as Error);
      }

      throw error;
    }
  }
}

// Factory function for creating resilient operations
export function createResilientOperation(
  name: string,
  config: ResilientConfig,
  logger?: EnhancedLogger
): ResilientOperation {
  return new ResilientOperation(name, config, logger);
}

// Decorator for resilient methods
export function Resilient(config: ResilientConfig) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = (this as any).logger as EnhancedLogger | undefined;
      const resilientOp = new ResilientOperation(
        `${target.constructor.name}.${propertyName}`,
        config,
        logger
      );

      return resilientOp.execute(() => method.apply(this, args));
    };

    return descriptor;
  };
}

// Preset configurations for common scenarios
export const ResilientPresets = {
  // For external API calls
  externalApi: (logger?: EnhancedLogger): ResilientConfig => ({
    circuitBreaker: {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
      resetTimeout: 60000,
      monitoringPeriod: 60000
    },
    retry: {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: ['TimeoutError', 'NetworkError', 'ServiceUnavailableError']
    },
    timeout: {
      timeout: 30000
    }
  }),

  // For database operations
  database: (logger?: EnhancedLogger): ResilientConfig => ({
    circuitBreaker: {
      failureThreshold: 10,
      successThreshold: 3,
      timeout: 60000,
      resetTimeout: 30000,
      monitoringPeriod: 60000
    },
    retry: {
      maxAttempts: 3,
      initialDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 2,
      retryableErrors: ['TimeoutError', 'ECONNRESET', 'ETIMEDOUT']
    },
    timeout: {
      timeout: 10000
    }
  }),

  // For MCP integrations
  mcp: (logger?: EnhancedLogger): ResilientConfig => ({
    circuitBreaker: {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 60000,
      resetTimeout: 120000,
      monitoringPeriod: 60000
    },
    retry: {
      maxAttempts: 2,
      initialDelay: 2000,
      maxDelay: 15000,
      backoffMultiplier: 2,
      retryableErrors: ['TimeoutError', 'ThrottlingError', 'TooManyRequestsError']
    },
    timeout: {
      timeout: 45000
    }
  }),

  // For internal services
  internal: (logger?: EnhancedLogger): ResilientConfig => ({
    retry: {
      maxAttempts: 2,
      initialDelay: 500,
      maxDelay: 3000,
      backoffMultiplier: 2
    },
    timeout: {
      timeout: 5000
    }
  }),

  // For critical operations (no retry, fast fail)
  critical: (logger?: EnhancedLogger): ResilientConfig => ({
    timeout: {
      timeout: 3000
    }
  })
};

// Helper function to execute with resilience
export async function executeResilient<T>(
  name: string,
  operation: () => Promise<T>,
  config: ResilientConfig,
  logger?: EnhancedLogger
): Promise<T> {
  const resilientOp = new ResilientOperation(name, config, logger);
  return resilientOp.execute(operation);
}

// Helper function to execute with preset
export async function executeWithPreset<T>(
  name: string,
  operation: () => Promise<T>,
  preset: keyof typeof ResilientPresets,
  logger?: EnhancedLogger
): Promise<T> {
  const config = ResilientPresets[preset](logger);
  return executeResilient(name, operation, config, logger);
}

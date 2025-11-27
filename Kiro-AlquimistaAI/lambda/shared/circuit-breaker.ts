import { Logger, EnhancedLogger } from './logger';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export interface CircuitBreakerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rejectedRequests: number;
  state: CircuitState;
  lastStateChange: Date;
  lastFailureTime?: Date;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime?: Date;
  private lastStateChange: Date = new Date();
  private metrics: CircuitBreakerMetrics;
  private logger?: EnhancedLogger;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,
      resetTimeout: 30000,
      monitoringPeriod: 60000
    },
    logger?: EnhancedLogger
  ) {
    this.logger = logger;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      state: this.state,
      lastStateChange: this.lastStateChange
    };

    this.logger?.info('Circuit breaker initialized', {
      operation: 'circuit-breaker.init',
      customMetrics: {
        name: this.name,
        config: this.config
      }
    });
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.metrics.totalRequests++;

    // Check if circuit is open
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.transitionTo('HALF_OPEN');
      } else {
        this.metrics.rejectedRequests++;
        this.logger?.warn('Circuit breaker rejected request', {
          operation: 'circuit-breaker.reject',
          customMetrics: {
            name: this.name,
            state: this.state,
            failures: this.failures
          }
        });
        throw new CircuitBreakerOpenError(
          `Circuit breaker '${this.name}' is OPEN. Too many failures.`
        );
      }
    }

    const startTime = Date.now();

    try {
      const result = await this.executeWithTimeout(operation);
      const duration = Date.now() - startTime;

      this.onSuccess(duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.onFailure(error as Error, duration);
      throw error;
    }
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new CircuitBreakerTimeoutError(
            `Operation timed out after ${this.config.timeout}ms`
          )),
          this.config.timeout
        )
      )
    ]);
  }

  private onSuccess(duration: number): void {
    this.failures = 0;
    this.successes++;
    this.metrics.successfulRequests++;

    this.logger?.debug('Circuit breaker operation succeeded', {
      operation: 'circuit-breaker.success',
      duration,
      customMetrics: {
        name: this.name,
        state: this.state,
        successes: this.successes,
        duration
      }
    });

    if (this.state === 'HALF_OPEN') {
      if (this.successes >= this.config.successThreshold) {
        this.transitionTo('CLOSED');
        this.successes = 0;
      }
    }
  }

  private onFailure(error: Error, duration: number): void {
    this.failures++;
    this.successes = 0;
    this.lastFailureTime = new Date();
    this.metrics.failedRequests++;
    this.metrics.lastFailureTime = this.lastFailureTime;

    this.logger?.error('Circuit breaker operation failed', error, {
      operation: 'circuit-breaker.failure',
      duration,
      customMetrics: {
        name: this.name,
        state: this.state,
        failures: this.failures,
        errorType: error.name,
        duration
      }
    });

    if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN');
    } else if (this.state === 'CLOSED') {
      if (this.failures >= this.config.failureThreshold) {
        this.transitionTo('OPEN');
      }
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;

    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.config.resetTimeout;
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = new Date();
    this.metrics.state = newState;
    this.metrics.lastStateChange = this.lastStateChange;

    this.logger?.info('Circuit breaker state changed', {
      operation: 'circuit-breaker.state-change',
      customMetrics: {
        name: this.name,
        oldState,
        newState,
        failures: this.failures,
        successes: this.successes
      }
    });

    // Log metric for monitoring
    this.logger?.logCustomMetric(
      `CircuitBreaker.${this.name}.StateChange`,
      1,
      { unit: 'Count' }
    );
  }

  getState(): CircuitState {
    return this.state;
  }

  getMetrics(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.lastStateChange = new Date();

    this.logger?.info('Circuit breaker manually reset', {
      operation: 'circuit-breaker.reset',
      customMetrics: {
        name: this.name
      }
    });
  }

  // Health check method
  isHealthy(): boolean {
    return this.state === 'CLOSED' || this.state === 'HALF_OPEN';
  }
}

// Custom errors
export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

export class CircuitBreakerTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerTimeoutError';
  }
}

// Circuit breaker registry for managing multiple circuit breakers
export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry;
  private breakers: Map<string, CircuitBreaker> = new Map();
  private logger?: EnhancedLogger;

  private constructor(logger?: EnhancedLogger) {
    this.logger = logger;
  }

  static getInstance(logger?: EnhancedLogger): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry(logger);
    }
    return CircuitBreakerRegistry.instance;
  }

  getOrCreate(
    name: string,
    config?: CircuitBreakerConfig
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const breaker = new CircuitBreaker(name, config, this.logger);
      this.breakers.set(name, breaker);

      this.logger?.info('Circuit breaker registered', {
        operation: 'circuit-breaker.register',
        customMetrics: {
          name,
          totalBreakers: this.breakers.size
        }
      });
    }

    return this.breakers.get(name)!;
  }

  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  getAll(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    
    this.breakers.forEach((breaker, name) => {
      metrics[name] = breaker.getMetrics();
    });

    return metrics;
  }

  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
    
    this.logger?.info('All circuit breakers reset', {
      operation: 'circuit-breaker.reset-all',
      customMetrics: {
        count: this.breakers.size
      }
    });
  }
}

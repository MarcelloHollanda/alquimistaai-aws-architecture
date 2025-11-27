import { Logger, EnhancedLogger } from './logger';

export interface TimeoutConfig {
  timeout: number;
  onTimeout?: (duration: number) => void;
}

export interface TimeoutMetrics {
  totalOperations: number;
  timedOutOperations: number;
  successfulOperations: number;
  averageDuration: number;
  maxDuration: number;
}

export class TimeoutManager {
  private metrics: TimeoutMetrics = {
    totalOperations: 0,
    timedOutOperations: 0,
    successfulOperations: 0,
    averageDuration: 0,
    maxDuration: 0
  };

  constructor(
    private name: string,
    private config: TimeoutConfig,
    private logger?: EnhancedLogger
  ) {
    this.logger?.info('Timeout manager initialized', {
      operation: 'timeout-manager.init',
      customMetrics: {
        name: this.name,
        timeout: this.config.timeout
      }
    });
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.metrics.totalOperations++;
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        operation(),
        this.createTimeoutPromise<T>()
      ]);

      const duration = Date.now() - startTime;
      this.onSuccess(duration);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof TimeoutError) {
        this.onTimeout(duration);
      }

      throw error;
    }
  }

  private createTimeoutPromise<T>(): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(
          `Operation '${this.name}' timed out after ${this.config.timeout}ms`
        ));
      }, this.config.timeout);
    });
  }

  private onSuccess(duration: number): void {
    this.metrics.successfulOperations++;
    this.updateDurationMetrics(duration);

    this.logger?.debug('Timeout manager operation completed', {
      operation: 'timeout-manager.success',
      duration,
      customMetrics: {
        name: this.name,
        duration,
        timeout: this.config.timeout
      }
    });
  }

  private onTimeout(duration: number): void {
    this.metrics.timedOutOperations++;
    this.updateDurationMetrics(duration);

    this.logger?.error('Operation timed out', new TimeoutError('Timeout'), {
      operation: 'timeout-manager.timeout',
      duration,
      customMetrics: {
        name: this.name,
        duration,
        timeout: this.config.timeout
      }
    });

    // Log metric for monitoring
    this.logger?.logCustomMetric(
      `TimeoutManager.${this.name}.Timeout`,
      1,
      { unit: 'Count' }
    );

    // Call onTimeout callback if provided
    if (this.config.onTimeout) {
      this.config.onTimeout(duration);
    }
  }

  private updateDurationMetrics(duration: number): void {
    const total = this.metrics.successfulOperations + this.metrics.timedOutOperations;
    const currentTotal = this.metrics.averageDuration * (total - 1);
    this.metrics.averageDuration = (currentTotal + duration) / total;

    if (duration > this.metrics.maxDuration) {
      this.metrics.maxDuration = duration;
    }
  }

  getMetrics(): TimeoutMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      totalOperations: 0,
      timedOutOperations: 0,
      successfulOperations: 0,
      averageDuration: 0,
      maxDuration: 0
    };

    this.logger?.info('Timeout manager metrics reset', {
      operation: 'timeout-manager.reset',
      customMetrics: {
        name: this.name
      }
    });
  }
}

// Custom error
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Timeout decorator
export function Timeout(timeoutMs: number) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = (this as any).logger as EnhancedLogger | undefined;
      const timeoutManager = new TimeoutManager(
        `${target.constructor.name}.${propertyName}`,
        { timeout: timeoutMs },
        logger
      );

      return timeoutManager.execute(() => method.apply(this, args));
    };

    return descriptor;
  };
}

// Timeout registry for managing multiple timeout managers
export class TimeoutRegistry {
  private static instance: TimeoutRegistry;
  private managers: Map<string, TimeoutManager> = new Map();
  private logger?: EnhancedLogger;

  private constructor(logger?: EnhancedLogger) {
    this.logger = logger;
  }

  static getInstance(logger?: EnhancedLogger): TimeoutRegistry {
    if (!TimeoutRegistry.instance) {
      TimeoutRegistry.instance = new TimeoutRegistry(logger);
    }
    return TimeoutRegistry.instance;
  }

  getOrCreate(name: string, config: TimeoutConfig): TimeoutManager {
    if (!this.managers.has(name)) {
      const manager = new TimeoutManager(name, config, this.logger);
      this.managers.set(name, manager);

      this.logger?.info('Timeout manager registered', {
        operation: 'timeout-manager.register',
        customMetrics: {
          name,
          totalManagers: this.managers.size
        }
      });
    }

    return this.managers.get(name)!;
  }

  get(name: string): TimeoutManager | undefined {
    return this.managers.get(name);
  }

  getAll(): Map<string, TimeoutManager> {
    return new Map(this.managers);
  }

  getAllMetrics(): Record<string, TimeoutMetrics> {
    const metrics: Record<string, TimeoutMetrics> = {};
    
    this.managers.forEach((manager, name) => {
      metrics[name] = manager.getMetrics();
    });

    return metrics;
  }

  resetAll(): void {
    this.managers.forEach(manager => manager.reset());
    
    this.logger?.info('All timeout managers reset', {
      operation: 'timeout-manager.reset-all',
      customMetrics: {
        count: this.managers.size
      }
    });
  }
}

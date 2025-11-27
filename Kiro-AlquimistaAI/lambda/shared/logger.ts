import { Logger as PowertoolsLogger } from '@aws-lambda-powertools/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Context information for structured logging
 */
export interface LogContext {
  traceId?: string;
  agent?: string;
  leadId?: string;
  tenantId?: string;
  campaignId?: string;
  [key: string]: any;
}

/**
 * Structured logger using AWS Lambda Powertools
 * Automatically includes trace_id, agent, leadId, and tenantId in all logs
 */
export class Logger {
  private logger: PowertoolsLogger;
  private context: LogContext;

  constructor(serviceName?: string, context?: LogContext) {
    this.logger = new PowertoolsLogger({
      serviceName: serviceName || process.env.POWERTOOLS_SERVICE_NAME || 'fibonacci-service',
      logLevel: (process.env.LOG_LEVEL as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR') || 'INFO',
      sampleRateValue: 0.1, // Sample 10% of logs for detailed tracing
    });

    this.context = {
      traceId: context?.traceId || uuidv4(),
      ...context,
    };

    // Add persistent context to all logs
    if (this.context.agent) {
      this.logger.appendKeys({ agent: this.context.agent });
    }
    if (this.context.leadId) {
      this.logger.appendKeys({ leadId: this.context.leadId });
    }
    if (this.context.tenantId) {
      this.logger.appendKeys({ tenantId: this.context.tenantId });
    }
  }

  /**
   * Get the current trace ID
   */
  getTraceId(): string {
    return this.context.traceId || '';
  }

  /**
   * Set a new trace ID
   */
  setTraceId(traceId: string): void {
    this.context.traceId = traceId;
  }

  /**
   * Get the current context
   */
  getContext(): LogContext {
    return { ...this.context };
  }

  /**
   * Update context with new values
   */
  updateContext(newContext: Partial<LogContext>): void {
    this.context = { ...this.context, ...newContext };
    
    // Update persistent keys in Powertools logger
    const keysToAdd: Record<string, any> = {};
    if (newContext.agent) keysToAdd.agent = newContext.agent;
    if (newContext.leadId) keysToAdd.leadId = newContext.leadId;
    if (newContext.tenantId) keysToAdd.tenantId = newContext.tenantId;
    if (newContext.campaignId) keysToAdd.campaignId = newContext.campaignId;
    
    if (Object.keys(keysToAdd).length > 0) {
      this.logger.appendKeys(keysToAdd);
    }
  }

  /**
   * Log info level message
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.logger.info(message, {
      trace_id: this.context.traceId,
      ...metadata,
    });
  }

  /**
   * Log warning level message
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.logger.warn(message, {
      trace_id: this.context.traceId,
      ...metadata,
    });
  }

  /**
   * Log error level message
   */
  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    const errorDetails = error
      ? {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : {};

    this.logger.error(message, {
      trace_id: this.context.traceId,
      ...errorDetails,
      ...metadata,
    });
  }

  /**
   * Log debug level message
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.logger.debug(message, {
      trace_id: this.context.traceId,
      ...metadata,
    });
  }

  /**
   * Add persistent log keys that will be included in all subsequent logs
   */
  appendKeys(keys: Record<string, any>): void {
    this.logger.appendKeys(keys);
  }

  /**
   * Remove persistent log keys
   */
  removeKeys(keys: string[]): void {
    this.logger.removeKeys(keys);
  }

  /**
   * Create a child logger with additional context
   */
  createChild(additionalContext: Partial<LogContext>): Logger {
    const childLogger = new Logger(
      process.env.POWERTOOLS_SERVICE_NAME || 'fibonacci-service',
      { ...this.context, ...additionalContext }
    );
    return childLogger;
  }

  /**
   * Log custom metric (for backward compatibility)
   */
  logCustomMetric(metricName: string, value: number, metadata?: Record<string, any>): void {
    this.info(`Custom metric: ${metricName}`, {
      metric: metricName,
      value,
      ...metadata
    });
  }

  /**
   * Log API request (for backward compatibility)
   */
  logApiRequest(method: string, path: string, metadata?: Record<string, any>): void {
    this.info(`API Request: ${method} ${path}`, {
      method,
      path,
      ...metadata
    });
  }

  /**
   * Finish operation logging (for backward compatibility)
   */
  finishOperation(success: boolean, metadata?: Record<string, any>): void {
    if (success) {
      this.info('Operation completed successfully', metadata);
    } else {
      this.error('Operation failed', undefined, metadata);
    }
  }
}

/**
 * Create a logger instance with optional service name and context
 */
export function createLogger(serviceName?: string, context?: LogContext): Logger {
  return new Logger(serviceName, context);
}

/**
 * Create a logger for an agent with automatic agent name context
 */
export function createAgentLogger(agentName: string, context?: Partial<LogContext>): Logger {
  return new Logger(`fibonacci-${agentName}`, {
    agent: agentName,
    ...context,
  });
}

/**
 * Type alias for enhanced logger (for backward compatibility)
 */
export type EnhancedLogger = Logger;

/**
 * Default logger instance
 */
export const logger = new Logger();

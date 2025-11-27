// Logger estruturado para o Micro Agente
// AlquimistaAI - Padrão Oficial

export interface LogContext {
  contactId?: string;
  campaignId?: string;
  messageId?: string;
  interactionId?: string;
  scheduleId?: string;
  [key: string]: any;
}

export class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  private log(level: string, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      data,
      environment: process.env.ENVIRONMENT,
      service: 'micro-agente-disparo-agenda',
    };

    console.log(JSON.stringify(logEntry));
  }

  info(message: string, data?: any) {
    this.log('INFO', message, data);
  }

  warn(message: string, data?: any) {
    this.log('WARN', message, data);
  }

  error(message: string, error?: Error | any) {
    this.log('ERROR', message, {
      error: error?.message || error,
      stack: error?.stack,
    });
  }

  debug(message: string, data?: any) {
    if (process.env.ENVIRONMENT === 'dev') {
      this.log('DEBUG', message, data);
    }
  }

  withContext(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }
}

export const createLogger = (context?: LogContext) => new Logger(context);

// Export default logger instance
export const logger = new Logger();

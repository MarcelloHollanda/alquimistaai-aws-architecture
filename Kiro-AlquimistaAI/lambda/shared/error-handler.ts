import { Handler, Context } from 'aws-lambda';
import { SQS, SNS } from 'aws-sdk';
import { Logger, createLogger } from './logger';
import { v4 as uuidv4 } from 'uuid';
import { getSegment, addAnnotations, addMetadata } from './xray-tracer';

const sqs = new SQS();
const sns = new SNS();

/**
 * Error classification types
 */
export enum ErrorType {
  TRANSIENT = 'transient', // Temporary errors that should be retried
  PERMANENT = 'permanent', // Permanent errors that should not be retried
  CRITICAL = 'critical', // Critical errors that require immediate attention
}

/**
 * Error classification result
 */
interface ErrorClassification {
  type: ErrorType;
  shouldRetry: boolean;
  shouldAlert: boolean;
}

/**
 * Classify error based on its characteristics
 */
export function classifyError(error: Error): ErrorClassification {
  const errorMessage = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();
  const errorCode = (error as any).code;

  // Transient errors (network, timeouts, rate limits)
  const transientPatterns = [
    'timeout',
    'econnrefused',
    'econnreset',
    'etimedout',
    'enotfound',
    'network',
    'connection',
    'throttl',
    'rate limit',
    '429',
    '503',
    '504',
    'too many requests',
    'service unavailable',
    'gateway timeout',
  ];

  for (const pattern of transientPatterns) {
    if (
      errorMessage.includes(pattern) ||
      errorName.includes(pattern) ||
      errorCode === pattern
    ) {
      return {
        type: ErrorType.TRANSIENT,
        shouldRetry: true,
        shouldAlert: false,
      };
    }
  }

  // Critical errors (security, data corruption, system failures)
  const criticalPatterns = [
    'unauthorized',
    'forbidden',
    'access denied',
    'authentication',
    'security',
    'corruption',
    'integrity',
    'out of memory',
    'disk full',
    'database corruption',
  ];

  for (const pattern of criticalPatterns) {
    if (errorMessage.includes(pattern) || errorName.includes(pattern)) {
      return {
        type: ErrorType.CRITICAL,
        shouldRetry: false,
        shouldAlert: true,
      };
    }
  }

  // Permanent errors (validation, not found, bad request)
  const permanentPatterns = [
    'validation',
    'invalid',
    'not found',
    '404',
    '400',
    'bad request',
    'malformed',
    'schema',
    'parse error',
  ];

  for (const pattern of permanentPatterns) {
    if (
      errorMessage.includes(pattern) ||
      errorName.includes(pattern) ||
      errorCode === pattern
    ) {
      return {
        type: ErrorType.PERMANENT,
        shouldRetry: false,
        shouldAlert: false,
      };
    }
  }

  // Default to permanent error
  return {
    type: ErrorType.PERMANENT,
    shouldRetry: false,
    shouldAlert: false,
  };
}

/**
 * Send message to Dead Letter Queue
 */
async function sendToDLQ(
  event: any,
  error: Error,
  traceId: string,
  context: Context
): Promise<void> {
  const dlqUrl = process.env.DLQ_URL;

  if (!dlqUrl) {
    console.warn('DLQ_URL not configured, skipping DLQ send');
    return;
  }

  try {
    const message = {
      originalEvent: event,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      traceId,
      context: {
        functionName: context.functionName,
        functionVersion: context.functionVersion,
        requestId: context.awsRequestId,
        timestamp: new Date().toISOString(),
      },
    };

    await sqs
      .sendMessage({
        QueueUrl: dlqUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          traceId: {
            DataType: 'String',
            StringValue: traceId,
          },
          errorType: {
            DataType: 'String',
            StringValue: error.name,
          },
        },
      })
      .promise();

    console.log('Message sent to DLQ', { traceId, dlqUrl });
  } catch (dlqError) {
    console.error('Failed to send message to DLQ', dlqError);
  }
}

/**
 * Send alert for critical errors
 */
async function sendAlert(
  error: Error,
  traceId: string,
  context: Context,
  event: any
): Promise<void> {
  const alertTopicArn = process.env.ALERT_TOPIC_ARN;

  if (!alertTopicArn) {
    console.warn('ALERT_TOPIC_ARN not configured, skipping alert');
    return;
  }

  try {
    const message = {
      severity: 'CRITICAL',
      service: context.functionName,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      traceId,
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId,
      event: JSON.stringify(event).substring(0, 500), // Limit event size
    };

    await sns
      .publish({
        TopicArn: alertTopicArn,
        Subject: `🚨 CRITICAL ERROR: ${context.functionName}`,
        Message: JSON.stringify(message, null, 2),
        MessageAttributes: {
          severity: {
            DataType: 'String',
            StringValue: 'CRITICAL',
          },
          service: {
            DataType: 'String',
            StringValue: context.functionName,
          },
        },
      })
      .promise();

    console.log('Critical alert sent', { traceId, alertTopicArn });
  } catch (alertError) {
    console.error('Failed to send alert', alertError);
  }
}

/**
 * Error handler wrapper for Lambda functions
 * Automatically handles error classification, logging, DLQ, alerts, and X-Ray tracing
 */
export function withErrorHandling<TEvent = any, TResult = any>(
  handler: (event: TEvent, context: Context, logger: Logger) => Promise<TResult>
): Handler<TEvent, TResult> {
  return async (event: TEvent, context: Context): Promise<TResult> => {
    const traceId = uuidv4();
    const logger = createLogger(context.functionName, { traceId });
    const segment = getSegment();

    // Add X-Ray annotations for filtering
    addAnnotations({
      traceId,
      functionName: context.functionName,
      functionVersion: context.functionVersion,
      requestId: context.awsRequestId
    });

    try {
      logger.info('Lambda invocation started', {
        functionName: context.functionName,
        functionVersion: context.functionVersion,
        requestId: context.awsRequestId,
        remainingTimeMs: context.getRemainingTimeInMillis(),
      });

      const result = await handler(event, context, logger);

      // Add success annotation
      addAnnotations({ status: 'success' });

      logger.info('Lambda invocation completed successfully', {
        remainingTimeMs: context.getRemainingTimeInMillis(),
      });

      return result;
    } catch (error) {
      const err = error as Error;
      const classification = classifyError(err);

      // Add error annotations and metadata to X-Ray
      addAnnotations({ 
        status: 'error',
        errorType: classification.type,
        errorName: err.name
      });

      addMetadata({
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
          classification: classification.type
        }
      }, 'error');

      // Add error to X-Ray segment
      if (segment) {
        segment.addError(err);
      }

      logger.error('Lambda invocation failed', err, {
        errorType: classification.type,
        shouldRetry: classification.shouldRetry,
        shouldAlert: classification.shouldAlert,
      });

      // Send to DLQ for permanent and critical errors
      if (
        classification.type === ErrorType.PERMANENT ||
        classification.type === ErrorType.CRITICAL
      ) {
        await sendToDLQ(event, err, traceId, context);
      }

      // Send alert for critical errors
      if (classification.shouldAlert) {
        await sendAlert(err, traceId, context, event);
      }

      // For transient errors, throw to trigger Lambda retry
      if (classification.shouldRetry) {
        logger.warn('Throwing error to trigger Lambda retry');
        throw err;
      }

      // For permanent errors, return error response without retrying
      logger.warn('Returning error response without retry');
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Internal error',
          traceId,
          message: err.message,
        }),
      } as any;
    }
  };
}

/**
 * Simple error handler for non-HTTP Lambda functions
 * Includes X-Ray tracing integration
 */
export function withSimpleErrorHandling<TEvent = any, TResult = any>(
  handler: (event: TEvent, context: Context, logger: Logger) => Promise<TResult>
): Handler<TEvent, TResult> {
  return async (event: TEvent, context: Context): Promise<TResult> => {
    const traceId = uuidv4();
    const logger = createLogger(context.functionName, { traceId });
    const segment = getSegment();

    // Add X-Ray annotations for filtering
    addAnnotations({
      traceId,
      functionName: context.functionName,
      requestId: context.awsRequestId
    });

    try {
      logger.info('Processing event', {
        functionName: context.functionName,
      });

      const result = await handler(event, context, logger);

      // Add success annotation
      addAnnotations({ status: 'success' });

      logger.info('Event processed successfully');
      return result;
    } catch (error) {
      const err = error as Error;
      const classification = classifyError(err);

      // Add error annotations and metadata to X-Ray
      addAnnotations({ 
        status: 'error',
        errorType: classification.type,
        errorName: err.name
      });

      addMetadata({
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
          classification: classification.type
        }
      }, 'error');

      // Add error to X-Ray segment
      if (segment) {
        segment.addError(err);
      }

      logger.error('Event processing failed', err, {
        errorType: classification.type,
      });

      // Send to DLQ for non-transient errors
      if (!classification.shouldRetry) {
        await sendToDLQ(event, err, traceId, context);
      }

      // Send alert for critical errors
      if (classification.shouldAlert) {
        await sendAlert(err, traceId, context, event);
      }

      // Always throw to let Lambda handle retry logic
      throw err;
    }
  };
}

/**
 * Check if error is transient (for manual error handling)
 */
export function isTransientError(error: Error): boolean {
  const classification = classifyError(error);
  return classification.type === ErrorType.TRANSIENT;
}

/**
 * Check if error is critical (for manual error handling)
 */
export function isCriticalError(error: Error): boolean {
  const classification = classifyError(error);
  return classification.type === ErrorType.CRITICAL;
}

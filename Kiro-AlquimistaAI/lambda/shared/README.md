# Shared Utilities

This directory contains shared utilities used across all Lambda functions in the Fibonacci ecosystem.

## Components

### Logger (`logger.ts`)

Structured logging using AWS Lambda Powertools with automatic trace_id injection.

**Usage:**
```typescript
import { Logger, createLogger } from './shared/logger';

// Create a logger instance
const logger = new Logger('my-service');

// Log messages
logger.info('Processing started', { userId: '123' });
logger.warn('Rate limit approaching', { current: 95, max: 100 });
logger.error('Processing failed', error, { userId: '123' });
logger.debug('Debug information', { data: someData });

// Create child logger with additional context
const childLogger = logger.createChild({ requestId: 'abc-123' });
```

**Features:**
- Automatic trace_id injection
- JSON structured logging
- Support for info, warn, error, debug levels
- Child loggers with inherited context
- Integration with AWS Lambda Powertools

### Database (`database.ts`)

PostgreSQL connection pool with automatic credential management and retry logic.

**Usage:**
```typescript
import { query, transaction, getClient, healthCheck } from './shared/database';

// Simple query
const result = await query('SELECT * FROM users WHERE id = $1', [userId]);

// Transaction
await transaction(async (client) => {
  await client.query('INSERT INTO users (name) VALUES ($1)', ['John']);
  await client.query('INSERT INTO audit_log (action) VALUES ($1)', ['user_created']);
});

// Health check
const isHealthy = await healthCheck();
```

**Features:**
- Automatic credential retrieval from Secrets Manager
- Connection pooling (max 10 connections)
- Automatic retry with exponential backoff (3 attempts)
- Transaction support with automatic rollback
- SSL/TLS encryption for Aurora
- Transient error detection

### Error Handler (`error-handler.ts`)

Automatic error classification, DLQ handling, and alerting for Lambda functions.

**Usage:**
```typescript
import { withErrorHandling, withSimpleErrorHandling } from './shared/error-handler';

// HTTP Lambda with error handling
export const handler = withErrorHandling(async (event, context, logger) => {
  logger.info('Processing request');
  
  // Your business logic here
  const result = await processRequest(event);
  
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});

// Event-driven Lambda with simple error handling
export const handler = withSimpleErrorHandling(async (event, context, logger) => {
  logger.info('Processing event');
  
  // Your business logic here
  await processEvent(event);
});
```

**Features:**
- Automatic error classification (transient, permanent, critical)
- DLQ integration for permanent/critical errors
- SNS alerts for critical errors
- Automatic retry for transient errors
- Structured error logging with trace_id
- Lambda context integration

**Error Types:**
- **Transient**: Network timeouts, rate limits, service unavailable (retries automatically)
- **Permanent**: Validation errors, not found, bad request (sent to DLQ)
- **Critical**: Security issues, data corruption, system failures (alerts + DLQ)

### Circuit Breaker (`circuit-breaker.ts`)

Protect services from cascading failures with automatic circuit breaking.

**Usage:**
```typescript
import { CircuitBreaker, createCircuitBreaker } from './shared/circuit-breaker';

// Create a circuit breaker
const breaker = new CircuitBreaker({
  failureThreshold: 5,      // Open after 5 failures
  successThreshold: 2,      // Close after 2 successes in half-open
  timeout: 60000,           // Wait 60s before trying again
  name: 'external-api'
});

// Execute with circuit breaker protection
try {
  const result = await breaker.execute(async () => {
    return await callExternalAPI();
  });
} catch (error) {
  if (breaker.isOpen()) {
    logger.warn('Circuit is open, using fallback');
    return fallbackResponse;
  }
  throw error;
}

// Check circuit state
console.log(breaker.getState());        // 'closed', 'open', or 'half-open'
console.log(breaker.getStats());        // Detailed statistics
console.log(breaker.getFailureRate()); // Failure rate percentage
```

**Features:**
- Three states: closed, open, half-open
- Configurable failure threshold (default: 5)
- Configurable recovery timeout (default: 60s)
- Automatic state transitions
- Detailed statistics tracking
- Circuit breaker registry for managing multiple breakers

**States:**
- **Closed**: Normal operation, all requests pass through
- **Open**: Circuit is open, requests fail immediately without calling the service
- **Half-Open**: Testing if service recovered, limited requests allowed

## Environment Variables

These utilities use the following environment variables:

### Logger
- `POWERTOOLS_SERVICE_NAME`: Service name for logging (default: 'fibonacci-service')
- `LOG_LEVEL`: Log level - DEBUG, INFO, WARN, ERROR (default: 'INFO')

### Database
- `DB_SECRET_ARN`: ARN of the Secrets Manager secret containing database credentials

### Error Handler
- `DLQ_URL`: SQS Dead Letter Queue URL for failed messages
- `ALERT_TOPIC_ARN`: SNS Topic ARN for critical error alerts

## Best Practices

1. **Always use the logger** instead of console.log for structured logging
2. **Use withErrorHandling** for all Lambda functions to ensure consistent error handling
3. **Use circuit breakers** for external API calls to prevent cascading failures
4. **Use transactions** for multi-step database operations to ensure data consistency
5. **Include trace_id** in all logs for distributed tracing
6. **Set appropriate timeouts** for circuit breakers based on service SLAs

## Testing

All utilities include comprehensive error handling and logging. To test:

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage
```

## Integration with Lambda

Example of a complete Lambda function using all utilities:

```typescript
import { withErrorHandling } from './shared/error-handler';
import { query } from './shared/database';
import { createCircuitBreaker } from './shared/circuit-breaker';

const apiBreaker = createCircuitBreaker('external-api', {
  failureThreshold: 5,
  timeout: 60000
});

export const handler = withErrorHandling(async (event, context, logger) => {
  logger.info('Processing request', { eventType: event.type });
  
  // Database query with automatic retry
  const user = await query(
    'SELECT * FROM users WHERE id = $1',
    [event.userId]
  );
  
  // External API call with circuit breaker
  const enrichedData = await apiBreaker.execute(async () => {
    return await callExternalAPI(user);
  });
  
  logger.info('Request processed successfully', {
    userId: event.userId,
    enrichedFields: Object.keys(enrichedData).length
  });
  
  return {
    statusCode: 200,
    body: JSON.stringify({ user, enrichedData })
  };
});
```

## Monitoring

All utilities emit structured logs that can be queried in CloudWatch Logs Insights:

```
# Find all errors with trace_id
fields @timestamp, message, trace_id, error.message
| filter level = "ERROR"
| sort @timestamp desc

# Circuit breaker state changes
fields @timestamp, message, name, oldState, newState
| filter message like /state changed/
| sort @timestamp desc

# Database query performance
fields @timestamp, message, duration, rowCount
| filter message like /Query executed/
| stats avg(duration), max(duration), count() by bin(5m)
```

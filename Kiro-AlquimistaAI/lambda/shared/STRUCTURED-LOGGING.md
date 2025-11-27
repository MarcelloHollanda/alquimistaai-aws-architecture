# Structured Logging Implementation

## Overview

This document describes the structured logging implementation for the Fibonacci ecosystem. All Lambda functions use a consistent logging approach that includes trace IDs, agent names, lead IDs, and tenant IDs for complete observability.

## Logger Features

### Core Features

1. **Automatic Trace ID**: Every log entry includes a unique trace ID for request tracking
2. **Context Propagation**: Agent name, lead ID, and tenant ID are automatically included in all logs
3. **JSON Structured Format**: All logs are formatted as JSON for easy parsing and querying
4. **AWS Powertools Integration**: Built on AWS Lambda Powertools for best practices
5. **X-Ray Integration**: Seamless integration with AWS X-Ray for distributed tracing

### Log Levels

- `DEBUG`: Detailed information for debugging
- `INFO`: General informational messages
- `WARN`: Warning messages for potential issues
- `ERROR`: Error messages with full stack traces

## Usage

### Basic Usage

```typescript
import { createLogger } from '../shared/logger';

// Create a logger with trace ID
const logger = createLogger('my-service', { traceId: 'abc-123' });

logger.info('Processing request', { userId: '123' });
logger.warn('Rate limit approaching', { current: 95, limit: 100 });
logger.error('Failed to process', error, { userId: '123' });
```

### Agent Logger

For agent Lambda functions, use the `createAgentLogger` helper:

```typescript
import { createAgentLogger } from '../shared/logger';

// Automatically sets agent name in context
const logger = createAgentLogger('recebimento', { traceId: 'abc-123' });

logger.info('Lead received'); // Includes agent: 'recebimento'
```

### Updating Context

Add lead ID and tenant ID as they become available:

```typescript
// Initial logger
const logger = createLogger('my-service', { traceId: 'abc-123' });

// After identifying tenant
logger.updateContext({ tenantId: 'tenant-456' });

// After identifying lead
logger.updateContext({ leadId: 'lead-789' });

// All subsequent logs will include these fields
logger.info('Processing lead'); // Includes traceId, tenantId, leadId
```

### Child Loggers

Create child loggers with additional context:

```typescript
const parentLogger = createLogger('my-service', { traceId: 'abc-123' });

// Child logger inherits parent context and adds more
const childLogger = parentLogger.createChild({ 
  operation: 'enrichment',
  provider: 'receita-federal' 
});

childLogger.info('Enriching data'); // Includes all parent context + operation + provider
```

## Log Context Fields

### Standard Fields (Always Present)

- `timestamp`: ISO-8601 timestamp
- `level`: Log level (DEBUG, INFO, WARN, ERROR)
- `message`: Log message
- `trace_id`: Unique trace ID for request tracking
- `service`: Service name (e.g., 'fibonacci-api', 'fibonacci-recebimento')

### Contextual Fields (When Available)

- `agent`: Agent name (e.g., 'recebimento', 'estrategia', 'atendimento')
- `leadId`: Lead UUID
- `tenantId`: Tenant UUID
- `campaignId`: Campaign UUID
- `requestId`: AWS request ID
- `functionName`: Lambda function name

### Custom Metadata

Any additional fields passed to log methods:

```typescript
logger.info('Lead processed', {
  empresa: 'Acme Corp',
  setor: 'Tecnologia',
  score: 85
});
```

## Log Output Format

### Example INFO Log

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "message": "Lead processed successfully",
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "service": "fibonacci-recebimento",
  "agent": "recebimento",
  "leadId": "123e4567-e89b-12d3-a456-426614174000",
  "tenantId": "789e0123-e45b-67c8-d901-234567890abc",
  "empresa": "Acme Corp",
  "setor": "Tecnologia",
  "score": 85
}
```

### Example ERROR Log

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "ERROR",
  "message": "Failed to enrich lead data",
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "service": "fibonacci-recebimento",
  "agent": "recebimento",
  "leadId": "123e4567-e89b-12d3-a456-426614174000",
  "tenantId": "789e0123-e45b-67c8-d901-234567890abc",
  "error": {
    "name": "EnrichmentError",
    "message": "API rate limit exceeded",
    "stack": "EnrichmentError: API rate limit exceeded\n    at enrichLead (/var/task/lambda/agents/recebimento.js:245:15)\n    ..."
  }
}
```

## CloudWatch Insights Queries

### Find All Logs for a Trace ID

```
fields @timestamp, level, message, agent, leadId
| filter trace_id = "550e8400-e29b-41d4-a716-446655440000"
| sort @timestamp asc
```

### Find Errors by Agent

```
fields @timestamp, agent, message, error.message
| filter level = "ERROR"
| stats count() by agent
| sort count desc
```

### Find Logs for a Specific Lead

```
fields @timestamp, agent, message, level
| filter leadId = "123e4567-e89b-12d3-a456-426614174000"
| sort @timestamp asc
```

### Find Logs for a Specific Tenant

```
fields @timestamp, agent, leadId, message
| filter tenantId = "789e0123-e45b-67c8-d901-234567890abc"
| filter level = "ERROR"
| sort @timestamp desc
| limit 100
```

### Calculate Average Processing Time by Agent

```
fields @timestamp, agent, duration
| filter message = "Event processed successfully"
| stats avg(duration), p95(duration), p99(duration) by agent
```

## Integration with Error Handler

The error handler wrapper automatically creates a logger with proper context:

```typescript
import { withSimpleErrorHandling } from '../shared/error-handler';
import { Logger } from '../shared/logger';

export const handler = withSimpleErrorHandling(
  async (event: SQSEvent, context: Context, logger: Logger) => {
    // Logger is automatically created with trace ID and function name
    logger.info('Processing event');
    
    // Update context as needed
    logger.updateContext({ tenantId: event.tenantId });
    
    // All logs include trace_id, service, and any context
    logger.info('Event processed');
  }
);
```

## Best Practices

### 1. Log at Appropriate Levels

- **DEBUG**: Detailed debugging information (disabled in production)
- **INFO**: Normal operational messages (lead received, processed, etc.)
- **WARN**: Potential issues that don't prevent operation
- **ERROR**: Errors that prevent normal operation

### 2. Include Relevant Context

```typescript
// Good: Includes relevant business context
logger.info('Lead enriched', {
  empresa: lead.empresa,
  cnpj: lead.cnpj,
  enrichmentSource: 'receita-federal'
});

// Bad: Too vague
logger.info('Processing complete');
```

### 3. Update Context Early

```typescript
// Update context as soon as you have the information
const tenantId = extractTenantId(event);
logger.updateContext({ tenantId });

const lead = await fetchLead(leadId);
logger.updateContext({ leadId: lead.id });

// Now all subsequent logs include this context
logger.info('Starting enrichment'); // Includes tenantId and leadId
```

### 4. Don't Log Sensitive Data

```typescript
// Bad: Logs sensitive data
logger.info('User authenticated', {
  password: user.password,
  creditCard: user.creditCard
});

// Good: Logs only non-sensitive identifiers
logger.info('User authenticated', {
  userId: user.id,
  email: user.email
});
```

### 5. Use Structured Metadata

```typescript
// Good: Structured metadata
logger.info('API call completed', {
  endpoint: '/api/leads',
  method: 'POST',
  statusCode: 200,
  duration: 145
});

// Bad: Unstructured string
logger.info('API call to /api/leads POST returned 200 in 145ms');
```

## Migration Guide

### Before (Old Logger)

```typescript
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'my-service' });

export const handler = async (event, context) => {
  logger.info('Processing', { traceId: uuidv4() });
  // Manual trace ID management
};
```

### After (New Logger)

```typescript
import { createLogger } from '../shared/logger';

export const handler = async (event, context) => {
  const logger = createLogger('my-service', { traceId: uuidv4() });
  
  // Trace ID automatically included in all logs
  logger.info('Processing');
  
  // Add context as it becomes available
  logger.updateContext({ tenantId: event.tenantId });
};
```

### With Error Handler (Recommended)

```typescript
import { withSimpleErrorHandling } from '../shared/error-handler';
import { Logger } from '../shared/logger';

export const handler = withSimpleErrorHandling(
  async (event, context, logger: Logger) => {
    // Logger automatically created with trace ID
    logger.info('Processing');
    
    // Update context as needed
    logger.updateContext({ tenantId: event.tenantId });
  }
);
```

## Troubleshooting

### Logs Not Appearing in CloudWatch

1. Check Lambda execution role has `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` permissions
2. Verify `LOG_LEVEL` environment variable is set correctly
3. Check CloudWatch Logs retention settings

### Missing Context Fields

1. Ensure `updateContext()` is called after extracting tenant/lead IDs
2. Verify error handler wrapper is being used
3. Check that context is passed to child functions

### Trace ID Not Matching X-Ray

1. Use the same trace ID for both logger and X-Ray
2. Ensure X-Ray tracing is enabled on Lambda function
3. Check that trace ID is propagated through EventBridge events

## Performance Considerations

1. **Sampling**: Logger uses 10% sampling rate for detailed tracing
2. **Async Logging**: Powertools uses async logging to minimize latency
3. **JSON Serialization**: Efficient JSON serialization for structured logs
4. **Context Caching**: Context fields are cached to avoid repeated serialization

## Requirements Satisfied

This implementation satisfies **Requirement 15.5**:

- ✅ All Lambdas use shared logger
- ✅ All logs include trace_id
- ✅ Logs include relevant context (agent, leadId, tenantId)
- ✅ Logs formatted in JSON structured format
- ✅ Integration with AWS Powertools and X-Ray
- ✅ Consistent logging across all agents and platform functions

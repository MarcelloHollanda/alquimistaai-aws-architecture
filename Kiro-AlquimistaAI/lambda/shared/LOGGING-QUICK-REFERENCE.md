# Structured Logging - Quick Reference

## Import

```typescript
import { createLogger, createAgentLogger, Logger } from '../shared/logger';
```

## Create Logger

```typescript
// Basic logger
const logger = createLogger('my-service', { traceId: uuidv4() });

// Agent logger (automatically sets agent name)
const logger = createAgentLogger('recebimento', { traceId: uuidv4() });
```

## Log Messages

```typescript
// Info
logger.info('Processing started', { count: 10 });

// Warning
logger.warn('Rate limit approaching', { current: 95, limit: 100 });

// Error
logger.error('Failed to process', error, { userId: '123' });

// Debug
logger.debug('Detailed info', { data: complexObject });
```

## Update Context

```typescript
// Add tenant ID
logger.updateContext({ tenantId: 'tenant-123' });

// Add lead ID
logger.updateContext({ leadId: 'lead-456' });

// Add campaign ID
logger.updateContext({ campaignId: 'campaign-789' });

// All subsequent logs include these fields automatically
```

## With Error Handler

```typescript
import { withSimpleErrorHandling } from '../shared/error-handler';

export const handler = withSimpleErrorHandling(
  async (event, context, logger: Logger) => {
    // Logger automatically created with trace ID
    logger.updateContext({ tenantId: event.tenantId });
    logger.info('Processing');
  }
);
```

## Child Logger

```typescript
const parentLogger = createLogger('my-service');

const childLogger = parentLogger.createChild({ 
  operation: 'enrichment' 
});

childLogger.info('Enriching'); // Includes parent context + operation
```

## CloudWatch Insights Queries

### By Trace ID
```
fields @timestamp, message, agent
| filter trace_id = "YOUR_TRACE_ID"
| sort @timestamp asc
```

### By Lead ID
```
fields @timestamp, agent, message
| filter leadId = "YOUR_LEAD_ID"
| sort @timestamp asc
```

### By Tenant ID
```
fields @timestamp, agent, message
| filter tenantId = "YOUR_TENANT_ID"
| sort @timestamp desc
```

### Errors by Agent
```
fields @timestamp, agent, error.message
| filter level = "ERROR"
| stats count() by agent
```

## Log Output Example

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "message": "Lead processed",
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "service": "fibonacci-recebimento",
  "agent": "recebimento",
  "leadId": "123e4567-e89b-12d3-a456-426614174000",
  "tenantId": "789e0123-e45b-67c8-d901-234567890abc"
}
```

## Best Practices

✅ **DO**:
- Use appropriate log levels
- Update context early
- Include relevant business context
- Use structured metadata

❌ **DON'T**:
- Log sensitive data (passwords, credit cards)
- Use unstructured strings
- Repeat trace_id in metadata (automatic)
- Log at DEBUG level in production

## Common Patterns

### Agent Processing

```typescript
export const handler = withSimpleErrorHandling(
  async (event: SQSEvent, context: Context, logger: Logger) => {
    logger.info('Agent started', { recordCount: event.Records.length });
    
    for (const record of event.Records) {
      const { tenantId, leadId } = parseRecord(record);
      logger.updateContext({ tenantId, leadId });
      
      logger.info('Processing lead');
      await processLead(leadId, logger);
      logger.info('Lead processed');
    }
  }
);
```

### API Handler

```typescript
export const handler = async (event, context) => {
  const logger = createLogger('my-api', { traceId: uuidv4() });
  
  try {
    const tenantId = extractTenantId(event);
    logger.updateContext({ tenantId });
    
    logger.info('Request received', { path: event.path });
    const result = await processRequest(event, logger);
    logger.info('Request completed');
    
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    logger.error('Request failed', error);
    return { statusCode: 500, body: 'Internal error' };
  }
};
```

### MCP Integration

```typescript
async function callMCP(logger: Logger) {
  const childLogger = logger.createChild({ 
    operation: 'mcp-call',
    provider: 'whatsapp' 
  });
  
  childLogger.info('Calling MCP');
  const result = await mcpClient.call('whatsapp', 'sendMessage', params);
  childLogger.info('MCP call completed', { messageId: result.id });
  
  return result;
}
```

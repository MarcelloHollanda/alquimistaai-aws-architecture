# MCP Integrations

This directory contains the Model Context Protocol (MCP) integration layer for the Fibonacci ecosystem.

## Overview

The MCP Client provides a standardized way to integrate external tools and services into the Alquimista.AI ecosystem. It implements:

- **Retry logic with exponential backoff**: Automatically retries failed calls with increasing delays
- **Configurable timeout**: Prevents hanging calls with customizable timeout values
- **Structured logging**: All MCP calls are logged with trace_id for full auditability
- **Error classification**: Distinguishes between transient (retryable) and permanent errors

## Base Client

The `base-client.ts` file provides the core `MCPClient` class that all MCP integrations should use.

### Features

1. **Automatic Retries**: Failed calls are automatically retried up to 3 times (configurable)
2. **Exponential Backoff**: Retry delays increase exponentially: 1s, 2s, 4s, etc.
3. **Jitter**: Random variation (±25%) added to retry delays to prevent thundering herd
4. **Timeout Protection**: All calls have a configurable timeout (default 30 seconds)
5. **Trace ID**: Every call gets a unique trace_id for distributed tracing
6. **Sensitive Data Sanitization**: Passwords, tokens, and API keys are redacted from logs

### Usage

#### Basic Usage

```typescript
import { createMCPClient } from './mcp-integrations/base-client';

// Create client with default configuration
const mcpClient = createMCPClient();

// Call an MCP server method
const result = await mcpClient.call('whatsapp', 'sendMessage', {
  to: '+5511987654321',
  message: 'Hello from Alquimista.AI',
  idempotencyKey: 'unique-key-123'
});
```

#### Custom Configuration

```typescript
import { MCPClient } from './mcp-integrations/base-client';

const mcpClient = new MCPClient({
  timeout: 60000,           // 60 seconds
  maxRetries: 5,            // Retry up to 5 times
  initialRetryDelay: 2000,  // Start with 2 second delay
  maxRetryDelay: 60000,     // Cap delay at 60 seconds
  logger: customLogger      // Use custom logger
});
```

#### List Available Tools

```typescript
// Get list of tools from an MCP server
const tools = await mcpClient.listTools('whatsapp');

tools.forEach(tool => {
  console.log(`Tool: ${tool.name}`);
  console.log(`Description: ${tool.description}`);
  console.log(`Input Schema:`, tool.inputSchema);
});
```

### Error Handling

The MCP Client throws specific error types for different failure scenarios:

```typescript
import { 
  MCPError, 
  MCPTimeoutError, 
  MCPNetworkError, 
  MCPServerError 
} from './mcp-integrations/base-client';

try {
  const result = await mcpClient.call('calendar', 'createEvent', params);
} catch (error) {
  if (error instanceof MCPTimeoutError) {
    // Call timed out - may want to retry with longer timeout
    console.error('MCP call timed out:', error.traceId);
  } else if (error instanceof MCPNetworkError) {
    // Network issue - transient error, already retried
    console.error('Network error:', error.message);
  } else if (error instanceof MCPServerError) {
    // Server returned error status code
    console.error('Server error:', error.code);
  } else if (error instanceof MCPError) {
    // Generic MCP error
    console.error('MCP error:', error.message);
  }
}
```

### Custom Logger

You can provide a custom logger that implements the `MCPLogger` interface:

```typescript
import { MCPLogger } from './mcp-integrations/base-client';

class CustomLogger implements MCPLogger {
  info(message: string, metadata?: Record<string, any>): void {
    // Your custom logging logic
  }

  warn(message: string, metadata?: Record<string, any>): void {
    // Your custom logging logic
  }

  error(message: string, error: Error, metadata?: Record<string, any>): void {
    // Your custom logging logic
  }

  debug(message: string, metadata?: Record<string, any>): void {
    // Your custom logging logic
  }
}

const mcpClient = createMCPClient({
  logger: new CustomLogger()
});
```

## MCP Servers

The `servers/` directory contains specific MCP server implementations:

- ✅ **`whatsapp.ts`** - WhatsApp Business API integration (IMPLEMENTED)
  - Send messages with idempotency support
  - Get message delivery status
  - Rate limiting (80 msg/sec, 1000 msg/min, 10000 msg/hour)
  - Automatic retry with exponential backoff
  - API key stored in AWS Secrets Manager
  
- 🔜 **`calendar.ts`** - Google Calendar API integration (PLANNED)
- 🔜 **`enrichment.ts`** - Data enrichment services (PLANNED)
- 🔜 **`sentiment.ts`** - Sentiment analysis with AWS Comprehend (PLANNED)

See [servers/README.md](./servers/README.md) for detailed documentation on each server.

Each server implementation extends or uses the base `MCPClient` class.

## Requirements Mapping

This implementation satisfies the following requirements:

- **Requirement 13.1**: Base MCP client with standardized interface ✅
- **Requirement 13.2**: WhatsApp Business API integration ✅
- **Requirement 13.7**: API credentials stored in AWS Secrets Manager ✅
- **Requirement 13.8**: Retry logic with exponential backoff for failed calls ✅
- **Requirement 13.9**: Structured logging of all MCP calls with trace_id ✅
- **Requirement 13.10**: Alerts when MCP integration fails after retries ✅

## Next Steps

1. Implement specific MCP server integrations in `servers/` directory
2. Add authentication/authorization for each MCP server
3. Implement rate limiting per server
4. Add metrics collection for MCP call performance
5. Create integration tests for MCP client

## Architecture Notes

The MCP Client is designed to be:

- **Stateless**: No state is maintained between calls
- **Thread-safe**: Can be used concurrently from multiple Lambda invocations
- **Observable**: All operations are logged with structured metadata
- **Resilient**: Automatic retry with exponential backoff for transient failures
- **Extensible**: Easy to add new MCP server integrations

## Example: Complete Integration Flow

```typescript
import { createMCPClient } from './mcp-integrations/base-client';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'fibonacci-api' });
const mcpClient = createMCPClient({ logger });

export async function sendWhatsAppMessage(
  leadId: string,
  phoneNumber: string,
  message: string
): Promise<void> {
  try {
    // Call WhatsApp MCP server
    const result = await mcpClient.call('whatsapp', 'sendMessage', {
      to: phoneNumber,
      message: message,
      idempotencyKey: `${leadId}-${Date.now()}`
    });

    logger.info('WhatsApp message sent', {
      leadId,
      messageId: result.messageId,
      status: result.status
    });

    // Publish event to EventBridge
    await publishEvent({
      source: 'nigredo.disparo',
      type: 'message.sent',
      detail: {
        leadId,
        channel: 'whatsapp',
        messageId: result.messageId
      }
    });

  } catch (error) {
    logger.error('Failed to send WhatsApp message', error as Error, {
      leadId,
      phoneNumber
    });
    throw error;
  }
}
```

## Testing

To test the MCP client:

```bash
# Run unit tests
npm test mcp-integrations/base-client.test.ts

# Run integration tests
npm test mcp-integrations/integration.test.ts
```

## Monitoring

All MCP calls are automatically logged with:

- `traceId`: Unique identifier for the call
- `server`: MCP server name
- `method`: Method being called
- `attempt`: Retry attempt number
- `duration`: Call duration in milliseconds
- `error`: Error details if call failed

These logs can be queried in CloudWatch Insights:

```
fields @timestamp, traceId, server, method, duration
| filter server = "whatsapp"
| stats avg(duration), p95(duration), p99(duration) by method
```

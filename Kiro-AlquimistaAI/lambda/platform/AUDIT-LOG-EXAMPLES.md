# Audit Log System - Usage Examples

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Agent Actions](#agent-actions)
3. [User Actions](#user-actions)
4. [System Events](#system-events)
5. [Querying Audit Logs](#querying-audit-logs)
6. [Error Handling](#error-handling)

## Basic Usage

### Simple Agent Action Log

```typescript
import { logAgentAction } from '../platform/audit-log';

// Log a successful agent execution
await logAgentAction({
  tenantId: 'tenant-123',
  userId: 'user-456',
  agentId: 'agent-789',
  actionType: 'agent.executed',
  result: 'success'
});
```

### With Custom Context

```typescript
await logAgentAction({
  tenantId: 'tenant-123',
  userId: 'user-456',
  agentId: 'agent-789',
  actionType: 'agent.executed',
  result: 'success',
  context: {
    leadId: 'lead-abc',
    action: 'send_whatsapp_message',
    messageId: 'msg-xyz',
    recipientPhone: '+5511987654321'
  }
});
```

### With Trace ID

```typescript
import { v4 as uuidv4 } from 'uuid';

const traceId = uuidv4();

await logAgentAction({
  traceId,
  tenantId: 'tenant-123',
  userId: 'user-456',
  agentId: 'agent-789',
  actionType: 'agent.executed',
  result: 'success',
  context: {
    correlationId: traceId
  }
});
```

## Agent Actions

### Agent Activation

```typescript
// Success
await logAgentAction({
  tenantId: 'tenant-123',
  userId: 'user-456',
  agentId: 'agent-recebimento',
  actionType: 'agent.activated',
  result: 'success',
  context: {
    activationId: 'activation-1699564800000',
    permissions: ['read', 'write'],
    agentName: 'Agente de Recebimento',
    agentCategory: 'Vendas'
  }
});

// Failure
await logAgentAction({
  tenantId: 'tenant-123',
  userId: 'user-456',
  agentId: 'agent-recebimento',
  actionType: 'agent.activated',
  result: 'failure',
  errorMessage: 'Agent not found in catalog'
});
```

### Agent Deactivation

```typescript
await logAgentAction({
  tenantId: 'tenant-123',
  userId: 'user-456',
  agentId: 'agent-recebimento',
  actionType: 'agent.deactivated',
  result: 'success',
  context: {
    deactivationId: 'deactivation-1699564900000',
    reason: 'User requested deactivation',
    agentName: 'Agente de Recebimento'
  }
});
```

### Agent Execution

```typescript
// Successful execution
await logAgentAction({
  tenantId: 'tenant-123',
  userId: 'user-456',
  agentId: 'agent-disparo',
  actionType: 'agent.executed',
  result: 'success',
  context: {
    action: 'send_campaign_messages',
    campaignId: 'campaign-abc',
    messagesSent: 150,
    duration: '45s'
  }
});

// Failed execution
await logAgentAction({
  tenantId: 'tenant-123',
  userId: 'user-456',
  agentId: 'agent-disparo',
  actionType: 'agent.executed',
  result: 'failure',
  context: {
    action: 'send_campaign_messages',
    campaignId: 'campaign-abc',
    messagesSent: 50,
    messagesFailed: 100
  },
  errorMessage: 'Rate limit exceeded'
});

// Partial execution
await logAgentAction({
  tenantId: 'tenant-123',
  userId: 'user-456',
  agentId: 'agent-disparo',
  actionType: 'agent.executed',
  result: 'partial',
  context: {
    action: 'send_campaign_messages',
    campaignId: 'campaign-abc',
    messagesSent: 120,
    messagesFailed: 30,
    successRate: 0.8
  },
  errorMessage: 'Some messages failed due to invalid phone numbers'
});
```

## User Actions

### User Login

```typescript
import { logUserAction } from '../platform/audit-log';

await logUserAction({
  tenantId: 'tenant-123',
  userId: 'user-456',
  actionType: 'user.login',
  result: 'success',
  context: {
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    loginMethod: 'email_password'
  }
});
```

### Failed Login Attempt

```typescript
await logUserAction({
  tenantId: 'tenant-123',
  userId: 'user-456',
  actionType: 'user.login',
  result: 'failure',
  context: {
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    loginMethod: 'email_password',
    attemptNumber: 3
  },
  errorMessage: 'Invalid password'
});
```

### User Created

```typescript
await logUserAction({
  tenantId: 'tenant-123',
  userId: 'admin-user-123',
  actionType: 'user.created',
  result: 'success',
  context: {
    newUserId: 'user-789',
    newUserEmail: 'newuser@company.com',
    newUserRole: 'operator'
  }
});
```

### Data Access

```typescript
await logUserAction({
  tenantId: 'tenant-123',
  userId: 'user-456',
  actionType: 'data.accessed',
  result: 'success',
  context: {
    resourceType: 'leads',
    resourceId: 'lead-abc',
    action: 'view_details',
    dataFields: ['name', 'email', 'phone', 'company']
  }
});
```

### Data Export

```typescript
await logUserAction({
  tenantId: 'tenant-123',
  userId: 'user-456',
  actionType: 'data.exported',
  result: 'success',
  context: {
    resourceType: 'leads',
    exportFormat: 'csv',
    recordCount: 1500,
    filters: {
      status: 'interessado',
      dateRange: '2024-01-01 to 2024-11-09'
    }
  }
});
```

## System Events

### System Backup

```typescript
import { logSystemEvent } from '../platform/audit-log';

await logSystemEvent({
  tenantId: 'tenant-123',
  actionType: 'system.backup',
  result: 'success',
  context: {
    backupType: 'full',
    backupSize: '2.5GB',
    duration: '120s',
    backupLocation: 's3://backups/2024-11-09/tenant-123.tar.gz'
  }
});
```

### Database Migration

```typescript
await logSystemEvent({
  actionType: 'system.migration',
  result: 'success',
  context: {
    migrationName: '005_add_new_fields',
    duration: '5s',
    tablesAffected: ['leads', 'campanhas']
  }
});
```

### System Error

```typescript
await logSystemEvent({
  tenantId: 'tenant-123',
  actionType: 'system.error',
  result: 'failure',
  context: {
    errorType: 'DatabaseConnectionError',
    service: 'aurora-cluster',
    retryAttempts: 3
  },
  errorMessage: 'Failed to connect to database after 3 retries'
});
```

## Querying Audit Logs

### Query by Tenant

```bash
curl -X GET "https://api.alquimista.ai/api/audit-logs?tenantId=tenant-123&limit=100" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Query by Action Type

```bash
curl -X GET "https://api.alquimista.ai/api/audit-logs?actionType=agent.activated" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Query by Date Range

```bash
curl -X GET "https://api.alquimista.ai/api/audit-logs?startDate=2024-11-01T00:00:00Z&endDate=2024-11-09T23:59:59Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Query Failed Actions

```bash
curl -X GET "https://api.alquimista.ai/api/audit-logs?result=failure&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Query Specific Agent

```bash
curl -X GET "https://api.alquimista.ai/api/audit-logs?agentId=agent-recebimento&actionType=agent.executed" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Query with Pagination

```bash
# First page
curl -X GET "https://api.alquimista.ai/api/audit-logs?limit=50&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Second page
curl -X GET "https://api.alquimista.ai/api/audit-logs?limit=50&offset=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Complex Query

```bash
curl -X GET "https://api.alquimista.ai/api/audit-logs?tenantId=tenant-123&actionType=agent.executed&result=failure&startDate=2024-11-01T00:00:00Z&limit=100" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Error Handling

### Graceful Error Handling

```typescript
import { logAgentAction } from '../platform/audit-log';

export const handler = async (event: any) => {
  const traceId = uuidv4();
  
  try {
    // Business logic
    const result = await processLead(event.leadId);
    
    // Log success
    try {
      await logAgentAction({
        traceId,
        tenantId: event.tenantId,
        userId: event.userId,
        agentId: event.agentId,
        actionType: 'agent.executed',
        result: 'success',
        context: { leadId: event.leadId, result }
      });
    } catch (auditError) {
      // Don't fail the main operation if audit logging fails
      console.error('Failed to create audit log:', auditError);
    }
    
    return { success: true, result };
    
  } catch (error) {
    // Log failure
    try {
      await logAgentAction({
        traceId,
        tenantId: event.tenantId,
        userId: event.userId,
        agentId: event.agentId,
        actionType: 'agent.executed',
        result: 'failure',
        context: { leadId: event.leadId },
        errorMessage: error.message
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }
    
    throw error;
  }
};
```

### Retry Logic

```typescript
async function logWithRetry(logFn: () => Promise<string>, maxRetries = 3): Promise<string | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await logFn();
    } catch (error) {
      console.error(`Audit log attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error('All audit log attempts failed');
        return null;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  return null;
}

// Usage
await logWithRetry(() => logAgentAction({
  tenantId: 'tenant-123',
  userId: 'user-456',
  agentId: 'agent-789',
  actionType: 'agent.executed',
  result: 'success'
}));
```

### Batch Logging

```typescript
async function logMultipleActions(actions: Array<{
  tenantId: string;
  userId: string;
  agentId: string;
  actionType: string;
  result: 'success' | 'failure' | 'partial';
  context?: any;
}>) {
  const results = await Promise.allSettled(
    actions.map(action => logAgentAction(action))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`Audit logs: ${successful} successful, ${failed} failed`);
  
  return { successful, failed };
}

// Usage
await logMultipleActions([
  {
    tenantId: 'tenant-123',
    userId: 'user-456',
    agentId: 'agent-789',
    actionType: 'agent.executed',
    result: 'success'
  },
  {
    tenantId: 'tenant-123',
    userId: 'user-456',
    agentId: 'agent-abc',
    actionType: 'agent.executed',
    result: 'success'
  }
]);
```

## Best Practices

1. **Always include trace IDs**: Use consistent trace IDs across related operations for distributed tracing
2. **Log both success and failure**: Don't only log errors; successful operations are important for compliance
3. **Include relevant context**: Add meaningful context data that helps with debugging and auditing
4. **Don't log sensitive data**: Avoid logging passwords, API keys, or PII in the context field
5. **Use appropriate action types**: Follow the standard action type naming convention
6. **Handle audit logging errors gracefully**: Don't let audit logging failures break your main business logic
7. **Use pagination for queries**: Always use pagination when querying large numbers of audit logs
8. **Filter queries appropriately**: Use specific filters to improve query performance

## Common Patterns

### Lambda Handler with Audit Logging

```typescript
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { logAgentAction } from '../platform/audit-log';
import { v4 as uuidv4 } from 'uuid';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const traceId = uuidv4();
  
  // Extract user info from JWT
  const tenantId = event.requestContext.authorizer?.jwt?.claims?.['custom:tenant_id'] as string;
  const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
  const agentId = event.pathParameters?.agentId;
  
  try {
    // Your business logic here
    const result = await doSomething();
    
    // Log success
    await logAgentAction({
      traceId,
      tenantId,
      userId,
      agentId,
      actionType: 'agent.executed',
      result: 'success',
      context: {
        ipAddress: event.requestContext?.http?.sourceIp,
        userAgent: event.requestContext?.http?.userAgent,
        result
      }
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, result })
    };
    
  } catch (error) {
    // Log failure
    await logAgentAction({
      traceId,
      tenantId,
      userId,
      agentId,
      actionType: 'agent.executed',
      result: 'failure',
      context: {
        ipAddress: event.requestContext?.http?.sourceIp,
        userAgent: event.requestContext?.http?.userAgent
      },
      errorMessage: error.message
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

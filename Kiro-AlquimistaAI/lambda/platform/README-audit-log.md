# Audit Log System

## Overview

The Audit Log system provides comprehensive tracking of all agent actions and system events in the Alquimista platform. It ensures compliance with regulatory requirements (LGPD, GDPR) and provides full traceability of operations.

## Features

- **Automatic Logging**: All agent activations, deactivations, and executions are automatically logged
- **Trace ID**: Every action is assigned a unique trace ID for distributed tracing
- **Rich Context**: Logs include user information, IP addresses, user agents, and custom metadata
- **Query API**: Powerful filtering and pagination for audit log queries
- **Permission-Based Access**: Only authorized users can access audit logs

## Database Schema

```sql
CREATE TABLE alquimista_platform.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trace_id UUID NOT NULL,
    tenant_id UUID REFERENCES alquimista_platform.tenants(id),
    user_id UUID REFERENCES alquimista_platform.users(id),
    agent_id UUID REFERENCES alquimista_platform.agents(id),
    action_type VARCHAR(100) NOT NULL,
    result VARCHAR(50) NOT NULL, -- 'success' | 'failure' | 'partial'
    context JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Query Audit Logs

**Endpoint**: `GET /api/audit-logs`

**Authentication**: Required (Cognito JWT)

**Permissions**: User must have `READ` permission on `DATA` resource type

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenantId` | UUID | No | Filter by tenant (defaults to user's tenant) |
| `userId` | UUID | No | Filter by user |
| `agentId` | UUID | No | Filter by agent |
| `actionType` | string | No | Filter by action type |
| `result` | string | No | Filter by result (success/failure/partial) |
| `startDate` | ISO-8601 | No | Filter by start date |
| `endDate` | ISO-8601 | No | Filter by end date |
| `limit` | number | No | Number of results (default: 100, max: 1000) |
| `offset` | number | No | Pagination offset (default: 0) |

**Example Request**:

```bash
curl -X GET "https://api.alquimista.ai/api/audit-logs?actionType=agent.activated&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response**:

```json
{
  "logs": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "trace_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "tenant_id": "123e4567-e89b-12d3-a456-426614174000",
      "user_id": "987fcdeb-51a2-43f7-8f9e-123456789abc",
      "agent_id": "456e7890-e12b-34d5-a678-901234567def",
      "action_type": "agent.activated",
      "result": "success",
      "context": {
        "activationId": "activation-1699564800000",
        "permissions": [],
        "agentName": "recebimento",
        "agentCategory": "Vendas",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      },
      "error_message": null,
      "created_at": "2024-11-09T14:30:00.000Z",
      "user_email": "admin@company.com",
      "user_name": "Admin User",
      "agent_name": "recebimento",
      "agent_display_name": "Agente de Recebimento"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

## Action Types

The system tracks the following action types:

### Agent Actions
- `agent.activated` - Agent was activated for a tenant
- `agent.deactivated` - Agent was deactivated for a tenant
- `agent.executed` - Agent executed an action
- `agent.failed` - Agent execution failed

### User Actions
- `user.login` - User logged into the platform
- `user.logout` - User logged out
- `user.created` - New user was created
- `user.updated` - User information was updated
- `user.deleted` - User was deleted

### Data Actions
- `data.accessed` - Data was accessed
- `data.modified` - Data was modified
- `data.deleted` - Data was deleted
- `data.exported` - Data was exported

### Permission Actions
- `permission.granted` - Permission was granted
- `permission.revoked` - Permission was revoked

## Programmatic Usage

### Creating Audit Logs

The audit log system provides helper functions for creating audit entries:

#### Log Agent Action

```typescript
import { logAgentAction } from './audit-log';

await logAgentAction({
  traceId: 'optional-trace-id', // Auto-generated if not provided
  tenantId: 'tenant-uuid',
  userId: 'user-uuid',
  agentId: 'agent-uuid',
  actionType: 'agent.executed',
  result: 'success',
  context: {
    leadId: 'lead-uuid',
    action: 'send_message',
    channel: 'whatsapp'
  }
});
```

#### Log User Action

```typescript
import { logUserAction } from './audit-log';

await logUserAction({
  tenantId: 'tenant-uuid',
  userId: 'user-uuid',
  actionType: 'user.login',
  result: 'success',
  context: {
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  }
});
```

#### Log System Event

```typescript
import { logSystemEvent } from './audit-log';

await logSystemEvent({
  tenantId: 'tenant-uuid',
  actionType: 'system.backup',
  result: 'success',
  context: {
    backupSize: '1.5GB',
    duration: '45s'
  }
});
```

### Direct Audit Log Creation

For more control, use the `createAuditLog` function:

```typescript
import { createAuditLog } from './audit-log';

const auditLogId = await createAuditLog({
  traceId: 'trace-uuid',
  tenantId: 'tenant-uuid',
  userId: 'user-uuid',
  agentId: 'agent-uuid',
  actionType: 'custom.action',
  result: 'success',
  context: {
    customField: 'value'
  },
  errorMessage: 'Optional error message'
});
```

## Integration with Other Lambdas

The audit log system is automatically integrated with:

1. **activate-agent.ts**: Logs all agent activations (success and failure)
2. **deactivate-agent.ts**: Logs all agent deactivations (success and failure)

To integrate with other Lambda functions:

```typescript
import { logAgentAction } from '../platform/audit-log';
import { v4 as uuidv4 } from 'uuid';

export const handler = async (event: any) => {
  const traceId = uuidv4();
  
  try {
    // Your business logic here
    const result = await doSomething();
    
    // Log success
    await logAgentAction({
      traceId,
      tenantId: event.tenantId,
      userId: event.userId,
      agentId: event.agentId,
      actionType: 'agent.executed',
      result: 'success',
      context: {
        action: 'doSomething',
        result: result
      }
    });
    
    return { success: true };
    
  } catch (error) {
    // Log failure
    await logAgentAction({
      traceId,
      tenantId: event.tenantId,
      userId: event.userId,
      agentId: event.agentId,
      actionType: 'agent.executed',
      result: 'failure',
      context: {
        action: 'doSomething'
      },
      errorMessage: error.message
    });
    
    throw error;
  }
};
```

## Security Considerations

1. **Permission-Based Access**: Users can only query audit logs for their own tenant (unless they have admin role)
2. **Read-Only API**: The query API is read-only; audit logs cannot be modified or deleted via API
3. **Automatic Logging**: All critical actions are automatically logged; manual logging is not required
4. **Trace IDs**: Every action has a unique trace ID for correlation across distributed systems

## Performance

- **Indexes**: The audit_logs table has indexes on:
  - `trace_id` - For trace-based queries
  - `tenant_id` - For tenant-based queries
  - `user_id` - For user-based queries
  - `agent_id` - For agent-based queries
  - `action_type` - For action type filtering
  - `created_at` - For time-based queries
  - `(tenant_id, created_at)` - Composite index for tenant + time queries

- **Pagination**: The API supports pagination with configurable limits (max 1000 records per request)

- **Query Optimization**: Use specific filters (tenantId, actionType, date ranges) to improve query performance

## Compliance

The audit log system helps meet compliance requirements:

- **LGPD (Brazil)**: Tracks all data access and modifications
- **GDPR (EU)**: Provides audit trail for data processing activities
- **SOC 2**: Demonstrates security controls and monitoring
- **ISO 27001**: Supports information security management

## Retention Policy

Audit logs are retained according to the following policy:

- **Production**: 90 days (configurable)
- **Staging**: 30 days
- **Development**: 7 days

Logs older than the retention period are automatically archived to S3 for long-term storage.

## Troubleshooting

### No audit logs appearing

1. Check that the Lambda function has permissions to write to the database
2. Verify that `dbSecret.grantRead()` is called for the Lambda in the CDK stack
3. Check CloudWatch Logs for errors in the audit-log Lambda function

### Permission denied when querying logs

1. Verify that the user has `READ` permission on `DATA` resource type
2. Check that the user is querying logs for their own tenant
3. Verify that the Cognito JWT token includes `custom:tenant_id` claim

### Slow query performance

1. Use specific filters (tenantId, actionType, date ranges)
2. Reduce the limit parameter
3. Check database indexes are properly created
4. Consider adding additional composite indexes for common query patterns

## Future Enhancements

- [ ] Real-time audit log streaming via WebSocket
- [ ] Audit log export to CSV/JSON
- [ ] Automated anomaly detection
- [ ] Integration with SIEM systems
- [ ] Audit log visualization dashboard
- [ ] Configurable retention policies per tenant
- [ ] Audit log encryption at rest with customer-managed keys

## Related Documentation

- [Permissions System](./README-permissions.md)
- [Agent Activation](./README.md)
- [Database Schema](../../database/migrations/003_create_platform_tables.sql)

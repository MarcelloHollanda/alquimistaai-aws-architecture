# Agent Metrics API

## Overview

The Agent Metrics API provides comprehensive performance and cost analytics for AI agents in the Alquimista Platform. It calculates success rates, execution times, and costs based on audit log data.

**Requirements**: 14.6

## Features

- **Success Rate Calculation**: Track successful vs failed executions
- **Performance Metrics**: Average, min, max, and percentile (p50, p95, p99) execution times
- **Cost Analysis**: Total and per-execution cost tracking
- **Time-based Filtering**: Query metrics for specific date ranges
- **Multi-agent Support**: Get metrics for a single agent or all active agents

## API Endpoints

### 1. Get Metrics for Specific Agent

```http
GET /api/agents/{id}/metrics
Authorization: Bearer <cognito-jwt-token>
```

**Path Parameters:**
- `id` (required): Agent UUID

**Query Parameters:**
- `startDate` (optional): Start date for metrics period (ISO-8601 format)
  - Default: 30 days ago
  - Example: `2024-01-01T00:00:00Z`
- `endDate` (optional): End date for metrics period (ISO-8601 format)
  - Default: Current time
  - Example: `2024-01-31T23:59:59Z`

**Response:**
```json
{
  "metrics": {
    "agentId": "uuid",
    "agentName": "Agent Display Name",
    "agentCategory": "Vendas",
    "tenantId": "uuid",
    "totalExecutions": 1250,
    "successfulExecutions": 1180,
    "failedExecutions": 70,
    "successRate": 94.4,
    "avgDuration": 1523,
    "minDuration": 245,
    "maxDuration": 8932,
    "p50Duration": 1420,
    "p95Duration": 3200,
    "p99Duration": 5800,
    "totalCost": 12.45,
    "avgCostPerExecution": 0.0099,
    "periodStart": "2024-01-01T00:00:00Z",
    "periodEnd": "2024-01-31T23:59:59Z",
    "lastExecutionAt": "2024-01-31T18:45:23Z",
    "lastExecutionResult": "success"
  }
}
```

### 2. Get Metrics for All Active Agents

```http
GET /api/agents/metrics
Authorization: Bearer <cognito-jwt-token>
```

**Query Parameters:**
- `startDate` (optional): Start date for metrics period (ISO-8601 format)
- `endDate` (optional): End date for metrics period (ISO-8601 format)

**Response:**
```json
{
  "metrics": [
    {
      "agentId": "uuid-1",
      "agentName": "Agent 1",
      "agentCategory": "Vendas",
      "tenantId": "uuid",
      "totalExecutions": 1250,
      "successfulExecutions": 1180,
      "failedExecutions": 70,
      "successRate": 94.4,
      "avgDuration": 1523,
      "minDuration": 245,
      "maxDuration": 8932,
      "p50Duration": 1420,
      "p95Duration": 3200,
      "p99Duration": 5800,
      "totalCost": 12.45,
      "avgCostPerExecution": 0.0099,
      "periodStart": "2024-01-01T00:00:00Z",
      "periodEnd": "2024-01-31T23:59:59Z",
      "lastExecutionAt": "2024-01-31T18:45:23Z",
      "lastExecutionResult": "success"
    },
    {
      "agentId": "uuid-2",
      "agentName": "Agent 2",
      "agentCategory": "Agenda",
      "totalExecutions": 850,
      "successRate": 98.2,
      ...
    }
  ],
  "total": 2
}
```

**Note**: Results are sorted by `totalExecutions` in descending order.

## Metrics Explained

### Execution Metrics

- **totalExecutions**: Total number of agent executions in the period
- **successfulExecutions**: Number of successful executions (result = 'success')
- **failedExecutions**: Number of failed executions (result = 'failure')
- **successRate**: Percentage of successful executions (0-100)

### Performance Metrics

All duration values are in **milliseconds**.

- **avgDuration**: Average execution time across all executions
- **minDuration**: Fastest execution time
- **maxDuration**: Slowest execution time
- **p50Duration**: Median execution time (50th percentile)
- **p95Duration**: 95th percentile execution time
- **p99Duration**: 99th percentile execution time

**Note**: Duration metrics are only calculated if execution logs include duration data in their context.

### Cost Metrics

All cost values are in **USD**.

- **totalCost**: Total cost for all executions in the period
- **avgCostPerExecution**: Average cost per execution

**Note**: Cost metrics are only calculated if execution logs include cost data in their context.

### Time Period

- **periodStart**: Start of the metrics calculation period (ISO-8601)
- **periodEnd**: End of the metrics calculation period (ISO-8601)

### Last Execution

- **lastExecutionAt**: Timestamp of the most recent execution (ISO-8601)
- **lastExecutionResult**: Result of the most recent execution ('success' or 'failure')

## Data Source

Metrics are calculated from the `alquimista_platform.audit_logs` table, specifically from entries where:
- `action_type` starts with `'agent.executed'`
- `agent_id` matches the requested agent
- `tenant_id` matches the authenticated user's tenant
- `created_at` falls within the specified date range

## Logging Agent Executions

To ensure accurate metrics, agent execution logs should include duration and cost in their context:

```typescript
import { logAgentAction } from './audit-log';

// After agent execution
await logAgentAction({
  traceId: uuidv4(),
  tenantId: 'tenant-uuid',
  userId: 'user-uuid',
  agentId: 'agent-uuid',
  actionType: 'agent.executed',
  result: 'success', // or 'failure'
  context: {
    duration: 1523, // Execution time in milliseconds
    cost: 0.0099,   // Execution cost in USD
    // ... other context data
  }
});
```

## Permissions

Users must have `READ` permission on `DATA` resource type to access agent metrics. The API automatically:
- Validates user authentication via Cognito JWT
- Checks permissions using the platform's permission system
- Restricts access to the user's own tenant data

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized: Missing user information"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden: Insufficient permissions to access agent metrics",
  "reason": "User does not have READ permission on DATA resources"
}
```

### 404 Not Found
```json
{
  "error": "Agent not found or not activated for this tenant"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Detailed error message"
}
```

## Usage Examples

### Example 1: Get Last 30 Days Metrics for Specific Agent

```bash
curl -X GET \
  'https://api.alquimista.ai/api/agents/550e8400-e29b-41d4-a716-446655440000/metrics' \
  -H 'Authorization: Bearer eyJraWQiOiJ...'
```

### Example 2: Get Last 7 Days Metrics

```bash
curl -X GET \
  'https://api.alquimista.ai/api/agents/550e8400-e29b-41d4-a716-446655440000/metrics?startDate=2024-01-24T00:00:00Z&endDate=2024-01-31T23:59:59Z' \
  -H 'Authorization: Bearer eyJraWQiOiJ...'
```

### Example 3: Get Metrics for All Active Agents

```bash
curl -X GET \
  'https://api.alquimista.ai/api/agents/metrics' \
  -H 'Authorization: Bearer eyJraWQiOiJ...'
```

### Example 4: Using JavaScript/TypeScript

```typescript
async function getAgentMetrics(agentId: string, token: string) {
  const response = await fetch(
    `https://api.alquimista.ai/api/agents/${agentId}/metrics`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  const data = await response.json();
  return data.metrics;
}

// Usage
const metrics = await getAgentMetrics(
  '550e8400-e29b-41d4-a716-446655440000',
  cognitoToken
);

console.log(`Success Rate: ${metrics.successRate}%`);
console.log(`Avg Duration: ${metrics.avgDuration}ms`);
console.log(`Total Cost: $${metrics.totalCost}`);
```

## Performance Considerations

- **Caching**: Consider caching metrics results for frequently accessed agents
- **Date Range**: Larger date ranges will take longer to calculate
- **Parallel Queries**: When fetching all agents, metrics are calculated in parallel
- **Database Indexes**: The `idx_audit_agent_id` and `idx_audit_tenant_created` indexes optimize query performance

## Monitoring

The Lambda function includes:
- **Structured Logging**: All operations are logged with context
- **X-Ray Tracing**: Distributed tracing for performance analysis
- **CloudWatch Metrics**: Automatic Lambda metrics (invocations, errors, duration)

## Related Documentation

- [Audit Log API](./README-audit-log.md)
- [Permissions System](./README-permissions.md)
- [Agent Activation API](./README.md)

## Changelog

### Version 1.0.0 (2024-01-31)
- Initial implementation
- Support for execution, performance, and cost metrics
- Time-based filtering
- Multi-agent support

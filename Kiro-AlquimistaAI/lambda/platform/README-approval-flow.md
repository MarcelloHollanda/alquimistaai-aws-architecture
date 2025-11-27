# Approval Flow System

## Overview

The Approval Flow system implements 1-2 step approval for critical actions in the Alquimista platform. This ensures that sensitive operations require explicit authorization from designated approvers before execution.

**Requirements**: 14.4

## Features

- **Flexible Approval Steps**: Support for 1 or 2 step approval processes
- **Multiple Approvers**: Designate multiple users who can approve requests
- **Expiration**: Automatic expiration of pending approvals after a configurable time
- **Notifications**: Automatic notification of approvers about pending requests
- **Audit Trail**: Complete audit log of all approval decisions
- **Event Publishing**: Integration with EventBridge for workflow automation

## Architecture

```
┌─────────────┐
│   Requester │
└──────┬──────┘
       │ 1. Create Approval Request
       ▼
┌─────────────────────┐
│ Approval Flow API   │
└──────┬──────────────┘
       │ 2. Store in DB
       ▼
┌─────────────────────┐
│ approval_requests   │
└──────┬──────────────┘
       │ 3. Notify Approvers
       ▼
┌─────────────────────┐
│   Notifications     │
└─────────────────────┘

┌─────────────┐
│  Approver   │
└──────┬──────┘
       │ 4. Make Decision
       ▼
┌─────────────────────┐
│ Approval Flow API   │
└──────┬──────────────┘
       │ 5. Record Decision
       ▼
┌─────────────────────┐
│ approval_decisions  │
└──────┬──────────────┘
       │ 6. Check if Complete
       ▼
┌─────────────────────┐
│  Execute Action?    │
└─────────────────────┘
```

## API Endpoints

### 1. Create Approval Request

**POST** `/api/approvals`

Creates a new approval request for a critical action.

**Request Body**:
```json
{
  "actionType": "agent.delete",
  "resourceType": "agent",
  "resourceId": "agent-123",
  "actionDetails": {
    "agentName": "Sales Agent",
    "reason": "No longer needed"
  },
  "approvers": ["user-id-1", "user-id-2"],
  "requiredApprovals": 2,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Response**:
```json
{
  "success": true,
  "approvalId": "approval-1234567890",
  "status": "pending",
  "message": "Approval request created successfully"
}
```

### 2. Make Approval Decision

**POST** `/api/approvals/{id}/decide`

Records an approval or rejection decision.

**Request Body**:
```json
{
  "decision": "approve",
  "comment": "Approved after review"
}
```

**Response**:
```json
{
  "success": true,
  "approvalId": "approval-1234567890",
  "status": "approved",
  "canExecute": true,
  "message": "Action approved and can be executed"
}
```

### 3. Get Approval Details

**GET** `/api/approvals/{id}`

Retrieves details of a specific approval request.

**Response**:
```json
{
  "approval": {
    "id": "approval-1234567890",
    "tenantId": "tenant-123",
    "requestedBy": "user-id-1",
    "requesterEmail": "user@example.com",
    "requesterName": "John Doe",
    "actionType": "agent.delete",
    "resourceType": "agent",
    "resourceId": "agent-123",
    "actionDetails": {
      "agentName": "Sales Agent",
      "reason": "No longer needed"
    },
    "approvers": ["user-id-2", "user-id-3"],
    "requiredApprovals": 2,
    "status": "pending",
    "expiresAt": "2024-12-31T23:59:59Z",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  },
  "decisions": [
    {
      "id": 1,
      "approverId": "user-id-2",
      "approverEmail": "approver@example.com",
      "approverName": "Jane Smith",
      "decision": "approve",
      "comment": "Looks good",
      "createdAt": "2024-01-01T11:00:00Z"
    }
  ]
}
```

### 4. List Approval Requests

**GET** `/api/approvals`

Lists approval requests for the current user's tenant.

**Query Parameters**:
- `status` (optional): Filter by status (pending, approved, rejected, expired, cancelled)
- `actionType` (optional): Filter by action type
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "approvals": [
    {
      "id": "approval-1234567890",
      "requestedBy": "user-id-1",
      "requesterEmail": "user@example.com",
      "requesterName": "John Doe",
      "actionType": "agent.delete",
      "resourceType": "agent",
      "resourceId": "agent-123",
      "actionDetails": { ... },
      "approvers": ["user-id-2", "user-id-3"],
      "requiredApprovals": 2,
      "approvalCount": 1,
      "status": "pending",
      "expiresAt": "2024-12-31T23:59:59Z",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### 5. Cancel Approval Request

**DELETE** `/api/approvals/{id}`

Cancels a pending approval request. Only the requester can cancel.

**Response**:
```json
{
  "success": true,
  "approvalId": "approval-1234567890",
  "status": "cancelled",
  "message": "Approval request cancelled successfully"
}
```

## Usage Examples

### Example 1: Delete Agent with 2-Step Approval

```typescript
// Step 1: Request approval to delete agent
const response = await fetch('/api/approvals', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    actionType: 'agent.delete',
    resourceType: 'agent',
    resourceId: 'agent-123',
    actionDetails: {
      agentName: 'Sales Agent',
      agentCategory: 'sales',
      reason: 'No longer needed'
    },
    approvers: ['manager-id', 'admin-id'],
    requiredApprovals: 2,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  })
});

const { approvalId } = await response.json();

// Step 2: First approver approves
await fetch(`/api/approvals/${approvalId}/decide`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${managerToken}`
  },
  body: JSON.stringify({
    decision: 'approve',
    comment: 'Approved by manager'
  })
});

// Step 3: Second approver approves
const finalResponse = await fetch(`/api/approvals/${approvalId}/decide`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    decision: 'approve',
    comment: 'Approved by admin'
  })
});

const { canExecute } = await finalResponse.json();

// Step 4: If approved, execute the action
if (canExecute) {
  await fetch(`/api/agents/${agentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
}
```

### Example 2: Export Sensitive Data with 1-Step Approval

```typescript
// Request approval to export data
const response = await fetch('/api/approvals', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    actionType: 'data.export',
    resourceType: 'data',
    actionDetails: {
      dataType: 'customer_data',
      format: 'csv',
      dateRange: {
        start: '2024-01-01',
        end: '2024-12-31'
      }
    },
    approvers: ['compliance-officer-id'],
    requiredApprovals: 1
  })
});

const { approvalId } = await response.json();

// Compliance officer approves
const approvalResponse = await fetch(`/api/approvals/${approvalId}/decide`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${complianceToken}`
  },
  body: JSON.stringify({
    decision: 'approve',
    comment: 'Export approved for audit purposes'
  })
});

const { canExecute } = await approvalResponse.json();

if (canExecute) {
  // Proceed with data export
  await fetch('/api/data/export', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ approvalId })
  });
}
```

## Programmatic Usage

### Creating Approval Requests from Lambda Functions

```typescript
import { createApprovalRequest } from './approval-flow';

// In your Lambda function
const { approvalId, status } = await createApprovalRequest({
  tenantId: 'tenant-123',
  requestedBy: 'user-id-1',
  actionType: 'agent.delete',
  resourceType: 'agent',
  resourceId: 'agent-123',
  actionDetails: {
    agentName: 'Sales Agent',
    reason: 'No longer needed'
  },
  approvers: ['manager-id', 'admin-id'],
  requiredApprovals: 2
});

// Return approval ID to client
return {
  statusCode: 202,
  body: JSON.stringify({
    message: 'Action requires approval',
    approvalId,
    status
  })
};
```

### Checking Approval Status Before Executing Action

```typescript
import { query } from '../shared/database';

async function executeActionIfApproved(approvalId: string, action: () => Promise<void>) {
  // Check approval status
  const result = await query(
    `SELECT status FROM alquimista_platform.approval_requests WHERE id = $1`,
    [approvalId]
  );

  if (result.rows.length === 0) {
    throw new Error('Approval request not found');
  }

  const { status } = result.rows[0];

  if (status !== 'approved') {
    throw new Error(`Action cannot be executed. Approval status: ${status}`);
  }

  // Execute the action
  await action();

  // Mark approval as executed
  await query(
    `UPDATE alquimista_platform.approval_requests 
     SET updated_at = NOW() 
     WHERE id = $1`,
    [approvalId]
  );
}
```

## EventBridge Integration

The approval flow publishes events to EventBridge for workflow automation:

### Events Published

1. **approval.created** - When a new approval request is created
2. **approval.decision_recorded** - When an approver makes a decision
3. **approval.approved** - When all required approvals are received
4. **approval.rejected** - When any approver rejects the request
5. **approval.cancelled** - When the requester cancels the request

### Event Structure

```json
{
  "Source": "alquimista.platform",
  "DetailType": "approval.approved",
  "Detail": {
    "approvalId": "approval-1234567890",
    "tenantId": "tenant-123",
    "timestamp": "2024-01-01T12:00:00Z",
    "approverId": "user-id-2",
    "decision": "approve",
    "status": "approved",
    "canExecute": true
  }
}
```

### Example: Automated Action Execution

```typescript
// Lambda triggered by approval.approved event
export const handler = async (event: any) => {
  const { approvalId, tenantId } = event.detail;

  // Get approval details
  const approval = await getApprovalDetails(approvalId);

  // Execute the approved action
  switch (approval.actionType) {
    case 'agent.delete':
      await deleteAgent(approval.resourceId);
      break;
    case 'data.export':
      await exportData(approval.actionDetails);
      break;
    // ... other actions
  }
};
```

## Database Schema

### approval_requests

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(255) | Primary key |
| tenant_id | UUID | Tenant ID |
| requested_by | UUID | User who requested approval |
| action_type | VARCHAR(100) | Type of action (e.g., 'agent.delete') |
| resource_type | VARCHAR(50) | Type of resource (e.g., 'agent') |
| resource_id | VARCHAR(255) | Specific resource ID (optional) |
| action_details | JSONB | Details about the action |
| approvers | TEXT | JSON array of approver user IDs |
| required_approvals | INTEGER | Number of approvals required (1 or 2) |
| status | VARCHAR(20) | pending, approved, rejected, expired, cancelled |
| expires_at | TIMESTAMP | Expiration timestamp |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### approval_decisions

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| approval_id | VARCHAR(255) | Foreign key to approval_requests |
| approver_id | UUID | User who made the decision |
| decision | VARCHAR(10) | 'approve' or 'reject' |
| comment | TEXT | Optional comment |
| created_at | TIMESTAMP | Decision timestamp |

### notifications

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | UUID | User to notify |
| type | VARCHAR(50) | Notification type |
| title | VARCHAR(255) | Notification title |
| message | TEXT | Notification message |
| metadata | JSONB | Additional metadata |
| read | BOOLEAN | Read status |
| created_at | TIMESTAMP | Creation timestamp |

## Security Considerations

1. **Authorization**: Only designated approvers can make decisions
2. **Tenant Isolation**: Users can only see approvals for their tenant
3. **Audit Trail**: All decisions are logged in audit_logs table
4. **Expiration**: Pending approvals automatically expire
5. **Cancellation**: Only the requester can cancel pending approvals

## Best Practices

1. **Set Appropriate Expiration**: Default is 24 hours, adjust based on urgency
2. **Choose Right Approvers**: Select users with appropriate authority
3. **Provide Context**: Include detailed actionDetails for informed decisions
4. **Monitor Pending Approvals**: Set up alerts for expiring approvals
5. **Document Action Types**: Maintain a registry of action types requiring approval

## Common Action Types

- `agent.delete` - Delete an agent
- `agent.modify_critical` - Modify critical agent settings
- `user.role_change` - Change user role
- `user.delete` - Delete user account
- `data.export` - Export sensitive data
- `data.delete_bulk` - Bulk delete data
- `tenant.settings_change` - Change tenant settings
- `billing.plan_change` - Change billing plan

## Troubleshooting

### Approval Not Found
- Verify the approval ID is correct
- Check that the user has access to the tenant

### Cannot Approve
- Verify the user is in the approvers list
- Check that the approval is still pending
- Verify the approval hasn't expired

### Action Not Executing After Approval
- Check that all required approvals are received
- Verify the approval status is 'approved'
- Check for errors in the action execution logic

## Related Documentation

- [Audit Log System](./README-audit-log.md)
- [Permissions System](./README-permissions.md)
- [Platform API Reference](./API-REFERENCE.md)

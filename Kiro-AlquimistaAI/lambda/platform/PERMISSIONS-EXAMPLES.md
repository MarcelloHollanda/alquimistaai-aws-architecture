# Permission System - Usage Examples

This document provides practical examples of using the permission system in the Alquimista platform.

## Table of Contents

1. [Basic Permission Checks](#basic-permission-checks)
2. [Granting Permissions](#granting-permissions)
3. [Using Constraints](#using-constraints)
4. [Role-Based Access](#role-based-access)
5. [Protecting Lambda Functions](#protecting-lambda-functions)
6. [API Examples](#api-examples)

## Basic Permission Checks

### Example 1: Check if user can execute an agent

```typescript
import { checkPermission, SubjectType, ResourceType, PermissionAction } from './check-permissions';

async function canUserExecuteAgent(userId: string, agentId: string): Promise<boolean> {
  const result = await checkPermission({
    subjectType: SubjectType.USER,
    subjectId: userId,
    resourceType: ResourceType.AGENT,
    resourceId: agentId,
    action: PermissionAction.EXECUTE
  });
  
  return result.allowed;
}

// Usage
const allowed = await canUserExecuteAgent('user-123', 'agent-456');
if (allowed) {
  console.log('User can execute agent');
} else {
  console.log('User cannot execute agent');
}
```

### Example 2: Check permission with context

```typescript
const result = await checkPermission({
  subjectType: SubjectType.USER,
  subjectId: 'user-123',
  resourceType: ResourceType.AGENT,
  resourceId: 'agent-456',
  action: PermissionAction.EXECUTE,
  context: {
    tenantId: 'tenant-789',
    timestamp: new Date(),
    metadata: {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...'
    }
  }
});

if (!result.allowed) {
  console.log(`Permission denied: ${result.reason}`);
  if (result.constraints) {
    console.log('Constraints:', result.constraints);
  }
}
```

## Granting Permissions

### Example 3: Grant basic permission

```typescript
import { grantPermission, SubjectType, ResourceType, PermissionAction } from './check-permissions';

// Grant user permission to execute a specific agent
const { permissionId } = await grantPermission({
  subjectType: SubjectType.USER,
  subjectId: 'user-123',
  resourceType: ResourceType.AGENT,
  resourceId: 'agent-456',
  action: PermissionAction.EXECUTE,
  grantedBy: 'admin-user-id'
});

console.log(`Permission granted with ID: ${permissionId}`);
```

### Example 4: Grant permission to a role

```typescript
// Grant all managers permission to manage agents
await grantPermission({
  subjectType: SubjectType.ROLE,
  subjectId: 'manager',
  resourceType: ResourceType.AGENT,
  action: PermissionAction.MANAGE,
  grantedBy: 'admin-user-id'
});
```

### Example 5: Grant temporary permission

```typescript
// Grant permission that expires in 7 days
const expirationDate = new Date();
expirationDate.setDate(expirationDate.getDate() + 7);

await grantPermission({
  subjectType: SubjectType.USER,
  subjectId: 'user-123',
  resourceType: ResourceType.AGENT,
  resourceId: 'agent-456',
  action: PermissionAction.EXECUTE,
  expiresAt: expirationDate,
  grantedBy: 'admin-user-id'
});
```

## Using Constraints

### Example 6: Business hours only

```typescript
// Allow agent execution only during business hours (8 AM - 6 PM, Monday-Friday)
await grantPermission({
  subjectType: SubjectType.USER,
  subjectId: 'user-123',
  resourceType: ResourceType.AGENT,
  resourceId: 'agent-456',
  action: PermissionAction.EXECUTE,
  constraints: {
    timeWindow: {
      start: '08:00',
      end: '18:00'
    },
    allowedDays: [1, 2, 3, 4, 5] // Monday-Friday
  },
  grantedBy: 'admin-user-id'
});
```

### Example 7: Require approval for sensitive operations

```typescript
// Grant permission but require approval
await grantPermission({
  subjectType: SubjectType.USER,
  subjectId: 'user-123',
  resourceType: ResourceType.DATA,
  action: PermissionAction.DELETE,
  constraints: {
    requiresApproval: true
  },
  grantedBy: 'admin-user-id'
});

// When checking permission, pass approval status
const result = await checkPermission({
  subjectType: SubjectType.USER,
  subjectId: 'user-123',
  resourceType: ResourceType.DATA,
  action: PermissionAction.DELETE,
  context: {
    metadata: {
      approved: true, // Approval granted
      approvedBy: 'manager-user-id'
    }
  }
});
```

### Example 8: IP whitelist

```typescript
// Allow access only from specific IP addresses
await grantPermission({
  subjectType: SubjectType.USER,
  subjectId: 'user-123',
  resourceType: ResourceType.AGENT,
  action: PermissionAction.EXECUTE,
  constraints: {
    ipWhitelist: ['192.168.1.0/24', '10.0.0.1']
  },
  grantedBy: 'admin-user-id'
});
```

### Example 9: Combined constraints

```typescript
// Multiple constraints
await grantPermission({
  subjectType: SubjectType.USER,
  subjectId: 'user-123',
  resourceType: ResourceType.AGENT,
  resourceId: 'sensitive-agent-id',
  action: PermissionAction.EXECUTE,
  constraints: {
    timeWindow: { start: '09:00', end: '17:00' },
    allowedDays: [1, 2, 3, 4, 5],
    requiresApproval: true,
    ipWhitelist: ['192.168.1.0/24']
  },
  expiresAt: new Date('2025-12-31'),
  grantedBy: 'admin-user-id'
});
```

## Role-Based Access

### Example 10: Check user role

```typescript
import { hasRole } from './check-permissions';

// Check if user is admin
const isAdmin = await hasRole('user-123', 'admin');

// Check if user has one of multiple roles
const canManage = await hasRole('user-123', ['admin', 'manager']);

if (canManage) {
  // Allow management operations
}
```

### Example 11: Role-based permission check

```typescript
// This automatically checks both direct permissions and role-based permissions
const result = await checkPermission({
  subjectType: SubjectType.USER,
  subjectId: 'user-123',
  resourceType: ResourceType.AGENT,
  action: PermissionAction.MANAGE,
  context: {
    tenantId: 'tenant-789'
  }
});

// If user has 'manager' role, they inherit manager permissions
// Direct user permissions override role permissions
```

## Protecting Lambda Functions

### Example 12: Using withPermissionCheck middleware

```typescript
import { withPermissionCheck, ResourceType, PermissionAction } from './check-permissions';

// Protect entire Lambda function
export const handler = withPermissionCheck({
  resourceType: ResourceType.AGENT,
  action: PermissionAction.EXECUTE
})(async (event, context) => {
  // This code only runs if user has permission
  
  const agentId = event.pathParameters.id;
  // Execute agent...
  
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
});
```

### Example 13: Manual permission check in Lambda

```typescript
import { checkPermission, SubjectType, ResourceType, PermissionAction } from './check-permissions';

export const handler = async (event: any) => {
  // Extract user info from JWT
  const userId = event.requestContext.authorizer.jwt.claims.sub;
  const tenantId = event.requestContext.authorizer.jwt.claims['custom:tenant_id'];
  const agentId = event.pathParameters.id;
  
  // Check permission
  const permissionCheck = await checkPermission({
    subjectType: SubjectType.USER,
    subjectId: userId,
    resourceType: ResourceType.AGENT,
    resourceId: agentId,
    action: PermissionAction.EXECUTE,
    context: {
      tenantId,
      timestamp: new Date(),
      metadata: {
        ipAddress: event.requestContext.http.sourceIp
      }
    }
  });
  
  if (!permissionCheck.allowed) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        error: 'Forbidden',
        reason: permissionCheck.reason
      })
    };
  }
  
  // Proceed with execution...
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};
```

## API Examples

### Example 14: Grant permission via API

```bash
# POST /api/permissions
curl -X POST https://api.alquimista.ai/api/permissions \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectType": "user",
    "subjectId": "user-123",
    "resourceType": "agent",
    "resourceId": "agent-456",
    "action": "execute",
    "constraints": {
      "timeWindow": {
        "start": "09:00",
        "end": "18:00"
      },
      "allowedDays": [1, 2, 3, 4, 5]
    },
    "expiresAt": "2025-12-31T23:59:59Z"
  }'
```

### Example 15: List user permissions via API

```bash
# GET /api/permissions
curl -X GET https://api.alquimista.ai/api/permissions \
  -H "Authorization: Bearer $JWT_TOKEN"

# Response:
{
  "permissions": [
    {
      "id": "perm-123",
      "resource_type": "agent",
      "resource_id": "agent-456",
      "action": "execute",
      "constraints": {
        "timeWindow": { "start": "09:00", "end": "18:00" }
      },
      "granted_at": "2025-01-01T00:00:00Z",
      "expires_at": "2025-12-31T23:59:59Z"
    }
  ],
  "total": 1
}
```

### Example 16: Revoke permission via API

```bash
# DELETE /api/permissions/{id}
curl -X DELETE https://api.alquimista.ai/api/permissions/perm-123 \
  -H "Authorization: Bearer $JWT_TOKEN"

# Response:
{
  "success": true,
  "message": "Permission revoked successfully"
}
```

### Example 17: List permissions for another user (admin only)

```bash
# GET /api/permissions?subjectType=user&subjectId=user-123
curl -X GET "https://api.alquimista.ai/api/permissions?subjectType=user&subjectId=user-123" \
  -H "Authorization: Bearer $ADMIN_JWT_TOKEN"
```

## Advanced Scenarios

### Example 18: Cascading permissions

```typescript
// Grant broad permission to role
await grantPermission({
  subjectType: SubjectType.ROLE,
  subjectId: 'operator',
  resourceType: ResourceType.AGENT,
  action: PermissionAction.EXECUTE,
  grantedBy: 'admin-user-id'
});

// Override with more restrictive permission for specific user
await grantPermission({
  subjectType: SubjectType.USER,
  subjectId: 'user-123',
  resourceType: ResourceType.AGENT,
  resourceId: 'sensitive-agent-id',
  action: PermissionAction.EXECUTE,
  constraints: {
    requiresApproval: true
  },
  grantedBy: 'admin-user-id'
});

// User-123 can execute all agents (from role)
// But needs approval for sensitive-agent-id (direct permission overrides)
```

### Example 19: Temporary elevated access

```typescript
// Grant temporary admin access for maintenance
const maintenanceEnd = new Date();
maintenanceEnd.setHours(maintenanceEnd.getHours() + 2); // 2 hours

await grantPermission({
  subjectType: SubjectType.USER,
  subjectId: 'operator-user-id',
  resourceType: ResourceType.TENANT,
  action: PermissionAction.MANAGE,
  expiresAt: maintenanceEnd,
  grantedBy: 'admin-user-id'
});
```

### Example 20: Agent-to-agent permissions

```typescript
// Allow one agent to invoke another agent
await grantPermission({
  subjectType: SubjectType.AGENT,
  subjectId: 'agent-orchestrator-id',
  resourceType: ResourceType.AGENT,
  resourceId: 'agent-worker-id',
  action: PermissionAction.EXECUTE,
  grantedBy: 'admin-user-id'
});

// Check permission from agent
const result = await checkPermission({
  subjectType: SubjectType.AGENT,
  subjectId: 'agent-orchestrator-id',
  resourceType: ResourceType.AGENT,
  resourceId: 'agent-worker-id',
  action: PermissionAction.EXECUTE
});
```

## Testing Permissions

### Example 21: Test permission constraints

```typescript
// Test time window constraint
const morningCheck = await checkPermission({
  subjectType: SubjectType.USER,
  subjectId: 'user-123',
  resourceType: ResourceType.AGENT,
  action: PermissionAction.EXECUTE,
  context: {
    timestamp: new Date('2025-01-15T07:00:00Z') // 7 AM
  }
});
console.log('7 AM:', morningCheck.allowed); // false (before 8 AM)

const afternoonCheck = await checkPermission({
  subjectType: SubjectType.USER,
  subjectId: 'user-123',
  resourceType: ResourceType.AGENT,
  action: PermissionAction.EXECUTE,
  context: {
    timestamp: new Date('2025-01-15T14:00:00Z') // 2 PM
  }
});
console.log('2 PM:', afternoonCheck.allowed); // true (within 8 AM - 6 PM)
```

## Summary

The permission system provides:

- ✅ Granular control over who can do what
- ✅ Role-based and user-specific permissions
- ✅ Time-based and IP-based constraints
- ✅ Approval workflows for sensitive operations
- ✅ Temporary access with expiration
- ✅ Complete audit trail
- ✅ Easy integration with Lambda functions

For more details, see [README-permissions.md](./README-permissions.md)

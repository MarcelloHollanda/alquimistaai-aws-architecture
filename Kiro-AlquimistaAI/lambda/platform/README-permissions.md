# Permission System - Alquimista Platform

## Overview

The permission system provides granular, role-based access control (RBAC) for the Alquimista platform. It allows fine-grained control over who can perform which actions on which resources.

## Architecture

### Permission Model

```typescript
Permission {
  id: UUID
  subject_type: 'user' | 'role' | 'agent'
  subject_id: string
  resource_type: 'agent' | 'tenant' | 'user' | 'data'
  resource_id?: UUID
  action: 'read' | 'write' | 'execute' | 'delete' | 'manage'
  constraints?: PermissionConstraints
  granted_at: timestamp
  expires_at?: timestamp
}
```

### Permission Hierarchy

1. **Direct Permissions**: Assigned directly to a user
2. **Role Permissions**: Inherited from user's role
3. **Priority**: Direct permissions override role permissions

## Core Functions

### 1. checkPermission()

Check if a subject has permission to perform an action on a resource.

```typescript
const result = await checkPermission({
  subjectType: SubjectType.USER,
  subjectId: 'user-uuid',
  resourceType: ResourceType.AGENT,
  resourceId: 'agent-uuid',
  action: PermissionAction.EXECUTE,
  context: {
    tenantId: 'tenant-uuid',
    timestamp: new Date(),
    metadata: { ipAddress: '192.168.1.1' }
  }
});

if (result.allowed) {
  // Proceed with action
} else {
  // Deny access
  console.log(result.reason);
}
```


### 2. grantPermission()

Grant a new permission to a subject.

```typescript
const { permissionId } = await grantPermission({
  subjectType: SubjectType.USER,
  subjectId: 'user-uuid',
  resourceType: ResourceType.AGENT,
  resourceId: 'agent-uuid',
  action: PermissionAction.EXECUTE,
  constraints: {
    timeWindow: { start: '09:00', end: '18:00' },
    allowedDays: [1, 2, 3, 4, 5], // Monday-Friday
    maxExecutions: 100
  },
  expiresAt: new Date('2025-12-31'),
  grantedBy: 'admin-user-uuid'
});
```

### 3. revokePermission()

Revoke an existing permission.

```typescript
await revokePermission('permission-uuid');
```

### 4. listPermissions()

List all permissions for a subject.

```typescript
const permissions = await listPermissions(
  SubjectType.USER,
  'user-uuid'
);
```

### 5. hasRole()

Check if a user has a specific role.

```typescript
const isAdmin = await hasRole('user-uuid', 'admin');
const isManagerOrAdmin = await hasRole('user-uuid', ['admin', 'manager']);
```

## Permission Constraints

Constraints allow fine-grained control over when and how permissions can be used.

### Available Constraints

#### 1. Time Window
Restrict actions to specific hours of the day.

```typescript
constraints: {
  timeWindow: {
    start: '09:00',  // 9 AM
    end: '18:00'     // 6 PM
  }
}
```

#### 2. Allowed Days
Restrict actions to specific days of the week.

```typescript
constraints: {
  allowedDays: [1, 2, 3, 4, 5]  // Monday-Friday (0=Sunday, 6=Saturday)
}
```

#### 3. Requires Approval
Require explicit approval before executing action.

```typescript
constraints: {
  requiresApproval: true
}

// When checking permission, pass approval in context
context: {
  metadata: { approved: true }
}
```

#### 4. Max Executions
Limit number of times action can be performed (tracked separately).

```typescript
constraints: {
  maxExecutions: 100
}
```

#### 5. IP Whitelist
Restrict actions to specific IP addresses.

```typescript
constraints: {
  ipWhitelist: ['192.168.1.1', '10.0.0.0/8']
}
```

## Permission Scopes

### Resource Types

- **agent**: AI agent resources
- **tenant**: Tenant/company resources
- **user**: User management resources
- **data**: Data access resources

### Actions

- **read**: View/read resource
- **write**: Create/update resource
- **execute**: Execute/run resource (e.g., run agent)
- **delete**: Delete resource
- **manage**: Full control (includes all above)

### Subject Types

- **user**: Individual user
- **role**: User role (admin, manager, operator, viewer)
- **agent**: AI agent (for agent-to-agent permissions)

## Role-Based Permissions

### Default Roles

#### Admin
- Full access to all resources
- Can manage users and permissions
- Can activate/deactivate agents

#### Manager
- Can activate/deactivate agents
- Can view reports and metrics
- Cannot manage users or permissions

#### Operator
- Can execute agents
- Can view dashboards
- Cannot modify configurations

#### Viewer
- Read-only access
- Can view dashboards and reports
- Cannot execute actions

## Usage Examples

### Example 1: Protect Agent Execution

```typescript
import { withPermissionCheck, ResourceType, PermissionAction } from './check-permissions';

export const handler = withPermissionCheck({
  resourceType: ResourceType.AGENT,
  action: PermissionAction.EXECUTE
})(async (event, context) => {
  // This code only runs if user has permission
  // to execute agents
  
  const agentId = event.pathParameters.id;
  // Execute agent logic...
  
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
});
```

### Example 2: Check Permission Manually

```typescript
import { checkPermission, SubjectType, ResourceType, PermissionAction } from './check-permissions';

export const handler = async (event: any) => {
  const userId = event.requestContext.authorizer.jwt.claims.sub;
  const agentId = event.pathParameters.id;
  
  // Check if user can execute this specific agent
  const permissionCheck = await checkPermission({
    subjectType: SubjectType.USER,
    subjectId: userId,
    resourceType: ResourceType.AGENT,
    resourceId: agentId,
    action: PermissionAction.EXECUTE
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
};
```

### Example 3: Grant Time-Limited Permission

```typescript
import { grantPermission, SubjectType, ResourceType, PermissionAction } from './check-permissions';

// Grant user permission to execute agent only during business hours
await grantPermission({
  subjectType: SubjectType.USER,
  subjectId: 'user-123',
  resourceType: ResourceType.AGENT,
  resourceId: 'agent-456',
  action: PermissionAction.EXECUTE,
  constraints: {
    timeWindow: { start: '08:00', end: '18:00' },
    allowedDays: [1, 2, 3, 4, 5] // Monday-Friday
  },
  expiresAt: new Date('2025-12-31'),
  grantedBy: 'admin-user-id'
});
```

### Example 4: Role-Based Access

```typescript
import { hasRole } from './check-permissions';

export const handler = async (event: any) => {
  const userId = event.requestContext.authorizer.jwt.claims.sub;
  
  // Only admins and managers can access this endpoint
  const hasAccess = await hasRole(userId, ['admin', 'manager']);
  
  if (!hasAccess) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Insufficient permissions' })
    };
  }
  
  // Proceed with admin/manager logic...
};
```

## Database Schema

The permission system uses the `alquimista_platform.permissions` table:

```sql
CREATE TABLE alquimista_platform.permissions (
    id UUID PRIMARY KEY,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    action VARCHAR(100) NOT NULL,
    subject_type VARCHAR(50) NOT NULL,
    subject_id VARCHAR(255) NOT NULL,
    constraints JSONB DEFAULT '{}'::jsonb,
    granted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    CONSTRAINT unique_permission UNIQUE (
      resource_type, resource_id, action, subject_type, subject_id
    )
);
```

## Best Practices

### 1. Use Role-Based Permissions for Common Cases
Instead of granting permissions to individual users, grant them to roles.

```typescript
// Good: Grant to role
await grantPermission({
  subjectType: SubjectType.ROLE,
  subjectId: 'manager',
  resourceType: ResourceType.AGENT,
  action: PermissionAction.EXECUTE
});

// Less ideal: Grant to individual user (unless specific exception needed)
await grantPermission({
  subjectType: SubjectType.USER,
  subjectId: 'user-123',
  resourceType: ResourceType.AGENT,
  action: PermissionAction.EXECUTE
});
```

### 2. Use Resource-Specific Permissions for Sensitive Operations
For critical agents or data, grant permissions per resource.

```typescript
// Grant permission for specific agent only
await grantPermission({
  subjectType: SubjectType.USER,
  subjectId: 'user-123',
  resourceType: ResourceType.AGENT,
  resourceId: 'sensitive-agent-id',  // Specific agent
  action: PermissionAction.EXECUTE
});
```

### 3. Set Expiration Dates for Temporary Access
Always set expiration dates for temporary permissions.

```typescript
await grantPermission({
  // ... other fields
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
});
```

### 4. Use Constraints for Business Rules
Implement business rules using constraints rather than custom code.

```typescript
// Enforce business hours
constraints: {
  timeWindow: { start: '08:00', end: '18:00' },
  allowedDays: [1, 2, 3, 4, 5]
}
```

### 5. Log Permission Checks
Always log permission checks for audit trail.

```typescript
// Logging is built-in to checkPermission()
// Logs are automatically sent to CloudWatch
```

## Security Considerations

1. **Fail Closed**: If permission check fails due to error, access is denied
2. **Audit Trail**: All permission checks are logged with trace_id
3. **Expiration**: Expired permissions are automatically excluded from checks
4. **Constraints**: Constraints are validated on every permission check
5. **Role Hierarchy**: Direct permissions override role permissions

## Integration with Audit System

All permission checks and grants are automatically logged to the audit system:

```typescript
// Automatically logged to alquimista_platform.audit_logs
{
  action_type: 'permission.checked',
  result: 'success' | 'failure',
  context: {
    subjectId: 'user-123',
    resourceType: 'agent',
    action: 'execute',
    allowed: true
  }
}
```

## Requirements

This implementation satisfies **Requirement 14.3**:
- ✅ Granular permissions per agent
- ✅ Defined action scopes (read, write, execute, delete, manage)
- ✅ Permission validation before executing actions
- ✅ Role-based access control
- ✅ Resource-specific permissions
- ✅ Time-based constraints
- ✅ Audit trail integration

## Related Files

- `lambda/platform/check-permissions.ts` - Core permission logic
- `database/migrations/003_create_platform_tables.sql` - Database schema
- `lambda/platform/activate-agent.ts` - Example usage in agent activation
- `lambda/shared/database.ts` - Database connection utilities

# Permission System - Quick Start Guide

Get started with the Alquimista permission system in 5 minutes.

## 1. Import the Functions

```typescript
import {
  checkPermission,
  grantPermission,
  revokePermission,
  listPermissions,
  hasRole,
  SubjectType,
  ResourceType,
  PermissionAction
} from './check-permissions';
```

## 2. Check if User Can Do Something

```typescript
const result = await checkPermission({
  subjectType: SubjectType.USER,
  subjectId: userId,
  resourceType: ResourceType.AGENT,
  resourceId: agentId,
  action: PermissionAction.EXECUTE
});

if (result.allowed) {
  // User can execute the agent
} else {
  // User cannot - show result.reason
}
```

## 3. Protect a Lambda Function

```typescript
import { withPermissionCheck, ResourceType, PermissionAction } from './check-permissions';

export const handler = withPermissionCheck({
  resourceType: ResourceType.AGENT,
  action: PermissionAction.EXECUTE
})(async (event, context) => {
  // This code only runs if user has permission
  return { statusCode: 200, body: 'Success' };
});
```

## 4. Grant a Permission (Admin Only)

```typescript
await grantPermission({
  subjectType: SubjectType.USER,
  subjectId: 'user-123',
  resourceType: ResourceType.AGENT,
  resourceId: 'agent-456',
  action: PermissionAction.EXECUTE,
  grantedBy: adminUserId
});
```

## 5. Add Time Constraints

```typescript
await grantPermission({
  subjectType: SubjectType.USER,
  subjectId: 'user-123',
  resourceType: ResourceType.AGENT,
  action: PermissionAction.EXECUTE,
  constraints: {
    timeWindow: { start: '09:00', end: '18:00' },
    allowedDays: [1, 2, 3, 4, 5] // Monday-Friday
  },
  grantedBy: adminUserId
});
```

## Common Patterns

### Check Role

```typescript
const isAdmin = await hasRole(userId, 'admin');
const canManage = await hasRole(userId, ['admin', 'manager']);
```

### List User's Permissions

```typescript
const permissions = await listPermissions(SubjectType.USER, userId);
```

### Revoke Permission

```typescript
await revokePermission(permissionId);
```

## Default Roles

- **admin**: Full access to everything
- **manager**: Can manage agents, view reports
- **operator**: Can execute agents (business hours only)
- **viewer**: Read-only access

## Action Types

- **read**: View resource
- **write**: Create/update resource
- **execute**: Run/execute resource
- **delete**: Delete resource
- **manage**: Full control (all above)

## Resource Types

- **agent**: AI agents
- **tenant**: Company/tenant settings
- **user**: User management
- **data**: Data access

## Need More?

- Full documentation: [README-permissions.md](./README-permissions.md)
- 21 examples: [PERMISSIONS-EXAMPLES.md](./PERMISSIONS-EXAMPLES.md)
- Implementation details: [PERMISSIONS-IMPLEMENTATION-SUMMARY.md](./PERMISSIONS-IMPLEMENTATION-SUMMARY.md)

## API Endpoints

```bash
# Grant permission (admin only)
POST /api/permissions

# List permissions
GET /api/permissions

# Revoke permission (admin only)
DELETE /api/permissions/{id}
```

That's it! You're ready to use the permission system. 🚀

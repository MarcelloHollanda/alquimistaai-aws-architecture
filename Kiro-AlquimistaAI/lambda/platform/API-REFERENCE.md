# Alquimista Platform API Reference

## Base URL
```
https://{api-id}.execute-api.us-east-1.amazonaws.com
```

The actual URL will be available in CloudFormation outputs after deployment as `PlatformApiUrl`.

## Authentication

All endpoints require a valid Cognito JWT token in the Authorization header:

```
Authorization: Bearer {jwt-token}
```

The JWT token must contain the following claims:
- `custom:tenant_id` - Your tenant identifier
- `sub` - Your user ID
- `custom:user_role` - Your role (admin, manager, operator, viewer)

## Endpoints

### 1. List Available Agents

Get a list of all available agents in the marketplace.

**Endpoint:** `GET /api/agents`

**Query Parameters:**
- `category` (optional) - Filter by category
  - Valid values: `Conteúdo`, `Social`, `Vendas`, `Pesquisa`, `Agenda`, `Finanças`

**Example Request:**
```bash
curl -X GET "https://your-api-url/api/agents?category=Vendas" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200 OK):**
```json
{
  "agents": [
    {
      "id": "agent-001",
      "name": "Agente de Recebimento",
      "description": "Higieniza, padroniza e enriquece dados de leads",
      "category": "Vendas",
      "version": "1.0.0",
      "status": "active",
      "pricing": "free",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid JWT token
- `500 Internal Server Error` - Database or server error

---

### 2. Activate Agent

Activate an agent for your tenant.

**Endpoint:** `POST /api/agents/{id}/activate`

**Path Parameters:**
- `id` (required) - Agent ID to activate

**Request Body:**
```json
{
  "permissions": ["read", "write", "execute"]  // optional
}
```

**Required Permissions:**
- User role must be `admin` or `manager`

**Example Request:**
```bash
curl -X POST "https://your-api-url/api/agents/agent-001/activate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": ["read", "write"]
  }'
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "activationId": "activation-1234567890",
  "agent": {
    "id": "agent-001",
    "name": "Agente de Recebimento",
    "category": "Vendas"
  },
  "tenantId": "tenant-123",
  "permissions": ["read", "write"],
  "activatedAt": "2024-01-15T10:30:00.000Z",
  "message": "Agent Agente de Recebimento activated successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Missing agent ID or invalid request
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User doesn't have permission to activate agents
- `404 Not Found` - Agent not found in catalog
- `409 Conflict` - Agent is already active for this tenant
- `500 Internal Server Error` - Database or server error

**EventBridge Event Published:**
```json
{
  "Source": "alquimista.platform",
  "DetailType": "agent.activated",
  "Detail": {
    "activationId": "activation-1234567890",
    "agentId": "agent-001",
    "tenantId": "tenant-123",
    "userId": "user-456",
    "permissions": ["read", "write"],
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 3. Deactivate Agent

Deactivate an agent for your tenant.

**Endpoint:** `POST /api/agents/{id}/deactivate`

**Path Parameters:**
- `id` (required) - Agent ID to deactivate

**Request Body:**
```json
{
  "reason": "No longer needed"  // optional
}
```

**Required Permissions:**
- User role must be `admin` or `manager`

**Example Request:**
```bash
curl -X POST "https://your-api-url/api/agents/agent-001/deactivate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Switching to different agent"
  }'
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "deactivationId": "deactivation-1234567890",
  "agent": {
    "id": "agent-001",
    "name": "Agente de Recebimento",
    "category": "Vendas"
  },
  "tenantId": "tenant-123",
  "reason": "Switching to different agent",
  "deactivatedAt": "2024-01-15T11:00:00.000Z",
  "message": "Agent Agente de Recebimento deactivated successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Missing agent ID
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User doesn't have permission to deactivate agents
- `404 Not Found` - Agent not activated for this tenant
- `409 Conflict` - Agent is already inactive
- `500 Internal Server Error` - Database or server error

**EventBridge Event Published:**
```json
{
  "Source": "alquimista.platform",
  "DetailType": "agent.deactivated",
  "Detail": {
    "deactivationId": "deactivation-1234567890",
    "agentId": "agent-001",
    "tenantId": "tenant-123",
    "userId": "user-456",
    "reason": "Switching to different agent",
    "timestamp": "2024-01-15T11:00:00.000Z"
  }
}
```

---

## Agent Categories

The following categories are available for filtering:

| Category | Description | Example Agents |
|----------|-------------|----------------|
| `Conteúdo` | Content creation and management | Blog writer, Social media content |
| `Social` | Social media management | Post scheduler, Engagement tracker |
| `Vendas` | Sales and prospecting | Lead receiver, Strategy, Dispatch |
| `Pesquisa` | Research and analysis | Sentiment analysis, Reports |
| `Agenda` | Calendar and scheduling | Meeting scheduler, Availability checker |
| `Finanças` | Financial management | Invoice generator, Expense tracker |

## User Roles and Permissions

| Role | List Agents | Activate Agent | Deactivate Agent |
|------|-------------|----------------|------------------|
| `admin` | ✅ | ✅ | ✅ |
| `manager` | ✅ | ✅ | ✅ |
| `operator` | ✅ | ❌ | ❌ |
| `viewer` | ✅ | ❌ | ❌ |

## Rate Limits

- **List Agents:** 100 requests per minute per tenant
- **Activate Agent:** 10 requests per minute per tenant
- **Deactivate Agent:** 10 requests per minute per tenant

## CORS Configuration

The API supports CORS with the following configuration:
- **Allowed Origins:** `*` (configure specific origins in production)
- **Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers:** Content-Type, Authorization
- **Max Age:** 86400 seconds (24 hours)

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Observability

All API requests are:
- Logged with structured JSON format
- Traced with AWS X-Ray
- Monitored with CloudWatch metrics
- Published as events to EventBridge (for activate/deactivate)

## Testing with cURL

### Get JWT Token from Cognito
```bash
# Replace with your Cognito User Pool details
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id YOUR_CLIENT_ID \
  --auth-parameters USERNAME=user@example.com,PASSWORD=YourPassword
```

### List All Agents
```bash
curl -X GET "https://your-api-url/api/agents" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### List Agents by Category
```bash
curl -X GET "https://your-api-url/api/agents?category=Vendas" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Activate an Agent
```bash
curl -X POST "https://your-api-url/api/agents/agent-001/activate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"permissions": ["read", "write"]}'
```

### Deactivate an Agent
```bash
curl -X POST "https://your-api-url/api/agents/agent-001/deactivate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Testing deactivation"}'
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import axios from 'axios';

const API_URL = 'https://your-api-url';
const JWT_TOKEN = 'your-jwt-token';

// List agents
const listAgents = async (category?: string) => {
  const params = category ? { category } : {};
  const response = await axios.get(`${API_URL}/api/agents`, {
    headers: { Authorization: `Bearer ${JWT_TOKEN}` },
    params
  });
  return response.data;
};

// Activate agent
const activateAgent = async (agentId: string, permissions?: string[]) => {
  const response = await axios.post(
    `${API_URL}/api/agents/${agentId}/activate`,
    { permissions },
    { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
  );
  return response.data;
};

// Deactivate agent
const deactivateAgent = async (agentId: string, reason?: string) => {
  const response = await axios.post(
    `${API_URL}/api/agents/${agentId}/deactivate`,
    { reason },
    { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
  );
  return response.data;
};
```

### Python
```python
import requests

API_URL = 'https://your-api-url'
JWT_TOKEN = 'your-jwt-token'

headers = {'Authorization': f'Bearer {JWT_TOKEN}'}

# List agents
def list_agents(category=None):
    params = {'category': category} if category else {}
    response = requests.get(f'{API_URL}/api/agents', headers=headers, params=params)
    return response.json()

# Activate agent
def activate_agent(agent_id, permissions=None):
    data = {'permissions': permissions} if permissions else {}
    response = requests.post(
        f'{API_URL}/api/agents/{agent_id}/activate',
        headers=headers,
        json=data
    )
    return response.json()

# Deactivate agent
def deactivate_agent(agent_id, reason=None):
    data = {'reason': reason} if reason else {}
    response = requests.post(
        f'{API_URL}/api/agents/{agent_id}/deactivate',
        headers=headers,
        json=data
    )
    return response.json()
```

## Support

For issues or questions:
- Check CloudWatch Logs: `/aws/lambda/alquimista-*`
- Check X-Ray traces for request flow
- Review EventBridge events for agent lifecycle
- Contact platform support team

# Nigredo API Documentation

## Overview

The Nigredo API provides endpoints for capturing and managing leads through public prospecting forms. The API follows RESTful principles and returns JSON responses.

**Base URL**: `https://api.alquimista.ai` (production)

**API Version**: v1

## Authentication

### Public Endpoints

The following endpoints are publicly accessible without authentication:

- `POST /api/leads` - Create a new lead

### Protected Endpoints

Protected endpoints require JWT authentication using AWS Cognito tokens.

**Authentication Header**:
```
Authorization: Bearer <JWT_TOKEN>
```

**How to obtain a token**:
1. Authenticate through the Fibonacci dashboard login
2. The JWT token is automatically included in API requests from the frontend
3. Tokens expire after 1 hour and must be refreshed

**Example**:
```bash
curl -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \
  https://api.alquimista.ai/api/leads
```

## Endpoints

### 1. Create Lead

Create a new lead from a prospecting form submission.

**Endpoint**: `POST /api/leads`

**Authentication**: None (public endpoint)

**Rate Limit**: 10 requests per hour per IP address

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "João Silva",
  "email": "joao.silva@example.com",
  "phone": "+5511999999999",
  "company": "Acme Corporation",
  "message": "Gostaria de saber mais sobre os serviços de automação com IA",
  "source": "website",
  "utm_params": {
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "brand-2024"
  }
}
```

**Request Schema**:

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `name` | string | Yes | 2-100 chars | Lead's full name |
| `email` | string | Yes | Valid email format (RFC 5322) | Lead's email address |
| `phone` | string | No | E.164 format | Lead's phone number |
| `company` | string | No | 2-100 chars | Lead's company name |
| `message` | string | Yes | 10-1000 chars | Lead's message or inquiry |
| `source` | string | No | Max 50 chars | Traffic source identifier |
| `utm_params` | object | No | - | UTM tracking parameters |
| `utm_params.utm_source` | string | No | Max 100 chars | UTM source |
| `utm_params.utm_medium` | string | No | Max 100 chars | UTM medium |
| `utm_params.utm_campaign` | string | No | Max 100 chars | UTM campaign |

**Success Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "success",
  "message": "Lead criado com sucesso",
  "lead": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses**:

**400 Bad Request** - Validation error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados de entrada inválidos",
    "details": {
      "email": "Formato de email inválido",
      "message": "Mensagem deve ter entre 10 e 1000 caracteres"
    }
  },
  "request_id": "abc-123-def-456",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**429 Too Many Requests** - Rate limit exceeded:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Limite de submissões excedido. Tente novamente em 1 hora.",
    "details": {
      "limit": 10,
      "window": "1 hour",
      "retry_after": 3600
    }
  },
  "request_id": "abc-123-def-456",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**500 Internal Server Error**:
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Erro interno do servidor. Tente novamente mais tarde."
  },
  "request_id": "abc-123-def-456",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Example cURL Request**:
```bash
curl -X POST https://api.alquimista.ai/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao.silva@example.com",
    "phone": "+5511999999999",
    "company": "Acme Corporation",
    "message": "Gostaria de saber mais sobre os serviços de automação com IA",
    "source": "website"
  }'
```

**Example JavaScript (Fetch)**:
```javascript
const response = await fetch('https://api.alquimista.ai/api/leads', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'João Silva',
    email: 'joao.silva@example.com',
    phone: '+5511999999999',
    company: 'Acme Corporation',
    message: 'Gostaria de saber mais sobre os serviços de automação com IA',
    source: 'website'
  })
});

const data = await response.json();
console.log(data);
```

---

### 2. List Leads

Retrieve a paginated list of leads with optional filters.

**Endpoint**: `GET /api/leads`

**Authentication**: Required (JWT token)

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number (1-indexed) |
| `limit` | integer | No | 20 | Items per page (max: 100) |
| `status` | string | No | - | Filter by lead status (new, contacted, qualified, converted) |
| `source` | string | No | - | Filter by traffic source |
| `from_date` | string | No | - | Filter leads created after this date (ISO 8601) |
| `to_date` | string | No | - | Filter leads created before this date (ISO 8601) |
| `search` | string | No | - | Search in name, email, or company |

**Success Response** (200 OK):
```json
{
  "leads": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "João Silva",
      "email": "joao.silva@example.com",
      "phone": "+5511999999999",
      "company": "Acme Corporation",
      "message": "Gostaria de saber mais sobre os serviços de automação com IA",
      "source": "website",
      "status": "new",
      "utm_source": "google",
      "utm_medium": "cpc",
      "utm_campaign": "brand-2024",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Maria Santos",
      "email": "maria.santos@example.com",
      "phone": "+5511988888888",
      "company": "Tech Solutions",
      "message": "Preciso de uma solução para atendimento automatizado",
      "source": "linkedin",
      "status": "contacted",
      "utm_source": "linkedin",
      "utm_medium": "social",
      "utm_campaign": "outreach-2024",
      "created_at": "2024-01-15T09:15:00.000Z",
      "updated_at": "2024-01-15T11:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

**Error Responses**:

**401 Unauthorized** - Missing or invalid token:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token de autenticação ausente ou inválido"
  },
  "request_id": "abc-123-def-456",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Example cURL Request**:
```bash
curl -X GET "https://api.alquimista.ai/api/leads?page=1&limit=20&status=new" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Example with Filters**:
```bash
curl -X GET "https://api.alquimista.ai/api/leads?page=1&limit=20&source=website&from_date=2024-01-01&search=acme" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 3. Get Lead Details

Retrieve detailed information about a specific lead, including webhook delivery history.

**Endpoint**: `GET /api/leads/{id}`

**Authentication**: Required (JWT token)

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Lead ID |

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Success Response** (200 OK):
```json
{
  "lead": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "João Silva",
    "email": "joao.silva@example.com",
    "phone": "+5511999999999",
    "company": "Acme Corporation",
    "message": "Gostaria de saber mais sobre os serviços de automação com IA",
    "source": "website",
    "status": "new",
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "brand-2024",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "webhook_history": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "webhook_url": "https://api.fibonacci.com/public/nigredo-event",
      "status_code": 200,
      "success": true,
      "attempt_number": 1,
      "sent_at": "2024-01-15T10:30:05.000Z"
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "webhook_url": "https://api.fibonacci.com/public/nigredo-event",
      "status_code": 500,
      "success": false,
      "attempt_number": 1,
      "error_message": "Internal Server Error",
      "sent_at": "2024-01-15T10:30:02.000Z"
    }
  ]
}
```

**Error Responses**:

**401 Unauthorized**:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token de autenticação ausente ou inválido"
  },
  "request_id": "abc-123-def-456",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**403 Forbidden** - User doesn't have permission to view this lead:
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Você não tem permissão para visualizar este lead"
  },
  "request_id": "abc-123-def-456",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**404 Not Found**:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Lead não encontrado"
  },
  "request_id": "abc-123-def-456",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Example cURL Request**:
```bash
curl -X GET "https://api.alquimista.ai/api/leads/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 4. Health Check

Check the API health status.

**Endpoint**: `GET /health`

**Authentication**: None

**Success Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

**Example cURL Request**:
```bash
curl -X GET https://api.alquimista.ai/health
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `DATABASE_ERROR` | 503 | Database unavailable |
| `WEBHOOK_ERROR` | 500 | Webhook delivery failed |

---

## Rate Limiting

### Public Endpoints

- **Limit**: 10 requests per hour per IP address
- **Scope**: Applies to `POST /api/leads` only
- **Response**: 429 Too Many Requests with `retry_after` header

### Protected Endpoints

- **Limit**: 1000 requests per hour per user
- **Scope**: Applies to all authenticated endpoints
- **Response**: 429 Too Many Requests

**Rate Limit Headers**:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1705318200
```

---

## CORS Policy

The API supports Cross-Origin Resource Sharing (CORS) for the following origins:

- `https://alquimista.ai`
- `https://www.alquimista.ai`
- `https://fibonacci.alquimista.ai`
- `http://localhost:3000` (development only)

**Allowed Methods**: GET, POST, OPTIONS

**Allowed Headers**: Content-Type, Authorization

---

## Webhooks

### Nigredo to Fibonacci Webhook

When a new lead is created, Nigredo automatically sends a webhook to the Fibonacci system.

**Webhook URL**: `https://api.fibonacci.com/public/nigredo-event`

**Method**: POST

**Payload**:
```json
{
  "event_type": "lead.created",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "lead": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "João Silva",
    "email": "joao.silva@example.com",
    "phone": "+5511999999999",
    "company": "Acme Corporation",
    "message": "Gostaria de saber mais sobre os serviços de automação com IA",
    "source": "website",
    "utm_params": {
      "utm_source": "google",
      "utm_medium": "cpc",
      "utm_campaign": "brand-2024"
    }
  }
}
```

**Retry Logic**:
- Max retries: 3
- Backoff: Exponential (1s, 2s, 4s)
- Timeout: 5 seconds per attempt

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const API_BASE_URL = 'https://api.alquimista.ai';

// Create a lead
async function createLead(leadData: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  source?: string;
}) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/leads`, leadData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data);
      throw error.response?.data;
    }
    throw error;
  }
}

// List leads (authenticated)
async function listLeads(token: string, params?: {
  page?: number;
  limit?: number;
  status?: string;
  source?: string;
}) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/leads`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data);
      throw error.response?.data;
    }
    throw error;
  }
}

// Get lead details (authenticated)
async function getLead(token: string, leadId: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/leads/${leadId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data);
      throw error.response?.data;
    }
    throw error;
  }
}
```

### Python

```python
import requests
from typing import Optional, Dict

API_BASE_URL = 'https://api.alquimista.ai'

def create_lead(lead_data: Dict) -> Dict:
    """Create a new lead"""
    try:
        response = requests.post(
            f'{API_BASE_URL}/api/leads',
            json=lead_data,
            headers={'Content-Type': 'application/json'}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        print(f'API Error: {e.response.json()}')
        raise

def list_leads(token: str, page: int = 1, limit: int = 20, 
               status: Optional[str] = None) -> Dict:
    """List leads with pagination"""
    try:
        params = {'page': page, 'limit': limit}
        if status:
            params['status'] = status
            
        response = requests.get(
            f'{API_BASE_URL}/api/leads',
            headers={'Authorization': f'Bearer {token}'},
            params=params
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        print(f'API Error: {e.response.json()}')
        raise

def get_lead(token: str, lead_id: str) -> Dict:
    """Get lead details"""
    try:
        response = requests.get(
            f'{API_BASE_URL}/api/leads/{lead_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        print(f'API Error: {e.response.json()}')
        raise
```

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully and provide user-friendly messages:

```typescript
try {
  const lead = await createLead(formData);
  showSuccessMessage('Lead criado com sucesso!');
} catch (error) {
  if (error.error?.code === 'RATE_LIMIT_EXCEEDED') {
    showErrorMessage('Você atingiu o limite de submissões. Tente novamente mais tarde.');
  } else if (error.error?.code === 'VALIDATION_ERROR') {
    showValidationErrors(error.error.details);
  } else {
    showErrorMessage('Ocorreu um erro. Tente novamente.');
  }
}
```

### 2. Input Validation

Validate inputs on the client-side before sending to the API:

```typescript
import { z } from 'zod';

const leadSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/).optional(),
  company: z.string().min(2).max(100).optional(),
  message: z.string().min(10).max(1000),
  source: z.string().max(50).optional()
});

// Validate before submitting
const validatedData = leadSchema.parse(formData);
```

### 3. Rate Limit Handling

Implement exponential backoff when rate limited:

```typescript
async function createLeadWithRetry(leadData: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await createLead(leadData);
    } catch (error) {
      if (error.error?.code === 'RATE_LIMIT_EXCEEDED' && i < maxRetries - 1) {
        const retryAfter = error.error.details?.retry_after || 3600;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      } else {
        throw error;
      }
    }
  }
}
```

### 4. Token Management

Refresh tokens before they expire:

```typescript
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getValidToken(): Promise<string> {
  const now = Date.now();
  
  if (cachedToken && tokenExpiry > now + 60000) {
    return cachedToken;
  }
  
  // Refresh token logic here
  const newToken = await refreshAuthToken();
  cachedToken = newToken;
  tokenExpiry = now + 3600000; // 1 hour
  
  return newToken;
}
```

---

## Support

For API support, please contact:

- **Email**: suporte@alquimista.ai
- **Documentation**: https://docs.alquimista.ai
- **Status Page**: https://status.alquimista.ai

---

## Changelog

### Version 1.0.0 (2024-01-15)

- Initial release
- Create Lead endpoint
- List Leads endpoint
- Get Lead Details endpoint
- JWT authentication
- Rate limiting
- Webhook integration with Fibonacci

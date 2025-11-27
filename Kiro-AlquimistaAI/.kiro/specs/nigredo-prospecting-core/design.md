# Design Document - Nigredo Prospecting Core

## Overview

O Nigredo Prospecting Core é um sistema de captura e qualificação de leads através de formulários públicos e landing pages. O sistema segue a arquitetura serverless AWS estabelecida no ecossistema AlquimistaAI, integrando-se perfeitamente com o Fibonacci (dashboard principal) através de webhooks e eventos.

### Key Design Principles

1. **Serverless-First**: Utilizar Lambda, API Gateway, S3/CloudFront para escalabilidade automática
2. **Security by Design**: Criptografia end-to-end, rate limiting, sanitização de inputs
3. **Observability**: Logging estruturado, métricas CloudWatch, tracing X-Ray
4. **Performance**: CDN edge caching, lazy loading, otimização de assets
5. **Consistency**: Seguir padrões estabelecidos no Fibonacci e Alquimista stacks

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CloudFront CDN                          │
│                    (Edge Caching + WAF)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    S3 Static Website                            │
│              (Next.js Build - Landing Pages)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼ (API Calls)
┌─────────────────────────────────────────────────────────────────┐
│                   API Gateway HTTP API                          │
│                  (CORS + Rate Limiting)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    ┌────────┐     ┌────────┐     ┌────────┐
    │ Create │     │  List  │     │  Get   │
    │  Lead  │     │ Leads  │     │  Lead  │
    │ Lambda │     │ Lambda │     │ Lambda │
    └────┬───┘     └────┬───┘     └────┬───┘
         │              │              │
         └──────────────┼──────────────┘
                        ▼
         ┌──────────────────────────────┐
         │   Aurora PostgreSQL          │
         │   Schema: nigredo            │
         │   - leads                    │
         │   - form_submissions         │
         │   - webhook_logs             │
         └──────────────────────────────┘
                        │
                        ▼ (Webhook)
         ┌──────────────────────────────┐
         │   Fibonacci System           │
         │   POST /public/nigredo-event │
         └──────────────────────────────┘
```

### Technology Stack

**Backend:**
- AWS Lambda (Node.js 20)
- API Gateway HTTP API
- Aurora PostgreSQL (schema `nigredo`)
- AWS Secrets Manager
- EventBridge (optional for async processing)

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TailwindCSS
- TypeScript

**Infrastructure:**
- AWS CDK (TypeScript)
- CloudFront + S3
- WAF (Web Application Firewall)
- CloudWatch (Logs, Metrics, Alarms)
- X-Ray (Distributed Tracing)

## Components and Interfaces

### 1. Backend API (Lambda Functions)

#### 1.1 Create Lead Lambda

**Purpose**: Receber e processar submissões de formulário de prospecção

**Handler**: `lambda/nigredo/create-lead.ts`

**Input**:
```typescript
interface CreateLeadRequest {
  name: string;           // Required, 2-100 chars
  email: string;          // Required, valid email format
  phone?: string;         // Optional, E.164 format
  company?: string;       // Optional, 2-100 chars
  message: string;        // Required, 10-1000 chars
  source?: string;        // Optional, tracking source
  utm_params?: {          // Optional, UTM tracking
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
}
```

**Output**:
```typescript
interface CreateLeadResponse {
  id: string;
  status: 'success' | 'error';
  message: string;
  lead?: {
    id: string;
    created_at: string;
  };
}
```

**Processing Flow**:
1. Validate input (schema validation)
2. Sanitize all text fields (XSS prevention)
3. Check rate limit (10 submissions/hour per IP)
4. Insert lead into database
5. Send webhook to Fibonacci
6. Return success response

**Error Handling**:
- 400: Validation errors
- 429: Rate limit exceeded
- 500: Internal server error
- 503: Database unavailable

#### 1.2 List Leads Lambda

**Purpose**: Listar leads com paginação e filtros (autenticado)

**Handler**: `lambda/nigredo/list-leads.ts`

**Input** (Query Parameters):
```typescript
interface ListLeadsQuery {
  page?: number;          // Default: 1
  limit?: number;         // Default: 20, Max: 100
  status?: string;        // Filter by status
  source?: string;        // Filter by source
  from_date?: string;     // ISO 8601 date
  to_date?: string;       // ISO 8601 date
  search?: string;        // Search in name, email, company
}
```

**Output**:
```typescript
interface ListLeadsResponse {
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

**Authorization**: Requires JWT token from Cognito

#### 1.3 Get Lead Lambda

**Purpose**: Obter detalhes de um lead específico (autenticado)

**Handler**: `lambda/nigredo/get-lead.ts`

**Input**: Lead ID in path parameter

**Output**:
```typescript
interface GetLeadResponse {
  lead: Lead;
  webhook_history: WebhookLog[];
}
```

**Authorization**: Requires JWT token from Cognito

#### 1.4 Webhook Sender Lambda

**Purpose**: Enviar eventos de novos leads para o Fibonacci

**Handler**: `lambda/nigredo/webhook-sender.ts`

**Trigger**: Invoked by Create Lead Lambda

**Webhook Payload**:
```typescript
interface NigredoWebhookPayload {
  event_type: 'lead.created';
  timestamp: string;
  lead: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message: string;
    source?: string;
    utm_params?: object;
  };
}
```

**Retry Logic**:
- Max retries: 3
- Backoff: Exponential (1s, 2s, 4s)
- Timeout: 5 seconds per attempt
- Log all attempts to `webhook_logs` table

### 2. Frontend (Next.js)

#### 2.1 Landing Page

**Route**: `/nigredo` or `/prospecting`

**Components**:
- Hero section with value proposition
- Lead capture form
- Social proof (testimonials, logos)
- FAQ section
- Footer with links

**Form Component**: `frontend/src/components/nigredo/lead-form.tsx`

```typescript
interface LeadFormProps {
  onSuccess?: (leadId: string) => void;
  onError?: (error: Error) => void;
  source?: string;
}
```

**Form Validation**:
- Client-side: React Hook Form + Zod schema
- Server-side: Lambda input validation
- Real-time feedback on errors

**UX Features**:
- Loading states during submission
- Success message with confirmation
- Error handling with retry option
- Accessibility (ARIA labels, keyboard navigation)

#### 2.2 Admin Dashboard (Optional)

**Route**: `/dashboard/leads`

**Features**:
- List all leads with filters
- View lead details
- Export to CSV
- Webhook status monitoring

**Authentication**: Protected by Cognito JWT

### 3. Infrastructure (CDK)

#### 3.1 Nigredo API Stack

**File**: `lib/nigredo-api-stack.ts`

**Resources**:
- API Gateway HTTP API
- Lambda Functions (Create, List, Get, Webhook)
- IAM Roles and Policies
- CloudWatch Log Groups
- CloudWatch Alarms
- X-Ray Tracing

**Configuration**:
```typescript
interface NigredoApiStackProps extends cdk.StackProps {
  envName: string;
  envConfig: any;
  vpc: ec2.Vpc;
  dbCluster: rds.DatabaseCluster;
  dbSecret: rds.DatabaseSecret;
  kmsKey: kms.Key;
  fibonacciWebhookUrl: string;
}
```

#### 3.2 Nigredo Frontend Stack

**File**: `lib/nigredo-frontend-stack.ts`

**Resources**:
- S3 Bucket (static hosting)
- CloudFront Distribution
- WAF Web ACL
- Origin Access Identity
- Cache Policies

**Build Process**:
1. Run `npm run build` in frontend directory
2. Upload build output to S3
3. Invalidate CloudFront cache

## Data Models

### Database Schema: `nigredo`

#### Table: `leads`

```sql
CREATE TABLE nigredo.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(100),
  message TEXT NOT NULL,
  source VARCHAR(50),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  status VARCHAR(20) DEFAULT 'new',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_leads_email ON nigredo.leads(email);
CREATE INDEX idx_leads_status ON nigredo.leads(status);
CREATE INDEX idx_leads_created_at ON nigredo.leads(created_at DESC);
CREATE INDEX idx_leads_source ON nigredo.leads(source);
```

#### Table: `form_submissions`

```sql
CREATE TABLE nigredo.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES nigredo.leads(id),
  ip_address INET NOT NULL,
  user_agent TEXT,
  referer TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_lead FOREIGN KEY (lead_id) REFERENCES nigredo.leads(id) ON DELETE CASCADE
);

CREATE INDEX idx_submissions_ip ON nigredo.form_submissions(ip_address, submitted_at);
CREATE INDEX idx_submissions_lead ON nigredo.form_submissions(lead_id);
```

#### Table: `webhook_logs`

```sql
CREATE TABLE nigredo.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES nigredo.leads(id),
  webhook_url TEXT NOT NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  attempt_number INTEGER DEFAULT 1,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_lead FOREIGN KEY (lead_id) REFERENCES nigredo.leads(id) ON DELETE CASCADE
);

CREATE INDEX idx_webhook_logs_lead ON nigredo.webhook_logs(lead_id);
CREATE INDEX idx_webhook_logs_success ON nigredo.webhook_logs(success, sent_at);
```

#### Table: `rate_limits`

```sql
CREATE TABLE nigredo.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  submission_count INTEGER DEFAULT 1,
  window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_ip_window UNIQUE (ip_address, window_start)
);

CREATE INDEX idx_rate_limits_ip ON nigredo.rate_limits(ip_address, window_start);
```

### Migration File

**File**: `database/migrations/007_create_nigredo_schema.sql`

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  request_id: string;
  timestamp: string;
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many submissions |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_ERROR` | 500 | Server error |
| `DATABASE_ERROR` | 503 | Database unavailable |
| `WEBHOOK_ERROR` | 500 | Webhook delivery failed |

### Retry Strategy

**Client-Side**:
- Retry on 5xx errors
- Max retries: 2
- Backoff: 1s, 2s

**Server-Side (Webhook)**:
- Retry on 5xx errors and timeouts
- Max retries: 3
- Backoff: Exponential (1s, 2s, 4s)
- Log all attempts

## Testing Strategy

### Unit Tests

**Coverage Target**: 80%

**Test Files**:
- `lambda/nigredo/__tests__/create-lead.test.ts`
- `lambda/nigredo/__tests__/list-leads.test.ts`
- `lambda/nigredo/__tests__/get-lead.test.ts`
- `lambda/nigredo/__tests__/webhook-sender.test.ts`
- `lambda/nigredo/__tests__/validators.test.ts`

**Test Cases**:
- Input validation (valid/invalid)
- Rate limiting logic
- Webhook retry logic
- Error handling
- Database queries

### Integration Tests

**Test Files**:
- `lambda/nigredo/__tests__/integration/api.test.ts`
- `lambda/nigredo/__tests__/integration/webhook.test.ts`

**Test Cases**:
- End-to-end form submission
- Webhook delivery to Fibonacci
- Database transactions
- Authentication flow

### E2E Tests (Optional)

**Tool**: Playwright or Cypress

**Test Cases**:
- User fills and submits form
- Success message displayed
- Lead appears in admin dashboard
- Webhook received by Fibonacci

## Security Considerations

### Input Validation

- **Schema Validation**: Zod schemas for all inputs
- **Sanitization**: DOMPurify for text fields
- **SQL Injection**: Parameterized queries only
- **XSS Prevention**: Content Security Policy headers

### Rate Limiting

- **Implementation**: IP-based tracking in database
- **Limits**: 10 submissions per hour per IP
- **Bypass**: Authenticated users exempt
- **Cleanup**: Cron job to delete old rate limit records

### Authentication

- **Public Endpoints**: `/api/leads` (POST only)
- **Protected Endpoints**: `/api/leads` (GET), `/api/leads/{id}` (GET)
- **Method**: Cognito JWT tokens
- **Validation**: API Gateway Cognito Authorizer

### Data Protection

- **Encryption at Rest**: KMS for Aurora, S3
- **Encryption in Transit**: TLS 1.2+
- **PII Handling**: LGPD compliance (data retention, deletion)
- **Secrets**: AWS Secrets Manager for credentials

### WAF Rules

- **Rate Limiting**: 2000 requests per 5 minutes per IP
- **SQL Injection**: AWS Managed Rules
- **XSS Protection**: AWS Managed Rules
- **Bot Protection**: AWS Bot Control

## Performance Optimization

### Frontend

- **Static Generation**: Next.js SSG for landing pages
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Dynamic imports for heavy components
- **CDN Caching**: CloudFront edge locations
- **Compression**: Gzip/Brotli for assets

### Backend

- **Cold Start**: Provisioned concurrency for critical Lambdas
- **Connection Pooling**: Reuse database connections
- **Caching**: CloudFront for API responses (GET only)
- **Async Processing**: EventBridge for non-critical tasks

### Database

- **Indexes**: On frequently queried columns
- **Query Optimization**: EXPLAIN ANALYZE for slow queries
- **Connection Limits**: Max 10 connections per Lambda
- **Read Replicas**: For reporting queries (future)

## Monitoring and Observability

### CloudWatch Metrics

**Custom Metrics**:
- `NigredoLeadSubmissions` (Count)
- `NigredoWebhookSuccess` (Count)
- `NigredoWebhookFailure` (Count)
- `NigredoRateLimitHits` (Count)
- `NigredoApiLatency` (Milliseconds)

### CloudWatch Alarms

**Critical Alarms**:
- API error rate > 5%
- API latency > 1000ms (p99)
- Webhook failure rate > 10%
- Lambda errors > 10/minute

**Warning Alarms**:
- API latency > 500ms (p95)
- Database connection errors
- Rate limit hits > 100/hour

### CloudWatch Dashboard

**Widgets**:
- Lead submissions over time (line chart)
- Webhook success rate (gauge)
- API latency percentiles (line chart)
- Error rate by endpoint (bar chart)
- Top sources (pie chart)

### X-Ray Tracing

**Instrumentation**:
- All Lambda functions
- Database queries
- HTTP requests (webhook)
- Custom segments for business logic

### Structured Logging

**Log Format**:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "service": "nigredo-api",
  "function": "create-lead",
  "request_id": "abc-123",
  "correlation_id": "xyz-789",
  "message": "Lead created successfully",
  "lead_id": "uuid",
  "duration_ms": 150
}
```

## Deployment Strategy

### CI/CD Pipeline

**Stages**:
1. **Build**: Compile TypeScript, run tests
2. **Package**: CDK synth, bundle Lambda code
3. **Deploy Backend**: CDK deploy API stack
4. **Deploy Frontend**: Build Next.js, upload to S3
5. **Smoke Tests**: Health check endpoints
6. **Invalidate Cache**: CloudFront invalidation

### Environment Strategy

**Environments**:
- `dev`: Development testing
- `staging`: Pre-production validation
- `prod`: Production

**Configuration**:
- Environment variables in CDK context
- Secrets in AWS Secrets Manager
- Feature flags for gradual rollout

### Rollback Plan

**Automated Rollback**:
- CloudWatch alarm triggers rollback
- Revert to previous CDK stack version
- Restore S3 bucket to previous version

**Manual Rollback**:
- Run `cdk deploy --rollback` command
- Restore database from backup (if needed)

## Integration with Fibonacci

### Webhook Endpoint

**Fibonacci Endpoint**: `POST /public/nigredo-event`

**Authentication**: None (public endpoint with signature verification)

**Payload**:
```json
{
  "event_type": "lead.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "signature": "hmac-sha256-signature",
  "lead": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+5511999999999",
    "company": "Acme Inc",
    "message": "Interested in your services",
    "source": "website",
    "utm_params": {
      "utm_source": "google",
      "utm_medium": "cpc",
      "utm_campaign": "brand"
    }
  }
}
```

### Event Flow

1. User submits form on Nigredo landing page
2. Create Lead Lambda validates and stores lead
3. Webhook Sender Lambda sends event to Fibonacci
4. Fibonacci processes event and creates lead record
5. Fibonacci triggers Nigredo agents (recebimento, estrategia, etc.)

### Error Handling

- **Fibonacci Down**: Retry with exponential backoff
- **Fibonacci Rejects**: Log error, alert ops team
- **Network Timeout**: Retry up to 3 times
- **All Retries Failed**: Store in DLQ for manual processing

## Future Enhancements

### Phase 2 Features

1. **Multi-Form Support**: Different forms for different campaigns
2. **A/B Testing**: Test different form layouts and copy
3. **Lead Scoring**: Automatic scoring based on form data
4. **Email Notifications**: Send confirmation emails to leads
5. **CRM Integration**: Sync leads to external CRMs (Salesforce, HubSpot)

### Phase 3 Features

1. **Chatbot Integration**: AI-powered chat on landing page
2. **Progressive Profiling**: Multi-step forms with conditional logic
3. **Lead Nurturing**: Automated email sequences
4. **Analytics Dashboard**: Advanced reporting and insights
5. **Mobile App**: Native mobile app for lead capture

## Appendix

### API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/leads` | No | Create new lead |
| GET | `/api/leads` | Yes | List leads with pagination |
| GET | `/api/leads/{id}` | Yes | Get lead details |
| GET | `/health` | No | Health check |

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_SECRET_ARN` | Aurora credentials secret ARN | `arn:aws:secretsmanager:...` |
| `FIBONACCI_WEBHOOK_URL` | Fibonacci webhook endpoint | `https://api.fibonacci.com/public/nigredo-event` |
| `RATE_LIMIT_WINDOW` | Rate limit window in seconds | `3600` |
| `RATE_LIMIT_MAX` | Max submissions per window | `10` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `POWERTOOLS_SERVICE_NAME` | Service name for logs | `nigredo-api` |

### Dependencies

**Backend**:
- `@aws-sdk/client-secrets-manager`
- `@aws-sdk/client-eventbridge`
- `pg` (PostgreSQL client)
- `zod` (Schema validation)
- `@aws-lambda-powertools/logger`
- `@aws-lambda-powertools/tracer`

**Frontend**:
- `next` (14.x)
- `react` (18.x)
- `react-hook-form`
- `zod`
- `tailwindcss`
- `@headlessui/react`

**Infrastructure**:
- `aws-cdk-lib` (2.x)
- `constructs`

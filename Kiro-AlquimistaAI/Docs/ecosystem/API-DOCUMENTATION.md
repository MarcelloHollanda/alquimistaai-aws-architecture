# 🔌 API Documentation - AlquimistaAI

## 📡 Visão Geral da API

**Base URL**: `https://api.alquimista.ai/v1`  
**Autenticação**: Bearer Token (JWT)  
**Formato**: JSON  
**Rate Limit**: 1000 req/hora (ajustável por plano)

---

## 🔐 Autenticação

### Obter Token
```http
POST /auth/token
Content-Type: application/json

{
  "apiKey": "your-api-key",
  "apiSecret": "your-api-secret"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "refreshToken": "refresh-token-here"
}
```

---

## 🤖 Endpoints por Subnúcleo

### NIGREDO - Prospecção

#### 1. Processar Leads
```http
POST /nigredo/leads/process
Authorization: Bearer {token}
Content-Type: application/json

{
  "source": "planilha",
  "leads": [
    {
      "empresa": "Empresa X",
      "contato": "João Silva",
      "email": "joao@empresax.com",
      "telefone": "+5511999999999",
      "cnpj": "12345678000190"
    }
  ],
  "options": {
    "enrich": true,
    "segment": true,
    "prioritize": true
  }
}
```

**Response**:
```json
{
  "batchId": "batch-123",
  "status": "processing",
  "totalLeads": 1,
  "estimatedTime": "2 minutos"
}
```

#### 2. Criar Campanha
```http
POST /nigredo/campaigns
Authorization: Bearer {token}

{
  "name": "Campanha Q1 2024",
  "segment": "tecnologia",
  "messages": {
    "topo": "Mensagem inicial...",
    "meio": "Follow-up...",
    "fundo": "Proposta..."
  },
  "channels": ["whatsapp", "email"],
  "schedule": {
    "startDate": "2024-01-15",
    "frequency": "daily"
  }
}
```

#### 3. Agendar Reunião
```http
POST /nigredo/meetings/schedule
Authorization: Bearer {token}

{
  "leadId": "lead-456",
  "preferredDates": ["2024-01-20", "2024-01-21"],
  "duration": 60,
  "attendees": ["vendedor@empresa.com"]
}
```

---

### HERMES - Marketing Digital

#### 1. Gerar Conteúdo
```http
POST /hermes/content/generate
Authorization: Bearer {token}

{
  "type": "blog",
  "topic": "Tendências de IA em 2024",
  "keywords": ["inteligência artificial", "automação"],
  "tone": "professional",
  "length": 1500
}
```

**Response**:
```json
{
  "contentId": "content-789",
  "status": "completed",
  "content": "# Tendências de IA em 2024\n\n...",
  "wordCount": 1523,
  "seoScore": 92,
  "readabilityScore": 85
}
```

#### 2. Publicar em Redes Sociais
```http
POST /hermes/social/publish
Authorization: Bearer {token}

{
  "platforms": ["instagram", "linkedin"],
  "content": {
    "text": "Novidade incrível chegando! 🚀",
    "imageUrl": "https://...",
    "hashtags": ["#inovacao", "#tecnologia"]
  },
  "schedule": "2024-01-20T10:00:00Z"
}
```

#### 3. Criar Landing Page
```http
POST /hermes/landing-pages
Authorization: Bearer {token}

{
  "template": "lead-generation",
  "content": {
    "headline": "Transforme Seu Negócio",
    "cta": "Começar Agora"
  },
  "domain": "pages.empresa.com",
  "slug": "oferta-especial"
}
```

#### 4. Criar Campanha de Ads
```http
POST /hermes/ads/campaigns
Authorization: Bearer {token}

{
  "platforms": ["google", "meta"],
  "budget": 5000,
  "objective": "conversions",
  "targeting": {
    "locations": ["BR"],
    "age": "25-54",
    "interests": ["tecnologia"]
  }
}
```

---

### SOPHIA - Atendimento

#### 1. Criar Ticket
```http
POST /sophia/tickets
Authorization: Bearer {token}

{
  "customerId": "cust-123",
  "channel": "whatsapp",
  "subject": "Problema com acesso",
  "message": "Não consigo fazer login",
  "priority": "high"
}
```

**Response**:
```json
{
  "ticketId": "ticket-456",
  "status": "open",
  "assignedTo": "auto",
  "estimatedResolution": "15 minutos",
  "suggestedSolutions": [
    {
      "title": "Resetar senha",
      "url": "https://docs.empresa.com/reset-password"
    }
  ]
}
```

#### 2. Enviar Pesquisa NPS
```http
POST /sophia/surveys/nps
Authorization: Bearer {token}

{
  "customerId": "cust-123",
  "channel": "email",
  "trigger": "post-purchase",
  "delay": 7
}
```

#### 3. Análise de Churn
```http
GET /sophia/churn/predict?customerId=cust-123
Authorization: Bearer {token}
```

**Response**:
```json
{
  "customerId": "cust-123",
  "churnProbability": 0.72,
  "risk": "high",
  "factors": [
    "Baixo uso nos últimos 30 dias",
    "Tickets de suporte não resolvidos",
    "Não abriu últimos 3 emails"
  ],
  "recommendations": [
    "Oferecer desconto de retenção",
    "Agendar call com CSM",
    "Enviar pesquisa de satisfação"
  ]
}
```

---

### ATLAS - Operações

#### 1. Processar Documento
```http
POST /atlas/documents/process
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [arquivo PDF/imagem]
type: "invoice"
```

**Response**:
```json
{
  "documentId": "doc-789",
  "type": "invoice",
  "extractedData": {
    "invoiceNumber": "INV-2024-001",
    "date": "2024-01-15",
    "amount": 1500.00,
    "vendor": "Fornecedor X"
  },
  "confidence": 0.95
}
```

#### 2. Analisar Contrato
```http
POST /atlas/contracts/analyze
Authorization: Bearer {token}

{
  "documentUrl": "https://...",
  "type": "service_agreement"
}
```

**Response**:
```json
{
  "contractId": "contract-123",
  "risks": [
    {
      "level": "medium",
      "clause": "Cláusula 5.2",
      "description": "Renovação automática sem aviso prévio",
      "recommendation": "Adicionar cláusula de notificação 60 dias antes"
    }
  ],
  "keyTerms": {
    "duration": "12 meses",
    "renewalDate": "2025-01-15",
    "terminationNotice": "30 dias"
  }
}
```

#### 3. Previsão Financeira
```http
GET /atlas/financial/forecast?months=6
Authorization: Bearer {token}
```

**Response**:
```json
{
  "forecast": [
    {
      "month": "2024-02",
      "revenue": 125000,
      "expenses": 85000,
      "cashFlow": 40000,
      "confidence": 0.88
    }
  ]
}
```

---

### ORACLE - Inteligência

#### 1. Análise de Dados
```http
POST /oracle/analytics/query
Authorization: Bearer {token}

{
  "metric": "conversion_rate",
  "dimensions": ["channel", "campaign"],
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "filters": {
    "channel": ["email", "social"]
  }
}
```

**Response**:
```json
{
  "results": [
    {
      "channel": "email",
      "campaign": "Q1 Launch",
      "conversionRate": 0.045,
      "trend": "up",
      "change": "+15%"
    }
  ],
  "insights": [
    "Email campaigns performing 20% better than social",
    "Best performing time: Tuesday 10am"
  ]
}
```

#### 2. Previsão de Vendas
```http
POST /oracle/forecast/sales
Authorization: Bearer {token}

{
  "horizon": 90,
  "confidence": 0.95,
  "includeSeasonality": true
}
```

**Response**:
```json
{
  "forecast": [
    {
      "date": "2024-02-01",
      "predicted": 45000,
      "lower": 38000,
      "upper": 52000
    }
  ],
  "accuracy": 0.92,
  "factors": [
    "Historical trend",
    "Seasonality",
    "Marketing campaigns"
  ]
}
```

#### 3. Análise Competitiva
```http
GET /oracle/competition/monitor?competitor=competitor-x
Authorization: Bearer {token}
```

**Response**:
```json
{
  "competitor": "Competitor X",
  "changes": [
    {
      "type": "pricing",
      "date": "2024-01-10",
      "description": "Redução de 15% no plano Pro",
      "impact": "medium"
    }
  ],
  "recommendations": [
    "Considerar ajuste de preços",
    "Destacar diferenciais de features"
  ]
}
```

---

## 🔔 Webhooks

### Configurar Webhook
```http
POST /webhooks
Authorization: Bearer {token}

{
  "url": "https://seu-sistema.com/webhook",
  "events": [
    "lead.processed",
    "campaign.completed",
    "ticket.created"
  ],
  "secret": "webhook-secret-key"
}
```

### Eventos Disponíveis

#### Nigredo
- `lead.received`
- `lead.processed`
- `lead.enriched`
- `campaign.created`
- `campaign.completed`
- `message.sent`
- `message.replied`
- `meeting.scheduled`
- `meeting.confirmed`

#### Hermes
- `content.generated`
- `post.published`
- `email.sent`
- `email.opened`
- `landing_page.created`
- `ad.campaign_started`

#### Sophia
- `ticket.created`
- `ticket.resolved`
- `survey.completed`
- `churn.predicted`

#### Atlas
- `document.processed`
- `contract.analyzed`
- `payment.received`

#### Oracle
- `forecast.generated`
- `anomaly.detected`
- `insight.discovered`

---

## 📊 Rate Limits

### Por Plano

| Plano | Requests/Hora | Requests/Dia | Burst |
|-------|---------------|--------------|-------|
| Starter | 100 | 1.000 | 10/min |
| Professional | 1.000 | 10.000 | 50/min |
| Business | 5.000 | 50.000 | 200/min |
| Enterprise | 20.000 | 200.000 | 1000/min |

### Headers de Rate Limit
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1642521600
```

---

## 🔧 SDKs Oficiais

### JavaScript/TypeScript
```bash
npm install @alquimista/sdk
```

```typescript
import { AlquimistaClient } from '@alquimista/sdk';

const client = new AlquimistaClient({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret'
});

// Processar leads
const result = await client.nigredo.leads.process({
  leads: [/* ... */],
  options: { enrich: true }
});

// Gerar conteúdo
const content = await client.hermes.content.generate({
  type: 'blog',
  topic: 'IA em 2024'
});
```

### Python
```bash
pip install alquimista-sdk
```

```python
from alquimista import AlquimistaClient

client = AlquimistaClient(
    api_key='your-api-key',
    api_secret='your-api-secret'
)

# Processar leads
result = client.nigredo.leads.process(
    leads=[...],
    options={'enrich': True}
)

# Criar ticket
ticket = client.sophia.tickets.create(
    customer_id='cust-123',
    subject='Problema com acesso'
)
```

---

## 🐛 Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Bad Request - Parâmetros inválidos |
| 401 | Unauthorized - Token inválido ou expirado |
| 403 | Forbidden - Sem permissão para o recurso |
| 404 | Not Found - Recurso não encontrado |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Erro no servidor |
| 503 | Service Unavailable - Serviço temporariamente indisponível |

### Formato de Erro
```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "O campo 'email' é obrigatório",
    "field": "email",
    "documentation": "https://docs.alquimista.ai/errors/invalid-parameter"
  }
}
```

---

## 📚 Recursos Adicionais

- **Documentação Completa**: https://docs.alquimista.ai
- **API Reference**: https://api.alquimista.ai/docs
- **Status Page**: https://status.alquimista.ai
- **Changelog**: https://changelog.alquimista.ai
- **Suporte**: suporte@alquimista.ai

---

*API Documentation v1.0 - Janeiro 2024*
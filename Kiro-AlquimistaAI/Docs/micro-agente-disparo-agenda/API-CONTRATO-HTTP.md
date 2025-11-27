# Contrato HTTP - API do Micro Agente Disparo & Agendamento

**Versão**: 1.0.0  
**Data**: 24 de Novembro de 2025  
**Protocolo**: HTTP/1.1  
**Formato**: JSON

---

## 📋 Visão Geral

Este documento define o contrato completo da API HTTP do Micro Agente de Disparo & Agendamento, incluindo:
- Estrutura de requisições e respostas
- Validações de entrada
- Códigos de status HTTP
- Regras de autenticação/autorização
- Exemplos de uso

---

## 🔐 Autenticação e Autorização

### Ambiente DEV
- **Autenticação**: Não requerida (para facilitar desenvolvimento)
- **CORS**: Habilitado para todos os origins (`*`)

### Ambiente PROD (Planejado)
- **Autenticação**: JWT via Amazon Cognito
- **Header**: `Authorization: Bearer <token>`
- **CORS**: Restrito aos domínios da aplicação
- **Rate Limiting**: 100 req/min por IP

---

## 📡 Endpoints

### 1. GET /disparo/overview

**Descrição**: Retorna contadores agregados do sistema.

**Autenticação**: Não requerida (DEV) | JWT (PROD)

**Request Headers**:
```http
Content-Type: application/json
Authorization: Bearer <token> (PROD apenas)
```

**Request Body**: Nenhum

**Response** (200 OK):
```json
{
  "contactsInQueue": 0,
  "messagesSentToday": 0,
  "meetingsScheduled": 0,
  "meetingsConfirmed": 0
}
```

**Response Schema**:
```typescript
interface OverviewResponse {
  contactsInQueue: number;      // Contatos aguardando processamento
  messagesSentToday: number;    // Mensagens enviadas hoje (00:00-23:59 UTC)
  meetingsScheduled: number;    // Total de reuniões agendadas (futuras)
  meetingsConfirmed: number;    // Reuniões confirmadas (status=confirmed)
}
```

**Erros Possíveis**:
- `401 Unauthorized`: Token inválido ou expirado (PROD)
- `500 Internal Server Error`: Erro ao consultar banco de dados

---

### 2. GET /disparo/campaigns

**Descrição**: Lista campanhas de disparo ativas e recentes.

**Autenticação**: Não requerida (DEV) | JWT (PROD)

**Request Headers**:
```http
Content-Type: application/json
Authorization: Bearer <token> (PROD apenas)
```

**Query Parameters** (Opcional):
- `status` (string): Filtrar por status (`pending`, `active`, `paused`, `completed`)
- `channel` (string): Filtrar por canal (`whatsapp`, `email`, `sms`)
- `limit` (number): Limite de resultados (padrão: 50, máximo: 100)

**Request Body**: Nenhum

**Response** (200 OK):
```json
[
  {
    "id": "camp-123",
    "name": "Campanha Q4 2025",
    "status": "active",
    "channel": "whatsapp",
    "messagesSent": 150,
    "messagesTotal": 500,
    "nextRun": "2025-11-25T10:00:00Z"
  }
]
```

**Response Schema**:
```typescript
interface Campaign {
  id: string;                   // ID único da campanha
  name: string;                 // Nome da campanha
  status: 'pending' | 'active' | 'paused' | 'completed';
  channel: 'whatsapp' | 'email' | 'sms';
  messagesSent: number;         // Mensagens já enviadas
  messagesTotal: number;        // Total de mensagens planejadas
  nextRun?: string;             // Próxima execução (ISO 8601)
}

type CampaignsResponse = Campaign[];
```

**Erros Possíveis**:
- `400 Bad Request`: Query parameter inválido
- `401 Unauthorized`: Token inválido ou expirado (PROD)
- `500 Internal Server Error`: Erro ao consultar banco de dados

---

### 3. POST /disparo/contacts/ingest

**Descrição**: Envia lote de contatos para ingestão e processamento assíncrono.

**Autenticação**: Não requerida (DEV) | JWT (PROD)

**Request Headers**:
```http
Content-Type: application/json
Authorization: Bearer <token> (PROD apenas)
```

**Request Body**:
```json
{
  "contacts": [
    {
      "company": "Empresa XYZ Ltda",
      "contactName": "João Silva",
      "phone": "+5584997084444",
      "email": "joao@empresa.com",
      "notes": "Lead quente - interessado em demo"
    }
  ]
}
```

**Request Schema**:
```typescript
interface ContactIngestRequest {
  contacts: Contact[];
}

interface Contact {
  company: string;              // Nome da empresa (obrigatório)
  contactName: string;          // Nome do contato (obrigatório)
  phone: string;                // Telefone em formato internacional (obrigatório)
  email: string;                // Email válido (obrigatório)
  notes?: string;               // Observações (opcional)
}
```

**Validações**:
1. `contacts` deve ser um array não vazio
2. Cada contato deve ter: `company`, `contactName`, `phone`, `email`
3. `phone` deve estar em formato internacional (ex: `+5584997084444`)
4. `email` deve ser um email válido (regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`)
5. `company` e `contactName` devem ter entre 2 e 255 caracteres
6. `notes` (se presente) deve ter no máximo 1000 caracteres
7. Máximo de 100 contatos por requisição

**Response** (202 Accepted):
```json
{
  "success": true,
  "message": "1 contatos enviados para processamento"
}
```

**Response Schema**:
```typescript
interface ContactIngestResponse {
  success: boolean;
  message: string;
}
```

**Erros Possíveis**:
- `400 Bad Request`: Payload inválido ou validação falhou
  ```json
  {
    "error": "Invalid contact",
    "message": "Each contact must have: company, contactName, phone, email"
  }
  ```
- `401 Unauthorized`: Token inválido ou expirado (PROD)
- `413 Payload Too Large`: Mais de 100 contatos em uma requisição
- `500 Internal Server Error`: Falha ao processar contatos

---

### 4. GET /agendamento/meetings

**Descrição**: Lista reuniões agendadas.

**Autenticação**: Não requerida (DEV) | JWT (PROD)

**Request Headers**:
```http
Content-Type: application/json
Authorization: Bearer <token> (PROD apenas)
```

**Query Parameters** (Opcional):
- `status` (string): Filtrar por status (`proposed`, `confirmed`, `cancelled`, `completed`, `no_show`)
- `from` (string): Data inicial (ISO 8601, ex: `2025-11-24T00:00:00Z`)
- `to` (string): Data final (ISO 8601)
- `limit` (number): Limite de resultados (padrão: 50, máximo: 100)

**Request Body**: Nenhum

**Response** (200 OK):
```json
[
  {
    "id": "meet-456",
    "leadName": "João Silva",
    "leadCompany": "Empresa XYZ Ltda",
    "scheduledAt": "2025-11-26T14:00:00Z",
    "duration": 60,
    "meetingType": "demo",
    "status": "confirmed",
    "meetingLink": "https://meet.google.com/abc-defg-hij"
  }
]
```

**Response Schema**:
```typescript
interface Meeting {
  id: string;                   // ID único da reunião
  leadName: string;             // Nome do lead
  leadCompany: string;          // Empresa do lead
  scheduledAt: string;          // Data/hora agendada (ISO 8601)
  duration: number;             // Duração em minutos
  meetingType: 'demo' | 'discovery' | 'negotiation' | 'closing';
  status: 'proposed' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  meetingLink?: string;         // Link da reunião (Google Meet, etc.)
}

type MeetingsResponse = Meeting[];
```

**Erros Possíveis**:
- `400 Bad Request`: Query parameter inválido
- `401 Unauthorized`: Token inválido ou expirado (PROD)
- `500 Internal Server Error`: Erro ao consultar banco de dados

---

## 🚨 Códigos de Status HTTP

| Código | Nome | Quando Usar |
|--------|------|-------------|
| **2xx - Sucesso** |
| 200 | OK | Requisição GET bem-sucedida |
| 202 | Accepted | Requisição POST aceita para processamento assíncrono |
| **4xx - Erro do Cliente** |
| 400 | Bad Request | Payload inválido, validação falhou, query params inválidos |
| 401 | Unauthorized | Token JWT inválido ou expirado (PROD) |
| 403 | Forbidden | Usuário não tem permissão para acessar recurso (PROD) |
| 404 | Not Found | Rota não encontrada |
| 413 | Payload Too Large | Payload excede limite permitido |
| 429 | Too Many Requests | Rate limit excedido (PROD) |
| **5xx - Erro do Servidor** |
| 500 | Internal Server Error | Erro interno do servidor |
| 502 | Bad Gateway | Erro ao comunicar com serviços downstream |
| 503 | Service Unavailable | Serviço temporariamente indisponível |

---

## 📝 Formato de Erros

Todos os erros seguem o formato padrão:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

**Exemplo**:
```json
{
  "error": "Invalid contact",
  "message": "Each contact must have: company, contactName, phone, email"
}
```

---

## 🔄 Idempotência

### POST /disparo/contacts/ingest
- **Idempotente**: Não (cada requisição cria novos contatos)
- **Recomendação**: Implementar `Idempotency-Key` header em versões futuras

---

## 📊 Rate Limiting (PROD)

| Endpoint | Limite | Janela |
|----------|--------|--------|
| GET /disparo/overview | 100 req | 1 minuto |
| GET /disparo/campaigns | 100 req | 1 minuto |
| POST /disparo/contacts/ingest | 10 req | 1 minuto |
| GET /agendamento/meetings | 100 req | 1 minuto |

**Headers de Rate Limit** (PROD):
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1732464000
```

---

## 🧪 Exemplos de Uso

### Exemplo 1: Buscar Overview

**Request**:
```http
GET /disparo/overview HTTP/1.1
Host: abc123.execute-api.us-east-1.amazonaws.com
Content-Type: application/json
```

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "contactsInQueue": 42,
  "messagesSentToday": 150,
  "meetingsScheduled": 8,
  "meetingsConfirmed": 5
}
```

### Exemplo 2: Enviar Contatos

**Request**:
```http
POST /disparo/contacts/ingest HTTP/1.1
Host: abc123.execute-api.us-east-1.amazonaws.com
Content-Type: application/json

{
  "contacts": [
    {
      "company": "Tech Solutions Ltda",
      "contactName": "Maria Santos",
      "phone": "+5511987654321",
      "email": "maria@techsolutions.com",
      "notes": "Interessada em plano enterprise"
    },
    {
      "company": "Inovação Digital",
      "contactName": "Pedro Oliveira",
      "phone": "+5521976543210",
      "email": "pedro@inovacao.com"
    }
  ]
}
```

**Response**:
```http
HTTP/1.1 202 Accepted
Content-Type: application/json

{
  "success": true,
  "message": "2 contatos enviados para processamento"
}
```

### Exemplo 3: Listar Reuniões Confirmadas

**Request**:
```http
GET /agendamento/meetings?status=confirmed&limit=10 HTTP/1.1
Host: abc123.execute-api.us-east-1.amazonaws.com
Content-Type: application/json
```

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": "meet-789",
    "leadName": "Carlos Mendes",
    "leadCompany": "Startup XYZ",
    "scheduledAt": "2025-11-27T15:00:00Z",
    "duration": 60,
    "meetingType": "demo",
    "status": "confirmed",
    "meetingLink": "https://meet.google.com/xyz-abcd-efgh"
  }
]
```

---

## 📚 Referências

- **Blueprint**: `.kiro/steering/blueprint-disparo-agendamento.md`
- **Requirements**: `.kiro/specs/micro-agente-disparo-agendamento/requirements.md`
- **Design**: `.kiro/specs/micro-agente-disparo-agendamento/design.md`
- **API Gateway**: `terraform/modules/agente_disparo_agenda/api_gateway.tf`
- **Lambda Handler**: `lambda-src/agente-disparo-agenda/src/handlers/api-handler.ts`

---

**Última Atualização**: 2025-11-24  
**Mantido por**: Equipe AlquimistaAI


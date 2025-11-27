# Design · Micro Agente de Disparos & Agendamentos

## Versão: v0.1

## 1. Arquitetura Geral

### 1.1. Stack Tecnológico

- **Backend**: AWS Lambda (Node.js 20) + API Gateway HTTP
- **Database**: Aurora Serverless v2 (PostgreSQL)
- **Storage**: S3 (planilhas importadas)
- **Scheduler**: EventBridge Scheduler
- **Integrações**: MCP Servers (WhatsApp, Email, Calendar)
- **Observabilidade**: CloudWatch Logs + X-Ray + Métricas customizadas

### 1.2. Princípios de Design

- **Event-Driven**: Comunicação via EventBridge
- **Serverless**: Escalabilidade automática
- **Multi-tenant**: Isolamento por `tenant_id`
- **Idempotência**: Evita duplicatas em envios
- **Retry Logic**: Backoff exponencial em falhas

---

## 2. Modelo de Dados

### 2.1. Schema PostgreSQL

#### Tabela: `leads`

```sql
CREATE TABLE leads (
  lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Rastreabilidade
  lead_id_externo VARCHAR(255) NOT NULL UNIQUE,
  origem_arquivo VARCHAR(255) NOT NULL,
  origem_aba VARCHAR(100) NOT NULL,
  linha_planilha INTEGER NOT NULL,
  
  -- Dados do lead
  nome VARCHAR(500) NOT NULL,
  contato_nome VARCHAR(255),
  documento VARCHAR(20),
  
  -- Dados brutos da planilha
  email_raw TEXT,
  telefone_raw TEXT,
  
  -- Estado
  status VARCHAR(50) DEFAULT 'novo',
  tags JSONB DEFAULT '[]',
  
  -- Timestamps
  data_ingestao TIMESTAMP DEFAULT NOW(),
  data_ultimo_evento TIMESTAMP DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT uk_tenant_lead_externo UNIQUE(tenant_id, lead_id_externo)
);

CREATE INDEX idx_leads_tenant_status ON leads(tenant_id, status);
CREATE INDEX idx_leads_origem ON leads(origem_arquivo, linha_planilha);
CREATE INDEX idx_leads_documento ON leads(documento) WHERE documento IS NOT NULL;
```

#### Tabela: `lead_telefones`

```sql
CREATE TABLE lead_telefones (
  telefone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  
  telefone VARCHAR(20) NOT NULL,
  telefone_principal BOOLEAN DEFAULT FALSE,
  tipo_origem VARCHAR(50) DEFAULT 'nao_classificado',
  valido_para_disparo BOOLEAN DEFAULT TRUE,
  
  data_criacao TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT uk_lead_telefone UNIQUE(lead_id, telefone)
);

CREATE INDEX idx_telefones_lead ON lead_telefones(lead_id);
CREATE INDEX idx_telefones_validos ON lead_telefones(valido_para_disparo) WHERE valido_para_disparo = TRUE;
```

#### Tabela: `lead_emails`

```sql
CREATE TABLE lead_emails (
  email_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  
  email VARCHAR(255) NOT NULL,
  email_principal BOOLEAN DEFAULT FALSE,
  valido_para_disparo BOOLEAN DEFAULT TRUE,
  
  data_criacao TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT uk_lead_email UNIQUE(lead_id, email)
);

CREATE INDEX idx_emails_lead ON lead_emails(lead_id);
CREATE INDEX idx_emails_validos ON lead_emails(valido_para_disparo) WHERE valido_para_disparo = TRUE;
```

#### Tabela: `disparos`

```sql
CREATE TABLE disparos (
  disparo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID NOT NULL REFERENCES leads(lead_id),
  
  canal VARCHAR(20) NOT NULL, -- 'whatsapp' | 'email'
  destino VARCHAR(255) NOT NULL,
  template VARCHAR(100) NOT NULL,
  payload JSONB,
  
  status VARCHAR(50) DEFAULT 'pendente', -- 'pendente' | 'enviado' | 'erro' | 'confirmado'
  mensagem_erro TEXT,
  
  data_agendado TIMESTAMP NOT NULL,
  data_envio TIMESTAMP,
  data_retorno TIMESTAMP,
  
  tentativas INTEGER DEFAULT 0,
  max_tentativas INTEGER DEFAULT 3,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_disparos_lead ON disparos(lead_id);
CREATE INDEX idx_disparos_status ON disparos(tenant_id, status, data_agendado);
CREATE INDEX idx_disparos_canal ON disparos(canal, status);
```

#### Tabela: `agendamentos`

```sql
CREATE TABLE agendamentos (
  agendamento_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID NOT NULL REFERENCES leads(lead_id),
  
  tipo VARCHAR(50) NOT NULL, -- 'callback' | 'reuniao'
  canal VARCHAR(50) NOT NULL, -- 'telefone' | 'whatsapp' | 'video'
  
  data_agendada TIMESTAMP NOT NULL,
  data_criacao TIMESTAMP DEFAULT NOW(),
  
  status VARCHAR(50) DEFAULT 'pendente', -- 'pendente' | 'realizado' | 'cancelado'
  observacoes TEXT,
  
  realizado_em TIMESTAMP,
  cancelado_em TIMESTAMP,
  motivo_cancelamento TEXT
);

CREATE INDEX idx_agendamentos_lead ON agendamentos(lead_id);
CREATE INDEX idx_agendamentos_data ON agendamentos(tenant_id, data_agendada, status);
```

#### Tabela: `ingest_jobs`

```sql
CREATE TABLE ingest_jobs (
  job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  arquivo_origem VARCHAR(255) NOT NULL,
  s3_bucket VARCHAR(100),
  s3_key VARCHAR(500),
  
  status VARCHAR(50) DEFAULT 'pendente', -- 'pendente' | 'processando' | 'concluido' | 'erro'
  
  linhas_processadas INTEGER DEFAULT 0,
  leads_criados INTEGER DEFAULT 0,
  telefones_criados INTEGER DEFAULT 0,
  emails_criados INTEGER DEFAULT 0,
  
  erros JSONB DEFAULT '[]',
  
  iniciado_em TIMESTAMP,
  concluido_em TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_tenant_status ON ingest_jobs(tenant_id, status);
```

---

## 3. Arquitetura de Lambdas

### 3.1. Lambda: Ingest Handler

**Arquivo**: `lambda-src/agente-disparo-agenda/handlers/ingest.ts`

**Trigger**: API Gateway `POST /ingest/leads/xlsx`

**Responsabilidades**:
1. Validar arquivo recebido (formato, tamanho)
2. Fazer upload para S3 (se multipart)
3. Criar registro em `ingest_jobs`
4. Publicar evento no EventBridge para processamento assíncrono
5. Retornar `job_id` ao cliente

**Timeout**: 30 segundos  
**Memory**: 512 MB

**Variáveis de Ambiente**:
```typescript
{
  INGEST_BUCKET: string;           // alquimista-leads-ingest-{env}
  EVENT_BUS_NAME: string;          // fibonacci-bus-{env}
  DB_SECRET_ARN: string;           // ARN do Aurora
}
```

---

### 3.2. Lambda: Ingest Processor

**Arquivo**: `lambda-src/agente-disparo-agenda/handlers/ingest-processor.ts`

**Trigger**: EventBridge Rule `disparo-agenda.ingest.job_created`

**Responsabilidades**:
1. Baixar arquivo do S3
2. Ler aba "Leads" da planilha
3. Para cada linha:
   - Criar registro em `leads`
   - Explodir emails → `lead_emails`
   - Explodir telefones → `lead_telefones`
4. Atualizar `ingest_jobs` com estatísticas
5. Publicar evento de conclusão

**Timeout**: 15 minutos  
**Memory**: 2048 MB

**Dependências**:
- `xlsx` (leitura de planilhas)
- `@aws-sdk/client-s3`
- `pg` (PostgreSQL)

---

### 3.3. Lambda: Disparo Handler

**Arquivo**: `lambda-src/agente-disparo-agenda/handlers/disparo.ts`

**Trigger**: API Gateway `POST /leads/{lead_id}/disparos`

**Responsabilidades**:
1. Validar payload (canal, template, destino)
2. Criar registro em `disparos`
3. Se `agendar_para` é nulo ou passado: disparar imediatamente
4. Se `agendar_para` é futuro: criar regra no EventBridge Scheduler
5. Retornar `disparo_id`

**Timeout**: 30 segundos  
**Memory**: 512 MB

---

### 3.4. Lambda: Disparo Executor

**Arquivo**: `lambda-src/agente-disparo-agenda/handlers/disparo-executor.ts`

**Trigger**: 
- EventBridge Scheduler (disparos agendados)
- Invocação direta (disparos imediatos)

**Responsabilidades**:
1. Buscar disparo por `disparo_id`
2. Validar se ainda está pendente
3. Chamar MCP Server apropriado (WhatsApp ou Email)
4. Atualizar status do disparo
5. Implementar retry logic (até 3 tentativas)
6. Publicar evento de conclusão

**Timeout**: 60 segundos  
**Memory**: 512 MB

**Variáveis de Ambiente**:
```typescript
{
  MCP_WHATSAPP_ENDPOINT: string;
  MCP_EMAIL_ENDPOINT: string;
  DB_SECRET_ARN: string;
  EVENT_BUS_NAME: string;
}
```

---

### 3.5. Lambda: Agendamento Handler

**Arquivo**: `lambda-src/agente-disparo-agenda/handlers/agendamento.ts`

**Trigger**: API Gateway `POST /leads/{lead_id}/agendamentos`

**Responsabilidades**:
1. Validar payload (tipo, canal, data)
2. Criar registro em `agendamentos`
3. Criar notificação no EventBridge Scheduler
4. Retornar `agendamento_id`

**Timeout**: 30 segundos  
**Memory**: 256 MB

---

### 3.6. Lambda: Leads Query

**Arquivo**: `lambda-src/agente-disparo-agenda/handlers/leads-query.ts`

**Trigger**: API Gateway `GET /leads`

**Responsabilidades**:
1. Validar parâmetros de query (status, limit, offset)
2. Construir query SQL com filtros
3. Executar query paginada
4. Retornar lista de leads + total

**Timeout**: 30 segundos  
**Memory**: 256 MB

---

### 3.7. Lambda: Job Status

**Arquivo**: `lambda-src/agente-disparo-agenda/handlers/job-status.ts`

**Trigger**: API Gateway `GET /ingest/leads/jobs/{job_id}`

**Responsabilidades**:
1. Buscar job por `job_id`
2. Retornar status e estatísticas
3. Incluir erros se houver

**Timeout**: 10 segundos  
**Memory**: 256 MB

---

## 4. Fluxos de Dados

### 4.1. Fluxo de Ingestão

```
Cliente
  ↓ POST /ingest/leads/xlsx (multipart ou S3 ref)
Ingest Handler (Lambda)
  ↓ Upload para S3 (se multipart)
  ↓ Criar ingest_job
  ↓ Publicar evento: disparo-agenda.ingest.job_created
EventBridge
  ↓ Trigger
Ingest Processor (Lambda)
  ↓ Baixar arquivo do S3
  ↓ Ler planilha (xlsx)
  ↓ Para cada linha:
      ↓ INSERT leads
      ↓ INSERT lead_emails (múltiplos)
      ↓ INSERT lead_telefones (múltiplos)
  ↓ UPDATE ingest_job (status = concluido)
  ↓ Publicar evento: disparo-agenda.ingest.job_completed
```

### 4.2. Fluxo de Disparo Imediato

```
Cliente
  ↓ POST /leads/{lead_id}/disparos (agendar_para = null)
Disparo Handler (Lambda)
  ↓ INSERT disparos (status = pendente)
  ↓ Invocar Disparo Executor (async)
Disparo Executor (Lambda)
  ↓ SELECT disparo
  ↓ POST MCP WhatsApp/Email
  ↓ UPDATE disparo (status = enviado | erro)
  ↓ Publicar evento: disparo-agenda.disparo.completed
```

### 4.3. Fluxo de Disparo Agendado

```
Cliente
  ↓ POST /leads/{lead_id}/disparos (agendar_para = futuro)
Disparo Handler (Lambda)
  ↓ INSERT disparos (status = pendente)
  ↓ Criar EventBridge Scheduler Rule
  ↓ Retornar disparo_id
...
(No horário agendado)
EventBridge Scheduler
  ↓ Trigger
Disparo Executor (Lambda)
  ↓ SELECT disparo
  ↓ POST MCP WhatsApp/Email
  ↓ UPDATE disparo (status = enviado | erro)
  ↓ Publicar evento: disparo-agenda.disparo.completed
```

---

## 5. Integração com MCP Servers

### 5.1. MCP WhatsApp

**Endpoint**: Configurado via `MCP_WHATSAPP_ENDPOINT`

**Request**:
```typescript
POST /mcp/whatsapp/send
{
  to: string;              // +5584997084444
  message: string;
  templateId?: string;
  variables?: Record<string, string>;
}
```

**Response**:
```typescript
{
  messageId: string;
  status: 'sent' | 'failed';
  error?: string;
}
```

### 5.2. MCP Email

**Endpoint**: Configurado via `MCP_EMAIL_ENDPOINT`

**Request**:
```typescript
POST /mcp/email/send
{
  to: string;
  subject: string;
  body: string;
  html?: string;
  templateId?: string;
  variables?: Record<string, string>;
}
```

**Response**:
```typescript
{
  messageId: string;
  status: 'sent' | 'failed';
  error?: string;
}
```

---

## 6. API REST

### 6.1. Endpoints

#### POST /ingest/leads/xlsx

**Request (multipart)**:
```
Content-Type: multipart/form-data
file: Leads_Organizados.xlsx
```

**Request (S3 ref)**:
```json
{
  "bucket": "alquimista-leads",
  "key": "imports/2025-11-26/Leads_Organizados.xlsx"
}
```

**Response (202 Accepted)**:
```json
{
  "job_id": "uuid",
  "status": "accepted"
}
```

---

#### GET /ingest/leads/jobs/{job_id}

**Response**:
```json
{
  "job_id": "uuid",
  "status": "concluido",
  "linhas_processadas": 164809,
  "leads_criados": 164809,
  "telefones_criados": 107835,
  "emails_criados": 57117,
  "erros": []
}
```

---

#### GET /leads

**Query Params**:
- `status` (opcional): novo, em_disparo, agendado, etc.
- `limit` (opcional): default 50, max 500
- `offset` (opcional): default 0

**Response**:
```json
{
  "items": [
    {
      "lead_id": "uuid",
      "nome": "Empresa Exemplo Ltda",
      "contato_nome": "joao.silva",
      "documento": "12345678000199",
      "status": "novo",
      "data_ingestao": "2025-11-26T21:00:00Z"
    }
  ],
  "total": 12345,
  "limit": 50,
  "offset": 0
}
```

---

#### POST /leads/{lead_id}/disparos

**Request**:
```json
{
  "canal": "whatsapp",
  "telefone_id": "uuid",
  "template": "cobranca_padrao_1",
  "payload": {
    "variaveis": {
      "nome": "João",
      "valor_aberto": "R$ 1.250,00"
    }
  },
  "agendar_para": "2025-11-27T09:00:00Z"
}
```

**Response**:
```json
{
  "disparo_id": "uuid",
  "status": "pendente",
  "data_agendado": "2025-11-27T09:00:00Z"
}
```

---

#### POST /leads/{lead_id}/agendamentos

**Request**:
```json
{
  "tipo": "callback",
  "canal": "telefone",
  "data_agendada": "2025-11-27T14:00:00Z",
  "observacoes": "Cliente prefere contato à tarde."
}
```

**Response**:
```json
{
  "agendamento_id": "uuid",
  "status": "pendente",
  "data_agendada": "2025-11-27T14:00:00Z"
}
```

---

## 7. Observabilidade

### 7.1. Métricas CloudWatch

```typescript
namespace: 'Alquimista/DisparoAgenda'

metrics: [
  {
    name: 'IngestJobsCompleted',
    unit: 'Count',
    dimensions: { TenantId }
  },
  {
    name: 'LeadsCreated',
    unit: 'Count',
    dimensions: { TenantId, OrigemArquivo }
  },
  {
    name: 'DisparosSent',
    unit: 'Count',
    dimensions: { TenantId, Canal }
  },
  {
    name: 'DisparosFailedRate',
    unit: 'Percent',
    dimensions: { TenantId, Canal }
  },
  {
    name: 'AgendamentosCriados',
    unit: 'Count',
    dimensions: { TenantId, Tipo }
  }
]
```

### 7.2. Alarmes

```typescript
alarms: [
  {
    name: 'DisparoHighFailureRate',
    metric: 'DisparosFailedRate',
    threshold: 10, // %
    evaluationPeriods: 2,
    severity: 'CRITICAL'
  },
  {
    name: 'IngestJobFailed',
    metric: 'IngestJobsCompleted',
    statistic: 'Sum',
    threshold: 0,
    evaluationPeriods: 1,
    severity: 'HIGH'
  }
]
```

### 7.3. Logs Estruturados

```typescript
interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  service: 'ingest' | 'disparo' | 'agendamento';
  tenantId: string;
  leadId?: string;
  action: string;
  result: 'success' | 'failure';
  duration?: number;
  error?: {
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}
```

---

## 8. Segurança

### 8.1. Autenticação e Autorização

- **Cognito**: Autenticação de usuários
- **IAM**: Autorização de Lambdas
- **Multi-tenant**: Filtro por `tenant_id` em todas as queries

### 8.2. Secrets

Armazenados no AWS Secrets Manager:

```
/alquimista/dev/disparo-agenda/mcp-whatsapp
/alquimista/dev/disparo-agenda/mcp-email
/alquimista/dev/disparo-agenda/db-credentials
```

### 8.3. Criptografia

- **Em trânsito**: TLS 1.3
- **Em repouso**: Aurora KMS encryption
- **S3**: Server-side encryption (SSE-S3)

---

## 9. Retry Logic

### 9.1. Disparos

```typescript
const retryConfig = {
  maxAttempts: 3,
  backoff: 'exponential',
  baseDelay: 1000, // 1s
  maxDelay: 30000, // 30s
};

// Tentativa 1: imediato
// Tentativa 2: após 1s
// Tentativa 3: após 2s
// Tentativa 4: após 4s (se maxAttempts = 4)
```

### 9.2. Dead Letter Queue

Disparos que falharem após 3 tentativas vão para DLQ:

```typescript
{
  queueName: 'disparo-agenda-dlq-{env}',
  retentionPeriod: '14 days',
  alarmOnMessages: true
}
```

---

## 10. Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        API Gateway                          │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─── POST /ingest/leads/xlsx ──→ Ingest Handler
             │                                      ↓
             │                                 EventBridge
             │                                      ↓
             │                              Ingest Processor
             │                                      ↓
             │                                  Aurora DB
             │
             ├─── GET /leads ──────────────→ Leads Query
             │                                      ↓
             │                                  Aurora DB
             │
             ├─── POST /leads/{id}/disparos ──→ Disparo Handler
             │                                      ↓
             │                              Disparo Executor
             │                                      ↓
             │                              MCP WhatsApp/Email
             │
             └─── POST /leads/{id}/agendamentos ──→ Agendamento Handler
                                                    ↓
                                                Aurora DB
```

---

## 11. Decisões de Design

### D-01: Por que Aurora Serverless v2?

- Auto-scaling baseado em demanda
- Compatibilidade com PostgreSQL
- Suporte a JSON (JSONB)
- Multi-AZ para alta disponibilidade

### D-02: Por que EventBridge para processamento assíncrono?

- Desacoplamento entre ingestão e processamento
- Retry automático em falhas
- Facilita adição de novos consumidores de eventos

### D-03: Por que separar Disparo Handler e Disparo Executor?

- Handler: API síncrona, resposta rápida
- Executor: Processamento assíncrono, pode demorar
- Permite retry independente

### D-04: Por que MCP Servers em vez de integração direta?

- Abstração de complexidade (WhatsApp Business API, SMTP)
- Reutilização em outros micro agentes
- Facilita testes e mocks

---

## 12. Próximos Passos

1. Implementar Lambdas handlers
2. Criar migrations do banco de dados
3. Configurar EventBridge Rules
4. Implementar testes unitários
5. Configurar CI/CD
6. Deploy em ambiente dev
7. Testes de integração
8. Deploy em ambiente prod

---

**Última Atualização**: 2024-11-26  
**Versão**: 0.1  
**Status**: Rascunho  
**Mantido por**: Equipe AlquimistaAI

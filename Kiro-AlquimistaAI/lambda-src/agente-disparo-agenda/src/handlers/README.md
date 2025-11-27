# Lambdas Core - Micro Agente de Disparo & Agendamento

Este diretório contém as **4 Lambdas Core** do Micro Agente de Disparo & Agendamento.

## 📋 Visão Geral

### 1. **ingest-contacts.ts**
**Trigger**: API Gateway (HTTP POST)

**Responsabilidades**:
- Receber e validar dados de contatos (CSV, JSON, API)
- Normalizar e sanitizar os dados
- Salvar no DynamoDB
- Fazer upload do arquivo original para S3
- Gerar métricas de processamento

**Input**: 
```json
{
  "source": "csv" | "api" | "manual",
  "data": [{ contact objects }],
  "batchId": "optional-batch-id",
  "metadata": {}
}
```

**Output**:
```json
{
  "success": true,
  "batchId": "batch_123",
  "summary": {
    "totalReceived": 100,
    "validContacts": 95,
    "invalidContacts": 5,
    "processed": 95,
    "failed": 0,
    "successRate": 100
  },
  "s3Key": "contacts/2024-01-15/batch_123.csv"
}
```

---

### 2. **send-messages.ts**
**Trigger**: SQS Queue

**Responsabilidades**:
- Processar eventos de envio de mensagens da fila SQS
- Buscar contatos no DynamoDB
- Gerar mensagens personalizadas via MCP
- Enviar mensagens via WhatsApp/Email/LinkedIn
- Registrar histórico e métricas

**Input (SQS Event)**:
```json
{
  "contactIds": ["contact_1", "contact_2"],
  "campaignId": "campaign_123",
  "messageType": "initial" | "followup" | "reminder",
  "channel": "whatsapp" | "email" | "linkedin",
  "customMessage": "optional custom message",
  "scheduledAt": "2024-01-15T10:00:00Z",
  "metadata": {}
}
```

**Canais Suportados**:
- **WhatsApp**: Via MCP WhatsApp Server
- **Email**: Via MCP Email Server
- **LinkedIn**: Via MCP LinkedIn Server

---

### 3. **handle-replies.ts**
**Trigger**: SQS Queue

**Responsabilidades**:
- Processar respostas de contatos (WhatsApp/Email/LinkedIn)
- Analisar sentimento e intenção via MCP
- Atualizar status do contato
- Determinar próxima ação (follow-up, agendar reunião, etc.)
- Gerar alertas para vendedores quando necessário

**Input (SQS Event)**:
```json
{
  "messageId": "msg_123",
  "contactId": "contact_456",
  "replyContent": "Sim, tenho interesse!",
  "channel": "whatsapp" | "email" | "linkedin",
  "receivedAt": "2024-01-15T10:30:00Z",
  "metadata": {}
}
```

**Análise MCP**:
- **Sentimento**: positive, neutral, negative
- **Intenção**: interested, not_interested, needs_info, ready_to_buy, unknown
- **Próxima Ação**: schedule_meeting, send_info, followup, close_deal, manual_review
- **Urgência**: low, medium, high

**Ações Automáticas**:
- `schedule_meeting` → Dispara Lambda de agendamento
- `send_info` → Dispara follow-up com informações
- `followup` → Agenda follow-up futuro
- `close_deal` → Notifica vendedor (alta prioridade)
- `manual_review` → Notifica vendedor para revisão

---

### 4. **schedule-meeting.ts**
**Trigger**: EventBridge Event

**Responsabilidades**:
- Processar solicitações de agendamento de reuniões
- Consultar disponibilidade via Google Calendar
- Criar evento no calendário
- Gerar briefing automático para o vendedor
- Enviar confirmação para o contato
- Configurar lembretes automáticos

**Input (EventBridge Event)**:
```json
{
  "contactId": "contact_789",
  "scheduledAt": "2024-01-20T14:00:00Z",
  "duration": 60,
  "type": "discovery" | "demo" | "proposal" | "followup",
  "title": "Reunião de Discovery",
  "description": "Entender necessidades do cliente",
  "location": "Google Meet",
  "generateBriefing": true,
  "metadata": {}
}
```

**Briefing Automático**:
- Dados da empresa e contato
- Histórico de interações
- Análise de sentimento
- Objeções identificadas
- Pontos de dor
- Recomendações para a reunião
- Próximos passos sugeridos

**Lembretes**:
- 24 horas antes da reunião
- 1 hora antes da reunião

---

## 🔧 Variáveis de Ambiente

### Comuns a Todas as Lambdas
```bash
AWS_REGION=us-east-1
EVENT_BUS_NAME=fibonacci-bus-dev
DB_SECRET_ARN=arn:aws:secretsmanager:...
MCP_API_KEY=your-mcp-api-key
```

### Específicas por Lambda

#### ingest-contacts
```bash
S3_BUCKET_NAME=alquimista-agente-disparo-agenda
```

#### send-messages
```bash
MCP_WHATSAPP_ENDPOINT=https://api.alquimista.ai/mcp/whatsapp
MCP_EMAIL_ENDPOINT=https://api.alquimista.ai/mcp/email
MCP_LINKEDIN_ENDPOINT=https://api.alquimista.ai/mcp/linkedin
MCP_BASE_URL=https://api.alquimista.ai/mcp
MCP_TIMEOUT=30000
```

#### handle-replies
```bash
MCP_BASE_URL=https://api.alquimista.ai/mcp
MCP_TIMEOUT=30000
```

#### schedule-meeting
```bash
MCP_CALENDAR_ENDPOINT=https://api.alquimista.ai/mcp/calendar
GOOGLE_CALENDAR_ID=vendas@empresa.com
MCP_WHATSAPP_ENDPOINT=https://api.alquimista.ai/mcp/whatsapp
MCP_EMAIL_ENDPOINT=https://api.alquimista.ai/mcp/email
```

---

## 📊 Tabelas DynamoDB

### nigredo_contacts
```typescript
{
  id: string (PK)
  name: string
  email: string
  phone?: string
  company?: string
  position?: string
  industry?: string
  location?: string
  linkedinUrl?: string
  status: ContactStatus
  source: ContactSource
  tags: string[]
  customFields: Record<string, any>
  createdAt: string
  updatedAt: string
  lastInteractionAt?: string
  messageHistory?: string[]
  responseRate?: number
  engagementScore?: number
  batchId?: string
  campaignId?: string
}
```

### nigredo_messages
```typescript
{
  id: string (PK)
  contactId: string (GSI)
  content: string
  channel: MessageChannel
  type: MessageType
  status: MessageStatus
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  repliedAt?: string
  metadata?: Record<string, any>
  mcpGenerated?: boolean
  confidence?: number
  createdAt: string
}
```

### nigredo_meetings
```typescript
{
  id: string (PK)
  contactId: string (GSI)
  scheduledAt: string
  duration: number
  type: MeetingType
  status: MeetingStatus
  title?: string
  description?: string
  location?: string
  meetingUrl?: string
  briefingS3Key?: string
  briefingGenerated?: boolean
  createdAt: string
  updatedAt: string
  confirmedAt?: string
  cancelledAt?: string
  metadata?: Record<string, any>
}
```

---

## 🔄 Fluxo de Dados

```
1. INGESTÃO
   CSV/API → ingest-contacts → DynamoDB (contacts)
                             → S3 (arquivo original)

2. ENVIO
   EventBridge/SQS → send-messages → MCP (geração)
                                   → WhatsApp/Email/LinkedIn
                                   → DynamoDB (messages)
                                   → S3 (logs)

3. RESPOSTA
   Webhook → SQS → handle-replies → MCP (análise)
                                  → DynamoDB (messages, contacts)
                                  → EventBridge (próximas ações)

4. AGENDAMENTO
   EventBridge → schedule-meeting → Google Calendar
                                  → MCP (briefing)
                                  → S3 (briefing)
                                  → DynamoDB (meetings)
                                  → WhatsApp/Email (confirmação)
                                  → EventBridge (lembretes)
```

---

## 🧪 Testes

### Teste Local
```bash
# Compilar TypeScript
npm run build

# Executar testes
npm test

# Teste específico
npm test -- ingest-contacts.test.ts
```

### Teste de Integração
```bash
# Invocar Lambda localmente
sam local invoke IngestContactsFunction -e events/ingest-contacts.json

# Enviar mensagem para SQS
aws sqs send-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/.../send-messages \
  --message-body file://events/send-messages.json
```

---

## 📝 Logs e Observabilidade

Todas as Lambdas utilizam **logging estruturado** via `logger.ts`:

```typescript
logger.info('Mensagem', { 
  requestId, 
  contactId, 
  additionalData 
});

logger.error('Erro', { 
  requestId, 
  error: error.message, 
  stack: error.stack 
});
```

**CloudWatch Logs Groups**:
- `/aws/lambda/ingest-contacts-{env}`
- `/aws/lambda/send-messages-{env}`
- `/aws/lambda/handle-replies-{env}`
- `/aws/lambda/schedule-meeting-{env}`

**Métricas Customizadas**:
- `ContactsIngested`
- `MessagesSent`
- `RepliesProcessed`
- `MeetingsScheduled`
- `MCPCallDuration`
- `ErrorRate`

---

## 🚨 Error Handling

Todas as Lambdas implementam:

1. **Try-Catch Global**: Captura todos os erros não tratados
2. **Validação de Input**: Valida dados antes de processar
3. **Retry Logic**: Backoff exponencial para falhas temporárias
4. **Dead Letter Queue**: Mensagens que falharam após retries
5. **Logging Estruturado**: Todos os erros são logados com contexto
6. **Fallback**: Mensagens de fallback quando MCP falha

---

## 📚 Dependências

```json
{
  "@aws-sdk/client-dynamodb": "^3.x",
  "@aws-sdk/lib-dynamodb": "^3.x",
  "@aws-sdk/client-s3": "^3.x",
  "@aws-sdk/client-eventbridge": "^3.x",
  "@aws-sdk/s3-request-presigner": "^3.x"
}
```

---

## 🔐 Segurança

- **IAM Roles**: Least privilege principle
- **Secrets Manager**: Credenciais MCP e APIs externas
- **Encryption**: S3 com AES256, DynamoDB com KMS
- **Input Validation**: Sanitização de todos os inputs
- **Rate Limiting**: Controle de taxa de envio

---

## 📖 Referências

- [Design Document](../../.kiro/specs/micro-agente-disparo-agendamento/design.md)
- [Requirements](../../.kiro/specs/micro-agente-disparo-agendamento/requirements.md)
- [Tasks](../../.kiro/specs/micro-agente-disparo-agendamento/tasks.md)
- [Blueprint](../../.kiro/steering/blueprint-disparo-agendamento.md)

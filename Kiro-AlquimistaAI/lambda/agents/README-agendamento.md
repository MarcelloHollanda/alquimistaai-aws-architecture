# Agente de Agendamento

## Visão Geral

O Agente de Agendamento é responsável por marcar reuniões com leads qualificados, verificando disponibilidade em tempo real via Google Calendar e gerenciando todo o fluxo de confirmação.

## Funcionalidades

### 1. Consulta de Disponibilidade
- Integra com Google Calendar via MCP
- Busca slots disponíveis nos próximos 7 dias
- Respeita horário comercial (09:00-18:00, seg-sex)
- Propõe 3 horários ao lead

### 2. Proposta de Horários
- Envia mensagem via WhatsApp com opções de horário
- Formata datas em português brasileiro
- Aguarda confirmação do lead
- Salva slots propostos no banco de dados

### 3. Confirmação de Agendamento
- Recebe confirmação do lead
- Cria evento no Google Calendar
- Adiciona link do Google Meet automaticamente
- Envia convite por email aos participantes

### 4. Briefing Comercial
- Gera briefing completo com histórico do lead
- Inclui todas as interações anteriores
- Adiciona classificações e insights
- Lista objeções identificadas
- Anexa ao evento do calendário

### 5. Notificações
- Envia confirmação via WhatsApp
- Inclui link da reunião (Google Meet)
- Atualiza status do lead para "agendado"
- Publica evento `nigredo.agendamento.confirmed`

## Fluxo de Processamento

```
1. Recebe evento nigredo.atendimento.schedule_requested
   ↓
2. Busca lead no banco de dados
   ↓
3. Consulta disponibilidade via MCP Calendar
   ↓
4. Propõe 3 horários ao lead via WhatsApp
   ↓
5. Salva slots propostos no banco
   ↓
6. Aguarda confirmação do lead
   ↓
7. Recebe evento com slot selecionado
   ↓
8. Cria evento no Google Calendar
   ↓
9. Gera briefing comercial
   ↓
10. Salva agendamento confirmado
   ↓
11. Envia confirmação via WhatsApp
   ↓
12. Atualiza status do lead
   ↓
13. Publica evento nigredo.agendamento.confirmed
```

## Estrutura de Dados

### Agendamento Request
```typescript
{
  leadId: string;
  tenantId: string;
  calendarId: string;
  duration?: number; // minutos, padrão 60
  preferredDates?: string[]; // ISO-8601
  context?: {
    source: string;
    lastMessage: string;
    history: any[];
  };
}
```

### Agendamento Confirmation
```typescript
{
  leadId: string;
  selectedSlot: string; // ISO-8601 datetime
}
```

### Briefing Comercial
```markdown
# Briefing Comercial - [Empresa]

**Contato:** [Nome]
**Email:** [Email]
**Telefone:** [Telefone]
**Setor:** [Setor]
**Porte:** [Porte]

## Histórico de Interações

- **[Data]** ([Canal]) [Sentimento]: [Mensagem]...

## Classificações e Insights

- **Status:** [Status]
- **Prioridade:** [0-100]
- **Necessidade Autêntica:** [Sim/Não]

## Objeções Identificadas

- [Objeção 1]
- [Objeção 2]
```

## Integrações MCP

### Google Calendar API
- **Método:** `getAvailability()`
  - Busca slots disponíveis
  - Filtra por horário comercial
  - Retorna até 3 opções

- **Método:** `createEvent()`
  - Cria evento no calendário
  - Adiciona participantes
  - Gera link do Google Meet
  - Envia convites por email

### WhatsApp Business API
- **Método:** `sendMessage()`
  - Envia proposta de horários
  - Envia confirmação de agendamento
  - Usa idempotency key para evitar duplicatas

## Configuração

### Variáveis de Ambiente
```bash
POWERTOOLS_SERVICE_NAME=nigredo-agendamento
LOG_LEVEL=INFO
EVENT_BUS_NAME=fibonacci-bus
DB_SECRET_ARN=arn:aws:secretsmanager:...
DLQ_URL=https://sqs.us-east-1.amazonaws.com/...
NODE_OPTIONS=--enable-source-maps
```

### Permissões IAM Necessárias
- `events:PutEvents` - Publicar eventos no EventBridge
- `secretsmanager:GetSecretValue` - Ler credenciais do banco e MCP
- `rds-data:ExecuteStatement` - Executar queries no Aurora
- `sqs:SendMessage` - Enviar mensagens para DLQ

### Secrets Manager
- `fibonacci/mcp/calendar` - Credenciais do Google Calendar
- `fibonacci/mcp/whatsapp` - Credenciais do WhatsApp Business
- `fibonacci/db/credentials` - Credenciais do Aurora PostgreSQL

## Banco de Dados

### Tabela: nigredo_leads.agendamentos
```sql
CREATE TABLE nigredo_leads.agendamentos (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES nigredo_leads.leads(id),
  tenant_id UUID NOT NULL,
  data_hora TIMESTAMP,
  duracao INTEGER DEFAULT 60,
  status VARCHAR(50), -- 'proposto', 'confirmado', 'realizado', 'cancelado'
  calendar_event_id VARCHAR(255),
  briefing TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_agendamentos_lead ON nigredo_leads.agendamentos(lead_id);
CREATE INDEX idx_agendamentos_status ON nigredo_leads.agendamentos(status);
CREATE INDEX idx_agendamentos_data ON nigredo_leads.agendamentos(data_hora);
```

## Eventos Publicados

### nigredo.agendamento.confirmed
```json
{
  "Source": "nigredo.agendamento",
  "DetailType": "agendamento.confirmed",
  "Detail": {
    "leadId": "uuid",
    "tenantId": "uuid",
    "empresa": "Nome da Empresa",
    "contato": "Nome do Contato",
    "dataHora": "2024-01-15T14:00:00Z",
    "calendarEventId": "google-calendar-event-id",
    "traceId": "uuid",
    "timestamp": "2024-01-10T10:30:00Z"
  }
}
```

## Tratamento de Erros

### Erros Transientes (Retry)
- Falha de conexão com Google Calendar
- Timeout na API do WhatsApp
- Erro de conexão com banco de dados

### Erros Permanentes (DLQ)
- Lead não encontrado
- Calendário inválido
- Slot já ocupado
- Dados inválidos

### Casos Especiais
- **Sem slots disponíveis:** Notifica lead que não há horários
- **Lead sem telefone:** Apenas envia email
- **Erro ao criar evento:** Tenta novamente com outro slot

## Métricas e Observabilidade

### Logs Estruturados
```json
{
  "timestamp": "2024-01-10T10:30:00Z",
  "level": "INFO",
  "message": "Schedule request handled successfully",
  "trace_id": "uuid",
  "leadId": "uuid",
  "proposedSlots": 3,
  "duration": 1234
}
```

### Métricas CloudWatch
- `AgendamentoRequests` - Total de solicitações
- `AgendamentoConfirmed` - Agendamentos confirmados
- `AgendamentoErrors` - Erros no processamento
- `CalendarAPILatency` - Latência da API do Google Calendar
- `WhatsAppAPILatency` - Latência da API do WhatsApp

### X-Ray Tracing
- Trace completo do fluxo de agendamento
- Subsegments para cada integração MCP
- Annotations: leadId, tenantId, calendarId

## Testes

### Teste Manual
```bash
# Publicar evento de teste
aws events put-events --entries '[
  {
    "Source": "nigredo.atendimento",
    "DetailType": "schedule_requested",
    "Detail": "{\"type\":\"schedule_request\",\"leadId\":\"uuid\",\"tenantId\":\"uuid\",\"calendarId\":\"primary\"}",
    "EventBusName": "fibonacci-bus"
  }
]'
```

### Teste de Confirmação
```bash
# Publicar evento de confirmação
aws events put-events --entries '[
  {
    "Source": "nigredo.agendamento",
    "DetailType": "schedule_confirmation",
    "Detail": "{\"type\":\"schedule_confirmation\",\"leadId\":\"uuid\",\"selectedSlot\":\"2024-01-15T14:00:00Z\"}",
    "EventBusName": "fibonacci-bus"
  }
]'
```

## Troubleshooting

### Problema: Slots não são propostos
- Verificar credenciais do Google Calendar no Secrets Manager
- Verificar se calendário existe e está acessível
- Verificar logs do Lambda para erros de API

### Problema: Confirmação não cria evento
- Verificar se slot ainda está disponível
- Verificar permissões do calendário
- Verificar se lead tem email válido

### Problema: WhatsApp não envia mensagem
- Verificar credenciais do WhatsApp no Secrets Manager
- Verificar se telefone está no formato correto (+55...)
- Verificar rate limits do WhatsApp

## Requisitos Atendidos

- **11.8:** Implementa agendamento com verificação de disponibilidade em tempo real
- **11.10:** Publica evento nigredo.agendamento.confirmed com trace_id
- **11.2:** Lambda configurada com 512MB, 30s timeout e trigger do EventBridge

## Próximos Passos

1. Implementar integração real com Google Calendar API (atualmente mock)
2. Adicionar suporte a múltiplos calendários por tenant
3. Implementar reagendamento de reuniões
4. Adicionar lembretes automáticos antes da reunião
5. Integrar com CRM para sincronizar agendamentos

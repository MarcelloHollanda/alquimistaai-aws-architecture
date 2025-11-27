# Agente de Agendamento

## Visão Geral

O Agente de Agendamento gerencia solicitações de reuniões, consulta disponibilidade no Google Calendar e cria eventos confirmados.

## Funcionalidades

### 1. Consulta de Disponibilidade
- **Google Calendar**: Via MCP integration
- **Múltiplas agendas**: Vendedores e gestores
- **Horário comercial**: 09h-18h, seg-sex
- **Buffer**: 15min entre reuniões

### 2. Proposta de Horários
- **3 opções**: Diferentes dias/horários
- **Personalização**: Baseada no perfil do lead
- **Confirmação**: Via WhatsApp/Email

### 3. Criação de Evento
- **Google Calendar**: Evento confirmado
- **Participantes**: Lead + vendedor
- **Briefing**: Histórico completo anexado
- **Lembretes**: 24h e 1h antes

## Configuração

### Variáveis de Ambiente
```bash
EVENT_BUS_NAME=fibonacci-bus-dev
DB_SECRET_ARN=arn:aws:secretsmanager:...
MCP_CALENDAR_ENDPOINT=https://...
GOOGLE_CALENDAR_ID=vendas@empresa.com
MEETING_DURATION=60
BUFFER_MINUTES=15
```

### Triggers
- **EventBridge Rule**: `nigredo.atendimento.schedule_requested`
- **Timeout**: 30 segundos
- **Memory**: 512MB

## Input/Output

### Input (EventBridge Event)
```json
{
  "source": "nigredo.atendimento",
  "detail-type": "Schedule Requested",
  "detail": {
    "leadId": "lead-456",
    "preferredDates": ["2024-01-16", "2024-01-17"],
    "preferredTimes": ["morning", "afternoon"],
    "urgency": "high"
  }
}
```

### Output (EventBridge Event)
```json
{
  "source": "nigredo.agendamento",
  "detail-type": "Meeting Scheduled",
  "detail": {
    "meetingId": "meet-789",
    "leadId": "lead-456",
    "dateTime": "2024-01-16T14:00:00Z",
    "duration": 60,
    "attendees": [
      "lead@empresa.com",
      "vendedor@nossa-empresa.com"
    ],
    "calendarEventId": "cal-event-123"
  }
}
```

## Briefing Template

### Informações do Lead
```markdown
# Briefing Comercial - {empresa}

## Dados da Empresa
- **Nome**: {empresa}
- **CNPJ**: {cnpj}
- **Setor**: {setor}
- **Porte**: {porte}
- **Faturamento estimado**: {faturamento}

## Histórico de Interações
{historico_interacoes}

## Análise de Sentimento
- **Último sentimento**: {sentimento}
- **Nível de interesse**: {interesse}
- **Objeções identificadas**: {objecoes}

## Recomendações
- **Abordagem sugerida**: {abordagem}
- **Pontos de dor**: {pain_points}
- **Proposta de valor**: {value_prop}
```

## Disponibilidade

### Horários Padrão
- **Segunda a Sexta**: 09:00 - 18:00
- **Duração padrão**: 60 minutos
- **Buffer**: 15 minutos entre reuniões

### Exceções
- **Feriados**: Automaticamente bloqueados
- **Férias**: Configurável por vendedor
- **Reuniões internas**: Respeitadas

## Métricas

- **Agendamentos/dia**: Target 20+
- **Taxa de confirmação**: Target 80%+
- **No-show rate**: Target <10%
- **Tempo de agendamento**: Target <2min
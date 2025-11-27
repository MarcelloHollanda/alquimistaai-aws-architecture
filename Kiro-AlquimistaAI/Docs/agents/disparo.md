# Agente de Disparo

## Visão Geral

O Agente de Disparo executa campanhas ativas, enviando mensagens via WhatsApp ou email respeitando horários comerciais e rate limits.

## Funcionalidades

### 1. Controle de Horário
- **Horário comercial**: 08h-18h, seg-sex
- **Fuso horário**: Baseado na localização do lead
- **Variações**: ±5 min para parecer mais humano

### 2. Rate Limiting
- **Por tenant**: 100 msg/hora, 500 msg/dia
- **Por canal**: WhatsApp 80 msg/s, Email 50 msg/s
- **Backoff**: Exponential em caso de limite

### 3. Envio via MCP
- **Idempotência**: Evita duplicatas
- **Status tracking**: Acompanha entrega
- **Retry logic**: 3 tentativas com backoff

## Configuração

### Variáveis de Ambiente
```bash
EVENT_BUS_NAME=fibonacci-bus-dev
DB_SECRET_ARN=arn:aws:secretsmanager:...
MCP_WHATSAPP_ENDPOINT=https://...
MCP_EMAIL_ENDPOINT=https://...
RATE_LIMIT_TENANT=100
RATE_LIMIT_DAILY=500
```

### Triggers
- **EventBridge Scheduler**: Cron expression
- **Timeout**: 30 segundos
- **Memory**: 512MB

## Input/Output

### Input (Scheduled Event)
```json
{
  "source": "aws.scheduler",
  "detail-type": "Scheduled Event",
  "detail": {
    "scheduleName": "disparo-diario"
  }
}
```

### Output (EventBridge Event)
```json
{
  "source": "nigredo.disparo",
  "detail-type": "Messages Sent",
  "detail": {
    "campaignId": "camp-789",
    "messagesSent": 45,
    "channels": {
      "whatsapp": 30,
      "email": 15
    },
    "failures": 2,
    "nextRun": "2024-01-16T09:00:00Z"
  }
}
```

## Rate Limits

### Por Tenant
- **Hourly**: 100 mensagens
- **Daily**: 500 mensagens
- **Burst**: 10 mensagens/minuto

### Por Canal
- **WhatsApp**: 80 msg/segundo
- **Email**: 50 msg/segundo
- **SMS**: 10 msg/segundo

## Métricas

- **Mensagens enviadas/hora**: Target 500+
- **Taxa de entrega**: Target 98%+
- **Tempo médio de envio**: Target <2s
- **Compliance rate limit**: Target 100%
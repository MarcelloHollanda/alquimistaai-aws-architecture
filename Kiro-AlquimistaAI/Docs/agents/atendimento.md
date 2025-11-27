# Agente de Atendimento

## Visão Geral

O Agente de Atendimento processa respostas de leads via webhook, analisa sentimento e gera respostas contextualizadas usando LLM.

## Funcionalidades

### 1. Processamento de Webhook
- **WhatsApp**: Recebe via webhook do Meta
- **Email**: Processa via SES/SNS
- **Identificação**: Localiza lead no banco

### 2. Análise de Sentimento
- **Invocação síncrona**: Chama Agente de Sentimento
- **Classificação**: Positivo, neutro, negativo, irritado
- **Ajuste de tom**: Baseado no sentimento

### 3. Geração de Resposta
- **LLM**: Bedrock Claude 3 Sonnet
- **Contexto**: Histórico completo do lead
- **Validação**: Políticas de marca
- **Personalização**: Baseada no perfil

### 4. Decisão de Próximo Passo
- **Agendamento**: Se lead interessado
- **Nutrição**: Se precisa mais informações
- **Descarte**: Se não qualificado

## Configuração

### Variáveis de Ambiente
```bash
EVENT_BUS_NAME=fibonacci-bus-dev
DB_SECRET_ARN=arn:aws:secretsmanager:...
MCP_WHATSAPP_ENDPOINT=https://...
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet
SENTIMENT_FUNCTION_NAME=nigredo-sentimento-dev
```

### Triggers
- **API Gateway**: Webhook endpoint
- **Timeout**: 30 segundos
- **Memory**: 1024MB

## Input/Output

### Input (Webhook)
```json
{
  "from": "+5511999999999",
  "message": "Olá, gostaria de saber mais sobre o produto",
  "timestamp": "2024-01-15T10:30:00Z",
  "messageId": "msg-123"
}
```

### Output (EventBridge Event)
```json
{
  "source": "nigredo.atendimento",
  "detail-type": "Lead Responded",
  "detail": {
    "leadId": "lead-456",
    "sentiment": "positive",
    "response": "Olá! Fico feliz com seu interesse...",
    "nextAction": "schedule_meeting",
    "confidence": 0.85
  }
}
```

## Prompts Templates

### Resposta Positiva
```
Você é um consultor comercial experiente. O lead {nome} da empresa {empresa} 
demonstrou interesse em {produto}. Histórico: {historico}. 
Responda de forma calorosa e proponha próximos passos.
```

### Resposta Neutra
```
O lead {nome} fez uma pergunta sobre {assunto}. Forneça informações 
claras e objetivas, mantendo o interesse sem ser invasivo.
```

### Resposta Negativa
```
O lead {nome} demonstrou resistência. Seja empático, ofereça valor 
sem insistir e deixe a porta aberta para futuro contato.
```

## Métricas

- **Respostas processadas/hora**: Target 200+
- **Tempo de resposta**: Target <30s
- **Taxa de conversão**: Target 15%+
- **Satisfação do lead**: Target 4.5/5
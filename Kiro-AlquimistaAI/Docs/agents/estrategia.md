# Agente de Estratégia

## Visão Geral

O Agente de Estratégia cria campanhas personalizadas para cada lote de leads, definindo mensagens, canais e ritmo de disparos baseado no perfil comercial.

## Funcionalidades

### 1. Análise de Perfil Comercial
- **Pesquisa detalhada**: Via MCP enrichment
- **Faturamento estimado**: Baseado em porte e setor
- **Maturidade**: Análise de presença digital

### 2. Criação de Campanhas
- **Funil completo**: Topo, Meio e Fundo
- **Testes A/B**: Variações de mensagens
- **Canal ideal**: WhatsApp vs Email por segmento
- **Ritmo**: Horários e frequência otimizados

### 3. Aprovação e Persistência
- **Pré-visualizações**: Mockups das mensagens
- **Aprovação**: Workflow de validação
- **Persistência**: Salva na tabela campanhas

## Configuração

### Variáveis de Ambiente
```bash
EVENT_BUS_NAME=fibonacci-bus-dev
DB_SECRET_ARN=arn:aws:secretsmanager:...
MCP_ENRICHMENT_ENDPOINT=https://...
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet
```

### Triggers
- **EventBridge Rule**: `nigredo.recebimento.completed`
- **Timeout**: 120 segundos
- **Memory**: 1024MB

## Input/Output

### Input (EventBridge Event)
```json
{
  "source": "nigredo.recebimento",
  "detail-type": "Leads Processed",
  "detail": {
    "batchId": "batch-456",
    "segments": [
      {
        "name": "Tecnologia",
        "leads": ["lead-1", "lead-2"],
        "avgScore": 85
      }
    ]
  }
}
```

### Output (EventBridge Event)
```json
{
  "source": "nigredo.estrategia",
  "detail-type": "Campaign Created",
  "detail": {
    "campaignId": "camp-789",
    "batchId": "batch-456",
    "segments": ["Tecnologia"],
    "messages": {
      "topo": "Mensagem inicial...",
      "meio": "Follow-up...",
      "fundo": "Proposta..."
    },
    "schedule": {
      "startDate": "2024-01-15",
      "frequency": "daily",
      "timeSlots": ["09:00", "14:00"]
    }
  }
}
```

## Métricas

- **Campanhas criadas/dia**: Target 50+
- **Taxa de aprovação**: Target 95%+
- **Tempo de criação**: Target <2min
- **Variações por campanha**: Target 3+
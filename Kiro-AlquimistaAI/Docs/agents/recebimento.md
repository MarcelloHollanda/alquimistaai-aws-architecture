# Agente de Recebimento

## Visão Geral

O Agente de Recebimento é responsável por processar leads recebidos através de planilhas Excel ou JSON, realizando higienização, enriquecimento e segmentação dos dados.

## Funcionalidades

### 1. Processamento de Dados
- **Entrada**: Planilha Excel ou JSON com dados de leads
- **Validação**: Campos obrigatórios (empresa, contato, telefone/email)
- **Diferenciação**: PF vs PJ usando validação de CNPJ
- **Formatação**: Telefones (+55...) e emails (lowercase)

### 2. Enriquecimento de Dados
- **Receita Federal**: Busca dados empresariais via CNPJ
- **Google Places**: Informações de localização e categoria
- **Completude**: Preenchimento de campos faltantes

### 3. Segmentação e Priorização
- **Segmentação**: Por setor, porte e atividade
- **Score**: Cálculo de prioridade (0-100)
- **Lotes**: Criação de grupos homogêneos

## Configuração

### Variáveis de Ambiente
```bash
EVENT_BUS_NAME=fibonacci-bus-dev
DB_SECRET_ARN=arn:aws:secretsmanager:...
MCP_ENRICHMENT_ENDPOINT=https://...
```

### Triggers
- **SQS Queue**: `fibonacci-recebimento-{env}`
- **Timeout**: 60 segundos
- **Memory**: 1024MB

## Input/Output

### Input (SQS Message)
```json
{
  "source": "upload",
  "type": "leads.received",
  "detail": {
    "fileUrl": "s3://bucket/leads.xlsx",
    "format": "excel|json",
    "tenantId": "tenant-123"
  }
}
```

### Output (EventBridge Event)
```json
{
  "source": "nigredo.recebimento",
  "detail-type": "Leads Processed",
  "detail": {
    "batchId": "batch-456",
    "totalLeads": 150,
    "validLeads": 142,
    "segments": [
      {
        "name": "Tecnologia",
        "count": 45,
        "avgScore": 85
      }
    ]
  }
}
```

## Métricas

- **Leads processados/hora**: Target 1000+
- **Taxa de enriquecimento**: Target 90%+
- **Tempo médio de processamento**: Target <30s
- **Taxa de erro**: Target <1%
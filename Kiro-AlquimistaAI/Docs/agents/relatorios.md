# Agente de Relatórios

## Visão Geral

O Agente de Relatórios consolida dados de todos os agentes para gerar insights estratégicos e métricas de performance do funil de vendas.

## Funcionalidades

### 1. Coleta de Dados
- **Todos os agentes**: Métricas consolidadas
- **Funil completo**: Leads → Respostas → Agendamentos
- **Período**: Diário, semanal, mensal
- **Segmentação**: Por campanha, setor, vendedor

### 2. Análise de Performance
- **Taxa de conversão**: Por etapa do funil
- **Tempo médio**: Ciclo de vendas
- **Objeções**: Padrões recorrentes
- **ROI**: Por campanha e canal

### 3. Geração de Insights
- **LLM**: Bedrock para análise estratégica
- **Tendências**: Identificação de padrões
- **Recomendações**: Otimizações sugeridas
- **Alertas**: Métricas fora do padrão

## Configuração

### Variáveis de Ambiente
```bash
EVENT_BUS_NAME=fibonacci-bus-dev
DB_SECRET_ARN=arn:aws:secretsmanager:...
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet
REPORT_EMAIL=gestores@empresa.com
DASHBOARD_URL=https://dashboard.empresa.com
```

### Triggers
- **EventBridge Scheduler**: Diário às 08:00
- **Timeout**: 120 segundos
- **Memory**: 1024MB

## Input/Output

### Input (Scheduled Event)
```json
{
  "source": "aws.scheduler",
  "detail-type": "Daily Report",
  "detail": {
    "reportType": "daily",
    "date": "2024-01-15"
  }
}
```

### Output (EventBridge Event)
```json
{
  "source": "nigredo.relatorios",
  "detail-type": "Report Generated",
  "detail": {
    "reportId": "report-789",
    "period": "2024-01-15",
    "metrics": {
      "leadsReceived": 150,
      "leadsProcessed": 142,
      "messagesSent": 89,
      "responses": 23,
      "meetings": 8
    },
    "insights": [
      "Taxa de resposta 15% acima da média",
      "Setor tecnologia com melhor performance"
    ]
  }
}
```

## Métricas Principais

### Funil de Conversão
- **Leads recebidos**: Total de leads importados
- **Leads válidos**: Após higienização
- **Mensagens enviadas**: Total de disparos
- **Taxa de resposta**: Respostas/Mensagens
- **Agendamentos**: Reuniões marcadas
- **Conversões**: Vendas fechadas

### Performance por Canal
- **WhatsApp**: Taxa de entrega e resposta
- **Email**: Open rate e click rate
- **SMS**: Entrega e conversão

### Análise Temporal
- **Melhor horário**: Para disparos
- **Melhor dia**: Da semana
- **Sazonalidade**: Padrões mensais

## Relatório Diário

### Estrutura
```markdown
# Relatório Diário - {data}

## 📊 Métricas Gerais
- Leads processados: {leads}
- Mensagens enviadas: {mensagens}
- Taxa de resposta: {taxa_resposta}%
- Agendamentos: {agendamentos}

## 🎯 Performance por Campanha
{tabela_campanhas}

## 📈 Tendências
{insights_llm}

## ⚠️ Alertas
{alertas_automaticos}

## 💡 Recomendações
{recomendacoes_llm}
```

## Insights Automáticos

### Padrões Identificados
- **Horário ótimo**: Baseado em taxa de resposta
- **Segmento top**: Melhor performance
- **Objeções comuns**: Análise de sentimento
- **Ciclo de vendas**: Tempo médio por setor

### Alertas
- **Taxa de erro alta**: >5% em qualquer agente
- **Queda de performance**: >20% vs média
- **Compliance LGPD**: Descadastros não processados

## Métricas

- **Relatórios gerados/dia**: Target 1
- **Tempo de geração**: Target <2min
- **Precisão insights**: Target 85%+
- **Ações tomadas**: Target 70%+ das recomendações
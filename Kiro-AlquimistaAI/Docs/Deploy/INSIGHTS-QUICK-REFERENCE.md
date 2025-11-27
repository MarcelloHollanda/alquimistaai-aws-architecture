# CloudWatch Insights - Referência Rápida

## 🚀 Queries Essenciais

### Erros por Agente
```
fields @timestamp, agent, message, error.message
| filter level = "ERROR"
| stats count() by agent
| sort count desc
```

### Latência por Endpoint
```
fields @timestamp, requestContext.http.path as endpoint, duration
| filter requestContext.http.path like /api/
| stats avg(duration), pct(duration, 95) by endpoint
| sort pct(duration, 95) desc
```

### Conversão do Funil
```
fields leadId, agent
| filter agent in ["recebimento", "estrategia", "disparo", "atendimento", "agendamento"]
| stats count() by agent
```

### Chamadas MCP
```
fields metadata.mcpServer, metadata.mcpMethod, duration
| filter metadata.mcpServer like /.+/
| stats count(), avg(duration), sum(level = "ERROR") by metadata.mcpServer
```

### Leads Lentos
```
fields leadId, agent, duration
| filter leadId like /.+/
| stats max(@timestamp) - min(@timestamp) as totalTime by leadId
| sort totalTime desc
| limit 20
```

## 📊 Análises Comuns

### Top 10 Erros
```
fields error.message
| filter level = "ERROR"
| stats count() by error.message
| sort count desc
| limit 10
```

### Sentimento por Hora
```
fields metadata.sentiment
| filter agent = "sentimento"
| stats count() by metadata.sentiment, bin(1h)
```

### Taxa de Resposta
```
fields agent
| filter agent in ["disparo", "atendimento"]
| stats count() by agent
```

### Custos Estimados
```
fields agent, @billedDuration, @memorySize
| stats 
    count() as invocations,
    sum(@billedDuration) / 1000 as totalSeconds
  by agent
```

## 🔍 Troubleshooting

### Trace Específico
```
fields @timestamp, agent, message
| filter traceId = "YOUR_TRACE_ID"
| sort @timestamp asc
```

### Lead Específico
```
fields @timestamp, agent, message, classification
| filter leadId = "YOUR_LEAD_ID"
| sort @timestamp asc
```

### Erros Recentes
```
fields @timestamp, agent, error.message, traceId
| filter level = "ERROR"
| sort @timestamp desc
| limit 50
```

## 💡 Dicas

- Use `bin(1h)` para agrupar por hora
- Use `pct(field, 95)` para percentil 95
- Use `latest(field)` para último valor
- Use `filter field like /.+/` para campo não vazio
- Use `limit` para reduzir resultados

## 📍 Acesso Rápido

**Console**: CloudWatch > Logs > Insights > Select saved queries

**CLI**:
```bash
aws logs start-query \
  --log-group-name "/aws/lambda/FibonacciStack-prod-ApiHandler" \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'YOUR_QUERY_HERE'
```

## 🎯 Queries por Caso de Uso

| Caso de Uso | Query |
|-------------|-------|
| Sistema lento | Latência por Endpoint |
| Muitos erros | Erros por Agente |
| Lead travado | Trace Específico |
| Campanha ruim | Taxa de Resposta |
| Custo alto | Custos Estimados |
| LGPD audit | Conformidade LGPD |

## 📚 Documentação Completa

Ver: [CLOUDWATCH-INSIGHTS-QUERIES.md](./CLOUDWATCH-INSIGHTS-QUERIES.md)

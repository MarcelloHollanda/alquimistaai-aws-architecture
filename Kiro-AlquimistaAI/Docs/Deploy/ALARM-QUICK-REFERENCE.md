# CloudWatch Alarms - Quick Reference Guide

## 🚨 Alarmes Ativos - Ações Imediatas

### 🔴 CRÍTICO - Ação Imediata Necessária

#### High Error Rate Alarm
```bash
# 1. Ver últimos erros
aws logs tail /aws/lambda/fibonacci-api-handler-{env} --follow --filter-pattern "ERROR"

# 2. Ver X-Ray traces
aws xray get-trace-summaries --start-time $(date -u -d '10 minutes ago' +%s) --end-time $(date -u +%s)

# 3. Se necessário, rollback
git checkout {previous-commit}
npm run deploy:{env}
```

#### DLQ Not Empty Alarm
```bash
# 1. Inspecionar mensagens
aws sqs receive-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/{account}/fibonacci-dlq-{env} \
  --max-number-of-messages 10

# 2. Após correção, reprocessar
aws sqs receive-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/{account}/fibonacci-dlq-{env} \
  --max-number-of-messages 10 | \
jq -r '.Messages[] | .Body' | \
while read body; do
  aws sqs send-message \
    --queue-url https://sqs.us-east-1.amazonaws.com/{account}/fibonacci-main-{env} \
    --message-body "$body"
done

# 3. Purgar DLQ
aws sqs purge-queue \
  --queue-url https://sqs.us-east-1.amazonaws.com/{account}/fibonacci-dlq-{env}
```

#### API Gateway 5xx Errors
```bash
# 1. Ver logs do API Gateway
aws logs tail /aws/apigateway/{api-id}/{env} --follow

# 2. Verificar status da Lambda
aws lambda get-function --function-name fibonacci-api-handler-{env}

# 3. Testar endpoint
curl -v https://{api-url}/health
```

---

### 🟡 ALTA - Investigar em até 30 minutos

#### High Latency Alarm
```bash
# 1. Ver traces lentas no X-Ray
aws xray get-trace-summaries \
  --start-time $(date -u -d '30 minutes ago' +%s) \
  --end-time $(date -u +%s) \
  --filter-expression 'duration > 3'

# 2. Verificar CPU do Aurora
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBClusterIdentifier,Value=fibonacci-cluster-{env} \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average

# 3. Verificar conexões do banco
aws rds describe-db-clusters \
  --db-cluster-identifier fibonacci-cluster-{env} \
  --query 'DBClusters[0].DatabaseConnections'
```

#### Aurora CPU High Alarm
```bash
# 1. Conectar ao banco e verificar queries lentas
psql -h {aurora-endpoint} -U dbadmin -d fibonacci -c "
  SELECT query, calls, total_time, mean_time 
  FROM pg_stat_statements 
  ORDER BY total_time DESC 
  LIMIT 10;
"

# 2. Verificar conexões ativas
psql -h {aurora-endpoint} -U dbadmin -d fibonacci -c "
  SELECT count(*), state 
  FROM pg_stat_activity 
  GROUP BY state;
"

# 3. Se necessário, aumentar capacidade (temporário)
# Editar lib/fibonacci-stack.ts e aumentar serverlessV2MaxCapacity
npm run deploy:{env}
```

#### Lambda Throttle Alarm
```bash
# 1. Verificar limite de concorrência
aws lambda get-account-settings

# 2. Verificar concorrência atual
aws lambda get-function-concurrency \
  --function-name fibonacci-api-handler-{env}

# 3. Adicionar reserved concurrency (se necessário)
aws lambda put-function-concurrency \
  --function-name fibonacci-api-handler-{env} \
  --reserved-concurrent-executions 100
```

---

### 🟢 MÉDIA - Monitorar

#### Old Messages Alarm
```bash
# 1. Verificar idade das mensagens
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/{account}/fibonacci-main-{env} \
  --attribute-names ApproximateAgeOfOldestMessage

# 2. Verificar número de mensagens
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/{account}/fibonacci-main-{env} \
  --attribute-names ApproximateNumberOfMessages

# 3. Verificar se consumers estão rodando
aws lambda get-function \
  --function-name fibonacci-api-handler-{env} \
  --query 'Configuration.State'
```

#### Estimated Cost High Alarm
```bash
# 1. Ver invocações por hora
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=fibonacci-api-handler-{env} \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum

# 2. Ver custos estimados no Cost Explorer
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d '7 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --filter file://cost-filter.json

# 3. Verificar se há loop ou retry excessivo
aws logs tail /aws/lambda/fibonacci-api-handler-{env} --follow --filter-pattern "retry"
```

---

## 📊 Comandos Úteis

### Ver Status de Todos os Alarmes
```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix fibonacci- \
  --state-value ALARM \
  --query 'MetricAlarms[*].[AlarmName,StateValue,StateReason]' \
  --output table
```

### Ver Histórico de Alarme
```bash
aws cloudwatch describe-alarm-history \
  --alarm-name fibonacci-high-error-rate-{env} \
  --history-item-type StateUpdate \
  --start-date $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
  --max-records 50
```

### Silenciar Alarme Temporariamente
```bash
# Desabilitar ações do alarme
aws cloudwatch disable-alarm-actions \
  --alarm-names fibonacci-high-error-rate-{env}

# Reabilitar após manutenção
aws cloudwatch enable-alarm-actions \
  --alarm-names fibonacci-high-error-rate-{env}
```

### Testar Notificação SNS
```bash
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:{account}:fibonacci-alarms-{env} \
  --subject "Teste de Notificação" \
  --message "Este é um teste de notificação do sistema de alarmes"
```

---

## 🔧 Troubleshooting Rápido

### Lambda não está respondendo
```bash
# 1. Verificar estado
aws lambda get-function --function-name fibonacci-api-handler-{env}

# 2. Ver últimos logs
aws logs tail /aws/lambda/fibonacci-api-handler-{env} --follow

# 3. Invocar manualmente
aws lambda invoke \
  --function-name fibonacci-api-handler-{env} \
  --payload '{"httpMethod":"GET","path":"/health"}' \
  response.json
```

### Aurora não está acessível
```bash
# 1. Verificar status do cluster
aws rds describe-db-clusters \
  --db-cluster-identifier fibonacci-cluster-{env} \
  --query 'DBClusters[0].Status'

# 2. Verificar security groups
aws ec2 describe-security-groups \
  --filters Name=tag:Name,Values=*DbSg* \
  --query 'SecurityGroups[*].[GroupId,GroupName,IpPermissions]'

# 3. Testar conectividade
nc -zv {aurora-endpoint} 5432
```

### EventBridge não está roteando eventos
```bash
# 1. Verificar regras
aws events list-rules \
  --event-bus-name fibonacci-bus-{env}

# 2. Ver métricas de eventos
aws cloudwatch get-metric-statistics \
  --namespace AWS/Events \
  --metric-name Invocations \
  --dimensions Name=RuleName,Value=nigredo-routing-{env} \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# 3. Testar publicação de evento
aws events put-events \
  --entries '[{"Source":"fibonacci.demo","DetailType":"test","Detail":"{}","EventBusName":"fibonacci-bus-{env}"}]'
```

---

## 📞 Contatos de Escalação

| Severidade | Tempo de Resposta | Contato |
|------------|-------------------|---------|
| 🔴 CRÍTICO | Imediato | ops@alquimista.ai + PagerDuty |
| 🟡 ALTA | 30 minutos | ops@alquimista.ai |
| 🟢 MÉDIA | 2 horas | devops@alquimista.ai |

---

## 📝 Checklist Pós-Incidente

- [ ] Alarme voltou ao estado OK
- [ ] Causa raiz identificada
- [ ] Correção aplicada e testada
- [ ] Documentação atualizada
- [ ] Post-mortem criado (para incidentes críticos)
- [ ] Ações preventivas definidas
- [ ] Stakeholders notificados

---

**Dica**: Salve este documento localmente e mantenha-o acessível durante plantões!

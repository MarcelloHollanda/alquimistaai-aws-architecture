# Comandos Úteis - Observabilidade

## 📋 CloudWatch Logs

### Ver logs em tempo real

```bash
# Tenant API
aws logs tail /aws/lambda/operational-dashboard-tenant-api --follow

# Internal API
aws logs tail /aws/lambda/operational-dashboard-internal-api --follow

# Operational Commands
aws logs tail /aws/lambda/operational-dashboard-commands --follow

# Aggregate Metrics
aws logs tail /aws/lambda/operational-dashboard-aggregate-metrics --follow
```

### Ver logs com filtro

```bash
# Apenas erros
aws logs tail /aws/lambda/operational-dashboard-tenant-api \
  --follow \
  --filter-pattern "ERROR"

# Por tenant específico
aws logs tail /aws/lambda/operational-dashboard-tenant-api \
  --follow \
  --filter-pattern "{ $.tenantId = \"tenant-123\" }"

# Por usuário específico
aws logs tail /aws/lambda/operational-dashboard-internal-api \
  --follow \
  --filter-pattern "{ $.userId = \"user-456\" }"
```

### Buscar logs históricos

```bash
# Últimas 100 linhas
aws logs tail /aws/lambda/operational-dashboard-tenant-api \
  --since 1h \
  --format short

# Últimas 24 horas
aws logs tail /aws/lambda/operational-dashboard-tenant-api \
  --since 24h \
  --format detailed
```

## 🔍 CloudWatch Logs Insights

### Executar query

```bash
# Definir variáveis
LOG_GROUP="/aws/lambda/operational-dashboard-tenant-api"
START_TIME=$(date -d '1 hour ago' +%s)
END_TIME=$(date +%s)

# Executar query
QUERY_ID=$(aws logs start-query \
  --log-group-name "$LOG_GROUP" \
  --start-time $START_TIME \
  --end-time $END_TIME \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | limit 20' \
  --query 'queryId' \
  --output text)

echo "Query ID: $QUERY_ID"

# Aguardar e obter resultados
sleep 5
aws logs get-query-results --query-id "$QUERY_ID"
```

### Queries úteis via CLI

**Erros por tenant:**
```bash
aws logs start-query \
  --log-group-name /aws/lambda/operational-dashboard-tenant-api \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, tenantId, @message | filter @message like /ERROR/ | stats count() by tenantId | sort count desc'
```

**Latência média:**
```bash
aws logs start-query \
  --log-group-name /aws/lambda/operational-dashboard-tenant-api \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, path, @duration | filter path like /\/tenant\// | stats avg(@duration) as avgLatency by path'
```

**Comandos operacionais:**
```bash
aws logs start-query \
  --log-group-name /aws/lambda/operational-dashboard-commands \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, commandType, status | stats count() by commandType, status'
```

## 📊 CloudWatch Metrics

### Listar métricas customizadas

```bash
# Todas as métricas do namespace
aws cloudwatch list-metrics \
  --namespace AlquimistaAI/OperationalDashboard

# Métricas específicas
aws cloudwatch list-metrics \
  --namespace AlquimistaAI/OperationalDashboard \
  --metric-name TenantAPICall

# Com dimensões
aws cloudwatch list-metrics \
  --namespace AlquimistaAI/OperationalDashboard \
  --dimensions Name=TenantId,Value=tenant-123
```

### Obter estatísticas de métrica

```bash
# Últimas 24 horas
aws cloudwatch get-metric-statistics \
  --namespace AlquimistaAI/OperationalDashboard \
  --metric-name TenantAPICall \
  --start-time $(date -d '24 hours ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 3600 \
  --statistics Sum \
  --dimensions Name=TenantId,Value=tenant-123

# Com múltiplas estatísticas
aws cloudwatch get-metric-statistics \
  --namespace AlquimistaAI/OperationalDashboard \
  --metric-name APILatency \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Average,Maximum,Minimum \
  --dimensions Name=Endpoint,Value=/tenant/me
```

### Obter dados de métrica (mais recente)

```bash
aws cloudwatch get-metric-data \
  --metric-data-queries '[
    {
      "Id": "m1",
      "MetricStat": {
        "Metric": {
          "Namespace": "AlquimistaAI/OperationalDashboard",
          "MetricName": "TenantAPICall",
          "Dimensions": [
            {
              "Name": "TenantId",
              "Value": "tenant-123"
            }
          ]
        },
        "Period": 300,
        "Stat": "Sum"
      }
    }
  ]' \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601)
```

## 🚨 CloudWatch Alarms

### Listar alarmes

```bash
# Todos os alarmes do painel operacional
aws cloudwatch describe-alarms \
  --alarm-name-prefix OperationalDashboard

# Apenas alarmes em estado ALARM
aws cloudwatch describe-alarms \
  --alarm-name-prefix OperationalDashboard \
  --state-value ALARM

# Apenas alarmes em estado OK
aws cloudwatch describe-alarms \
  --alarm-name-prefix OperationalDashboard \
  --state-value OK
```

### Ver histórico de alarme

```bash
aws cloudwatch describe-alarm-history \
  --alarm-name OperationalDashboard-TenantAPI-HighErrorRate \
  --max-records 10
```

### Desabilitar alarme temporariamente

```bash
aws cloudwatch disable-alarm-actions \
  --alarm-names OperationalDashboard-TenantAPI-HighErrorRate
```

### Habilitar alarme

```bash
aws cloudwatch enable-alarm-actions \
  --alarm-names OperationalDashboard-TenantAPI-HighErrorRate
```

### Testar alarme (forçar estado)

```bash
# Forçar estado ALARM
aws cloudwatch set-alarm-state \
  --alarm-name OperationalDashboard-TenantAPI-HighErrorRate \
  --state-value ALARM \
  --state-reason "Testing alarm notification"

# Voltar para OK
aws cloudwatch set-alarm-state \
  --alarm-name OperationalDashboard-TenantAPI-HighErrorRate \
  --state-value OK \
  --state-reason "Test complete"
```

## 🔬 X-Ray

### Listar traces

```bash
# Últimas 6 horas
aws xray get-trace-summaries \
  --start-time $(date -d '6 hours ago' +%s) \
  --end-time $(date +%s)

# Com filtro de erro
aws xray get-trace-summaries \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --filter-expression 'error = true'

# Por tenant específico
aws xray get-trace-summaries \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --filter-expression 'annotation.tenantId = "tenant-123"'
```

### Obter detalhes de trace

```bash
# Obter IDs de traces
TRACE_IDS=$(aws xray get-trace-summaries \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --query 'TraceSummaries[0:5].Id' \
  --output text)

# Obter detalhes
aws xray batch-get-traces --trace-ids $TRACE_IDS
```

### Ver service graph

```bash
aws xray get-service-graph \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s)
```

## 📈 Lambda Insights

### Ver métricas de função

```bash
# Invocações
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=operational-dashboard-tenant-api \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum

# Erros
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=operational-dashboard-tenant-api \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum

# Duração
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=operational-dashboard-tenant-api \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Average,Maximum

# Throttles
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Throttles \
  --dimensions Name=FunctionName,Value=operational-dashboard-tenant-api \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum
```

## 🔧 Scripts Úteis

### Script: Monitorar erros em tempo real

```bash
#!/bin/bash
# monitor-errors.sh

LOG_GROUP="/aws/lambda/operational-dashboard-tenant-api"

echo "Monitoring errors in $LOG_GROUP..."
echo "Press Ctrl+C to stop"
echo ""

aws logs tail "$LOG_GROUP" \
  --follow \
  --filter-pattern "ERROR" \
  --format short
```

### Script: Relatório de métricas diário

```bash
#!/bin/bash
# daily-metrics-report.sh

NAMESPACE="AlquimistaAI/OperationalDashboard"
START_TIME=$(date -d '24 hours ago' --iso-8601)
END_TIME=$(date --iso-8601)

echo "=== Daily Metrics Report ==="
echo "Period: $START_TIME to $END_TIME"
echo ""

# Tenant API Calls
echo "Tenant API Calls:"
aws cloudwatch get-metric-statistics \
  --namespace "$NAMESPACE" \
  --metric-name TenantAPICall \
  --start-time "$START_TIME" \
  --end-time "$END_TIME" \
  --period 86400 \
  --statistics Sum \
  --query 'Datapoints[0].Sum' \
  --output text

# Internal API Calls
echo "Internal API Calls:"
aws cloudwatch get-metric-statistics \
  --namespace "$NAMESPACE" \
  --metric-name InternalAPICall \
  --start-time "$START_TIME" \
  --end-time "$END_TIME" \
  --period 86400 \
  --statistics Sum \
  --query 'Datapoints[0].Sum' \
  --output text

# Operational Commands
echo "Operational Commands Created:"
aws cloudwatch get-metric-statistics \
  --namespace "$NAMESPACE" \
  --metric-name OperationalCommandCreated \
  --start-time "$START_TIME" \
  --end-time "$END_TIME" \
  --period 86400 \
  --statistics Sum \
  --query 'Datapoints[0].Sum' \
  --output text

# Cache Hit Rate
echo "Cache Hit Rate:"
HITS=$(aws cloudwatch get-metric-statistics \
  --namespace "$NAMESPACE" \
  --metric-name CacheHit \
  --start-time "$START_TIME" \
  --end-time "$END_TIME" \
  --period 86400 \
  --statistics Sum \
  --query 'Datapoints[0].Sum' \
  --output text)

MISSES=$(aws cloudwatch get-metric-statistics \
  --namespace "$NAMESPACE" \
  --metric-name CacheMiss \
  --start-time "$START_TIME" \
  --end-time "$END_TIME" \
  --period 86400 \
  --statistics Sum \
  --query 'Datapoints[0].Sum' \
  --output text)

if [ "$HITS" != "None" ] && [ "$MISSES" != "None" ]; then
  TOTAL=$((HITS + MISSES))
  RATE=$(echo "scale=2; $HITS / $TOTAL * 100" | bc)
  echo "${RATE}%"
else
  echo "N/A"
fi
```

### Script: Verificar saúde do sistema

```bash
#!/bin/bash
# health-check.sh

echo "=== System Health Check ==="
echo ""

# Verificar alarmes ativos
echo "Active Alarms:"
ALARMS=$(aws cloudwatch describe-alarms \
  --alarm-name-prefix OperationalDashboard \
  --state-value ALARM \
  --query 'MetricAlarms[].AlarmName' \
  --output text)

if [ -z "$ALARMS" ]; then
  echo "✅ No active alarms"
else
  echo "⚠️  Active alarms:"
  echo "$ALARMS"
fi
echo ""

# Verificar erros recentes
echo "Recent Errors (last hour):"
ERROR_COUNT=$(aws logs start-query \
  --log-group-name /aws/lambda/operational-dashboard-tenant-api \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @message | filter @message like /ERROR/ | stats count()' \
  --query 'queryId' \
  --output text)

sleep 5
ERRORS=$(aws logs get-query-results --query-id "$ERROR_COUNT" \
  --query 'results[0][0].value' \
  --output text)

if [ "$ERRORS" = "0" ] || [ -z "$ERRORS" ]; then
  echo "✅ No errors"
else
  echo "⚠️  $ERRORS errors found"
fi
echo ""

# Verificar latência
echo "Average Latency (last hour):"
aws cloudwatch get-metric-statistics \
  --namespace AlquimistaAI/OperationalDashboard \
  --metric-name APILatency \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 3600 \
  --statistics Average \
  --query 'Datapoints[0].Average' \
  --output text | awk '{printf "%.0f ms\n", $1}'
```

## 📝 Notas

### Formato de tempo

```bash
# Unix timestamp (segundos desde 1970)
date +%s

# ISO 8601
date --iso-8601

# Relativo
date -d '1 hour ago' +%s
date -d '24 hours ago' --iso-8601
date -d '7 days ago' +%s
```

### Filtros de log pattern

```bash
# Texto simples
--filter-pattern "ERROR"

# JSON field
--filter-pattern "{ $.tenantId = \"tenant-123\" }"

# Múltiplos campos
--filter-pattern "{ $.tenantId = \"tenant-123\" && $.statusCode = 500 }"

# Regex
--filter-pattern "[ERROR]"
```

### Permissões necessárias

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
        "logs:GetLogEvents",
        "logs:FilterLogEvents",
        "logs:StartQuery",
        "logs:GetQueryResults",
        "logs:Tail",
        "cloudwatch:DescribeAlarms",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:GetMetricData",
        "cloudwatch:ListMetrics",
        "xray:GetTraceSummaries",
        "xray:BatchGetTraces",
        "xray:GetServiceGraph"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🔗 Links Úteis

- [AWS CLI CloudWatch Logs](https://docs.aws.amazon.com/cli/latest/reference/logs/)
- [AWS CLI CloudWatch](https://docs.aws.amazon.com/cli/latest/reference/cloudwatch/)
- [AWS CLI X-Ray](https://docs.aws.amazon.com/cli/latest/reference/xray/)
- [CloudWatch Logs Insights Query Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)

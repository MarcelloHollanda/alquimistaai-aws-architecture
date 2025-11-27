# Comandos Rápidos - CloudWatch Observability

## 🚀 Deploy e Build

### Compilar e Sintetizar
```bash
# Compilar TypeScript
npm run build

# Sintetizar template (dev)
cdk synth ObservabilityDashboardStack-dev --context env=dev

# Sintetizar template (prod)
cdk synth ObservabilityDashboardStack-prod --context env=prod

# Ver diferenças antes do deploy
cdk diff ObservabilityDashboardStack-dev --context env=dev
```

### Deploy
```bash
# Deploy em dev
cdk deploy ObservabilityDashboardStack-dev --context env=dev

# Deploy em prod
cdk deploy ObservabilityDashboardStack-prod --context env=prod

# Deploy com aprovação automática
cdk deploy ObservabilityDashboardStack-dev --context env=dev --require-approval never

# Deploy de todas as stacks
cdk deploy --all --context env=dev
```

### Destruir Stack
```bash
# Remover stack de dev
cdk destroy ObservabilityDashboardStack-dev --context env=dev

# Remover stack de prod (cuidado!)
cdk destroy ObservabilityDashboardStack-prod --context env=prod
```

## 📊 Dashboards

### Listar Dashboards
```bash
# Listar todos os dashboards
aws cloudwatch list-dashboards

# Listar dashboards com filtro
aws cloudwatch list-dashboards --dashboard-name-prefix AlquimistaAI

# Formato JSON
aws cloudwatch list-dashboards --output json
```

### Obter Dashboard
```bash
# Obter definição completa
aws cloudwatch get-dashboard --dashboard-name AlquimistaAI-Core-System-dev

# Salvar em arquivo
aws cloudwatch get-dashboard \
  --dashboard-name AlquimistaAI-Core-System-dev \
  --output json > dashboard-backup.json

# Ver apenas o body
aws cloudwatch get-dashboard \
  --dashboard-name AlquimistaAI-Core-System-dev \
  --query 'DashboardBody' \
  --output text | jq .
```

### Criar/Atualizar Dashboard
```bash
# Criar dashboard a partir de arquivo
aws cloudwatch put-dashboard \
  --dashboard-name MeuDashboard \
  --dashboard-body file://dashboard.json

# Atualizar dashboard existente
aws cloudwatch put-dashboard \
  --dashboard-name AlquimistaAI-Core-System-dev \
  --dashboard-body file://dashboard-updated.json
```

### Deletar Dashboard
```bash
# Deletar um dashboard
aws cloudwatch delete-dashboards --dashboard-names AlquimistaAI-Test

# Deletar múltiplos dashboards
aws cloudwatch delete-dashboards \
  --dashboard-names AlquimistaAI-Test1 AlquimistaAI-Test2
```

## 📈 Métricas

### Listar Métricas
```bash
# Listar todas as métricas customizadas
aws cloudwatch list-metrics --namespace AlquimistaAI/Business

# Listar métricas de Lambda
aws cloudwatch list-metrics --namespace AWS/Lambda

# Listar métricas com dimensão específica
aws cloudwatch list-metrics \
  --namespace AWS/Lambda \
  --dimensions Name=FunctionName,Value=fibonacci-handler
```

### Obter Estatísticas de Métricas
```bash
# Última hora - Active Tenants
aws cloudwatch get-metric-statistics \
  --namespace AlquimistaAI/Business \
  --metric-name ActiveTenants \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Maximum

# Últimas 24h - Lambda Errors
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=fibonacci-handler \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum

# API Gateway Latency com percentis
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Latency \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,p95,p99
```

### Publicar Métricas Customizadas
```bash
# Publicar métrica simples
aws cloudwatch put-metric-data \
  --namespace AlquimistaAI/Business \
  --metric-name ActiveTenants \
  --value 42

# Publicar com timestamp
aws cloudwatch put-metric-data \
  --namespace AlquimistaAI/Business \
  --metric-name Revenue \
  --value 1500.50 \
  --timestamp $(date -u +%Y-%m-%dT%H:%M:%S)

# Publicar com dimensões
aws cloudwatch put-metric-data \
  --namespace AlquimistaAI/Agents \
  --metric-name ExecutionTime \
  --value 250 \
  --dimensions AgentType=recebimento

# Publicar múltiplas métricas
aws cloudwatch put-metric-data \
  --namespace AlquimistaAI/Business \
  --metric-data \
    MetricName=ActiveTenants,Value=42,Timestamp=$(date -u +%Y-%m-%dT%H:%M:%S) \
    MetricName=Revenue,Value=1500.50,Timestamp=$(date -u +%Y-%m-%dT%H:%M:%S)
```

## 🔔 Alarmes

### Listar Alarmes
```bash
# Listar todos os alarmes
aws cloudwatch describe-alarms

# Listar alarmes por estado
aws cloudwatch describe-alarms --state-value ALARM
aws cloudwatch describe-alarms --state-value OK
aws cloudwatch describe-alarms --state-value INSUFFICIENT_DATA

# Listar alarmes específicos
aws cloudwatch describe-alarms \
  --alarm-names \
    ObservabilityDashboardStack-dev-LambdaErrorRateAlarm \
    ObservabilityDashboardStack-dev-APIGatewayLatencyAlarm
```

### Obter Histórico de Alarmes
```bash
# Histórico de um alarme
aws cloudwatch describe-alarm-history \
  --alarm-name ObservabilityDashboardStack-dev-LambdaErrorRateAlarm \
  --max-records 10

# Histórico com filtro de tipo
aws cloudwatch describe-alarm-history \
  --alarm-name ObservabilityDashboardStack-dev-LambdaErrorRateAlarm \
  --history-item-type StateUpdate
```

### Habilitar/Desabilitar Alarmes
```bash
# Desabilitar alarme
aws cloudwatch disable-alarm-actions \
  --alarm-names ObservabilityDashboardStack-dev-LambdaErrorRateAlarm

# Habilitar alarme
aws cloudwatch enable-alarm-actions \
  --alarm-names ObservabilityDashboardStack-dev-LambdaErrorRateAlarm

# Desabilitar múltiplos alarmes
aws cloudwatch disable-alarm-actions \
  --alarm-names \
    ObservabilityDashboardStack-dev-LambdaErrorRateAlarm \
    ObservabilityDashboardStack-dev-APIGatewayLatencyAlarm
```

### Testar Alarme
```bash
# Forçar estado de alarme (para teste)
aws cloudwatch set-alarm-state \
  --alarm-name ObservabilityDashboardStack-dev-LambdaErrorRateAlarm \
  --state-value ALARM \
  --state-reason "Teste manual"

# Voltar ao estado OK
aws cloudwatch set-alarm-state \
  --alarm-name ObservabilityDashboardStack-dev-LambdaErrorRateAlarm \
  --state-value OK \
  --state-reason "Teste concluído"
```

### Deletar Alarmes
```bash
# Deletar um alarme
aws cloudwatch delete-alarms \
  --alarm-names ObservabilityDashboardStack-dev-TestAlarm

# Deletar múltiplos alarmes
aws cloudwatch delete-alarms \
  --alarm-names \
    ObservabilityDashboardStack-dev-TestAlarm1 \
    ObservabilityDashboardStack-dev-TestAlarm2
```

## 📧 SNS (Notificações)

### Listar Tópicos
```bash
# Listar todos os tópicos
aws sns list-topics

# Filtrar tópicos AlquimistaAI
aws sns list-topics | grep alquimista-ai
```

### Listar Subscrições
```bash
# Listar todas as subscrições
aws sns list-subscriptions

# Listar subscrições de um tópico
aws sns list-subscriptions-by-topic \
  --topic-arn arn:aws:sns:us-east-1:123456789:alquimista-ai-alerts-dev
```

### Publicar Mensagem de Teste
```bash
# Enviar mensagem de teste
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:123456789:alquimista-ai-alerts-dev \
  --message "Teste de notificação AlquimistaAI" \
  --subject "Teste"

# Enviar com atributos
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:123456789:alquimista-ai-alerts-dev \
  --message "Alerta crítico de teste" \
  --subject "CRITICAL: Teste" \
  --message-attributes '{"severity":{"DataType":"String","StringValue":"CRITICAL"}}'
```

### Adicionar Subscrição
```bash
# Adicionar email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789:alquimista-ai-alerts-dev \
  --protocol email \
  --notification-endpoint seu-email@empresa.com

# Adicionar SMS
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789:alquimista-ai-critical-alerts-dev \
  --protocol sms \
  --notification-endpoint +5584999999999
```

## 📋 CloudFormation

### Listar Stacks
```bash
# Listar todas as stacks
aws cloudformation list-stacks

# Listar apenas stacks ativas
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# Filtrar por nome
aws cloudformation list-stacks | grep ObservabilityDashboard
```

### Descrever Stack
```bash
# Informações completas da stack
aws cloudformation describe-stacks \
  --stack-name ObservabilityDashboardStack-dev

# Ver apenas outputs
aws cloudformation describe-stacks \
  --stack-name ObservabilityDashboardStack-dev \
  --query 'Stacks[0].Outputs'

# Ver apenas recursos
aws cloudformation describe-stack-resources \
  --stack-name ObservabilityDashboardStack-dev
```

### Ver Eventos da Stack
```bash
# Últimos eventos
aws cloudformation describe-stack-events \
  --stack-name ObservabilityDashboardStack-dev \
  --max-items 20

# Eventos em tempo real (durante deploy)
aws cloudformation describe-stack-events \
  --stack-name ObservabilityDashboardStack-dev \
  --query 'StackEvents[*].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId]' \
  --output table
```

## 🔍 Logs

### Tail de Logs
```bash
# Seguir logs de Lambda
aws logs tail /aws/lambda/fibonacci-handler --follow

# Seguir com filtro
aws logs tail /aws/lambda/fibonacci-handler --follow --filter-pattern "ERROR"

# Últimas 100 linhas
aws logs tail /aws/lambda/fibonacci-handler --since 1h
```

### Buscar em Logs
```bash
# Buscar padrão específico
aws logs filter-log-events \
  --log-group-name /aws/lambda/fibonacci-handler \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '1 hour ago' +%s)000

# Buscar em múltiplos log groups
aws logs filter-log-events \
  --log-group-name-prefix /aws/lambda/ \
  --filter-pattern "timeout"
```

## 🛠️ Utilitários

### Obter ARN de Recursos
```bash
# ARN do tópico SNS
aws sns list-topics --query 'Topics[?contains(TopicArn, `alquimista-ai-alerts`)].TopicArn' --output text

# ARN de Lambda
aws lambda get-function --function-name fibonacci-handler --query 'Configuration.FunctionArn' --output text

# ARN de API Gateway
aws apigateway get-rest-apis --query 'items[?name==`fibonacci-api`].id' --output text
```

### Exportar Configuração
```bash
# Exportar todos os dashboards
for dashboard in $(aws cloudwatch list-dashboards --query 'DashboardEntries[*].DashboardName' --output text); do
  aws cloudwatch get-dashboard --dashboard-name $dashboard > "backup-${dashboard}.json"
done

# Exportar todos os alarmes
aws cloudwatch describe-alarms > backup-alarms.json
```

### Validar JSON
```bash
# Validar arquivo de dashboard
cat dashboard.json | jq .

# Validar e formatar
cat dashboard.json | jq . > dashboard-formatted.json
```

## 📊 Queries Úteis

### Top 10 Lambdas com Mais Erros
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Sum \
  --query 'sort_by(Datapoints, &Sum)[-10:]'
```

### Custo Estimado Mensal
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Billing \
  --metric-name EstimatedCharges \
  --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Maximum \
  --dimensions Name=Currency,Value=USD
```

### Health Check Rápido
```bash
#!/bin/bash
echo "=== AlquimistaAI Health Check ==="
echo ""
echo "Dashboards:"
aws cloudwatch list-dashboards --dashboard-name-prefix AlquimistaAI --query 'DashboardEntries[*].DashboardName' --output table
echo ""
echo "Alarmes em ALARM:"
aws cloudwatch describe-alarms --state-value ALARM --query 'MetricAlarms[*].AlarmName' --output table
echo ""
echo "Métricas recentes:"
aws cloudwatch get-metric-statistics \
  --namespace AlquimistaAI/Business \
  --metric-name ActiveTenants \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Maximum \
  --query 'Datapoints[0].Maximum'
```

---

## 💡 Dicas

1. **Alias úteis** (adicione ao seu `.bashrc` ou `.zshrc`):
```bash
alias cw-dashboards='aws cloudwatch list-dashboards'
alias cw-alarms='aws cloudwatch describe-alarms --state-value ALARM'
alias cw-metrics='aws cloudwatch list-metrics --namespace AlquimistaAI/Business'
```

2. **Variáveis de ambiente**:
```bash
export AWS_REGION=us-east-1
export AWS_PROFILE=alquimista-dev
```

3. **JQ para filtros complexos**:
```bash
# Instalar jq
sudo apt-get install jq  # Ubuntu/Debian
brew install jq          # macOS

# Exemplo de uso
aws cloudwatch describe-alarms | jq '.MetricAlarms[] | select(.StateValue=="ALARM") | .AlarmName'
```

---

**Última Atualização**: 2024-11-23  
**Versão**: 1.0.0

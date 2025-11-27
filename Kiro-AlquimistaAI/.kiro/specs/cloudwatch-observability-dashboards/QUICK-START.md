# CloudWatch Observability Dashboards - Guia Rápido

## 🚀 Início Rápido

Este guia fornece os passos essenciais para começar a usar os dashboards de observabilidade do AlquimistaAI.

## 📋 Pré-requisitos

- AWS CLI configurado
- Node.js 18+ instalado
- AWS CDK instalado (`npm install -g aws-cdk`)
- Credenciais AWS com permissões adequadas
- Stacks Fibonacci e Nigredo já deployadas

## ⚡ Setup em 5 Minutos

### 1. Instalar Dependências

```bash
cd /path/to/alquimistaai-aws-architecture
npm install
```

### 2. Compilar TypeScript

```bash
npm run build
```

### 3. Sintetizar Template

```bash
# Para ambiente dev
cdk synth ObservabilityDashboardStack-dev --context env=dev

# Para ambiente prod
cdk synth ObservabilityDashboardStack-prod --context env=prod
```

### 4. Deploy

```bash
# Deploy em dev
cdk deploy ObservabilityDashboardStack-dev --context env=dev

# Deploy em prod (após validar em dev)
cdk deploy ObservabilityDashboardStack-prod --context env=prod
```

### 5. Acessar Dashboards

Após o deploy, os URLs dos dashboards serão exibidos nos outputs:

```
Outputs:
ObservabilityDashboardStack-dev.CoreDashboardURL = https://console.aws.amazon.com/cloudwatch/...
ObservabilityDashboardStack-dev.BusinessDashboardURL = https://console.aws.amazon.com/cloudwatch/...
ObservabilityDashboardStack-dev.AgentsDashboardURL = https://console.aws.amazon.com/cloudwatch/...
ObservabilityDashboardStack-dev.SecurityDashboardURL = https://console.aws.amazon.com/cloudwatch/...
```

## 📊 Dashboards Disponíveis

### 1. Core System Dashboard
**Quando usar**: Monitoramento de infraestrutura e troubleshooting técnico

**Principais métricas**:
- System Health Score
- Lambda Performance (Duration, Errors)
- API Gateway (Latency, Throughput, Errors)
- Database (CPU, Connections, Latency)

**Acesso rápido**:
```bash
aws cloudwatch get-dashboard --dashboard-name AlquimistaAI-Core-System-dev
```

### 2. Business Metrics Dashboard
**Quando usar**: Análise de KPIs e métricas de negócio

**Principais métricas**:
- Active Tenants
- Leads Today
- Revenue Today
- Lead Processing Funnel
- Subscription Trends

**Acesso rápido**:
```bash
aws cloudwatch get-dashboard --dashboard-name AlquimistaAI-Business-Metrics-dev
```

### 3. Agents Performance Dashboard
**Quando usar**: Otimização e troubleshooting de agentes IA

**Principais métricas**:
- Total Agent Executions
- Success Rate
- Execution Time by Type
- Resource Utilization

**Acesso rápido**:
```bash
aws cloudwatch get-dashboard --dashboard-name AlquimistaAI-Agents-Performance-dev
```

### 4. Security Dashboard
**Quando usar**: Monitoramento de segurança e detecção de ameaças

**Principais métricas**:
- Failed Login Attempts
- Blocked IPs
- Suspicious Activity
- Unauthorized Access

**Acesso rápido**:
```bash
aws cloudwatch get-dashboard --dashboard-name AlquimistaAI-Security-dev
```

## 🔔 Configurar Notificações

### Email

1. Após o deploy, você receberá um email de confirmação da AWS
2. Clique no link de confirmação para ativar as notificações
3. Você começará a receber alertas automaticamente

### SMS (Apenas Critical Alerts)

Para configurar SMS, adicione seu número ao deploy:

```typescript
// No bin/app.ts
new EnhancedObservabilityDashboardStack(app, 'ObservabilityDashboardStack-dev', {
  environment: 'dev',
  alertEmail: 'seu-email@empresa.com',
  alertPhone: '+5584999999999', // Adicione esta linha
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1'
  }
});
```

## 📈 Visualizar Métricas

### Via Console AWS

1. Acesse [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/)
2. No menu lateral, clique em "Dashboards"
3. Selecione o dashboard desejado
4. Use os controles de período para ajustar o intervalo de tempo

### Via AWS CLI

```bash
# Listar todos os dashboards
aws cloudwatch list-dashboards

# Obter métricas específicas
aws cloudwatch get-metric-statistics \
  --namespace AlquimistaAI/Business \
  --metric-name ActiveTenants \
  --start-time 2024-11-23T00:00:00Z \
  --end-time 2024-11-23T23:59:59Z \
  --period 3600 \
  --statistics Maximum
```

## 🚨 Responder a Alertas

### Quando Receber um Alerta

1. **Identifique a Severidade**
   - CRITICAL: Ação imediata necessária
   - HIGH: Investigar dentro de 1 hora
   - MEDIUM: Investigar dentro de 4 horas

2. **Acesse o Dashboard Relevante**
   - Erros de Lambda/API → Core System Dashboard
   - Problemas de negócio → Business Metrics Dashboard
   - Problemas de agentes → Agents Performance Dashboard
   - Incidentes de segurança → Security Dashboard

3. **Investigue a Causa Raiz**
   - Verifique os widgets relacionados
   - Compare com períodos anteriores
   - Verifique logs no CloudWatch Logs

4. **Tome Ação**
   - Escale se necessário
   - Documente o incidente
   - Implemente correções

### Alarmes Comuns e Soluções

#### Lambda Error Rate Alto
```bash
# Verificar logs de erros
aws logs tail /aws/lambda/sua-funcao --follow --filter-pattern "ERROR"

# Verificar métricas detalhadas
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=sua-funcao \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

#### API Gateway Latency Alta
```bash
# Verificar latência por rota
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Latency \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,p95,p99
```

#### Database CPU Alto
```bash
# Verificar queries lentas
aws rds describe-db-log-files --db-instance-identifier sua-instancia

# Verificar conexões ativas
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum
```

## 🔧 Troubleshooting

### Dashboard Não Aparece

```bash
# Verificar se a stack foi deployada
aws cloudformation describe-stacks --stack-name ObservabilityDashboardStack-dev

# Listar dashboards
aws cloudwatch list-dashboards
```

### Métricas Não Aparecem

1. Aguarde 5-10 minutos após o deploy
2. Verifique se as stacks Fibonacci e Nigredo estão rodando
3. Gere tráfego nas APIs para popular métricas
4. Verifique se as métricas customizadas estão sendo enviadas

### Alertas Não Chegam

```bash
# Verificar status do tópico SNS
aws sns list-subscriptions

# Verificar se o email foi confirmado
aws sns list-subscriptions-by-topic --topic-arn arn:aws:sns:us-east-1:123456789:alquimista-ai-alerts-dev

# Testar envio manual
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:123456789:alquimista-ai-alerts-dev \
  --message "Teste de alerta" \
  --subject "Teste AlquimistaAI"
```

## 📚 Próximos Passos

1. **Personalize os Dashboards**
   - Adicione widgets específicos do seu caso de uso
   - Ajuste períodos e estatísticas conforme necessário

2. **Configure Alertas Adicionais**
   - Defina thresholds baseados no seu SLA
   - Adicione mais canais de notificação (Slack, PagerDuty)

3. **Explore Métricas Customizadas**
   - Envie métricas específicas da sua aplicação
   - Crie dashboards personalizados por tenant

4. **Automatize Respostas**
   - Configure Lambda functions para auto-remediation
   - Implemente runbooks automatizados

## 🆘 Suporte

### Documentação
- [README](./README.md) - Visão geral completa
- [Design](./design.md) - Arquitetura detalhada
- [Tasks](./tasks.md) - Plano de implementação

### Comandos Úteis
```bash
# Ver outputs da stack
aws cloudformation describe-stacks \
  --stack-name ObservabilityDashboardStack-dev \
  --query 'Stacks[0].Outputs'

# Exportar dashboard para JSON
aws cloudwatch get-dashboard \
  --dashboard-name AlquimistaAI-Core-System-dev \
  --output json > dashboard-backup.json

# Listar todos os alarmes
aws cloudwatch describe-alarms --alarm-names \
  ObservabilityDashboardStack-dev-LambdaErrorRateAlarm \
  ObservabilityDashboardStack-dev-APIGatewayLatencyAlarm
```

### Contato
- **Email**: alquimistafibonacci@gmail.com
- **WhatsApp**: +55 84 99708-4444

---

**Dica**: Marque os URLs dos dashboards nos seus favoritos para acesso rápido durante incidentes! 🔖

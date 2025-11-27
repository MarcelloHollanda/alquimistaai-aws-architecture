# Guia de Guardrails - AlquimistaAI

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Guardrails de Segurança](#guardrails-de-segurança)
3. [Guardrails de Custo](#guardrails-de-custo)
4. [Guardrails de Observabilidade](#guardrails-de-observabilidade)
5. [Como Interpretar Alertas](#como-interpretar-alertas)
6. [Como Ajustar Configurações](#como-ajustar-configurações)
7. [Troubleshooting](#troubleshooting)

---

## Visão Geral

Guardrails são controles automatizados que monitoram e alertam sobre aspectos críticos do sistema. O AlquimistaAI implementa três categorias de guardrails:

- 🔒 **Segurança**: CloudTrail, GuardDuty, SNS
- 💰 **Custo**: AWS Budget, Cost Anomaly Detection
- 📊 **Observabilidade**: CloudWatch Alarms, Logs

### Por Que Guardrails?

- ✅ **Detecção Precoce**: Identificar problemas antes que se tornem críticos
- ✅ **Automação**: Reduzir carga manual de monitoramento
- ✅ **Conformidade**: Garantir aderência a políticas de segurança e custo
- ✅ **Visibilidade**: Ter clareza sobre o estado do sistema

---

## Guardrails de Segurança

### 1. AWS CloudTrail

**O que é**:
- Serviço de auditoria que registra todas as chamadas de API na AWS
- Cria trilha de auditoria completa de ações na conta

**O que Monitora**:
- ✅ Quem fez a ação (usuário/role)
- ✅ Quando foi feita (timestamp)
- ✅ Qual ação foi executada (API call)
- ✅ Quais recursos foram afetados
- ✅ De onde veio a requisição (IP)

**Configuração Atual**:
```typescript
// lib/security-stack.ts
const trailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
  bucketName: `alquimista-cloudtrail-logs-${accountId}-${env}`,
  encryption: s3.BucketEncryption.S3_MANAGED,
  lifecycleRules: [{
    expiration: cdk.Duration.days(90)
  }],
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
});

const trail = new cloudtrail.Trail(this, 'CloudTrail', {
  bucket: trailBucket,
  enableFileValidation: true,
  includeGlobalServiceEvents: true,
  isMultiRegionTrail: false
});
```

**Retenção**: 90 dias

**Onde Ver Logs**:
```powershell
# Listar eventos recentes
aws cloudtrail lookup-events `
  --max-results 50 `
  --region us-east-1

# Ver logs no S3
aws s3 ls s3://alquimista-cloudtrail-logs-ACCOUNT_ID-dev/
```

**Alertas**:
- Nenhum alerta automático configurado
- Logs disponíveis para auditoria manual ou SIEM

---

### 2. Amazon GuardDuty

**O que é**:
- Serviço de detecção de ameaças que monitora atividades maliciosas
- Usa machine learning para identificar comportamentos anormais

**O que Monitora**:
- ✅ Atividades de reconhecimento (port scanning)
- ✅ Instâncias comprometidas
- ✅ Contas comprometidas
- ✅ Acesso não autorizado a dados
- ✅ Comunicação com IPs maliciosos
- ✅ Mineração de criptomoedas

**Configuração Atual**:
```typescript
// lib/security-stack.ts
const guardDutyDetector = new guardduty.CfnDetector(this, 'GuardDutyDetector', {
  enable: true,
  findingPublishingFrequency: 'FIFTEEN_MINUTES',
  dataSources: {
    s3Logs: { enable: true }
  }
});
```

**Severidades**:
- 🔴 **HIGH** (7.0-8.9): Ação imediata necessária
- 🟠 **MEDIUM** (4.0-6.9): Investigar em breve
- 🟡 **LOW** (0.1-3.9): Monitorar

**Alertas Configurados**:
- ✅ Findings HIGH ou CRITICAL → SNS `alquimista-security-alerts`

**Onde Ver Findings**:
```powershell
# Listar findings ativos
aws guardduty list-findings `
  --detector-id <detector-id> `
  --region us-east-1

# Ver detalhes de um finding
aws guardduty get-findings `
  --detector-id <detector-id> `
  --finding-ids <finding-id> `
  --region us-east-1
```

**Console AWS**:
- https://console.aws.amazon.com/guardduty/

---

### 3. SNS Topic - Security Alerts

**O que é**:
- Tópico SNS dedicado para alertas de segurança
- Recebe notificações de GuardDuty

**Configuração Atual**:
```typescript
// lib/security-stack.ts
const securityAlertsTopic = new sns.Topic(this, 'SecurityAlertsTopic', {
  topicName: `alquimista-security-alerts-${env}`,
  displayName: 'AlquimistaAI Security Alerts'
});

// Assinatura via variável de ambiente
if (process.env.SECURITY_ALERT_EMAIL) {
  securityAlertsTopic.addSubscription(
    new subscriptions.EmailSubscription(process.env.SECURITY_ALERT_EMAIL)
  );
}
```

**Como Configurar Email**:
```powershell
# Definir variável de ambiente antes do deploy
$env:SECURITY_ALERT_EMAIL = "security@alquimista.ai"
cdk deploy SecurityStack --context env=dev
```

**Formato de Alerta**:
```json
{
  "AlarmName": "GuardDuty-HIGH-Finding",
  "NewStateValue": "ALARM",
  "NewStateReason": "GuardDuty detected a HIGH severity finding",
  "Finding": {
    "Severity": 8.5,
    "Type": "UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration",
    "Description": "Credentials that were created exclusively for an EC2 instance are being used from an external IP address"
  }
}
```

---

## Guardrails de Custo

### 1. AWS Budget

**O que é**:
- Orçamento mensal configurável
- Alertas quando gastos atingem thresholds

**Configuração Atual**:
```typescript
// lib/security-stack.ts
const monthlyBudget = new budgets.CfnBudget(this, 'MonthlyBudget', {
  budget: {
    budgetName: `alquimista-monthly-budget-${env}`,
    budgetType: 'COST',
    timeUnit: 'MONTHLY',
    budgetLimit: {
      amount: budgetAmount, // Default: $500
      unit: 'USD'
    }
  },
  notificationsWithSubscribers: [
    {
      notification: {
        notificationType: 'ACTUAL',
        comparisonOperator: 'GREATER_THAN',
        threshold: 80
      },
      subscribers: [{ subscriptionType: 'SNS', address: costAlertsTopic.topicArn }]
    },
    {
      notification: {
        notificationType: 'ACTUAL',
        comparisonOperator: 'GREATER_THAN',
        threshold: 100
      },
      subscribers: [{ subscriptionType: 'SNS', address: costAlertsTopic.topicArn }]
    }
  ]
});
```

**Thresholds Configurados**:
- 🟡 **80%**: Alerta de atenção
- 🔴 **100%**: Alerta crítico

**Como Ajustar Orçamento**:
```powershell
# Definir variável de ambiente antes do deploy
$env:MONTHLY_BUDGET_AMOUNT = "1000"
cdk deploy SecurityStack --context env=prod
```

**Onde Ver Gastos**:
```powershell
# Ver gastos do mês atual
aws ce get-cost-and-usage `
  --time-period Start=2025-11-01,End=2025-11-30 `
  --granularity MONTHLY `
  --metrics BlendedCost `
  --region us-east-1
```

**Console AWS**:
- https://console.aws.amazon.com/billing/home#/budgets

---

### 2. Cost Anomaly Detection

**O que é**:
- Detecção automática de gastos anormais
- Usa machine learning para identificar padrões

**O que Monitora**:
- ✅ Picos inesperados de custo
- ✅ Novos serviços sendo usados
- ✅ Mudanças significativas em serviços existentes

**Configuração Atual**:
```typescript
// lib/security-stack.ts
const costAnomalyMonitor = new ce.CfnAnomalyMonitor(this, 'CostAnomalyMonitor', {
  monitorName: `alquimista-cost-anomaly-monitor-${env}`,
  monitorType: 'DIMENSIONAL',
  monitorDimension: 'SERVICE'
});

const costAnomalySubscription = new ce.CfnAnomalySubscription(this, 'CostAnomalySubscription', {
  subscriptionName: `alquimista-cost-anomaly-subscription-${env}`,
  threshold: 50, // $50
  frequency: 'DAILY',
  monitorArnList: [costAnomalyMonitor.attrMonitorArn],
  subscribers: [{
    type: 'SNS',
    address: costAlertsTopic.topicArn
  }]
});
```

**Threshold**: $50 de impacto

**Frequência**: Diária

**Onde Ver Anomalias**:
```powershell
# Listar anomalias detectadas
aws ce get-anomalies `
  --date-interval Start=2025-11-01,End=2025-11-30 `
  --region us-east-1
```

**Console AWS**:
- https://console.aws.amazon.com/cost-management/home#/anomaly-detection

---

### 3. SNS Topic - Cost Alerts

**O que é**:
- Tópico SNS dedicado para alertas de custo
- Recebe notificações de Budget e Cost Anomaly Detection

**Configuração Atual**:
```typescript
// lib/security-stack.ts
const costAlertsTopic = new sns.Topic(this, 'CostAlertsTopic', {
  topicName: `alquimista-cost-alerts-${env}`,
  displayName: 'AlquimistaAI Cost Alerts'
});

// Assinatura via variável de ambiente
if (process.env.COST_ALERT_EMAIL) {
  costAlertsTopic.addSubscription(
    new subscriptions.EmailSubscription(process.env.COST_ALERT_EMAIL)
  );
}
```

**Como Configurar Email**:
```powershell
# Definir variável de ambiente antes do deploy
$env:COST_ALERT_EMAIL = "finance@alquimista.ai"
cdk deploy SecurityStack --context env=dev
```

**Formato de Alerta (Budget)**:
```json
{
  "AlarmName": "Budget-80%-Threshold",
  "NewStateValue": "ALARM",
  "NewStateReason": "Budget has exceeded 80% of $500 limit",
  "CurrentSpend": "$420.50",
  "BudgetLimit": "$500.00",
  "Threshold": "80%"
}
```

**Formato de Alerta (Anomaly)**:
```json
{
  "AlarmName": "Cost-Anomaly-Detected",
  "Service": "AWS Lambda",
  "AnomalyScore": 0.85,
  "Impact": "$75.00",
  "ExpectedSpend": "$50.00",
  "ActualSpend": "$125.00"
}
```

---

## Guardrails de Observabilidade

### 1. CloudWatch Alarms - Fibonacci

**Alarmes Configurados**:

#### API Gateway 5XX
```typescript
const apiGateway5xxAlarm = new cloudwatch.Alarm(this, 'FibonacciApiGateway5xxAlarm', {
  metric: apiGateway.metricServerError(),
  threshold: 5,
  evaluationPeriods: 1,
  datapointsToAlarm: 1,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
});
```
- **Threshold**: >= 5 erros em 5 minutos
- **Ação**: Notificação via SNS ops-alerts

#### Lambda Errors
```typescript
const lambdaErrorsAlarm = new cloudwatch.Alarm(this, 'FibonacciLambdaErrorsAlarm', {
  metric: lambdaFunction.metricErrors(),
  threshold: 3,
  evaluationPeriods: 1,
  datapointsToAlarm: 1,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
});
```
- **Threshold**: >= 3 erros em 5 minutos
- **Ação**: Notificação via SNS ops-alerts

#### Lambda Throttles
```typescript
const lambdaThrottlesAlarm = new cloudwatch.Alarm(this, 'FibonacciLambdaThrottlesAlarm', {
  metric: lambdaFunction.metricThrottles(),
  threshold: 1,
  evaluationPeriods: 2,
  datapointsToAlarm: 1,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
});
```
- **Threshold**: >= 1 throttle em 10 minutos
- **Ação**: Notificação via SNS ops-alerts

---

### 2. CloudWatch Alarms - Nigredo

**Alarmes Configurados**:

#### API Gateway 5XX
- **Threshold**: >= 5 erros em 5 minutos
- **Ação**: Notificação via SNS ops-alerts

#### Lambda Errors (por função)
- **Threshold**: >= 3 erros em 5 minutos
- **Ação**: Notificação via SNS ops-alerts

---

### 3. CloudWatch Alarms - Aurora

**Alarmes Configurados**:

#### CPU Utilization
```typescript
const cpuAlarm = new cloudwatch.Alarm(this, 'AuroraCPUAlarm', {
  metric: cluster.metricCPUUtilization(),
  threshold: 80,
  evaluationPeriods: 2,
  datapointsToAlarm: 2,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
});
```
- **Threshold**: >= 80% por 10 minutos
- **Ação**: Notificação via SNS ops-alerts

#### Database Connections
```typescript
const connectionsAlarm = new cloudwatch.Alarm(this, 'AuroraConnectionsAlarm', {
  metric: cluster.metricDatabaseConnections(),
  threshold: 80,
  evaluationPeriods: 2,
  datapointsToAlarm: 2,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
});
```
- **Threshold**: >= 80 conexões por 10 minutos
- **Ação**: Notificação via SNS ops-alerts

---

### 4. SNS Topic - Ops Alerts

**O que é**:
- Tópico SNS dedicado para alertas operacionais
- Recebe notificações de CloudWatch Alarms

**Configuração Atual**:
```typescript
// lib/security-stack.ts
const opsAlertsTopic = new sns.Topic(this, 'OpsAlertsTopic', {
  topicName: `alquimista-ops-alerts-${env}`,
  displayName: 'AlquimistaAI Operational Alerts'
});

// Assinatura via variável de ambiente
if (process.env.OPS_ALERT_EMAIL) {
  opsAlertsTopic.addSubscription(
    new subscriptions.EmailSubscription(process.env.OPS_ALERT_EMAIL)
  );
}
```

**Como Configurar Email**:
```powershell
# Definir variável de ambiente antes do deploy
$env:OPS_ALERT_EMAIL = "ops@alquimista.ai"
cdk deploy SecurityStack --context env=dev
```

**Formato de Alerta**:
```json
{
  "AlarmName": "Fibonacci-API-Gateway-5XX",
  "NewStateValue": "ALARM",
  "NewStateReason": "Threshold Crossed: 5 datapoints [7.0, 6.0, 8.0, 5.0, 9.0] were greater than or equal to the threshold (5.0)",
  "Metric": "5XXError",
  "Namespace": "AWS/ApiGateway",
  "Threshold": 5,
  "EvaluationPeriods": 1
}
```

---

### 5. CloudWatch Logs

**Retenção Configurada**:
- Lambda logs: 30 dias
- API Gateway logs: 30 dias
- CloudTrail logs: 90 dias

**Como Ver Logs**:
```powershell
# Ver logs de uma Lambda
aws logs tail /aws/lambda/fibonacci-handler-dev --follow --region us-east-1

# Ver logs de API Gateway
aws logs tail /aws/apigateway/fibonacci-api-dev --follow --region us-east-1

# Buscar em logs
aws logs filter-log-events `
  --log-group-name /aws/lambda/fibonacci-handler-dev `
  --filter-pattern "ERROR" `
  --region us-east-1
```

---

## Como Interpretar Alertas

### Alerta de Segurança (GuardDuty)

**Exemplo de Email**:
```
Subject: [ALARM] GuardDuty-HIGH-Finding

GuardDuty detected a HIGH severity finding:

Type: UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration
Severity: 8.5
Description: Credentials that were created exclusively for an EC2 instance are being used from an external IP address

Resource: i-1234567890abcdef0
Time: 2025-11-19T10:30:00Z
```

**O que Fazer**:
1. ✅ **Verificar Imediatamente**: Acessar console GuardDuty
2. ✅ **Analisar Finding**: Entender o que foi detectado
3. ✅ **Investigar Recurso**: Verificar se recurso está comprometido
4. ✅ **Tomar Ação**: Revogar credenciais, isolar recurso, etc.
5. ✅ **Documentar**: Registrar incidente e ações tomadas

---

### Alerta de Custo (Budget)

**Exemplo de Email**:
```
Subject: [ALARM] Budget-80%-Threshold

Your AWS Budget has exceeded 80% of the limit:

Budget Name: alquimista-monthly-budget-dev
Budget Limit: $500.00
Current Spend: $420.50
Threshold: 80%
Forecasted Spend: $525.00
```

**O que Fazer**:
1. ✅ **Verificar Gastos**: Acessar Cost Explorer
2. ✅ **Identificar Serviços**: Ver quais serviços estão gastando mais
3. ✅ **Analisar Tendência**: Verificar se é pico temporário ou tendência
4. ✅ **Otimizar**: Desligar recursos não usados, ajustar configurações
5. ✅ **Ajustar Orçamento**: Se necessário, aumentar limite

---

### Alerta de Custo (Anomaly)

**Exemplo de Email**:
```
Subject: [ALARM] Cost-Anomaly-Detected

A cost anomaly was detected:

Service: AWS Lambda
Anomaly Score: 0.85
Impact: $75.00
Expected Spend: $50.00
Actual Spend: $125.00
Date: 2025-11-19
```

**O que Fazer**:
1. ✅ **Verificar Serviço**: Acessar console do serviço afetado
2. ✅ **Analisar Uso**: Ver métricas de uso (invocações, duração, etc.)
3. ✅ **Identificar Causa**: Deploy recente? Tráfego aumentado?
4. ✅ **Validar**: Verificar se é esperado ou problema
5. ✅ **Otimizar**: Se problema, ajustar configurações

---

### Alerta Operacional (CloudWatch)

**Exemplo de Email**:
```
Subject: [ALARM] Fibonacci-API-Gateway-5XX

CloudWatch Alarm triggered:

Alarm Name: Fibonacci-API-Gateway-5XX
Metric: 5XXError
Threshold: 5
Current Value: 8
State: ALARM
Time: 2025-11-19T10:30:00Z
```

**O que Fazer**:
1. ✅ **Verificar Logs**: Acessar CloudWatch Logs
2. ✅ **Identificar Erro**: Ver stack traces e mensagens de erro
3. ✅ **Verificar Recursos**: Lambda, API Gateway, Aurora
4. ✅ **Testar Endpoints**: Executar smoke tests
5. ✅ **Corrigir**: Deploy de fix ou rollback se necessário

---

## Como Ajustar Configurações

### Ajustar Orçamento Mensal

**Via Variável de Ambiente**:
```powershell
# Definir novo valor
$env:MONTHLY_BUDGET_AMOUNT = "1000"

# Deploy
cdk deploy SecurityStack --context env=prod
```

**Via Código**:
```typescript
// lib/security-stack.ts
const budgetAmount = process.env.MONTHLY_BUDGET_AMOUNT || '500';
```

---

### Ajustar Threshold de Anomalia

**Via Código**:
```typescript
// lib/security-stack.ts
const costAnomalySubscription = new ce.CfnAnomalySubscription(this, 'CostAnomalySubscription', {
  threshold: 100, // Alterar de 50 para 100
  // ...
});
```

**Deploy**:
```powershell
cdk deploy SecurityStack --context env=prod
```

---

### Ajustar Threshold de Alarme

**Via Código**:
```typescript
// lib/fibonacci-stack.ts
const apiGateway5xxAlarm = new cloudwatch.Alarm(this, 'FibonacciApiGateway5xxAlarm', {
  threshold: 10, // Alterar de 5 para 10
  // ...
});
```

**Deploy**:
```powershell
cdk deploy FibonacciStack --context env=prod
```

---

### Adicionar Email para Alertas

**Via Variável de Ambiente**:
```powershell
# Definir emails
$env:SECURITY_ALERT_EMAIL = "security@alquimista.ai"
$env:COST_ALERT_EMAIL = "finance@alquimista.ai"
$env:OPS_ALERT_EMAIL = "ops@alquimista.ai"

# Deploy
cdk deploy SecurityStack --context env=prod
```

**Via Console AWS (SNS)**:
1. Acessar https://console.aws.amazon.com/sns/
2. Selecionar tópico (ex: `alquimista-security-alerts-prod`)
3. Clicar em "Create subscription"
4. Protocol: Email
5. Endpoint: email@example.com
6. Confirmar email recebido

---

### Ajustar Retenção de Logs

**Via Código**:
```typescript
// lib/fibonacci-stack.ts
const lambdaFunction = new lambda.Function(this, 'FibonacciHandler', {
  logRetention: logs.RetentionDays.SIXTY_DAYS, // Alterar de 30 para 60
  // ...
});
```

**Deploy**:
```powershell
cdk deploy FibonacciStack --context env=prod
```

---

## Troubleshooting

### Problema: Não estou recebendo alertas

**Possíveis Causas**:
1. Email não configurado
2. Email não confirmado
3. Tópico SNS sem assinatura
4. Alarme não disparou

**Solução**:
```powershell
# 1. Verificar assinaturas SNS
aws sns list-subscriptions-by-topic `
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-ops-alerts-dev `
  --region us-east-1

# 2. Verificar estado do alarme
aws cloudwatch describe-alarms `
  --alarm-names Fibonacci-API-Gateway-5XX `
  --region us-east-1

# 3. Testar envio de notificação
aws sns publish `
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-ops-alerts-dev `
  --message "Test message" `
  --region us-east-1
```

---

### Problema: Muitos alertas falsos positivos

**Possíveis Causas**:
1. Threshold muito baixo
2. Período de avaliação muito curto
3. Tráfego legítimo sendo detectado

**Solução**:
1. Ajustar threshold para valor mais alto
2. Aumentar período de avaliação
3. Adicionar filtros ou exceções

---

### Problema: Gastos acima do orçamento

**Possíveis Causas**:
1. Recursos não desligados
2. Tráfego inesperado
3. Configuração incorreta

**Solução**:
```powershell
# 1. Ver gastos por serviço
aws ce get-cost-and-usage `
  --time-period Start=2025-11-01,End=2025-11-30 `
  --granularity DAILY `
  --metrics BlendedCost `
  --group-by Type=DIMENSION,Key=SERVICE `
  --region us-east-1

# 2. Identificar recursos caros
# 3. Desligar ou otimizar
```

---

## Recursos Adicionais

### Documentação Relacionada

- [SECURITY-GUARDRAILS-AWS.md](../SECURITY-GUARDRAILS-AWS.md) - Detalhes de segurança
- [COST-GUARDRAILS-AWS.md](../COST-GUARDRAILS-AWS.md) - Detalhes de custo
- [OBSERVABILITY-GUARDRAILS-AWS.md](../OBSERVABILITY-GUARDRAILS-AWS.md) - Detalhes de observabilidade
- [PIPELINE-OVERVIEW.md](./PIPELINE-OVERVIEW.md) - Overview do pipeline

### Scripts Úteis

| Script | Função |
|--------|--------|
| `verify-security-guardrails.ps1` | Verificar guardrails de segurança |
| `test-security-alerts.ps1` | Testar alertas de segurança |

---

**Última Atualização**: 19 de novembro de 2025  
**Versão**: 1.0  
**Autor**: Kiro AI - Sistema de CI/CD AlquimistaAI

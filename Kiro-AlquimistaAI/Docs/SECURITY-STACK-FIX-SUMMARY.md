# Correção da SecurityStack-dev - Resumo Executivo

## Problema Identificado

A `SecurityStack-dev` falhava consistentemente no deploy com os seguintes erros:

1. **Duplicate tag keys found** (IAM)
   - Tags case-insensitive duplicadas: `component` (app.ts) vs `Component` (security-stack.ts)

2. **AlreadyExists** (Cost Anomaly Monitor)
   - Cost Anomaly Monitor é um recurso **GLOBAL da conta AWS**
   - Não pode haver múltiplos monitores com o mesmo propósito
   - Dev e Prod tentavam criar monitores separados, causando conflito

## Soluções Implementadas

### 1. Correção de Tags Duplicadas

**Problema:** Tags aplicadas em dois lugares com case diferente
- `app.ts`: `tags: { component: 'security-guardrails' }`
- `security-stack.ts`: `cdk.Tags.of(this).add('Component', 'Security-Cost-Guardrails')`

**Solução:** Removidas as tags do `security-stack.ts`
```typescript
// ========================================
// Tags
// ========================================
// Tags são aplicadas via app.ts para evitar duplicatas case-insensitive
// Não adicionar tags aqui para evitar conflito com commonTags do app.ts
```

### 2. Remoção de Nomes Físicos Fixos

**Recursos ajustados para permitir geração automática de nomes:**
- CloudTrail Trail (removido `trailName`)
- SNS Topics (removido `topicName`)
- S3 Bucket (removido `bucketName`)
- EventBridge Rule (removido `ruleName`)
- CloudWatch Alarms (removido `alarmName`)

**Motivo:** Nomes fixos podem causar conflitos se recursos já existirem ou em tentativas de re-deploy.

### 3. Cost Anomaly Monitor Condicional (SOLUÇÃO PRINCIPAL)

**Lógica Implementada:**

```typescript
// Cost Anomaly Detection (APENAS PROD)
if (env === 'prod') {
  const costAnomalyMonitor = new ce.CfnAnomalyMonitor(this, 'CostAnomalyMonitor', {
    monitorName: `alquimista-cost-monitor-prod`,
    monitorType: 'DIMENSIONAL',
    monitorDimension: 'SERVICE',
  });

  const costAnomalySubscription = new ce.CfnAnomalySubscription(this, 'CostAnomalySubscription', {
    subscriptionName: `alquimista-cost-anomaly-alerts-prod`,
    threshold: 50,
    frequency: 'DAILY',
    monitorArnList: [costAnomalyMonitor.attrMonitorArn],
    subscribers: [{ type: 'SNS', address: this.costAlertTopic.topicArn }],
  });
}
```

**Mudanças na Interface:**

```typescript
export interface SecurityStackProps extends cdk.StackProps {
  /**
   * Nome do ambiente (dev, prod)
   * Usado para determinar quais recursos criar (Cost Anomaly Monitor apenas em prod)
   * @default 'dev'
   */
  envName?: string;
  // ... outras props
}
```

**Mudanças no bin/app.ts:**

```typescript
const securityStack = new SecurityStack(app, `SecurityStack-${envName}`, {
  env,
  envName, // Passar envName para controlar recursos condicionais
  tags: { ...commonTags, component: 'security-guardrails' },
  description: 'Security Guardrails - CloudTrail, GuardDuty, SNS Alerts',
  securityAlertEmail: process.env.SECURITY_ALERT_EMAIL || envConfig.securityAlertEmail,
});
```

## Recursos Criados por Ambiente

### SecurityStack-dev (Ambiente de Desenvolvimento)

✅ **Recursos Criados:**
- CloudTrail para auditoria
- GuardDuty Detector
- SNS Topics (Security, Cost, Ops Alerts)
- EventBridge Rule (GuardDuty → SNS)
- AWS Budget com alertas (80%, 100%, 120%)
- CloudWatch Alarms (se APIs/Lambdas configuradas)

❌ **Recursos NÃO Criados:**
- Cost Anomaly Monitor (apenas prod)
- Cost Anomaly Subscription (apenas prod)

### SecurityStack-prod (Ambiente de Produção)

✅ **Recursos Criados:**
- Todos os recursos do dev +
- **Cost Anomaly Monitor** (global da conta)
- **Cost Anomaly Subscription** (alertas de anomalias)

## Resultado do Deploy

### SecurityStack-dev - ✅ SUCESSO

```
✅  SecurityStack-dev

✨  Deployment time: 88.76s

Outputs:
SecurityStack-dev.CloudTrailBucketName = securitystack-dev-cloudtrailbucket98b0bfe1-arutl7cf5dir
SecurityStack-dev.CloudTrailName = arn:aws:cloudtrail:us-east-1:207933152643:trail/...
SecurityStack-dev.CostAlertTopicArn = arn:aws:sns:us-east-1:207933152643:...
SecurityStack-dev.GuardDutyDetectorId = 2124d28dc7ab44788081e7496cf0fd71
SecurityStack-dev.MonthlyBudgetAmount = 500
SecurityStack-dev.MonthlyBudgetName = alquimista-monthly-budget-dev
SecurityStack-dev.OpsAlertTopicArn = arn:aws:sns:us-east-1:207933152643:...
SecurityStack-dev.SecurityAlertTopicArn = arn:aws:sns:us-east-1:207933152643:...
```

## Próximos Passos

### ⚠️ IMPORTANTE: Deploy da SecurityStack-prod

Para garantir que o **Cost Anomaly Monitor** global continue existindo na conta AWS, é necessário fazer o deploy da `SecurityStack-prod`:

```bash
npx cdk deploy SecurityStack-prod --context env=prod --require-approval never
```

**Por que isso é importante:**
- O Cost Anomaly Monitor é um recurso **GLOBAL** da conta AWS
- Apenas a stack de **PROD** cria este recurso
- Se não houver SecurityStack-prod deployada, a conta ficará sem monitoramento de anomalias de custo

### Validação

Para validar que tudo está funcionando:

```bash
# Verificar recursos da SecurityStack-dev
aws cloudformation describe-stacks --stack-name SecurityStack-dev --region us-east-1

# Verificar GuardDuty
aws guardduty list-detectors --region us-east-1

# Verificar CloudTrail
aws cloudtrail describe-trails --region us-east-1

# Verificar Budgets
aws budgets describe-budgets --account-id 207933152643
```

## Arquivos Modificados

1. **lib/security-stack.ts**
   - Adicionada prop `envName` na interface
   - Removidas tags duplicadas
   - Removidos nomes físicos fixos
   - Cost Anomaly Monitor condicional (apenas prod)

2. **bin/app.ts**
   - Adicionado `envName` na criação da SecurityStack

## Lições Aprendidas

1. **Tags Case-Insensitive:** AWS trata tags como case-insensitive. Sempre usar um único padrão.

2. **Recursos Globais:** Cost Anomaly Monitor é global da conta. Criar apenas uma vez (prod).

3. **Nomes Físicos:** Evitar nomes fixos quando possível. Deixar CDK gerar automaticamente.

4. **Ambientes Separados:** Nem todos os recursos precisam existir em todos os ambientes.

## Comandos de Deploy

```bash
# Compilar
npm run build

# Sintetizar (validar)
npx cdk synth SecurityStack-dev --context env=dev

# Deploy Dev (✅ FUNCIONANDO)
npx cdk deploy SecurityStack-dev --context env=dev --require-approval never

# Deploy Prod (PENDENTE - necessário para Cost Anomaly Monitor)
npx cdk deploy SecurityStack-prod --context env=prod --require-approval never
```

---

**Status:** ✅ SecurityStack-dev deployada com sucesso  
**Data:** 2025-01-18  
**Próxima Ação:** Deploy da SecurityStack-prod para criar Cost Anomaly Monitor global

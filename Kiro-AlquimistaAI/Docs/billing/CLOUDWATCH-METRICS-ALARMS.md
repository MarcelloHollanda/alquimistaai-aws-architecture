# Métricas e Alarmes CloudWatch - Sistema de Checkout

## Métricas Customizadas

### Namespace: `AlquimistaAI/Billing`

#### 1. CheckoutSessionsCreated

**Descrição:** Número de sessões de checkout criadas

**Dimensões:**
- `Environment` (dev, prod)
- `TenantId` (opcional)

**Unidade:** Count

**Código de Implementação:**
```typescript
// Em create-checkout-session.ts
import { CloudWatch } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatch({ region: process.env.AWS_REGION });

await cloudwatch.putMetricData({
  Namespace: 'AlquimistaAI/Billing',
  MetricData: [
    {
      MetricName: 'CheckoutSessionsCreated',
      Value: 1,
      Unit: 'Count',
      Timestamp: new Date(),
      Dimensions: [
        {
          Name: 'Environment',
          Value: process.env.ENV || 'dev',
        },
      ],
    },
  ],
});
```

---

#### 2. CheckoutSessionsCompleted

**Descrição:** Número de checkouts concluídos com sucesso

**Dimensões:**
- `Environment`
- `PlanId`

**Unidade:** Count

**Código de Implementação:**
```typescript
// Em webhook-payment.ts (handleCheckoutCompleted)
await cloudwatch.putMetricData({
  Namespace: 'AlquimistaAI/Billing',
  MetricData: [
    {
      MetricName: 'CheckoutSessionsCompleted',
      Value: 1,
      Unit: 'Count',
      Timestamp: new Date(),
      Dimensions: [
        {
          Name: 'Environment',
          Value: process.env.ENV || 'dev',
        },
      ],
    },
  ],
});
```

---

#### 3. CheckoutSessionsCancelled

**Descrição:** Número de checkouts cancelados

**Dimensões:**
- `Environment`

**Unidade:** Count

---

#### 4. WebhookEventsReceived

**Descrição:** Total de eventos de webhook recebidos

**Dimensões:**
- `Environment`
- `EventType` (checkout.session.completed, invoice.paid, etc.)

**Unidade:** Count

**Código de Implementação:**
```typescript
// Em webhook-payment.ts
await cloudwatch.putMetricData({
  Namespace: 'AlquimistaAI/Billing',
  MetricData: [
    {
      MetricName: 'WebhookEventsReceived',
      Value: 1,
      Unit: 'Count',
      Timestamp: new Date(),
      Dimensions: [
        {
          Name: 'Environment',
          Value: process.env.ENV || 'dev',
        },
        {
          Name: 'EventType',
          Value: stripeEvent.type,
        },
      ],
    },
  ],
});
```

---

#### 5. WebhookEventsProcessed

**Descrição:** Eventos de webhook processados com sucesso

**Dimensões:**
- `Environment`
- `EventType`

**Unidade:** Count

---

#### 6. PaymentErrors

**Descrição:** Erros durante processamento de pagamentos

**Dimensões:**
- `Environment`
- `ErrorType` (STRIPE_ERROR, DATABASE_ERROR, VALIDATION_ERROR)

**Unidade:** Count

**Código de Implementação:**
```typescript
// Em create-checkout-session.ts (catch block)
await cloudwatch.putMetricData({
  Namespace: 'AlquimistaAI/Billing',
  MetricData: [
    {
      MetricName: 'PaymentErrors',
      Value: 1,
      Unit: 'Count',
      Timestamp: new Date(),
      Dimensions: [
        {
          Name: 'Environment',
          Value: process.env.ENV || 'dev',
        },
        {
          Name: 'ErrorType',
          Value: 'STRIPE_ERROR',
        },
      ],
    },
  ],
});
```

---

#### 7. CheckoutSessionValue

**Descrição:** Valor total das sessões de checkout criadas

**Dimensões:**
- `Environment`
- `Currency` (BRL)

**Unidade:** None (valor em reais)

**Código de Implementação:**
```typescript
// Em create-checkout-session.ts
await cloudwatch.putMetricData({
  Namespace: 'AlquimistaAI/Billing',
  MetricData: [
    {
      MetricName: 'CheckoutSessionValue',
      Value: totalAmount,
      Unit: 'None',
      Timestamp: new Date(),
      Dimensions: [
        {
          Name: 'Environment',
          Value: process.env.ENV || 'dev',
        },
        {
          Name: 'Currency',
          Value: 'BRL',
        },
      ],
    },
  ],
});
```

---

## Alarmes CloudWatch

### 1. High Error Rate - Create Checkout Session

**Descrição:** Taxa de erro > 5% em criação de sessões

**Métrica:** Lambda Errors / Lambda Invocations

**Threshold:** 5%

**Período de Avaliação:** 5 minutos

**Ação:** Enviar notificação SNS

**CDK Configuration:**
```typescript
const errorRateAlarm = new cloudwatch.Alarm(this, 'CheckoutSessionErrorRateAlarm', {
  alarmName: `${env}-checkout-session-error-rate`,
  metric: new cloudwatch.MathExpression({
    expression: '(errors / invocations) * 100',
    usingMetrics: {
      errors: createCheckoutSessionLambda.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      invocations: createCheckoutSessionLambda.metricInvocations({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
    },
  }),
  threshold: 5,
  evaluationPeriods: 1,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
});

errorRateAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));
```

---

### 2. High Latency - Create Checkout Session

**Descrição:** Latência > 3 segundos

**Métrica:** Lambda Duration (p99)

**Threshold:** 3000ms

**Período de Avaliação:** 5 minutos

**CDK Configuration:**
```typescript
const latencyAlarm = new cloudwatch.Alarm(this, 'CheckoutSessionLatencyAlarm', {
  alarmName: `${env}-checkout-session-latency`,
  metric: createCheckoutSessionLambda.metricDuration({
    statistic: 'p99',
    period: cdk.Duration.minutes(5),
  }),
  threshold: 3000,
  evaluationPeriods: 2,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
});

latencyAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));
```

---

### 3. Webhook Processing Failures

**Descrição:** > 10 falhas de webhook em 5 minutos

**Métrica:** Lambda Errors

**Threshold:** 10

**Período de Avaliação:** 5 minutos

**CDK Configuration:**
```typescript
const webhookFailureAlarm = new cloudwatch.Alarm(this, 'WebhookFailureAlarm', {
  alarmName: `${env}-webhook-processing-failures`,
  metric: webhookPaymentLambda.metricErrors({
    statistic: 'Sum',
    period: cdk.Duration.minutes(5),
  }),
  threshold: 10,
  evaluationPeriods: 1,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
});

webhookFailureAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));
```

---

### 4. Low Checkout Completion Rate

**Descrição:** Taxa de conclusão < 70%

**Métrica:** CheckoutSessionsCompleted / CheckoutSessionsCreated

**Threshold:** 0.7 (70%)

**Período de Avaliação:** 1 hora

**CDK Configuration:**
```typescript
const completionRateAlarm = new cloudwatch.Alarm(this, 'LowCompletionRateAlarm', {
  alarmName: `${env}-low-checkout-completion-rate`,
  metric: new cloudwatch.MathExpression({
    expression: 'completed / created',
    usingMetrics: {
      completed: new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Billing',
        metricName: 'CheckoutSessionsCompleted',
        statistic: 'Sum',
        period: cdk.Duration.hours(1),
      }),
      created: new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Billing',
        metricName: 'CheckoutSessionsCreated',
        statistic: 'Sum',
        period: cdk.Duration.hours(1),
      }),
    },
  }),
  threshold: 0.7,
  evaluationPeriods: 1,
  comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
});

completionRateAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));
```

---

### 5. Payment Errors Spike

**Descrição:** > 5 erros de pagamento em 5 minutos

**Métrica:** PaymentErrors (custom metric)

**Threshold:** 5

**Período de Avaliação:** 5 minutos

**CDK Configuration:**
```typescript
const paymentErrorsAlarm = new cloudwatch.Alarm(this, 'PaymentErrorsSpikeAlarm', {
  alarmName: `${env}-payment-errors-spike`,
  metric: new cloudwatch.Metric({
    namespace: 'AlquimistaAI/Billing',
    metricName: 'PaymentErrors',
    statistic: 'Sum',
    period: cdk.Duration.minutes(5),
    dimensionsMap: {
      Environment: env,
    },
  }),
  threshold: 5,
  evaluationPeriods: 1,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
});

paymentErrorsAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));
```

---

## Dashboard CloudWatch

### Billing Overview Dashboard

**Nome:** `${env}-billing-overview`

**Widgets:**

1. **Checkout Sessions Created (Last 24h)**
   - Tipo: Line Chart
   - Métrica: CheckoutSessionsCreated
   - Período: 1 hora

2. **Checkout Completion Rate**
   - Tipo: Number
   - Métrica: (CheckoutSessionsCompleted / CheckoutSessionsCreated) * 100
   - Período: 24 horas

3. **Webhook Events by Type**
   - Tipo: Pie Chart
   - Métrica: WebhookEventsReceived
   - Dimensão: EventType

4. **Lambda Errors**
   - Tipo: Line Chart
   - Métricas: Errors de todas as Lambdas de billing
   - Período: 5 minutos

5. **Lambda Duration (p99)**
   - Tipo: Line Chart
   - Métricas: Duration (p99) de todas as Lambdas
   - Período: 5 minutos

6. **Total Revenue (Last 30 days)**
   - Tipo: Number
   - Métrica: Sum(CheckoutSessionValue)
   - Período: 30 dias

**CDK Configuration:**
```typescript
const billingDashboard = new cloudwatch.Dashboard(this, 'BillingDashboard', {
  dashboardName: `${env}-billing-overview`,
});

// Widget 1: Checkout Sessions Created
billingDashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: 'Checkout Sessions Created (Last 24h)',
    left: [
      new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Billing',
        metricName: 'CheckoutSessionsCreated',
        statistic: 'Sum',
        period: cdk.Duration.hours(1),
      }),
    ],
    width: 12,
  })
);

// Widget 2: Completion Rate
billingDashboard.addWidgets(
  new cloudwatch.SingleValueWidget({
    title: 'Checkout Completion Rate (24h)',
    metrics: [
      new cloudwatch.MathExpression({
        expression: '(completed / created) * 100',
        usingMetrics: {
          completed: new cloudwatch.Metric({
            namespace: 'AlquimistaAI/Billing',
            metricName: 'CheckoutSessionsCompleted',
            statistic: 'Sum',
            period: cdk.Duration.hours(24),
          }),
          created: new cloudwatch.Metric({
            namespace: 'AlquimistaAI/Billing',
            metricName: 'CheckoutSessionsCreated',
            statistic: 'Sum',
            period: cdk.Duration.hours(24),
          }),
        },
        label: 'Completion Rate (%)',
      }),
    ],
    width: 6,
  })
);

// Widget 3: Lambda Errors
billingDashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: 'Lambda Errors',
    left: [
      createCheckoutSessionLambda.metricErrors({ label: 'Create Checkout' }),
      webhookPaymentLambda.metricErrors({ label: 'Webhook' }),
      getSubscriptionLambda.metricErrors({ label: 'Get Subscription' }),
    ],
    width: 12,
  })
);

// Widget 4: Lambda Duration
billingDashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: 'Lambda Duration (p99)',
    left: [
      createCheckoutSessionLambda.metricDuration({ 
        statistic: 'p99',
        label: 'Create Checkout' 
      }),
      webhookPaymentLambda.metricDuration({ 
        statistic: 'p99',
        label: 'Webhook' 
      }),
      getSubscriptionLambda.metricDuration({ 
        statistic: 'p99',
        label: 'Get Subscription' 
      }),
    ],
    width: 12,
  })
);
```

---

## SNS Topic para Alarmes

```typescript
const alarmTopic = new sns.Topic(this, 'BillingAlarmsTopic', {
  topicName: `${env}-billing-alarms`,
  displayName: 'AlquimistaAI Billing Alarms',
});

// Adicionar assinatura de e-mail
alarmTopic.addSubscription(
  new subscriptions.EmailSubscription('devops@alquimistaai.com')
);

// Adicionar assinatura de Slack (via Lambda)
const slackNotificationLambda = new lambda.Function(this, 'SlackNotificationFunction', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: lambda.Code.fromInline(`
    exports.handler = async (event) => {
      const message = JSON.parse(event.Records[0].Sns.Message);
      // Enviar para Slack webhook
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        body: JSON.stringify({
          text: \`🚨 Alarme: \${message.AlarmName}\\n\${message.NewStateReason}\`
        })
      });
    };
  `),
  environment: {
    SLACK_WEBHOOK_URL: slackWebhookUrl,
  },
});

alarmTopic.addSubscription(
  new subscriptions.LambdaSubscription(slackNotificationLambda)
);
```

---

## Checklist de Implementação

- [ ] Adicionar SDK CloudWatch às Lambdas
- [ ] Implementar métricas customizadas em cada handler
- [ ] Criar alarmes no CDK
- [ ] Criar dashboard no CDK
- [ ] Configurar SNS topic
- [ ] Adicionar assinaturas de e-mail
- [ ] Testar alarmes em dev
- [ ] Validar métricas no console
- [ ] Deploy em produção
- [ ] Documentar runbook para cada alarme

---

**Última atualização:** 2025-01-18

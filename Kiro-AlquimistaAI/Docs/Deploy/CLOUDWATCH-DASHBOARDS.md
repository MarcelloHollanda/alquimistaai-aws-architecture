# CloudWatch Dashboards - Guia de Implementação

## Visão Geral

O Ecossistema Alquimista.AI possui três dashboards principais no CloudWatch para monitoramento completo:

1. **Fibonacci Core Dashboard** - Infraestrutura e serviços AWS
2. **Nigredo Agents Dashboard** - Performance dos agentes de prospecção
3. **Business Metrics Dashboard** - KPIs de negócio e conversão

## Dashboards Implementados

### 1. Fibonacci Core Dashboard

**Nome**: `Fibonacci-Core-{env}`

**Localização**: Criado automaticamente pela `FibonacciStack`

**Métricas Monitoradas**:

#### API Gateway
- Requests por minuto
- Erros 4xx e 5xx
- Latência (média, p95, p99)

#### Lambda (API Handler)
- Invocations
- Errors e Throttles
- Duration (média, p95, p99)
- Concurrent Executions

#### EventBridge
- Events Published
- Failed Invocations

#### SQS
- Main Queue: Messages In Flight, Sent, Received
- DLQ: Message Count (alerta se > 0)

**Widgets**:
- 7 linhas de gráficos
- 1 widget de valor único para DLQ
- Período padrão: 1 minuto

### 2. Nigredo Agents Dashboard

**Nome**: `Nigredo-Agents-{env}`

**Localização**: Criado automaticamente pela `NigredoStack`

**Métricas Monitoradas**:

#### Por Agente (Recebimento, Estratégia, Disparo, Atendimento, Sentimento, Agendamento, Relatórios)
- Leads Processados (Invocations)
- Taxa de Sucesso (%)
- Tempo Médio de Processamento (ms)
- Tempo P95 de Processamento (ms)
- Erros
- Throttles
- Concurrent Executions

#### MCP Integrations
- Calls por serviço (WhatsApp, Calendar, Enrichment, Sentiment)
- Errors por serviço

**Widgets**:
- 13 linhas de gráficos comparativos
- Detalhes individuais por agente
- Período padrão: 5 minutos

### 3. Business Metrics Dashboard

**Nome**: `Business-Metrics-{env}`

**Localização**: Criado automaticamente pela `NigredoStack`

**Métricas Monitoradas**:

#### Funil de Conversão
- Leads Recebidos
- Leads Enriquecidos
- Leads Contatados
- Leads Responderam
- Leads Interessados
- Leads Agendados
- Leads Convertidos

#### Taxas de Conversão
- Taxa de Resposta (%)
- Taxa de Agendamento (%)
- Taxa de Conversão Final (%)
- Taxa de Enriquecimento (%)
- Taxa de Contato (%)
- Taxa de Interesse (%)

#### Métricas Financeiras
- Custo por Lead (R$)
- ROI por Campanha (%)
- Custo Total (R$)
- Receita Estimada (R$)

#### Campanhas
- Campanhas Ativas
- Mensagens Enviadas/Entregues/Lidas
- Taxa de Entrega (%)
- Taxa de Leitura (%)

#### LGPD e Qualidade
- Objeções
- Descadastros
- Leads Descartados

**Widgets**:
- 12 linhas de gráficos e valores
- Funil visual completo
- Período padrão: 1 hora

## Deploy dos Dashboards

Os dashboards são criados automaticamente durante o deploy das stacks:

```bash
# Deploy completo (todas as stacks)
npm run deploy:dev

# Ou deploy específico
npm run build && cdk deploy FibonacciStack-dev NigredoStack-dev
```

Após o deploy, os nomes dos dashboards estarão nos outputs do CloudFormation:

```bash
# Ver outputs
aws cloudformation describe-stacks \
  --stack-name FibonacciStack-dev \
  --query 'Stacks[0].Outputs'
```

## Publicando Métricas Customizadas

As métricas de negócio (Business Metrics) e MCP precisam ser publicadas pelas Lambda functions.

### Exemplo: Publicar Métrica de Leads Recebidos

```typescript
import { CloudWatch } from 'aws-sdk';

const cloudwatch = new CloudWatch();

export async function publishLeadsRecebidos(count: number, tenantId: string) {
  await cloudwatch.putMetricData({
    Namespace: 'Fibonacci/Business',
    MetricData: [
      {
        MetricName: 'LeadsRecebidos',
        Value: count,
        Unit: 'Count',
        Timestamp: new Date(),
        Dimensions: [
          { Name: 'Environment', Value: process.env.ENVIRONMENT || 'dev' },
          { Name: 'TenantId', Value: tenantId }
        ]
      }
    ]
  }).promise();
}
```

### Exemplo: Publicar Métrica de MCP Call

```typescript
export async function publishMCPCall(service: string, success: boolean) {
  const metricName = success ? `${service}Calls` : `${service}Errors`;
  
  await cloudwatch.putMetricData({
    Namespace: 'Fibonacci/MCP',
    MetricData: [
      {
        MetricName: metricName,
        Value: 1,
        Unit: 'Count',
        Timestamp: new Date(),
        Dimensions: [
          { Name: 'Service', Value: service },
          { Name: 'Environment', Value: process.env.ENVIRONMENT || 'dev' }
        ]
      }
    ]
  }).promise();
}
```


### Integração nas Lambda Functions

Adicione o helper de métricas em `lambda/shared/metrics.ts`:

```typescript
import { CloudWatch } from 'aws-sdk';

const cloudwatch = new CloudWatch();
const environment = process.env.ENVIRONMENT || 'dev';

export class MetricsPublisher {
  /**
   * Publica métrica de negócio
   */
  static async publishBusinessMetric(
    metricName: string,
    value: number,
    unit: string = 'Count',
    dimensions: Record<string, string> = {}
  ): Promise<void> {
    try {
      await cloudwatch.putMetricData({
        Namespace: 'Fibonacci/Business',
        MetricData: [
          {
            MetricName: metricName,
            Value: value,
            Unit: unit,
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'Environment', Value: environment },
              ...Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value }))
            ]
          }
        ]
      }).promise();
    } catch (error) {
      console.error('Error publishing business metric:', error);
      // Não propagar erro para não quebrar o fluxo principal
    }
  }

  /**
   * Publica métrica de MCP
   */
  static async publishMCPMetric(
    service: string,
    metricType: 'Calls' | 'Errors',
    value: number = 1
  ): Promise<void> {
    try {
      await cloudwatch.putMetricData({
        Namespace: 'Fibonacci/MCP',
        MetricData: [
          {
            MetricName: `${service}${metricType}`,
            Value: value,
            Unit: 'Count',
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'Service', Value: service },
              { Name: 'Environment', Value: environment }
            ]
          }
        ]
      }).promise();
    } catch (error) {
      console.error('Error publishing MCP metric:', error);
    }
  }
}
```

### Uso nas Lambda Functions

#### Agente de Recebimento

```typescript
import { MetricsPublisher } from '../shared/metrics';

export async function handler(event: SQSEvent) {
  const leads = await processLeads(event);
  
  // Publicar métricas
  await MetricsPublisher.publishBusinessMetric(
    'LeadsRecebidos',
    leads.length,
    'Count',
    { TenantId: tenantId }
  );
  
  const enrichedLeads = await enrichLeads(leads);
  
  await MetricsPublisher.publishBusinessMetric(
    'LeadsEnriquecidos',
    enrichedLeads.length,
    'Count',
    { TenantId: tenantId }
  );
  
  // Publicar chamadas MCP
  await MetricsPublisher.publishMCPMetric('Enrichment', 'Calls', enrichedLeads.length);
}
```

#### Agente de Disparo

```typescript
import { MetricsPublisher } from '../shared/metrics';

export async function handler(event: ScheduledEvent) {
  const messages = await sendMessages();
  
  await MetricsPublisher.publishBusinessMetric(
    'LeadsContatados',
    messages.sent,
    'Count'
  );
  
  await MetricsPublisher.publishBusinessMetric(
    'MensagensEnviadas',
    messages.sent,
    'Count'
  );
  
  await MetricsPublisher.publishMCPMetric('WhatsApp', 'Calls', messages.sent);
}
```

#### Agente de Atendimento

```typescript
import { MetricsPublisher } from '../shared/metrics';

export async function handler(event: APIGatewayProxyEvent) {
  const response = await processResponse(event);
  
  await MetricsPublisher.publishBusinessMetric(
    'LeadsResponderam',
    1,
    'Count',
    { TenantId: tenantId }
  );
  
  if (response.interested) {
    await MetricsPublisher.publishBusinessMetric(
      'LeadsInteressados',
      1,
      'Count',
      { TenantId: tenantId }
    );
  }
  
  // Publicar chamada de sentimento
  await MetricsPublisher.publishMCPMetric('Sentiment', 'Calls');
}
```

## Acessando os Dashboards

### Via AWS Console

1. Acesse o [AWS Console](https://console.aws.amazon.com/)
2. Navegue para **CloudWatch** > **Dashboards**
3. Selecione o dashboard desejado:
   - `Fibonacci-Core-dev`
   - `Nigredo-Agents-dev`
   - `Business-Metrics-dev`

### Via AWS CLI

```bash
# Listar todos os dashboards
aws cloudwatch list-dashboards

# Ver detalhes de um dashboard específico
aws cloudwatch get-dashboard --dashboard-name Fibonacci-Core-dev

# Exportar dashboard para JSON
aws cloudwatch get-dashboard \
  --dashboard-name Fibonacci-Core-dev \
  --query 'DashboardBody' \
  --output text > fibonacci-core-dashboard.json
```

### Via CDK Outputs

```bash
# Ver URL do dashboard (se configurado)
aws cloudformation describe-stacks \
  --stack-name FibonacciStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`DashboardName`].OutputValue' \
  --output text
```

## Configurando Alarmes

Os dashboards mostram métricas, mas você também pode configurar alarmes para notificações proativas.

### Exemplo: Alarme de Taxa de Erro Alta

```typescript
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

// Criar tópico SNS para notificações
const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
  displayName: 'Fibonacci Alarms'
});

alarmTopic.addSubscription(
  new subscriptions.EmailSubscription('ops@alquimista.ai')
);

// Alarme: Taxa de erro alta no API Gateway
new cloudwatch.Alarm(this, 'HighErrorRate', {
  metric: new cloudwatch.Metric({
    namespace: 'AWS/ApiGateway',
    metricName: '5XXError',
    dimensionsMap: {
      ApiId: httpApi.apiId
    },
    statistic: 'Sum',
    period: cdk.Duration.minutes(5)
  }),
  threshold: 10,
  evaluationPeriods: 2,
  datapointsToAlarm: 2,
  alarmDescription: 'API Gateway error rate is too high',
  actionsEnabled: true,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
});

// Alarme: DLQ não vazia
new cloudwatch.Alarm(this, 'DLQNotEmpty', {
  metric: dlq.metricApproximateNumberOfMessagesVisible(),
  threshold: 1,
  evaluationPeriods: 1,
  alarmDescription: 'Messages in DLQ - investigate immediately',
  actionsEnabled: true
});

// Alarme: Taxa de conversão baixa
new cloudwatch.Alarm(this, 'LowConversionRate', {
  metric: new cloudwatch.MathExpression({
    expression: '(m2 / m1) * 100',
    usingMetrics: {
      m1: new cloudwatch.Metric({
        namespace: 'Fibonacci/Business',
        metricName: 'LeadsRecebidos',
        statistic: 'Sum',
        period: cdk.Duration.hours(24)
      }),
      m2: new cloudwatch.Metric({
        namespace: 'Fibonacci/Business',
        metricName: 'LeadsConvertidos',
        statistic: 'Sum',
        period: cdk.Duration.hours(24)
      })
    }
  }),
  threshold: 5, // Menos de 5% de conversão
  evaluationPeriods: 1,
  comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
  alarmDescription: 'Conversion rate is below 5%'
});
```

## Troubleshooting

### Dashboard não aparece

**Problema**: Dashboard não está visível no console do CloudWatch

**Soluções**:
1. Verifique se o deploy foi bem-sucedido: `aws cloudformation describe-stacks --stack-name FibonacciStack-dev`
2. Confirme que está na região correta (us-east-1)
3. Aguarde alguns minutos após o deploy
4. Verifique os logs do CloudFormation para erros

### Métricas não aparecem

**Problema**: Gráficos estão vazios ou sem dados

**Soluções**:
1. Verifique se as Lambda functions estão sendo invocadas
2. Confirme que as métricas customizadas estão sendo publicadas
3. Verifique o namespace correto (`Fibonacci/Business` ou `Fibonacci/MCP`)
4. Aguarde até 5 minutos para as métricas aparecerem
5. Verifique permissões IAM: `cloudwatch:PutMetricData`

### Erros de permissão

**Problema**: Lambda não consegue publicar métricas

**Solução**: Adicione a política ao IAM role da Lambda:

```typescript
lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
  actions: ['cloudwatch:PutMetricData'],
  resources: ['*']
}));
```

### Métricas com valores incorretos

**Problema**: Valores não fazem sentido ou estão duplicados

**Soluções**:
1. Verifique se não está publicando métricas duplicadas
2. Confirme que as dimensões estão corretas
3. Use `Unit` apropriado (Count, Percent, Milliseconds, etc.)
4. Verifique se o timestamp está correto

## Melhores Práticas

### 1. Publicação de Métricas

- ✅ Publique métricas de forma assíncrona (não bloqueie o fluxo principal)
- ✅ Use try-catch para não quebrar a Lambda se a publicação falhar
- ✅ Agrupe métricas relacionadas em um único `putMetricData`
- ✅ Use dimensões para segmentar métricas (TenantId, Environment, etc.)
- ❌ Não publique métricas em excesso (limite de 150 TPS por conta)

### 2. Dashboards

- ✅ Use períodos apropriados (1 min para infra, 1 hora para negócio)
- ✅ Agrupe widgets relacionados
- ✅ Use cores consistentes para métricas similares
- ✅ Adicione anotações para eventos importantes
- ❌ Não sobrecarregue dashboards com muitos widgets

### 3. Alarmes

- ✅ Configure alarmes para métricas críticas
- ✅ Use SNS para notificações
- ✅ Defina thresholds realistas baseados em dados históricos
- ✅ Use `treatMissingData` apropriadamente
- ❌ Não crie alarmes demais (fadiga de alertas)

## Custos

### Estimativa de Custos CloudWatch

**Dashboards**: $3/mês por dashboard
- 3 dashboards = $9/mês

**Métricas Customizadas**: $0.30 por métrica/mês (primeiras 10.000 métricas)
- ~50 métricas customizadas = $15/mês

**Alarmes**: $0.10 por alarme/mês
- ~10 alarmes = $1/mês

**Total Estimado**: ~$25/mês

### Otimização de Custos

1. Use métricas agregadas quando possível
2. Reduza a frequência de publicação de métricas não críticas
3. Use dimensões com moderação
4. Considere usar CloudWatch Insights para queries ad-hoc ao invés de métricas permanentes

## Próximos Passos

1. ✅ Dashboards implementados
2. ⏳ Configurar alarmes (Task 26)
3. ⏳ Implementar X-Ray tracing (Task 27)
4. ⏳ Configurar CloudWatch Insights queries (Task 29)

## Referências

- [AWS CloudWatch Dashboards Documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Dashboards.html)
- [AWS CDK CloudWatch Module](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudwatch-readme.html)
- [Publishing Custom Metrics](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/publishingMetrics.html)
- [CloudWatch Pricing](https://aws.amazon.com/cloudwatch/pricing/)

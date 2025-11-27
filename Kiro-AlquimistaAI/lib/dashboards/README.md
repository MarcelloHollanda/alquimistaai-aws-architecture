# CloudWatch Dashboards - Ecossistema Alquimista.AI

Este diretório contém as implementações dos dashboards do CloudWatch para monitoramento do Ecossistema Alquimista.AI.

## Dashboards Disponíveis

### 1. Fibonacci Core Dashboard

**Arquivo**: `fibonacci-core-dashboard.ts`

**Propósito**: Monitorar a infraestrutura core do sistema (API Gateway, Lambda, EventBridge, SQS)

**Métricas Incluídas**:
- **API Gateway**: Requests/min, Errors (4xx, 5xx), Latency (avg, p95, p99)
- **Lambda**: Invocations, Errors, Throttles, Duration, Concurrent Executions
- **EventBridge**: Events Published, Failed Invocations
- **SQS**: Messages In Flight, Messages Sent/Received, DLQ Count

**Uso**:
```typescript
import { FibonacciCoreDashboard } from './dashboards/fibonacci-core-dashboard';

const dashboard = new FibonacciCoreDashboard(this, 'Dashboard', {
  envName: 'prod',
  apiHandler: lambdaFunction,
  httpApi: apiGateway,
  eventBus: eventBus,
  mainQueue: queue,
  dlq: deadLetterQueue
});
```

### 2. Nigredo Agents Dashboard

**Arquivo**: `nigredo-agents-dashboard.ts`

**Propósito**: Monitorar performance e saúde dos agentes de prospecção

**Métricas Incluídas**:
- **Leads Processados**: Invocations por agente
- **Taxa de Sucesso**: (Invocations - Errors) / Invocations * 100
- **Tempo de Processamento**: Duration (avg, p95) por agente
- **Erros**: Errors e Throttles por agente
- **MCP Calls**: Chamadas e erros por serviço (WhatsApp, Calendar, Enrichment, Sentiment)

**Agentes Monitorados**:
- Recebimento
- Estratégia
- Disparo
- Atendimento
- Sentimento
- Agendamento
- Relatórios

**Uso**:
```typescript
import { NigredoAgentsDashboard } from './dashboards/nigredo-agents-dashboard';

const dashboard = new NigredoAgentsDashboard(this, 'Dashboard', {
  envName: 'prod',
  recebimentoLambda: recebimentoFn,
  estrategiaLambda: estrategiaFn,
  disparoLambda: disparoFn,
  atendimentoLambda: atendimentoFn,
  sentimentoLambda: sentimentoFn,
  agendamentoLambda: agendamentoFn,
  relatoriosLambda: relatoriosFn
});
```

### 3. Business Metrics Dashboard

**Arquivo**: `business-metrics-dashboard.ts`

**Propósito**: Monitorar métricas de negócio e KPIs de conversão

**Métricas Incluídas**:
- **Funil de Conversão**: Leads por estágio (Recebidos → Convertidos)
- **Taxa de Resposta**: (Leads Responderam / Leads Contatados) * 100
- **Taxa de Agendamento**: (Leads Agendados / Leads Interessados) * 100
- **Taxa de Conversão**: (Leads Convertidos / Leads Recebidos) * 100
- **Custo por Lead**: Custo médio de aquisição
- **ROI por Campanha**: Retorno sobre investimento
- **Mensagens**: Enviadas, Entregues, Lidas
- **Objeções e Descadastros**: Tracking de LGPD

**Uso**:
```typescript
import { BusinessMetricsDashboard } from './dashboards/business-metrics-dashboard';

const dashboard = new BusinessMetricsDashboard(this, 'Dashboard', {
  envName: 'prod',
  recebimentoLambda: recebimentoFn,
  estrategiaLambda: estrategiaFn,
  disparoLambda: disparoFn,
  atendimentoLambda: atendimentoFn,
  agendamentoLambda: agendamentoFn
});
```

## Custom Metrics

Os dashboards Business Metrics e Nigredo Agents dependem de métricas customizadas que devem ser publicadas pelas Lambda functions.

### Como Publicar Custom Metrics

Use o AWS SDK CloudWatch para publicar métricas:

```typescript
import { CloudWatch } from 'aws-sdk';

const cloudwatch = new CloudWatch();

// Exemplo: Publicar métrica de leads recebidos
await cloudwatch.putMetricData({
  Namespace: 'Fibonacci/Business',
  MetricData: [
    {
      MetricName: 'LeadsRecebidos',
      Value: leadsCount,
      Unit: 'Count',
      Timestamp: new Date(),
      Dimensions: [
        { Name: 'Environment', Value: process.env.ENVIRONMENT || 'dev' },
        { Name: 'TenantId', Value: tenantId }
      ]
    }
  ]
}).promise();
```

### Métricas Customizadas Necessárias

#### Namespace: `Fibonacci/Business`
- `LeadsRecebidos` - Total de leads recebidos
- `LeadsEnriquecidos` - Leads com dados enriquecidos
- `LeadsContatados` - Leads que receberam mensagem
- `LeadsResponderam` - Leads que responderam
- `LeadsInteressados` - Leads com interesse confirmado
- `LeadsAgendados` - Leads com reunião agendada
- `LeadsConvertidos` - Leads convertidos em clientes
- `CustoPorLead` - Custo médio por lead (R$)
- `ROICampanha` - ROI da campanha (%)
- `CustoTotal` - Custo total de operação (R$)
- `ReceitaEstimada` - Receita estimada (R$)
- `CampanhasAtivas` - Número de campanhas ativas
- `MensagensEnviadas` - Total de mensagens enviadas
- `MensagensEntregues` - Total de mensagens entregues
- `MensagensLidas` - Total de mensagens lidas
- `Objecoes` - Total de objeções recebidas
- `Descadastros` - Total de descadastros (LGPD)
- `LeadsDescartados` - Total de leads descartados

#### Namespace: `Fibonacci/MCP`
- `WhatsAppCalls` - Chamadas à API do WhatsApp
- `WhatsAppErrors` - Erros na API do WhatsApp
- `CalendarCalls` - Chamadas à API do Google Calendar
- `CalendarErrors` - Erros na API do Google Calendar
- `EnrichmentCalls` - Chamadas aos serviços de enriquecimento
- `EnrichmentErrors` - Erros nos serviços de enriquecimento
- `SentimentCalls` - Chamadas ao serviço de análise de sentimento
- `SentimentErrors` - Erros no serviço de análise de sentimento

## Acessando os Dashboards

Após o deploy, os dashboards estarão disponíveis no console do CloudWatch:

1. Acesse o AWS Console
2. Navegue para CloudWatch > Dashboards
3. Procure pelos dashboards:
   - `Fibonacci-Core-{env}`
   - `Nigredo-Agents-{env}`
   - `Business-Metrics-{env}`

Ou use a AWS CLI:

```bash
# Listar dashboards
aws cloudwatch list-dashboards

# Ver dashboard específico
aws cloudwatch get-dashboard --dashboard-name Fibonacci-Core-prod
```

## Customização

Para adicionar novas métricas ou widgets aos dashboards:

1. Edite o arquivo TypeScript correspondente
2. Adicione novos widgets usando `dashboard.addWidgets()`
3. Execute `npm run build && cdk deploy`

Exemplo:

```typescript
// Adicionar novo widget
this.dashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: 'Minha Nova Métrica',
    left: [myMetric],
    width: 12,
    height: 6
  })
);
```

## Troubleshooting

### Dashboard não aparece no console

- Verifique se o deploy foi bem-sucedido
- Confirme que você está na região correta (us-east-1)
- Verifique os outputs do CloudFormation para o nome do dashboard

### Métricas não aparecem

- Verifique se as Lambda functions estão publicando as métricas customizadas
- Confirme que o namespace está correto (`Fibonacci/Business` ou `Fibonacci/MCP`)
- Aguarde alguns minutos para as métricas aparecerem (pode haver delay)

### Erros de permissão

- Verifique se as Lambda functions têm permissão `cloudwatch:PutMetricData`
- Adicione a política necessária ao IAM role da Lambda

## Referências

- [AWS CloudWatch Dashboards](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Dashboards.html)
- [AWS CDK CloudWatch Module](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudwatch-readme.html)
- [Custom Metrics](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/publishingMetrics.html)


### 4. Latency Dashboard ✨ NOVO

**Arquivo**: `latency-dashboard.ts`

**Propósito**: Monitoramento avançado de latência com observabilidade completa (P50/P90/P99)

**Métricas Incluídas**:
- **Latência Geral**: P50, P90, P99 de todas as funções Lambda
- **Latência Atual**: Valores em tempo real (últimos 5 minutos)
- **API Handler Detalhado**: Média, P50, P90, P99, Máximo
- **Agentes**: P90 de todos os agentes de prospecção
- **Distribuição**: P50, P75, P90, P95, P99 completos
- **Tendências**: Evolução de 24h com volume de requisições
- **Métricas Customizadas**: Operações de negócio e queries de banco
- **Correlação**: Latência vs Erros/Throttles
- **SLA Tracking**: % de requisições dentro do SLA (99.9%)
- **Status de Alertas**: Alarmes de latência ativos

**Widgets Incluídos**:
1. **Latency Overview** - Visão geral P50/P90/P99
2. **Current Latency** - Valores atuais (5min)
3. **API Handler Details** - Latência detalhada da API
4. **Agent Latency** - P90 de todos os agentes
5. **Latency Distribution** - Distribuição completa
6. **Latency Trends** - Tendências de 24h
7. **Custom Metrics** - Métricas de negócio
8. **Latency Correlation** - Correlação com erros
9. **SLA Tracking** - Monitoramento de SLA
10. **Latency Alerts** - Status de alarmes

**Uso**:
```typescript
import { LatencyDashboard } from './dashboards/latency-dashboard';

const dashboard = new LatencyDashboard(this, 'LatencyDashboard', {
  envName: 'prod',
  lambdaFunctions: {
    apiHandler: apiFunction,
    agentHandlers: [
      recebimentoFn,
      estrategiaFn,
      disparoFn,
      atendimentoFn,
      sentimentoFn,
      agendamentoFn,
      relatoriosFn
    ],
    internalHandlers: [
      updateMetricsFn,
      dashboardFn
    ]
  },
  customMetrics: [
    {
      namespace: 'Fibonacci/Custom',
      metricName: 'BusinessOperationLatency'
    },
    {
      namespace: 'Fibonacci/Custom',
      metricName: 'DatabaseQueryLatency'
    }
  ]
});
```

**Integração com Enhanced Observability**:

Este dashboard funciona perfeitamente com o sistema de observabilidade avançada implementado na Fase 1:

```typescript
// No seu handler Lambda
import { withEnhancedObservability } from '../shared/enhanced-middleware';

export const handler = withEnhancedObservability('my-api', async (ctx) => {
  const { logger, tracer } = ctx;
  
  // Logs automáticos com trace_id
  logger.info('Processing request');
  
  // Métricas customizadas para o dashboard
  logger.logCustomMetric('BusinessOperationLatency', duration, 'Milliseconds');
  
  // Tracing automático para X-Ray
  await tracer.traceOperation('business-logic', async () => {
    // Sua lógica aqui
  });
  
  return { statusCode: 200, body: '{}' };
});
```

**Documentação Relacionada**:
- [Fase 1: Observabilidade Avançada](../../docs/architecture/PHASE-1-OBSERVABILITY-IMPLEMENTATION.md)
- [Referência Rápida](../../docs/architecture/OBSERVABILITY-QUICK-REFERENCE.md)
- [Exemplos de Uso](../../lambda/examples/enhanced-api-handler-example.ts)

**Benefícios**:
- ✅ Visibilidade completa de latência em todos os percentis
- ✅ Identificação rápida de gargalos e degradação de performance
- ✅ Monitoramento de SLA em tempo real
- ✅ Correlação automática entre latência e erros
- ✅ Análise de tendências para otimização proativa
- ✅ Integração com X-Ray para debugging detalhado


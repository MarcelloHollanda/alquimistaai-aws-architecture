# Fase 1: Observabilidade Avançada - Guia de Implementação

## 📋 Visão Geral

Esta fase implementa observabilidade avançada no sistema Fibonacci/Alquimista com:
- Logging estruturado com trace_id automático
- X-Ray tracing com correlation IDs
- Dashboard de latência (P50/P90/P99)
- Métricas customizadas para CloudWatch

## 🎯 Componentes Implementados

### 1. Enhanced Logger (`lambda/shared/enhanced-logger.ts`)

Logger avançado com suporte a:
- **Trace ID automático**: Gerado automaticamente ou extraído de headers
- **Correlation ID**: Para rastreamento de requisições relacionadas
- **Contexto persistente**: userId, tenantId, agentId, etc.
- **Métricas customizadas**: Integração com CloudWatch Metrics
- **Child loggers**: Para operações aninhadas com contexto adicional

#### Uso Básico

```typescript
import { createLogger } from '../shared/enhanced-logger';

const logger = createLogger('my-service', lambdaContext, {
  userId: 'user-123',
  tenantId: 'tenant-456'
});

logger.info('Operation started', {
  operation: 'process.data',
  customMetrics: {
    recordCount: 100
  }
});
```

#### Métodos Disponíveis

- `info(message, metadata)` - Log informativo
- `error(message, error, metadata)` - Log de erro com stack trace
- `warn(message, metadata)` - Log de aviso
- `debug(message, metadata)` - Log de debug
- `logApiRequest(method, path, statusCode, duration)` - Log de requisição HTTP
- `logAgentExecution(agentId, operation, success, duration)` - Log de execução de agente
- `logDatabaseQuery(query, duration, rowCount)` - Log de query ao banco
- `logExternalApiCall(service, endpoint, statusCode, duration)` - Log de chamada externa
- `logCustomMetric(metricName, value, unit)` - Enviar métrica customizada
- `logBusinessEvent(eventType, eventData)` - Log de evento de negócio
- `child(additionalContext)` - Criar child logger com contexto adicional

### 2. Enhanced X-Ray Tracer (`lambda/shared/enhanced-xray-tracer.ts`)

Tracer avançado com:
- **Subsegmentos automáticos**: Com anotações e metadados
- **Correlation tracking**: Rastreamento de requisições relacionadas
- **Operações tipadas**: Database, External API, Agent Execution
- **Child tracers**: Para operações aninhadas

#### Uso Básico

```typescript
import { createTracer } from '../shared/enhanced-xray-tracer';

const tracer = createTracer({
  traceId: 'trace-123',
  correlationId: 'corr-456',
  userId: 'user-123'
}, logger);

// Trace de operação genérica
await tracer.traceOperation('my-operation', async () => {
  // Sua lógica aqui
});

// Trace de query ao banco
await tracer.traceDatabaseQuery('SELECT', async () => {
  return await db.query('SELECT * FROM users');
});

// Trace de chamada externa
await tracer.traceExternalCall('stripe', '/charges', async () => {
  return await stripe.charges.create({...});
});

// Trace de execução de agente
await tracer.traceAgentExecution('agent-123', 'qualification', async () => {
  return await agent.execute();
});
```

### 3. Enhanced Middleware (`lambda/shared/enhanced-middleware.ts`)

Middleware que adiciona observabilidade automaticamente:

#### Para APIs HTTP

```typescript
import { withEnhancedObservability } from '../shared/enhanced-middleware';

export const handler = withEnhancedObservability(
  'my-api',
  async (ctx) => {
    const { logger, tracer, event } = ctx;
    
    // Logger e tracer já configurados com trace_id e correlation_id
    logger.info('Processing request');
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  }
);
```

#### Para Funções Internas

```typescript
import { withEnhancedLogging } from '../shared/enhanced-middleware';

export const handler = withEnhancedLogging(
  'my-internal-function',
  async (event, logger, tracer) => {
    logger.info('Processing event');
    
    await tracer.traceOperation('process', async () => {
      // Sua lógica aqui
    });
    
    return { success: true };
  }
);
```

### 4. Latency Dashboard (`lib/dashboards/latency-dashboard.ts`)

Dashboard completo de latência com:
- **P50, P90, P99**: Percentis de latência
- **Distribuição**: Visualização da distribuição de latência
- **Tendências**: Análise de tendências ao longo do tempo
- **Correlações**: Latência vs Erros/Throttles
- **SLA Tracking**: Monitoramento de SLA (99.9%)

#### Integração no Stack

```typescript
import { LatencyDashboard } from './dashboards/latency-dashboard';

// No seu stack
const latencyDashboard = new LatencyDashboard(this, 'LatencyDashboard', {
  envName: props.envName,
  lambdaFunctions: {
    apiHandler: apiFunction,
    agentHandlers: [agent1, agent2, agent3],
    internalHandlers: [internal1, internal2]
  },
  customMetrics: [
    {
      namespace: 'Fibonacci/Custom',
      metricName: 'BusinessOperationLatency'
    }
  ]
});
```

## 🚀 Migração de Código Existente

### Passo 1: Atualizar Imports

**Antes:**
```typescript
import { Logger } from '@aws-lambda-powertools/logger';
const logger = new Logger({ serviceName: 'my-service' });
```

**Depois:**
```typescript
import { createLogger } from '../shared/enhanced-logger';
const logger = createLogger('my-service', context);
```

### Passo 2: Adicionar Middleware

**Antes:**
```typescript
export const handler = async (event: APIGatewayProxyEvent) => {
  // Lógica aqui
};
```

**Depois:**
```typescript
import { withEnhancedObservability } from '../shared/enhanced-middleware';

export const handler = withEnhancedObservability(
  'my-service',
  async (ctx) => {
    const { logger, tracer, event } = ctx;
    // Lógica aqui
  }
);
```

### Passo 3: Adicionar Tracing

**Antes:**
```typescript
const result = await database.query('SELECT * FROM users');
```

**Depois:**
```typescript
const result = await tracer.traceDatabaseQuery('SELECT', async () => {
  return await database.query('SELECT * FROM users');
});
```

## 📊 Métricas Customizadas

### Enviando Métricas

```typescript
// Métrica simples
logger.logCustomMetric('UserSignup', 1, 'Count');

// Métrica com valor
logger.logCustomMetric('OrderValue', 99.99, 'None');

// Evento de negócio (gera métrica automaticamente)
logger.logBusinessEvent('purchase.completed', {
  orderId: 'order-123',
  amount: 99.99,
  currency: 'BRL'
});
```

### Visualizando no CloudWatch

As métricas são enviadas para o namespace `Fibonacci/Custom` e podem ser visualizadas em:
- CloudWatch Metrics Console
- Dashboards customizados
- Alarmes

## 🔍 Queries no CloudWatch Insights

### Buscar por Trace ID

```
fields @timestamp, @message, traceId, correlationId, operation
| filter traceId = "1-67890abc-def123456789"
| sort @timestamp desc
```

### Analisar Latência por Operação

```
fields @timestamp, operation, duration
| filter operation like /agent/
| stats avg(duration), max(duration), pct(duration, 90) by operation
```

### Identificar Erros Correlacionados

```
fields @timestamp, correlationId, @message, error.message
| filter correlationId = "corr-123"
| sort @timestamp asc
```

## 🎨 Visualizações no X-Ray

### Service Map
- Visualize o fluxo de requisições entre serviços
- Identifique gargalos e dependências
- Analise latência por serviço

### Traces
- Veja o trace completo de uma requisição
- Identifique subsegmentos lentos
- Analise anotações e metadados

### Analytics
- Analise distribuição de latência
- Identifique padrões de erro
- Compare performance entre versões

## 🔧 Configuração

### Variáveis de Ambiente

```bash
LOG_LEVEL=INFO          # DEBUG, INFO, WARN, ERROR
ENVIRONMENT=production  # dev, staging, production
VERSION=1.0.0          # Versão da aplicação
```

### Permissões IAM Necessárias

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    }
  ]
}
```

## 📈 Benefícios

### 1. Rastreabilidade Completa
- Trace ID único para cada requisição
- Correlation ID para requisições relacionadas
- Contexto completo em todos os logs

### 2. Debugging Facilitado
- Busca rápida por trace ID
- Visualização de fluxo completo
- Identificação de gargalos

### 3. Métricas Acionáveis
- P50/P90/P99 para SLA
- Métricas de negócio customizadas
- Alertas proativos

### 4. Performance Insights
- Identificação de operações lentas
- Análise de tendências
- Otimização baseada em dados

## 🎯 Próximos Passos

1. **Migrar funções existentes** para usar o enhanced middleware
2. **Configurar alarmes** baseados em P90/P99
3. **Criar dashboards customizados** para métricas de negócio
4. **Implementar distributed tracing** entre microserviços
5. **Adicionar APM** (Application Performance Monitoring)

## 📚 Referências

- [AWS X-Ray Documentation](https://docs.aws.amazon.com/xray/)
- [CloudWatch Logs Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html)
- [Lambda Powertools](https://awslabs.github.io/aws-lambda-powertools-typescript/)

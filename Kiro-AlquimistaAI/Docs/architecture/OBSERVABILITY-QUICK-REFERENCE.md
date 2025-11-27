# Observabilidade Avançada - Referência Rápida

## 🚀 Setup Rápido

### 1. API Handler com Observabilidade

```typescript
import { withEnhancedObservability } from '../shared/enhanced-middleware';

export const handler = withEnhancedObservability('my-api', async (ctx) => {
  const { logger, tracer, event } = ctx;
  
  logger.info('Processing request');
  
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
});
```

### 2. Função Interna com Logging

```typescript
import { withEnhancedLogging } from '../shared/enhanced-middleware';

export const handler = withEnhancedLogging('my-function', 
  async (event, logger, tracer) => {
    logger.info('Processing event');
    return { success: true };
  }
);
```

## 📝 Logging

### Logs Básicos
```typescript
logger.info('Message', { operation: 'op.name' });
logger.warn('Warning', { operation: 'op.name' });
logger.error('Error', error, { operation: 'op.name' });
logger.debug('Debug info', { operation: 'op.name' });
```

### Logs Especializados
```typescript
// API Request
logger.logApiRequest('GET', '/users', 200, 150);

// Database Query
logger.logDatabaseQuery('SELECT * FROM users', 50, 10);

// External API Call
logger.logExternalApiCall('stripe', '/charges', 200, 300);

// Agent Execution
logger.logAgentExecution('agent-123', 'qualify', true, 500);

// Business Event
logger.logBusinessEvent('user.signup', { userId: '123' });

// Custom Metric
logger.logCustomMetric('UserSignup', 1, 'Count');
```

### Child Logger
```typescript
const childLogger = logger.child({
  operation: 'nested.op',
  agentId: 'agent-123'
});

childLogger.info('Child operation');
```

## 🔍 Tracing

### Operações Genéricas
```typescript
await tracer.traceOperation('operation-name', async () => {
  // Sua lógica aqui
  return result;
});
```

### Database Queries
```typescript
await tracer.traceDatabaseQuery('SELECT', async () => {
  return await db.query('SELECT * FROM users');
});
```

### External API Calls
```typescript
await tracer.traceExternalCall('service-name', '/endpoint', async () => {
  return await fetch('https://api.example.com/endpoint');
});
```

### Agent Execution
```typescript
await tracer.traceAgentExecution('agent-123', 'qualification', async () => {
  return await agent.execute();
});
```

### Child Tracer
```typescript
const childTracer = tracer.child({
  operation: 'nested.op',
  agentId: 'agent-123'
});

await childTracer.traceOperation('nested', async () => {
  // Lógica aninhada
});
```

## 📊 CloudWatch Insights Queries

### Buscar por Trace ID
```
fields @timestamp, @message, traceId, correlationId
| filter traceId = "1-67890abc-def123456789"
| sort @timestamp desc
```

### Latência por Operação
```
fields @timestamp, operation, duration
| stats avg(duration), max(duration), pct(duration, 90) by operation
```

### Erros por Correlation ID
```
fields @timestamp, correlationId, @message, error.message
| filter correlationId = "corr-123"
| sort @timestamp asc
```

### Top 10 Operações Mais Lentas
```
fields @timestamp, operation, duration
| sort duration desc
| limit 10
```

### Taxa de Erro por Hora
```
fields @timestamp
| filter level = "ERROR"
| stats count() by bin(1h)
```

### Métricas de Negócio
```
fields @timestamp, customMetrics.eventType, customMetrics.eventData
| filter customMetrics.businessMetric = true
| stats count() by customMetrics.eventType
```

## 🎯 Headers HTTP

### Request Headers (Cliente → API)
```
X-Trace-Id: 1-67890abc-def123456789
X-Correlation-Id: corr-123-456
X-User-Id: user-123
X-Tenant-Id: tenant-456
```

### Response Headers (API → Cliente)
```
X-Trace-Id: 1-67890abc-def123456789
X-Correlation-Id: corr-123-456
```

## 📈 Métricas Customizadas

### Namespace
```
Fibonacci/Custom
```

### Exemplos de Métricas
```typescript
// Contador
logger.logCustomMetric('UserSignup', 1, 'Count');

// Valor
logger.logCustomMetric('OrderValue', 99.99, 'None');

// Duração
logger.logCustomMetric('ProcessingTime', 150, 'Milliseconds');

// Percentual
logger.logCustomMetric('SuccessRate', 99.5, 'Percent');
```

## 🔔 Alarmes Recomendados

### Latência P90 Alta
```typescript
new cloudwatch.Alarm(this, 'HighLatencyP90', {
  metric: fn.metricDuration({ statistic: 'p90' }),
  threshold: 1000, // 1 segundo
  evaluationPeriods: 2,
  alarmDescription: 'P90 latency is too high'
});
```

### Taxa de Erro Alta
```typescript
new cloudwatch.Alarm(this, 'HighErrorRate', {
  metric: fn.metricErrors({ statistic: 'Sum' }),
  threshold: 10,
  evaluationPeriods: 1,
  alarmDescription: 'Error rate is too high'
});
```

### SLA Violation
```typescript
new cloudwatch.Alarm(this, 'SLAViolation', {
  metric: new cloudwatch.MathExpression({
    expression: '(m1 / m2) * 100 < 99.9',
    usingMetrics: {
      m1: fn.metricDuration({ statistic: 'SampleCount' }),
      m2: fn.metricInvocations({ statistic: 'Sum' })
    }
  }),
  threshold: 1,
  evaluationPeriods: 1,
  alarmDescription: 'SLA target not met'
});
```

## 🎨 X-Ray Annotations

### Anotações Automáticas
- `correlationId` - ID de correlação
- `service` - Nome do serviço
- `operation` - Nome da operação
- `userId` - ID do usuário (se disponível)
- `tenantId` - ID do tenant (se disponível)
- `success` - true/false
- `duration` - Duração em ms

### Anotações Customizadas
```typescript
tracer.addAnnotation('customKey', 'customValue');
tracer.addMetadata('namespace', { key: 'value' });
```

## 🔧 Troubleshooting

### Trace ID não aparece nos logs
- Verifique se está usando `withEnhancedObservability` ou `withEnhancedLogging`
- Confirme que o header `X-Trace-Id` está sendo enviado

### X-Ray não mostra traces
- Verifique permissões IAM (`xray:PutTraceSegments`)
- Confirme que X-Ray está habilitado na função Lambda
- Verifique se `aws-xray-sdk-core` está instalado

### Métricas não aparecem no CloudWatch
- Verifique permissões IAM (`cloudwatch:PutMetricData`)
- Confirme o namespace correto (`Fibonacci/Custom`)
- Aguarde até 5 minutos para métricas aparecerem

### Logs não estruturados
- Use sempre os métodos do logger (`logger.info`, etc.)
- Não use `console.log` diretamente
- Passe metadados no segundo parâmetro

## 📚 Recursos

- [Documentação Completa](./PHASE-1-OBSERVABILITY-IMPLEMENTATION.md)
- [Exemplos de Código](../../lambda/examples/enhanced-api-handler-example.ts)
- [Evolution Plan](./FIBONACCI-EVOLUTION-PLAN.md)

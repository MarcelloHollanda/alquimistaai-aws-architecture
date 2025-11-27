# Logging e Observabilidade - Guia Rápido

## Structured Logging

### Importar Logger

```typescript
import { createLogger } from '../shared/logger';

const logger = createLogger('operational-dashboard');
```

### Usar Logger em Handler

```typescript
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const context = extractAuthContext(event);
  
  // Atualizar contexto
  logger.updateContext({
    tenantId: context.tenantId,
    userId: context.sub,
    requestId: event.requestContext.requestId
  });
  
  // Log info
  logger.info('Processing request', {
    path: event.path,
    method: event.httpMethod
  });
  
  try {
    // Sua lógica aqui
    const result = await processRequest(event);
    
    logger.info('Request completed', {
      statusCode: 200,
      resultCount: result.length
    });
    
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    logger.error('Request failed', error as Error, {
      path: event.path
    });
    
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
}
```

## X-Ray Tracing

### Importar Tracer

```typescript
import { traceSubsegment, addAnnotations } from '../shared/xray-tracer';
```

### Adicionar Anotações

```typescript
addAnnotations({
  tenantId: context.tenantId || 'internal',
  userId: context.sub,
  endpoint: event.path
});
```

### Traçar Operação

```typescript
const result = await traceSubsegment(
  'FetchTenantData',
  () => getTenantById(tenantId),
  { tenantId, operation: 'getTenant' }
);
```

## Métricas Customizadas

### Importar Emitter

```typescript
import {
  emitTenantAPICall,
  emitInternalAPICall,
  emitOperationalCommandCreated,
  emitCacheHit,
  emitCacheMiss
} from '../shared/metrics-emitter';
```

### Emitir Métricas

```typescript
// API de tenant
await emitTenantAPICall(tenantId, '/tenant/me', 200, duration);

// API interna
await emitInternalAPICall(userId, '/internal/tenants', 200, duration);

// Comando operacional
await emitOperationalCommandCreated('REPROCESS_QUEUE', tenantId);

// Cache
await emitCacheHit('tenants:list');
await emitCacheMiss('tenants:list');
```

## CloudWatch Logs Insights

### Acessar Queries

1. Console AWS → CloudWatch → Logs Insights
2. Selecionar log group: `/aws/lambda/operational-dashboard-*`
3. Usar queries pré-configuradas

### Queries Úteis

**Erros por Tenant:**
```
fields @timestamp, tenantId, @message, error.message
| filter @message like /ERROR/
| stats count() by tenantId
| sort count desc
```

**Latência de APIs:**
```
fields @timestamp, path, @duration
| filter path like /\/tenant\//
| stats avg(@duration), max(@duration) by path
```

**Comandos Operacionais:**
```
fields @timestamp, commandType, status
| filter @message like /command/
| stats count() by commandType, status
```

## Alarmes

### Alarmes Configurados

- **HighErrorRate**: Taxa de erro > 10 em 5 min
- **HighLatency**: Latência média > 2s
- **Throttling**: Throttles > 5 em 5 min
- **CommandFailures**: Comandos falhando > 3 em 15 min
- **LowCacheHitRate**: Cache hit rate < 50%
- **HighAuthorizationFailures**: Falhas de autorização > 20 em 10 min

### Receber Notificações

Alarmes enviam notificações para o tópico SNS configurado.

## Dashboard CloudWatch

### Acessar Dashboard

Console AWS → CloudWatch → Dashboards → `OperationalDashboard-{env}`

### Widgets Principais

1. **API Latency**: Latência por endpoint
2. **Error Rate**: Taxa de erro geral
3. **Operational Commands**: Comandos por tipo e status
4. **Cache Performance**: Hit rate do cache
5. **Active Users**: Usuários ativos

## Troubleshooting

### Handler não está logando

Verificar:
- Logger foi importado e inicializado
- Contexto foi atualizado com tenantId/userId
- Variável `LOG_LEVEL` está configurada

### X-Ray não está traçando

Verificar:
- X-Ray está habilitado na função Lambda
- Anotações foram adicionadas
- Subsegments foram criados e fechados

### Métricas não aparecem

Verificar:
- Namespace correto: `AlquimistaAI/OperationalDashboard`
- Dimensões estão corretas
- Aguardar até 5 minutos para métricas aparecerem

### Alarmes não disparam

Verificar:
- Threshold está correto
- Período de avaliação está adequado
- Tópico SNS tem assinantes
- E-mail foi confirmado

## Boas Práticas

1. **Sempre** adicionar contexto ao logger (tenantId, userId)
2. **Sempre** logar início e fim de operações importantes
3. **Sempre** logar erros com stack trace
4. **Usar** X-Ray para operações de banco de dados e APIs externas
5. **Emitir** métricas para operações críticas
6. **Não** logar dados sensíveis (senhas, tokens, PII)
7. **Usar** níveis de log apropriados (DEBUG, INFO, WARN, ERROR)

## Comandos Úteis

### Ver logs em tempo real

```bash
aws logs tail /aws/lambda/operational-dashboard-tenant-api --follow
```

### Executar query do Logs Insights

```bash
aws logs start-query \
  --log-group-name /aws/lambda/operational-dashboard-tenant-api \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/'
```

### Listar alarmes ativos

```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix OperationalDashboard \
  --state-value ALARM
```

### Ver métricas customizadas

```bash
aws cloudwatch get-metric-statistics \
  --namespace AlquimistaAI/OperationalDashboard \
  --metric-name TenantAPICall \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum
```

## Links Úteis

- [Documentação Completa](./LOGGING-OBSERVABILITY-IMPLEMENTATION.md)
- [CloudWatch Logs Insights Queries](../../lib/dashboards/operational-dashboard-insights-queries.ts)
- [Alarmes](../../lib/dashboards/operational-dashboard-alarms.ts)
- [Metrics Emitter](../../lambda/shared/metrics-emitter.ts)
- [Logger](../../lambda/shared/logger.ts)
- [X-Ray Tracer](../../lambda/shared/xray-tracer.ts)

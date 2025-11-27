# Implementação de Logging e Observabilidade - Painel Operacional

## Visão Geral

Este documento descreve a implementação completa de logging estruturado e observabilidade para o Painel Operacional AlquimistaAI, incluindo:

- Structured logging em todos os handlers
- CloudWatch Logs Insights queries
- Alarmes para erros críticos
- X-Ray tracing em handlers principais
- Métricas customizadas no CloudWatch

## Arquitetura de Observabilidade

```
┌─────────────────────────────────────────────────────────────┐
│                    Lambda Handlers                           │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  Tenant APIs         │  │  Internal APIs       │        │
│  │  - Structured Logs   │  │  - Structured Logs   │        │
│  │  - X-Ray Tracing     │  │  - X-Ray Tracing     │        │
│  │  - Custom Metrics    │  │  - Custom Metrics    │        │
│  └──────────────────────┘  └──────────────────────┘        │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│  CloudWatch      │    │   X-Ray          │
│  - Logs          │    │   - Traces       │
│  - Metrics       │    │   - Service Map  │
│  - Alarms        │    │   - Analytics    │
│  - Insights      │    └──────────────────┘
└──────────────────┘
```

## Padrões de Logging

### 1. Structured Logging

Todos os handlers devem usar o logger estruturado:

```typescript
import { createLogger } from '../shared/logger';

const logger = createLogger('operational-dashboard');

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const context = extractAuthContext(event);
  
  // Atualizar contexto do logger
  logger.updateContext({
    tenantId: context.tenantId,
    userId: context.sub,
    requestId: event.requestContext.requestId
  });
  
  logger.info('Processing request', {
    path: event.path,
    method: event.httpMethod,
    userGroups: context.groups
  });
  
  try {
    // Lógica do handler
    const result = await processRequest(event);
    
    logger.info('Request completed successfully', {
      statusCode: 200,
      resultCount: result.length
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    logger.error('Request failed', error as Error, {
      path: event.path,
      method: event.httpMethod
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}
```

### 2. X-Ray Tracing

Handlers principais devem incluir tracing:

```typescript
import { traceSubsegment, addAnnotations } from '../shared/xray-tracer';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const context = extractAuthContext(event);
  
  // Adicionar anotações para filtragem
  addAnnotations({
    tenantId: context.tenantId || 'internal',
    userId: context.sub,
    isInternal: context.isInternal.toString()
  });
  
  return traceSubsegment(
    'ProcessTenantRequest',
    async () => {
      // Lógica do handler
      const data = await fetchTenantData(context.tenantId!);
      return {
        statusCode: 200,
        body: JSON.stringify(data)
      };
    },
    {
      tenantId: context.tenantId,
      operation: 'getTenantData'
    }
  );
}
```

### 3. Custom Metrics

Emitir métricas customizadas para monitoramento:

```typescript
import { CloudWatch } from 'aws-sdk';

const cloudwatch = new CloudWatch();

async function emitMetric(
  metricName: string,
  value: number,
  dimensions: { Name: string; Value: string }[]
): Promise<void> {
  await cloudwatch.putMetricData({
    Namespace: 'AlquimistaAI/OperationalDashboard',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: 'Count',
      Timestamp: new Date(),
      Dimensions: dimensions
    }]
  }).promise();
}

// Exemplo de uso
await emitMetric('TenantAPICall', 1, [
  { Name: 'TenantId', Value: tenantId },
  { Name: 'Endpoint', Value: '/tenant/me' }
]);
```

## CloudWatch Logs Insights Queries

### Query 1: Erros por Tenant

```
fields @timestamp, tenantId, @message, error.message
| filter @message like /ERROR/
| stats count() by tenantId
| sort count desc
```

### Query 2: Latência de APIs

```
fields @timestamp, path, @duration
| filter path like /\/tenant\//
| stats avg(@duration), max(@duration), min(@duration) by path
```

### Query 3: Comandos Operacionais

```
fields @timestamp, command_type, status, tenant_id
| filter @message like /operational command/
| stats count() by command_type, status
```

### Query 4: Taxa de Erro por Endpoint

```
fields @timestamp, path, statusCode
| filter statusCode >= 400
| stats count() as errors by path
| sort errors desc
```

### Query 5: Usuários Internos Ativos

```
fields @timestamp, userId, path
| filter isInternal = "true"
| stats count() by userId
| sort count desc
```

## Alarmes CloudWatch

### 1. Taxa de Erro Alta

```typescript
new cloudwatch.Alarm(this, 'HighErrorRate', {
  alarmName: 'OperationalDashboard-HighErrorRate',
  metric: new cloudwatch.Metric({
    namespace: 'AWS/Lambda',
    metricName: 'Errors',
    dimensionsMap: {
      FunctionName: tenantApiFunction.functionName
    },
    statistic: 'Sum',
    period: Duration.minutes(5)
  }),
  threshold: 10,
  evaluationPeriods: 2,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
});
```

### 2. Latência Alta

```typescript
new cloudwatch.Alarm(this, 'HighLatency', {
  alarmName: 'OperationalDashboard-HighLatency',
  metric: new cloudwatch.Metric({
    namespace: 'AWS/Lambda',
    metricName: 'Duration',
    dimensionsMap: {
      FunctionName: tenantApiFunction.functionName
    },
    statistic: 'Average',
    period: Duration.minutes(5)
  }),
  threshold: 2000, // 2 segundos
  evaluationPeriods: 2,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
});
```

### 3. Throttling

```typescript
new cloudwatch.Alarm(this, 'Throttling', {
  alarmName: 'OperationalDashboard-Throttling',
  metric: new cloudwatch.Metric({
    namespace: 'AWS/Lambda',
    metricName: 'Throttles',
    dimensionsMap: {
      FunctionName: tenantApiFunction.functionName
    },
    statistic: 'Sum',
    period: Duration.minutes(5)
  }),
  threshold: 5,
  evaluationPeriods: 1,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
});
```

### 4. Comandos Operacionais Falhando

```typescript
new cloudwatch.Alarm(this, 'OperationalCommandFailures', {
  alarmName: 'OperationalDashboard-CommandFailures',
  metric: new cloudwatch.Metric({
    namespace: 'AlquimistaAI/OperationalDashboard',
    metricName: 'OperationalCommandError',
    statistic: 'Sum',
    period: Duration.minutes(15)
  }),
  threshold: 3,
  evaluationPeriods: 1,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
});
```

## Métricas Customizadas

### Namespace: AlquimistaAI/OperationalDashboard

#### Métricas de API

- **TenantAPICall**: Chamadas às APIs de tenant
  - Dimensions: TenantId, Endpoint
  
- **InternalAPICall**: Chamadas às APIs internas
  - Dimensions: UserId, Endpoint
  
- **APILatency**: Latência das APIs
  - Dimensions: Endpoint, StatusCode

#### Métricas de Comandos

- **OperationalCommandCreated**: Comandos criados
  - Dimensions: CommandType, TenantId
  
- **OperationalCommandSuccess**: Comandos bem-sucedidos
  - Dimensions: CommandType
  
- **OperationalCommandError**: Comandos com erro
  - Dimensions: CommandType, ErrorType

#### Métricas de Cache

- **CacheHit**: Cache hits
  - Dimensions: CacheKey
  
- **CacheMiss**: Cache misses
  - Dimensions: CacheKey

## Implementação por Handler

### Tenant APIs

#### GET /tenant/me

```typescript
import { createLogger } from '../shared/logger';
import { traceSubsegment, addAnnotations } from '../shared/xray-tracer';

const logger = createLogger('tenant-api');

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const startTime = Date.now();
  const context = extractAuthContext(event);
  
  logger.updateContext({
    tenantId: context.tenantId,
    userId: context.sub
  });
  
  addAnnotations({
    tenantId: context.tenantId!,
    endpoint: '/tenant/me'
  });
  
  logger.info('Fetching tenant data', {
    tenantId: context.tenantId
  });
  
  try {
    const tenant = await traceSubsegment(
      'FetchTenantData',
      () => getTenantById(context.tenantId!),
      { tenantId: context.tenantId }
    );
    
    const duration = Date.now() - startTime;
    
    logger.info('Tenant data fetched successfully', {
      duration,
      tenantId: context.tenantId
    });
    
    await emitMetric('TenantAPICall', 1, [
      { Name: 'TenantId', Value: context.tenantId! },
      { Name: 'Endpoint', Value: '/tenant/me' }
    ]);
    
    await emitMetric('APILatency', duration, [
      { Name: 'Endpoint', Value: '/tenant/me' },
      { Name: 'StatusCode', Value: '200' }
    ]);
    
    return {
      statusCode: 200,
      body: JSON.stringify(tenant)
    };
  } catch (error) {
    logger.error('Failed to fetch tenant data', error as Error, {
      tenantId: context.tenantId
    });
    
    await emitMetric('TenantAPICall', 1, [
      { Name: 'TenantId', Value: context.tenantId! },
      { Name: 'Endpoint', Value: '/tenant/me' },
      { Name: 'Status', Value: 'Error' }
    ]);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}
```

### Internal APIs

#### GET /internal/tenants

```typescript
import { createLogger } from '../shared/logger';
import { traceSubsegment, addAnnotations } from '../shared/xray-tracer';

const logger = createLogger('internal-api');

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const startTime = Date.now();
  const context = extractAuthContext(event);
  
  logger.updateContext({
    userId: context.sub,
    isInternal: true
  });
  
  addAnnotations({
    userId: context.sub,
    endpoint: '/internal/tenants',
    isInternal: 'true'
  });
  
  logger.info('Listing tenants', {
    userId: context.sub,
    filters: event.queryStringParameters
  });
  
  try {
    requireInternal(context);
    
    const tenants = await traceSubsegment(
      'FetchTenantsList',
      () => fetchTenants(event.queryStringParameters),
      { operation: 'listTenants' }
    );
    
    const duration = Date.now() - startTime;
    
    logger.info('Tenants listed successfully', {
      duration,
      count: tenants.length,
      userId: context.sub
    });
    
    await emitMetric('InternalAPICall', 1, [
      { Name: 'UserId', Value: context.sub },
      { Name: 'Endpoint', Value: '/internal/tenants' }
    ]);
    
    return {
      statusCode: 200,
      body: JSON.stringify(tenants)
    };
  } catch (error) {
    logger.error('Failed to list tenants', error as Error, {
      userId: context.sub
    });
    
    return {
      statusCode: error.message.includes('Forbidden') ? 403 : 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
```

### Operational Commands

#### POST /internal/operations/commands

```typescript
import { createLogger } from '../shared/logger';
import { traceSubsegment, addAnnotations } from '../shared/xray-tracer';

const logger = createLogger('operational-commands');

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const context = extractAuthContext(event);
  const body = JSON.parse(event.body || '{}');
  
  logger.updateContext({
    userId: context.sub,
    commandType: body.command_type
  });
  
  addAnnotations({
    userId: context.sub,
    commandType: body.command_type,
    tenantId: body.tenant_id || 'global'
  });
  
  logger.info('Creating operational command', {
    commandType: body.command_type,
    tenantId: body.tenant_id,
    createdBy: context.sub
  });
  
  try {
    requireInternal(context);
    
    const command = await traceSubsegment(
      'CreateCommand',
      () => createCommand(body, context.sub),
      {
        commandType: body.command_type,
        tenantId: body.tenant_id
      }
    );
    
    logger.info('Operational command created', {
      commandId: command.command_id,
      commandType: body.command_type
    });
    
    await emitMetric('OperationalCommandCreated', 1, [
      { Name: 'CommandType', Value: body.command_type },
      { Name: 'TenantId', Value: body.tenant_id || 'global' }
    ]);
    
    return {
      statusCode: 201,
      body: JSON.stringify(command)
    };
  } catch (error) {
    logger.error('Failed to create operational command', error as Error, {
      commandType: body.command_type,
      tenantId: body.tenant_id
    });
    
    await emitMetric('OperationalCommandError', 1, [
      { Name: 'CommandType', Value: body.command_type },
      { Name: 'ErrorType', Value: 'CreationFailed' }
    ]);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create command' })
    };
  }
}
```

## Dashboard CloudWatch

### Widgets Recomendados

1. **API Latency**
   - Tipo: Line chart
   - Métrica: APILatency (avg, max, p99)
   - Dimensão: Endpoint

2. **Error Rate**
   - Tipo: Number
   - Métrica: Errors / Invocations * 100
   - Alarme: > 5%

3. **Operational Commands**
   - Tipo: Stacked area
   - Métricas: OperationalCommandCreated, OperationalCommandSuccess, OperationalCommandError
   - Dimensão: CommandType

4. **Cache Performance**
   - Tipo: Pie chart
   - Métricas: CacheHit, CacheMiss

5. **Active Users**
   - Tipo: Number
   - Métrica: Unique userId count (via Logs Insights)

## Checklist de Implementação

- [x] Logger estruturado configurado
- [x] X-Ray tracer configurado
- [ ] Logging adicionado em todos os handlers de tenant
- [ ] Logging adicionado em todos os handlers internos
- [ ] X-Ray tracing adicionado em handlers principais
- [ ] Métricas customizadas implementadas
- [ ] CloudWatch Logs Insights queries criadas
- [ ] Alarmes configurados
- [ ] Dashboard CloudWatch criado
- [ ] Documentação atualizada

## Próximos Passos

1. Adicionar logging estruturado em todos os handlers
2. Implementar X-Ray tracing nos handlers principais
3. Criar métricas customizadas
4. Configurar alarmes no CDK
5. Criar dashboard CloudWatch
6. Testar queries do Logs Insights
7. Validar alarmes em ambiente dev

## Referências

- [AWS Lambda Powertools - Logger](https://docs.powertools.aws.dev/lambda/typescript/latest/core/logger/)
- [AWS Lambda Powertools - Tracer](https://docs.powertools.aws.dev/lambda/typescript/latest/core/tracer/)
- [CloudWatch Logs Insights Query Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [CloudWatch Custom Metrics](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/publishingMetrics.html)

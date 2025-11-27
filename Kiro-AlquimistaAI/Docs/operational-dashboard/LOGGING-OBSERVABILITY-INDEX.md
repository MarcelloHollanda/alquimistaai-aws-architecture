# Logging e Observabilidade - Índice

## 📚 Documentação

### Guias Principais

1. **[Implementação Completa](./LOGGING-OBSERVABILITY-IMPLEMENTATION.md)**
   - Arquitetura de observabilidade
   - Padrões de logging estruturado
   - Padrões de X-Ray tracing
   - Métricas customizadas
   - CloudWatch Logs Insights queries
   - Alarmes CloudWatch
   - Dashboard CloudWatch

2. **[Guia Rápido](./LOGGING-OBSERVABILITY-QUICK-REFERENCE.md)** ⚡
   - Exemplos de código
   - Queries úteis
   - Comandos CLI
   - Troubleshooting
   - Boas práticas

3. **[Resumo de Implementação](./TASK-19-IMPLEMENTATION-SUMMARY.md)**
   - O que foi implementado
   - Status da tarefa
   - Próximos passos
   - Como usar

## 🔧 Código

### Componentes Principais

1. **[Logger Estruturado](../../lambda/shared/logger.ts)**
   - Logging com contexto
   - Níveis de log
   - Integração com Powertools

2. **[X-Ray Tracer](../../lambda/shared/xray-tracer.ts)**
   - Distributed tracing
   - Subsegments
   - Anotações e metadata

3. **[Metrics Emitter](../../lambda/shared/metrics-emitter.ts)** 🆕
   - Emissão de métricas customizadas
   - Helpers específicos
   - Buffer de métricas

4. **[CloudWatch Insights Queries](../../lib/dashboards/operational-dashboard-insights-queries.ts)** 🆕
   - 26 queries pré-configuradas
   - Queries por categoria
   - Helpers de busca

5. **[CloudWatch Alarms](../../lib/dashboards/operational-dashboard-alarms.ts)** 🆕
   - ~15 alarmes configurados
   - Tópico SNS
   - Alarmes compostos

### Exemplos

1. **[Handler Completo](../../lambda/platform/get-tenant-me-enhanced.ts.example)** 🆕
   - Logging estruturado
   - X-Ray tracing
   - Métricas customizadas
   - Error handling
   - Cache integration

## 📊 CloudWatch

### Logs Insights

**26 Queries Pré-configuradas:**

#### Tenant APIs (5)
- Tenant API Errors
- Tenant API Latency
- Most Active Tenants
- Tenant API Status Codes
- Slow Tenant Requests

#### Internal APIs (5)
- Internal API Errors
- Internal API Usage by User
- Internal API Latency
- Forbidden Access Attempts
- Active Internal Users

#### Operational Commands (5)
- Operational Commands by Type
- Failed Operational Commands
- Command Execution Time
- Commands by Tenant
- Command Success Rate

#### Metrics Aggregation (3)
- Daily Metrics Aggregation Status
- Metrics Aggregation Errors
- Aggregation Performance

#### Cache (2)
- Cache Hit Rate
- Cache Performance by Key

#### Security (3)
- Authorization Failures
- Tenant Isolation Violations
- Suspicious Activity

#### General (3)
- Error Summary
- Request Volume by Hour
- Cold Starts

### Alarmes

**~15 Alarmes Configurados:**

#### Por Função Lambda
- High Error Rate
- High Latency
- Throttling
- High Concurrent Executions

#### Comandos Operacionais
- Command Failures
- Low Command Success Rate

#### Agregação de Métricas
- Metrics Aggregation Failure
- Metrics Aggregation Not Running

#### Métricas Customizadas
- Low Cache Hit Rate
- High API Latency

#### Segurança
- High Authorization Failures
- Tenant Isolation Violation

### Métricas Customizadas

**Namespace:** `AlquimistaAI/OperationalDashboard`

#### APIs
- TenantAPICall
- InternalAPICall
- APILatency

#### Comandos
- OperationalCommandCreated
- OperationalCommandSuccess
- OperationalCommandError
- OperationalCommandDuration

#### Cache
- CacheHit
- CacheMiss

#### Segurança
- AuthorizationFailure
- TenantIsolationViolation

#### Agregação
- MetricsAggregationRun
- MetricsAggregationTenants
- MetricsAggregationDuration

## 🚀 Quick Start

### 1. Usar Logger

```typescript
import { createLogger } from '../shared/logger';

const logger = createLogger('my-service');

logger.updateContext({ tenantId, userId });
logger.info('Processing request', { data });
logger.error('Request failed', error);
```

### 2. Usar X-Ray Tracer

```typescript
import { traceSubsegment, addAnnotations } from '../shared/xray-tracer';

addAnnotations({ tenantId, endpoint });

const result = await traceSubsegment(
  'MyOperation',
  () => doSomething(),
  { tenantId }
);
```

### 3. Emitir Métricas

```typescript
import { emitTenantAPICall } from '../shared/metrics-emitter';

await emitTenantAPICall(tenantId, '/tenant/me', 200, duration);
```

### 4. Executar Query

1. Console AWS → CloudWatch → Logs Insights
2. Selecionar log group
3. Copiar query de `operational-dashboard-insights-queries.ts`
4. Executar

### 5. Ver Alarmes

```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix OperationalDashboard \
  --state-value ALARM
```

## 📖 Tutoriais

### Como Adicionar Logging a um Handler

1. Importar logger
2. Criar instância
3. Atualizar contexto
4. Logar eventos importantes
5. Logar erros com stack trace

**Ver:** [Guia Rápido](./LOGGING-OBSERVABILITY-QUICK-REFERENCE.md#structured-logging)

### Como Adicionar X-Ray Tracing

1. Importar tracer
2. Adicionar anotações
3. Envolver operações em subsegments
4. Traçar queries de banco
5. Traçar chamadas externas

**Ver:** [Guia Rápido](./LOGGING-OBSERVABILITY-QUICK-REFERENCE.md#x-ray-tracing)

### Como Emitir Métricas

1. Importar metrics emitter
2. Usar helpers específicos
3. Emitir em pontos críticos
4. Usar buffer para batch
5. Validar no CloudWatch

**Ver:** [Guia Rápido](./LOGGING-OBSERVABILITY-QUICK-REFERENCE.md#métricas-customizadas)

### Como Criar Query Customizada

1. Identificar log group
2. Escrever query
3. Testar no console
4. Adicionar ao arquivo de queries
5. Documentar uso

**Ver:** [Implementação Completa](./LOGGING-OBSERVABILITY-IMPLEMENTATION.md#cloudwatch-logs-insights-queries)

### Como Configurar Alarme

1. Identificar métrica
2. Definir threshold
3. Configurar no CDK
4. Adicionar ação SNS
5. Testar disparo

**Ver:** [Implementação Completa](./LOGGING-OBSERVABILITY-IMPLEMENTATION.md#alarmes-cloudwatch)

## 🔍 Troubleshooting

### Logs não aparecem
- Verificar log level
- Verificar permissões IAM
- Verificar log group existe

### X-Ray não traça
- Verificar X-Ray habilitado
- Verificar permissões IAM
- Verificar anotações adicionadas

### Métricas não aparecem
- Verificar namespace correto
- Verificar dimensões
- Aguardar até 5 minutos

### Alarmes não disparam
- Verificar threshold
- Verificar período
- Verificar assinatura SNS

**Ver:** [Guia Rápido - Troubleshooting](./LOGGING-OBSERVABILITY-QUICK-REFERENCE.md#troubleshooting)

## 📝 Checklist de Implementação

- [x] Logger estruturado configurado
- [x] X-Ray tracer configurado
- [x] Metrics emitter criado
- [x] CloudWatch Logs Insights queries criadas
- [x] CloudWatch Alarms implementados
- [x] Documentação completa
- [x] Guia rápido
- [x] Exemplo de handler
- [ ] Logging adicionado em handlers de tenant
- [ ] Logging adicionado em handlers internos
- [ ] X-Ray tracing habilitado nas funções
- [ ] Métricas sendo emitidas
- [ ] Alarmes configurados no CDK
- [ ] Dashboard CloudWatch criado
- [ ] Testado em ambiente dev

## 🎯 Próximos Passos

1. Adicionar logging em handlers existentes
2. Habilitar X-Ray nas funções Lambda
3. Emitir métricas customizadas
4. Configurar alarmes no CDK
5. Criar dashboard CloudWatch
6. Testar em ambiente dev

## 📞 Suporte

Para dúvidas ou problemas:

1. Consultar [Guia Rápido](./LOGGING-OBSERVABILITY-QUICK-REFERENCE.md)
2. Consultar [Implementação Completa](./LOGGING-OBSERVABILITY-IMPLEMENTATION.md)
3. Ver [Exemplo de Handler](../../lambda/platform/get-tenant-me-enhanced.ts.example)
4. Consultar documentação AWS

## 🔗 Links Úteis

- [AWS Lambda Powertools - Logger](https://docs.powertools.aws.dev/lambda/typescript/latest/core/logger/)
- [AWS Lambda Powertools - Tracer](https://docs.powertools.aws.dev/lambda/typescript/latest/core/tracer/)
- [CloudWatch Logs Insights Query Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [CloudWatch Custom Metrics](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/publishingMetrics.html)
- [X-Ray Concepts](https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html)

---

**Última atualização:** Task 19 - Logging e Observabilidade implementada
**Status:** ✅ Completa

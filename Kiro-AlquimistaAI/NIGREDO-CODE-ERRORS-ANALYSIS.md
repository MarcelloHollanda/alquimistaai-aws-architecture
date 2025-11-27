# 🔍 Análise Detalhada dos Erros de Código - NigredoStack Deploy

## 📋 Sumário Executivo

**Problema:** Falha na criação de 5 recursos do tipo `AWS::Logs::QueryDefinition`  
**Causa Raiz:** Configuração inválida nas QueryDefinitions do CloudWatch Insights  
**Impacto:** Deploy completo da stack falha e entra em ROLLBACK_COMPLETE  
**Severidade:** 🔴 CRÍTICA - Bloqueia todo o deploy

---

## 🎯 Recursos Afetados

### 1. NigredoInsightsQueriesLeadProcessingTimeQuery
- **CloudFormation ID:** `NigredoInsightsQueriesLeadProcessingTimeQuery0CB123CC`
- **Tipo:** `AWS::Logs::QueryDefinition`
- **Erro:** "Invalid request provided: AWS::Logs::QueryDefinition"

### 2. NigredoInsightsQueriesErrorsByAgentQuery
- **CloudFormation ID:** `NigredoInsightsQueriesErrorsByAgentQueryEC4A29E4`
- **Tipo:** `AWS::Logs::QueryDefinition`
- **Erro:** "Invalid request provided: AWS::Logs::QueryDefinition"

### 3. NigredoInsightsQueriesFunnelConversionQuery
- **CloudFormation ID:** `NigredoInsightsQueriesFunnelConversionQueryD790F490`
- **Tipo:** `AWS::Logs::QueryDefinition`
- **Erro:** "Invalid request provided: AWS::Logs::QueryDefinition"

### 4. NigredoInsightsQueriesMCPCallsQuery
- **CloudFormation ID:** `NigredoInsightsQueriesMCPCallsQuery3544C878`
- **Tipo:** `AWS::Logs::QueryDefinition`
- **Erro:** "Invalid request provided: AWS::Logs::QueryDefinition"

### 5. NigredoInsightsQueriesLatencyByEndpointQuery
- **CloudFormation ID:** `NigredoInsightsQueriesLatencyByEndpointQuery7C75674E`
- **Tipo:** `AWS::Logs::QueryDefinition`
- **Erro:** "Invalid request provided: AWS::Logs::QueryDefinition"

---

## 📂 Arquivos Envolvidos

### Arquivo Principal: `lib/cloudwatch-insights-queries.ts`
**Localização:** `lib/cloudwatch-insights-queries.ts`  
**Linhas:** 1-280  
**Função:** Define o construct CloudWatchInsightsQueries que cria as queries

### Arquivo de Uso: `lib/nigredo-stack.ts`
**Localização:** `lib/nigredo-stack.ts`  
**Linhas:** 928-960  
**Função:** Instancia o CloudWatchInsightsQueries e cria outputs

---

## 🐛 Trechos de Código Problemáticos

### Problema #1: Query "Erros por Agente"

**Arquivo:** `lib/cloudwatch-insights-queries.ts`  
**Linhas:** 48-56

```typescript
// ❌ CÓDIGO COM ERRO
this.errorsByAgentQuery = new logs.CfnQueryDefinition(this, 'ErrorsByAgentQuery', {
  name: `${props.envName}/fibonacci/errors-by-agent`,
  queryString: `fields @timestamp, agent, message, error.message, error.name, error.stack, traceId, leadId
| filter level = "ERROR"
| stats count() as errorCount by agent
| sort errorCount desc`,
  logGroupNames: logGroupNames
});
```

**Problema Identificado:**
- ❌ `logGroupNames` pode estar vazio ou com valores inválidos
- ❌ A query string pode ter sintaxe inválida para CloudWatch Insights
- ❌ Campos como `error.message`, `error.name`, `error.stack` podem não existir nos logs

---

### Problema #2: Query "Latência por Endpoint"

**Arquivo:** `lib/cloudwatch-insights-queries.ts`  
**Linhas:** 58-76

```typescript
// ❌ CÓDIGO COM ERRO
this.latencyByEndpointQuery = new logs.CfnQueryDefinition(this, 'LatencyByEndpointQuery', {
  name: `${props.envName}/fibonacci/latency-by-endpoint`,
  queryString: `fields @timestamp, requestContext.http.path as endpoint, duration, requestContext.http.method as method
| filter requestContext.http.path like /api/
| stats 
    count() as requestCount,
    avg(duration) as avgDuration,
    min(duration) as minDuration,
    max(duration) as maxDuration,
    pct(duration, 50) as p50,
    pct(duration, 95) as p95,
    pct(duration, 99) as p99
  by endpoint, method
| sort p95 desc`,
  logGroupNames: logGroupNames
});
```

**Problema Identificado:**
- ❌ `requestContext.http.path` é específico de API Gateway, não de Lambda logs
- ❌ Campo `duration` pode não existir nos logs das Lambdas
- ❌ Sintaxe `like /api/` pode estar incorreta (deveria ser `like "/api/"`)

---

### Problema #3: Query "Taxa de Conversão do Funil"

**Arquivo:** `lib/cloudwatch-insights-queries.ts`  
**Linhas:** 78-88

```typescript
// ❌ CÓDIGO COM ERRO
this.funnelConversionQuery = new logs.CfnQueryDefinition(this, 'FunnelConversionQuery', {
  name: `${props.envName}/fibonacci/funnel-conversion`,
  queryString: `fields @timestamp, leadId, agent, classification.intent, proposedAction
| filter agent in ["recebimento", "estrategia", "disparo", "atendimento", "agendamento"]
| stats 
    count() as totalLeads by agent
| sort agent asc`,
  logGroupNames: logGroupNames
});
```

**Problema Identificado:**
- ❌ Campos `classification.intent` e `proposedAction` podem não existir
- ❌ Campo `agent` pode não estar presente em todos os logs

---

### Problema #4: Query "Análise de Chamadas MCP"

**Arquivo:** `lib/cloudwatch-insights-queries.ts`  
**Linhas:** 90-103

```typescript
// ❌ CÓDIGO COM ERRO
this.mcpCallsQuery = new logs.CfnQueryDefinition(this, 'MCPCallsQuery', {
  name: `${props.envName}/fibonacci/mcp-calls-analysis`,
  queryString: `fields @timestamp, metadata.mcpServer as server, metadata.mcpMethod as method, duration, level, message
| filter metadata.mcpServer like /.+/
| stats 
    count() as callCount,
    avg(duration) as avgDuration,
    sum(level = "ERROR") as errorCount,
    (sum(level = "ERROR") / count()) * 100 as errorRate
  by server, method
| sort errorRate desc, callCount desc`,
  logGroupNames: logGroupNames
});
```

**Problema Identificado:**
- ❌ Campos `metadata.mcpServer` e `metadata.mcpMethod` podem não existir
- ❌ Sintaxe `like /.+/` pode estar incorreta (regex em CloudWatch Insights)

---

### Problema #5: Query "Tempo de Processamento de Leads"

**Arquivo:** `lib/cloudwatch-insights-queries.ts`  
**Linhas:** 105-120

```typescript
// ❌ CÓDIGO COM ERRO
this.leadProcessingTimeQuery = new logs.CfnQueryDefinition(this, 'LeadProcessingTimeQuery', {
  name: `${props.envName}/fibonacci/lead-processing-time`,
  queryString: `fields @timestamp, leadId, agent, duration, classification.priority
| filter leadId like /.+/
| stats 
    min(@timestamp) as startTime,
    max(@timestamp) as endTime,
    (max(@timestamp) - min(@timestamp)) / 1000 as totalProcessingSeconds,
    count() as stepsCompleted,
    latest(classification.priority) as priority
  by leadId
| sort totalProcessingSeconds desc
| limit 100`,
  logGroupNames: logGroupNames
});
```

**Problema Identificado:**
- ❌ Campo `classification.priority` pode não existir
- ❌ Sintaxe `like /.+/` pode estar incorreta
- ❌ Operação `(max(@timestamp) - min(@timestamp)) / 1000` pode não ser suportada

---

### Problema #6: Uso no NigredoStack

**Arquivo:** `lib/nigredo-stack.ts`  
**Linhas:** 928-960

```typescript
// ❌ CÓDIGO COM ERRO
const nigredoInsightsQueries = new CloudWatchInsightsQueries(this, 'NigredoInsightsQueries', {
  logGroups: [
    this.recebimentoLambda.logGroup,
    this.estrategiaLambda.logGroup,
    this.disparoLambda.logGroup,
    this.atendimentoLambda.logGroup,
    this.sentimentoLambda.logGroup,
    this.agendamentoLambda.logGroup,
    relatoriosLambda.logGroup
  ],
  envName: props.envName
  // Não passa exportPrefix - os exports são criados manualmente abaixo
});

new cdk.CfnOutput(this, 'NigredoInsightsQueryErrorsByAgent', {
  value: nigredoInsightsQueries.errorsByAgentQuery.name!,
  description: 'CloudWatch Insights Query: Erros por Agente Nigredo',
  exportName: `NigredoProspecting-InsightsQueryErrorsByAgent-${props.envName}`
});
```

**Problema Identificado:**
- ❌ Os log groups podem não existir ainda quando as queries são criadas
- ❌ Falta dependência explícita entre as Lambdas e as queries
- ❌ O `name!` pode ser undefined, causando erro

---

## 🔧 Causas Raízes Identificadas

### 1. **Sintaxe Inválida nas Queries**
- Uso de regex `/.+/` que pode não ser suportado
- Uso de `like` sem aspas duplas
- Campos aninhados que podem não existir

### 2. **Log Groups Não Existem**
- As queries são criadas antes dos log groups das Lambdas estarem disponíveis
- Falta de dependência explícita

### 3. **Campos Inexistentes**
- Queries referenciam campos que não existem nos logs estruturados
- Campos específicos de API Gateway sendo usados em logs de Lambda

### 4. **Formato Incorreto do CfnQueryDefinition**
- Possível problema com o formato do `logGroupNames`
- Possível problema com caracteres especiais no `queryString`

---

## ✅ Soluções Propostas

### Solução 1: Comentar Temporariamente (RÁPIDA)
**Tempo:** 5 minutos  
**Risco:** Baixo  
**Impacto:** Permite deploy imediato

```typescript
// Comentar as linhas 928-960 em lib/nigredo-stack.ts
/*
const nigredoInsightsQueries = new CloudWatchInsightsQueries(this, 'NigredoInsightsQueries', {
  ...
});
*/
```

### Solução 2: Corrigir Sintaxe das Queries (RECOMENDADA)
**Tempo:** 30 minutos  
**Risco:** Médio  
**Impacto:** Resolve o problema definitivamente

**Mudanças necessárias em `lib/cloudwatch-insights-queries.ts`:**

1. Corrigir sintaxe `like`:
```typescript
// ❌ ERRADO
| filter requestContext.http.path like /api/

// ✅ CORRETO
| filter requestContext.http.path like "/api/"
```

2. Corrigir regex:
```typescript
// ❌ ERRADO
| filter leadId like /.+/

// ✅ CORRETO
| filter ispresent(leadId)
```

3. Usar campos corretos:
```typescript
// ❌ ERRADO (campos de API Gateway)
fields @timestamp, requestContext.http.path as endpoint

// ✅ CORRETO (campos de Lambda)
fields @timestamp, @message, @logStream
```

### Solução 3: Adicionar Dependências Explícitas
**Tempo:** 15 minutos  
**Risco:** Baixo  
**Impacto:** Garante ordem correta de criação

```typescript
// Em lib/nigredo-stack.ts
const nigredoInsightsQueries = new CloudWatchInsightsQueries(this, 'NigredoInsightsQueries', {
  logGroups: [
    this.recebimentoLambda.logGroup,
    // ...
  ],
  envName: props.envName
});

// Adicionar dependências
nigredoInsightsQueries.node.addDependency(this.recebimentoLambda);
nigredoInsightsQueries.node.addDependency(this.estrategiaLambda);
// ... para todas as lambdas
```

---

## 🎯 Plano de Ação Recomendado

### Fase 1: Deploy Imediato (5 min)
1. ✅ Comentar seção de CloudWatchInsightsQueries no `lib/nigredo-stack.ts` (linhas 928-960)
2. ✅ Fazer deploy da stack
3. ✅ Verificar que o resto da stack funciona

### Fase 2: Correção Definitiva (1 hora)
1. ✅ Corrigir sintaxe das queries em `lib/cloudwatch-insights-queries.ts`
2. ✅ Adicionar dependências explícitas
3. ✅ Testar queries manualmente no console do CloudWatch
4. ✅ Descomentar código e fazer novo deploy

### Fase 3: Validação (30 min)
1. ✅ Verificar que todas as queries foram criadas
2. ✅ Executar queries manualmente para validar resultados
3. ✅ Documentar queries funcionais

---

## 📝 Checklist de Correção

- [ ] Comentar CloudWatchInsightsQueries no nigredo-stack.ts
- [ ] Deploy da stack sem as queries
- [ ] Corrigir sintaxe `like` em todas as queries
- [ ] Corrigir regex patterns
- [ ] Usar campos corretos de Lambda logs
- [ ] Adicionar dependências explícitas
- [ ] Testar queries no console
- [ ] Descomentar e fazer novo deploy
- [ ] Validar queries funcionando
- [ ] Atualizar documentação

---

## 🔗 Referências

- [AWS CloudWatch Insights Query Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [CDK CfnQueryDefinition](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_logs.CfnQueryDefinition.html)
- [Lambda Log Format](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-cloudwatchlogs.html)

---

**Documento criado em:** 2025-11-17  
**Última atualização:** 2025-11-17  
**Status:** 🔴 ATIVO - Problema não resolvido

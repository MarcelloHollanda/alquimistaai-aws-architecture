# 🔴 Erros do Deploy do NigredoStack

## 📊 Resumo
**Data:** 17/11/2025 00:09 UTC  
**Stack:** NigredoStack-dev  
**Status:** ROLLBACK_COMPLETE  
**Total de Erros:** 5

## ❌ Lista dos Últimos 5 Erros

### Erro #1: NigredoInsightsQueriesLeadProcessingTimeQuery
- **Resource:** `NigredoInsightsQueriesLeadProcessingTimeQuery0CB123CC`
- **Type:** `AWS::Logs::QueryDefinition`
- **Status:** `CREATE_FAILED`
- **Timestamp:** 2025-11-17T03:09:30.140000+00:00
- **Reason:** Resource handler returned message: "Invalid request provided: AWS::Logs::QueryDefinition"
- **RequestToken:** 1e8be07b-1a94-d866-1020-a235e9c596c0
- **HandlerErrorCode:** InvalidRequest

### Erro #2: NigredoInsightsQueriesErrorsByAgentQuery
- **Resource:** `NigredoInsightsQueriesErrorsByAgentQueryEC4A29E4`
- **Type:** `AWS::Logs::QueryDefinition`
- **Status:** `CREATE_FAILED`
- **Timestamp:** 2025-11-17T03:09:30.044000+00:00
- **Reason:** Resource handler returned message: "Invalid request provided: AWS::Logs::QueryDefinition"
- **RequestToken:** afb0767a-797a-6bc9-02fa-df0c532aca53
- **HandlerErrorCode:** InvalidRequest

### Erro #3: NigredoInsightsQueriesFunnelConversionQuery
- **Resource:** `NigredoInsightsQueriesFunnelConversionQueryD790F490`
- **Type:** `AWS::Logs::QueryDefinition`
- **Status:** `CREATE_FAILED`
- **Timestamp:** 2025-11-17T03:09:29.860000+00:00
- **Reason:** Resource handler returned message: "Invalid request provided: AWS::Logs::QueryDefinition"
- **RequestToken:** 15e4228b-454f-e1f0-071a-1e799e25bbe0
- **HandlerErrorCode:** InvalidRequest

### Erro #4: NigredoInsightsQueriesMCPCallsQuery
- **Resource:** `NigredoInsightsQueriesMCPCallsQuery3544C878`
- **Type:** `AWS::Logs::QueryDefinition`
- **Status:** `CREATE_FAILED`
- **Timestamp:** 2025-11-17T03:09:29.805000+00:00
- **Reason:** Resource handler returned message: "Invalid request provided: AWS::Logs::QueryDefinition"
- **RequestToken:** 5bec4570-0867-ee6d-6e03-048e645bba6c
- **HandlerErrorCode:** InvalidRequest

### Erro #5: NigredoInsightsQueriesLatencyByEndpointQuery
- **Resource:** `NigredoInsightsQueriesLatencyByEndpointQuery7C75674E`
- **Type:** `AWS::Logs::QueryDefinition`
- **Status:** `CREATE_FAILED`
- **Timestamp:** 2025-11-17T03:09:29.763000+00:00
- **Reason:** Resource handler returned message: "Invalid request provided: AWS::Logs::QueryDefinition"
- **RequestToken:** 939608d9-9b76-585f-d0ed-8ea4489f6bfa
- **HandlerErrorCode:** InvalidRequest

## 🔍 Análise do Problema

### Causa Raiz
Todos os 5 erros são do mesmo tipo: **AWS::Logs::QueryDefinition** com erro "Invalid request provided".

### Recursos Afetados
Todos os recursos são do construct `CloudWatchInsightsQueries` (ou similar) que está tentando criar queries do CloudWatch Insights.

### Possíveis Causas
1. **Sintaxe inválida na query** - As queries podem ter sintaxe incorreta
2. **Log Groups não existem** - As queries podem estar referenciando log groups que ainda não foram criados
3. **Permissões insuficientes** - Falta de permissões para criar QueryDefinitions
4. **Formato incorreto** - O formato da QueryDefinition pode estar incorreto

## 🛠️ Solução Proposta

### Opção 1: Comentar as Queries Temporariamente
Comentar a criação das queries do CloudWatch Insights no `nigredo-stack.ts` para permitir que o resto da stack seja criado.

### Opção 2: Corrigir o Construct CloudWatchInsightsQueries
Verificar e corrigir o arquivo `lib/cloudwatch-insights-queries.ts` para garantir que as queries estão sendo criadas corretamente.

### Opção 3: Verificar Dependências
Garantir que os log groups das Lambdas sejam criados antes das queries, adicionando dependências explícitas.

## 📝 Próximos Passos

1. Verificar o arquivo `lib/cloudwatch-insights-queries.ts`
2. Verificar o arquivo `lib/dashboards/nigredo-insights-queries.ts`
3. Identificar o problema na criação das QueryDefinitions
4. Aplicar correção
5. Tentar deploy novamente

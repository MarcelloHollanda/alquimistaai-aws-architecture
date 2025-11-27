# Task 29: CloudWatch Insights Queries - Resumo de Implementação

## ✅ Status: CONCLUÍDO

Todas as CloudWatch Insights Queries foram criadas e integradas com sucesso nas stacks Fibonacci e Nigredo.

## 📋 O Que Foi Implementado

### 1. Módulo de Queries (`lib/cloudwatch-insights-queries.ts`)

Criado módulo reutilizável que define 5 queries principais:

#### Query 1: Erros por Agente
- **Nome**: `{env}/fibonacci/errors-by-agent`
- **Propósito**: Identificar agentes com mais erros
- **Campos**: timestamp, agent, message, error details, traceId, leadId
- **Agregação**: Count por agente, ordenado por frequência

#### Query 2: Latência por Endpoint
- **Nome**: `{env}/fibonacci/latency-by-endpoint`
- **Propósito**: Analisar performance de endpoints da API
- **Campos**: endpoint, method, duration
- **Métricas**: count, avg, min, max, p50, p95, p99
- **Agregação**: Por endpoint e método HTTP

#### Query 3: Taxa de Conversão do Funil
- **Nome**: `{env}/fibonacci/funnel-conversion`
- **Propósito**: Analisar conversão entre estágios do funil
- **Campos**: leadId, agent, classification.intent, proposedAction
- **Filtro**: Agentes do funil (recebimento → agendamento)
- **Agregação**: Count por agente

#### Query 4: Análise de Chamadas MCP
- **Nome**: `{env}/fibonacci/mcp-calls-analysis`
- **Propósito**: Monitorar integrações externas
- **Campos**: mcpServer, mcpMethod, duration, level
- **Métricas**: callCount, avgDuration, errorCount, errorRate
- **Agregação**: Por servidor e método MCP

#### Query 5: Tempo de Processamento de Leads
- **Nome**: `{env}/fibonacci/lead-processing-time`
- **Propósito**: Identificar leads lentos ou travados
- **Campos**: leadId, agent, duration, priority
- **Cálculo**: Tempo total do primeiro ao último evento
- **Limite**: Top 100 leads mais lentos

### 2. Queries Adicionais (Documentadas)

Queries úteis para casos específicos (não criadas automaticamente):

1. **Leads que Falharam**: Identificar leads com erros recorrentes
2. **Análise de Sentimento**: Tendências de sentimento ao longo do tempo
3. **Objeções Recorrentes**: Top 20 objeções mais comuns
4. **Taxa de Resposta por Campanha**: Comparar performance de campanhas
5. **Gargalos de Performance**: Requisições > 5 segundos
6. **Conformidade LGPD**: Auditar ações de descadastro
7. **Custos por Agente**: Estimar custos baseado em invocações
8. **Agendamentos Bem-sucedidos**: Taxa de sucesso de agendamentos
9. **Trace Distribuído**: Rastrear lead específico
10. **Rate Limiting**: Análise de hits de rate limit

### 3. Integração com Fibonacci Stack

**Arquivo**: `lib/fibonacci-stack.ts`

- Importado módulo `CloudWatchInsightsQueries`
- Criado instância com log group do API Handler
- Adicionados 5 CloudFormation Outputs para referência

**Outputs criados**:
- `InsightsQueryErrorsByAgent`
- `InsightsQueryLatencyByEndpoint`
- `InsightsQueryFunnelConversion`
- `InsightsQueryMCPCalls`
- `InsightsQueryLeadProcessingTime`

### 4. Integração com Nigredo Stack

**Arquivo**: `lib/nigredo-stack.ts`

- Importado módulo `CloudWatchInsightsQueries`
- Criado instância com log groups de todos os 7 agentes
- Adicionados 3 CloudFormation Outputs específicos do Nigredo

**Log Groups incluídos**:
- Recebimento
- Estratégia
- Disparo
- Atendimento
- Sentimento
- Agendamento
- Relatórios

**Outputs criados**:
- `NigredoInsightsQueryErrorsByAgent`
- `NigredoInsightsQueryFunnelConversion`
- `NigredoInsightsQueryLeadProcessingTime`

### 5. Documentação Completa

#### Guia Completo (`Docs/Deploy/CLOUDWATCH-INSIGHTS-QUERIES.md`)

Documentação detalhada incluindo:
- Descrição de cada query automática
- Campos retornados e quando usar
- Exemplos de resultados esperados
- Queries adicionais para casos específicos
- Como usar via Console, CLI e SDK
- Exemplos práticos de troubleshooting
- Troubleshooting de problemas com queries
- Melhores práticas

#### Referência Rápida (`Docs/Deploy/INSIGHTS-QUICK-REFERENCE.md`)

Guia de consulta rápida com:
- Queries essenciais prontas para copiar
- Análises comuns
- Troubleshooting rápido
- Dicas de uso
- Tabela de casos de uso

## 🎯 Requisitos Atendidos

✅ **Requirement 15.2**: Dashboards e Observabilidade
- Queries criadas para análise de métricas por agente
- Queries para análise de latência por endpoint
- Queries para análise de conversão do funil
- Queries salvas no console do CloudWatch

## 🚀 Como Usar

### Via Console AWS

1. Acesse CloudWatch > Logs > Insights
2. Selecione "Select saved queries"
3. Escolha a query desejada (ex: `prod/fibonacci/errors-by-agent`)
4. Ajuste o período de tempo
5. Clique em "Run query"

### Via AWS CLI

```bash
# Listar queries salvas
aws logs describe-query-definitions \
  --query-definition-name-prefix "prod/fibonacci"

# Executar query
aws logs start-query \
  --log-group-name "/aws/lambda/FibonacciStack-prod-ApiHandler" \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, agent | filter level = "ERROR" | stats count() by agent'
```

### Via SDK (TypeScript)

```typescript
import { CloudWatchLogsClient, StartQueryCommand } from '@aws-sdk/client-cloudwatch-logs';

const client = new CloudWatchLogsClient({ region: 'us-east-1' });

const command = new StartQueryCommand({
  logGroupName: '/aws/lambda/FibonacciStack-prod-ApiHandler',
  startTime: Math.floor((Date.now() - 3600000) / 1000),
  endTime: Math.floor(Date.now() / 1000),
  queryString: 'fields @timestamp, agent | filter level = "ERROR" | stats count() by agent'
});

const { queryId } = await client.send(command);
```

## 📊 Exemplos de Uso

### Exemplo 1: Investigar Pico de Erros

```
fields @timestamp, agent, message, error.message, traceId
| filter level = "ERROR" and agent = "atendimento"
| sort @timestamp desc
| limit 50
```

### Exemplo 2: Analisar Endpoint Lento

```
fields @timestamp, duration, leadId, message
| filter requestContext.http.path = "/api/leads"
| filter duration > 2000
| sort duration desc
| limit 20
```

### Exemplo 3: Calcular Taxa de Conversão

```
fields leadId, agent
| filter agent in ["recebimento", "estrategia", "disparo", "atendimento", "agendamento"]
| stats count() by agent
```

**Resultado esperado**:
```
recebimento: 1000 leads
estrategia: 950 leads (95% conversão)
disparo: 900 leads (94.7% conversão)
atendimento: 450 leads (50% conversão)
agendamento: 180 leads (40% conversão)
Conversão total: 18%
```

## 🔧 Próximos Passos

### Após Deploy

1. **Verificar queries criadas**:
   ```bash
   aws logs describe-query-definitions --region us-east-1
   ```

2. **Testar cada query**:
   - Acesse o console do CloudWatch
   - Execute cada query salva
   - Verifique se retorna dados esperados

3. **Configurar alertas baseados em queries** (opcional):
   - Criar alarmes para erros acima de threshold
   - Criar alarmes para latência acima de SLA
   - Criar alarmes para conversão abaixo do esperado

4. **Treinar equipe**:
   - Compartilhar documentação
   - Demonstrar uso das queries
   - Criar runbooks de troubleshooting

### Melhorias Futuras

1. **Automatizar análises**:
   - Lambda que executa queries periodicamente
   - Enviar relatórios por email
   - Integrar com Slack

2. **Queries customizadas por tenant**:
   - Filtrar por tenant_id
   - Análises específicas por cliente

3. **Machine Learning**:
   - Detectar anomalias automaticamente
   - Prever problemas antes de ocorrerem

## 📚 Referências

- [CloudWatch Insights Query Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [Structured Logging Guide](../../lambda/shared/STRUCTURED-LOGGING.md)
- [X-Ray Tracing Guide](../../lambda/shared/xray-tracer.ts)
- [CloudWatch Dashboards](./CLOUDWATCH-DASHBOARDS.md)
- [CloudWatch Alarms](./CLOUDWATCH-ALARMS.md)

## ✅ Checklist de Validação

- [x] Módulo CloudWatchInsightsQueries criado
- [x] 5 queries principais implementadas
- [x] Queries adicionais documentadas
- [x] Integração com Fibonacci Stack
- [x] Integração com Nigredo Stack
- [x] CloudFormation Outputs adicionados
- [x] Documentação completa criada
- [x] Referência rápida criada
- [x] Exemplos práticos documentados
- [x] Guia de troubleshooting incluído

## 🎉 Conclusão

Task 29 foi implementada com sucesso! Todas as CloudWatch Insights Queries foram criadas, integradas nas stacks e documentadas. O sistema agora possui ferramentas poderosas para análise de logs, troubleshooting e otimização de performance.

As queries serão criadas automaticamente no próximo deploy e estarão disponíveis no console do CloudWatch Insights para toda a equipe.

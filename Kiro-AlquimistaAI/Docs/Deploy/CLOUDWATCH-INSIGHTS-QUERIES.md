# CloudWatch Insights Queries - Guia Completo

Este documento descreve as queries do CloudWatch Insights configuradas automaticamente no Ecossistema Alquimista.AI e como utilizá-las para análise de logs e troubleshooting.

## 📋 Índice

- [Queries Automáticas](#queries-automáticas)
- [Como Usar](#como-usar)
- [Queries Adicionais](#queries-adicionais)
- [Exemplos Práticos](#exemplos-práticos)
- [Troubleshooting](#troubleshooting)

## Queries Automáticas

As seguintes queries são criadas automaticamente durante o deploy e ficam disponíveis no console do CloudWatch Insights.

### 1. Erros por Agente

**Nome**: `{env}/fibonacci/errors-by-agent`

**Propósito**: Identificar quais agentes estão gerando mais erros e priorizar correções.

**Query**:
```
fields @timestamp, agent, message, error.message, error.name, error.stack, traceId, leadId
| filter level = "ERROR"
| stats count() as errorCount by agent
| sort errorCount desc
```

**Campos retornados**:
- `agent`: Nome do agente que gerou o erro
- `errorCount`: Número total de erros

**Quando usar**:
- Após deploy para verificar se há erros novos
- Durante troubleshooting de problemas reportados
- Para monitoramento proativo de saúde do sistema

**Exemplo de resultado**:
```
agent              | errorCount
-------------------|------------
atendimento        | 45
disparo            | 23
agendamento        | 12
recebimento        | 5
```

### 2. Latência por Endpoint

**Nome**: `{env}/fibonacci/latency-by-endpoint`

**Propósito**: Identificar endpoints lentos e otimizar performance.

**Query**:
```
fields @timestamp, requestContext.http.path as endpoint, duration, requestContext.http.method as method
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
| sort p95 desc
```

**Campos retornados**:
- `endpoint`: Caminho do endpoint
- `method`: Método HTTP (GET, POST, etc)
- `requestCount`: Número de requisições
- `avgDuration`: Duração média em ms
- `p50`, `p95`, `p99`: Percentis de latência

**Quando usar**:
- Para identificar endpoints que precisam otimização
- Após mudanças de código para validar impacto na performance
- Para estabelecer SLAs de latência

**Exemplo de resultado**:
```
endpoint              | method | requestCount | avgDuration | p95    | p99
----------------------|--------|--------------|-------------|--------|--------
/api/leads            | POST   | 1250         | 850         | 2100   | 3500
/api/agents/activate  | POST   | 340          | 450         | 1200   | 1800
/api/health           | GET    | 5000         | 50          | 120    | 200
```

### 3. Taxa de Conversão do Funil

**Nome**: `{env}/fibonacci/funnel-conversion`

**Propósito**: Analisar quantos leads passam por cada estágio do funil de prospecção.

**Query**:
```
fields @timestamp, leadId, agent, classification.intent, proposedAction
| filter agent in ["recebimento", "estrategia", "disparo", "atendimento", "agendamento"]
| stats count() as totalLeads by agent
| sort agent asc
```

**Campos retornados**:
- `agent`: Estágio do funil
- `totalLeads`: Número de leads nesse estágio

**Quando usar**:
- Para calcular taxa de conversão entre estágios
- Para identificar gargalos no funil
- Para relatórios de performance comercial

**Exemplo de resultado**:
```
agent          | totalLeads
---------------|------------
recebimento    | 1000
estrategia     | 950
disparo        | 900
atendimento    | 450
agendamento    | 180
```

**Cálculo de conversão**:
- Recebimento → Estratégia: 95% (950/1000)
- Estratégia → Disparo: 94.7% (900/950)
- Disparo → Atendimento: 50% (450/900)
- Atendimento → Agendamento: 40% (180/450)
- **Conversão total**: 18% (180/1000)

### 4. Análise de Chamadas MCP

**Nome**: `{env}/fibonacci/mcp-calls-analysis`

**Propósito**: Monitorar integrações externas e identificar problemas.

**Query**:
```
fields @timestamp, metadata.mcpServer as server, metadata.mcpMethod as method, duration, level, message
| filter metadata.mcpServer like /.+/
| stats 
    count() as callCount,
    avg(duration) as avgDuration,
    sum(level = "ERROR") as errorCount,
    (sum(level = "ERROR") / count()) * 100 as errorRate
  by server, method
| sort errorRate desc, callCount desc
```

**Quando usar**:
- Para identificar integrações instáveis
- Para otimizar chamadas externas
- Para troubleshooting de falhas de integração

### 5. Tempo de Processamento de Leads

**Nome**: `{env}/fibonacci/lead-processing-time`

**Propósito**: Analisar quanto tempo cada lead leva para ser processado do início ao fim.

**Query**:
```
fields @timestamp, leadId, agent, duration, classification.priority
| filter leadId like /.+/
| stats 
    min(@timestamp) as startTime,
    max(@timestamp) as endTime,
    (max(@timestamp) - min(@timestamp)) / 1000 as totalProcessingSeconds,
    count() as stepsCompleted,
    latest(classification.priority) as priority
  by leadId
| sort totalProcessingSeconds desc
| limit 100
```

**Quando usar**:
- Para identificar leads que estão travados
- Para otimizar tempo de resposta
- Para SLA de processamento

## Como Usar

### Via Console AWS

1. Acesse o console do CloudWatch
2. No menu lateral, clique em **Logs > Insights**
3. No dropdown "Select saved queries", escolha a query desejada
4. Ajuste o período de tempo no canto superior direito
5. Clique em **Run query**

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
  --query-string 'fields @timestamp, agent, message | filter level = "ERROR" | stats count() by agent'

# Obter resultados (use o queryId retornado acima)
aws logs get-query-results --query-id <query-id>
```

### Via SDK (TypeScript)

```typescript
import { CloudWatchLogsClient, StartQueryCommand, GetQueryResultsCommand } from '@aws-sdk/client-cloudwatch-logs';

const client = new CloudWatchLogsClient({ region: 'us-east-1' });

// Iniciar query
const startCommand = new StartQueryCommand({
  logGroupName: '/aws/lambda/FibonacciStack-prod-ApiHandler',
  startTime: Math.floor((Date.now() - 3600000) / 1000), // 1 hora atrás
  endTime: Math.floor(Date.now() / 1000),
  queryString: 'fields @timestamp, agent | filter level = "ERROR" | stats count() by agent'
});

const { queryId } = await client.send(startCommand);

// Aguardar e obter resultados
await new Promise(resolve => setTimeout(resolve, 3000));

const getCommand = new GetQueryResultsCommand({ queryId });
const { results } = await client.send(getCommand);

console.log(results);
```

## Queries Adicionais

Estas queries não são criadas automaticamente, mas podem ser úteis para análises específicas.

### Leads que Falharam

```
fields @timestamp, leadId, agent, message, error.message
| filter level = "ERROR" and leadId like /.+/
| stats 
    count() as errorCount,
    latest(agent) as lastAgent,
    latest(error.message) as lastError
  by leadId
| sort errorCount desc
| limit 50
```

**Uso**: Identificar leads específicos que estão com problemas.

### Análise de Sentimento

```
fields @timestamp, leadId, agent, classification.intent, metadata.sentiment, metadata.intensidade
| filter agent = "sentimento" or agent = "atendimento"
| stats 
    count() as totalInteractions,
    sum(metadata.sentiment = "positivo") as positive,
    sum(metadata.sentiment = "neutro") as neutral,
    sum(metadata.sentiment = "negativo") as negative,
    sum(metadata.sentiment = "irritado") as irritated,
    avg(metadata.intensidade) as avgIntensity
  by bin(1h)
| sort @timestamp desc
```

**Uso**: Analisar tendências de sentimento ao longo do tempo.

### Objeções Recorrentes

```
fields @timestamp, leadId, classification.intent, message
| filter classification.intent = "objection"
| stats count() as frequency by message
| sort frequency desc
| limit 20
```

**Uso**: Identificar objeções mais comuns para melhorar scripts de atendimento.

### Taxa de Resposta por Campanha

```
fields @timestamp, metadata.campaignId, agent, classification.intent
| filter agent in ["disparo", "atendimento"]
| stats 
    sum(agent = "disparo") as sent,
    sum(agent = "atendimento") as responded,
    (sum(agent = "atendimento") / sum(agent = "disparo")) * 100 as responseRate
  by metadata.campaignId
| sort responseRate desc
```

**Uso**: Comparar performance de diferentes campanhas.

### Gargalos de Performance

```
fields @timestamp, agent, duration, leadId
| filter duration > 5000
| stats 
    count() as slowRequests,
    avg(duration) as avgDuration,
    max(duration) as maxDuration
  by agent
| sort slowRequests desc
```

**Uso**: Identificar agentes com problemas de performance.

### Conformidade LGPD

```
fields @timestamp, leadId, agent, message, metadata.action
| filter metadata.action in ["descadastro", "direito_esquecimento", "consent_revoked"]
| stats count() as actionCount by metadata.action, bin(1d)
| sort @timestamp desc
```

**Uso**: Auditar ações relacionadas à LGPD.

### Custos por Agente

```
fields @timestamp, agent, @billedDuration, @memorySize
| stats 
    count() as invocations,
    sum(@billedDuration) / 1000 as totalSeconds,
    avg(@memorySize) as avgMemory,
    (sum(@billedDuration) / 1000) * (avg(@memorySize) / 1024) * 0.0000166667 as estimatedCost
  by agent
| sort estimatedCost desc
```

**Uso**: Identificar agentes mais caros para otimização.

### Trace Distribuído

```
fields @timestamp, traceId, agent, message, duration
| filter traceId = "REPLACE_WITH_TRACE_ID"
| sort @timestamp asc
```

**Uso**: Rastrear um lead específico através de todos os agentes.

## Exemplos Práticos

### Exemplo 1: Investigar Pico de Erros

**Cenário**: Você recebeu um alerta de que a taxa de erro aumentou.

**Passos**:

1. Execute a query "Erros por Agente" para identificar qual agente está falhando
2. Refine a query para ver detalhes dos erros:

```
fields @timestamp, agent, message, error.message, error.stack, traceId, leadId
| filter level = "ERROR" and agent = "atendimento"
| sort @timestamp desc
| limit 50
```

3. Pegue um `traceId` e execute a query de trace distribuído para ver o fluxo completo
4. Identifique a causa raiz e corrija

### Exemplo 2: Otimizar Endpoint Lento

**Cenário**: O endpoint `/api/leads` está lento.

**Passos**:

1. Execute a query "Latência por Endpoint"
2. Identifique que o P95 está em 2100ms
3. Analise logs específicos desse endpoint:

```
fields @timestamp, duration, leadId, message
| filter requestContext.http.path = "/api/leads"
| filter duration > 2000
| sort duration desc
| limit 20
```

4. Identifique padrões (ex: leads com muitos dados, chamadas MCP lentas)
5. Otimize o código ou adicione cache

### Exemplo 3: Analisar Campanha com Baixa Conversão

**Cenário**: Campanha X tem taxa de resposta de apenas 10%.

**Passos**:

1. Execute a query de taxa de resposta por campanha
2. Compare com outras campanhas
3. Analise sentimento das respostas:

```
fields @timestamp, leadId, metadata.sentiment, message
| filter metadata.campaignId = "campaign-x"
| filter agent = "atendimento"
| stats count() by metadata.sentiment
```

4. Identifique objeções recorrentes
5. Ajuste mensagens da campanha

## Troubleshooting

### Query Retorna Vazio

**Possíveis causas**:
- Período de tempo selecionado não tem dados
- Log group incorreto
- Filtros muito restritivos

**Solução**:
- Verifique se há logs no período selecionado
- Remova filtros temporariamente
- Verifique se o log group está correto

### Query Muito Lenta

**Possíveis causas**:
- Período de tempo muito amplo
- Muitos log groups selecionados
- Query sem filtros eficientes

**Solução**:
- Reduza o período de tempo
- Adicione filtros no início da query
- Use `limit` para reduzir resultados

### Campos Não Encontrados

**Possíveis causas**:
- Logs não estão em formato JSON estruturado
- Campo foi renomeado ou removido
- Versão antiga dos logs

**Solução**:
- Verifique se o logger está configurado corretamente
- Use `fields @message` para ver estrutura dos logs
- Ajuste a query para a estrutura atual

## Melhores Práticas

1. **Use filtros cedo**: Coloque filtros no início da query para melhor performance
2. **Limite resultados**: Use `limit` para evitar queries muito grandes
3. **Use bins para agregação temporal**: `bin(1h)` para agrupar por hora
4. **Salve queries úteis**: Crie suas próprias queries salvas para análises recorrentes
5. **Combine com X-Ray**: Use traceId para correlacionar com traces do X-Ray
6. **Automatize alertas**: Crie alarmes baseados em queries para monitoramento proativo

## Referências

- [CloudWatch Insights Query Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [CloudWatch Insights Examples](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax-examples.html)
- [Structured Logging Guide](../lambda/shared/STRUCTURED-LOGGING.md)
- [X-Ray Tracing Guide](../lambda/shared/xray-tracer.ts)

## Suporte

Para dúvidas ou problemas:
1. Consulte a documentação do CloudWatch Insights
2. Verifique os logs estruturados em `/aws/lambda/*`
3. Use X-Ray para trace distribuído
4. Entre em contato com a equipe de DevOps

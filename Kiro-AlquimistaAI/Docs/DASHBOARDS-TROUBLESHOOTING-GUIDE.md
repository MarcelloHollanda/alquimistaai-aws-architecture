# Guia Rápido de Troubleshooting - Dashboards de Observabilidade

## 🎯 Propósito

Este guia fornece cenários comuns de incidentes e como usar os dashboards de observabilidade para diagnosticar e resolver problemas rapidamente.

---

## 📊 Acesso Rápido aos Dashboards

### Via Console AWS

1. Acesse [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1)
2. Clique em **Dashboards** no menu lateral
3. Selecione:
   - `AlquimistaAI-Dev-Overview` para ambiente de desenvolvimento
   - `AlquimistaAI-Prod-Overview` para ambiente de produção

### Via URL Direta

```
# Dev
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=AlquimistaAI-Dev-Overview

# Prod
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=AlquimistaAI-Prod-Overview
```

---

## 🚨 Cenários de Incidente

### Cenário 1: "API está lenta"

**Sintomas:**
- Usuários reportam lentidão
- Timeouts ocasionais

**Investigação no Dashboard:**

1. **Verificar Latência do API Gateway**
   - Widget: `[ENV] Fibonacci - API Gateway Latency` ou `[ENV] Nigredo - API Gateway Latency`
   - Olhar para: p99 (linha vermelha)
   - **Normal**: < 1000ms
   - **Alerta**: 1000-3000ms
   - **Crítico**: > 3000ms

2. **Verificar CPU do Aurora**
   - Widget: `[ENV] Aurora - CPU Utilization`
   - **Normal**: < 70%
   - **Alerta**: 70-85%
   - **Crítico**: > 85%

3. **Verificar Duração das Lambdas**
   - Widget: `[ENV] Fibonacci - Lambda Duration` ou `[ENV] Nigredo - Lambda Duration (p95)`
   - Olhar para: p95 (linha laranja)
   - **Normal**: < 3000ms
   - **Alerta**: 3000-5000ms
   - **Crítico**: > 5000ms

**Ações:**
- Se CPU alta → Otimizar queries do banco
- Se Lambda lenta → Otimizar código ou aumentar memória
- Se ambos normais → Verificar rede/integrações externas

---

### Cenário 2: "Usuários recebendo erro 500"

**Sintomas:**
- Erros 5XX reportados
- Funcionalidades não funcionam

**Investigação no Dashboard:**

1. **Verificar Erros 5XX do API Gateway**
   - Widget: `[ENV] Fibonacci - API Gateway Errors` ou `[ENV] Nigredo - API Gateway Errors`
   - Olhar para: Linha vermelha (5xx Errors)
   - **Normal**: 0-2 por minuto
   - **Alerta**: 3-10 por minuto
   - **Crítico**: > 10 por minuto

2. **Verificar Erros das Lambdas**
   - Widget: `[ENV] Fibonacci - Lambda Errors` ou `[ENV] Nigredo - Lambda Errors`
   - Identificar qual Lambda está falhando
   - **Normal**: < 1% das invocações
   - **Crítico**: > 1% das invocações

3. **Correlacionar com Horário**
   - Ajustar período do dashboard para focar no momento do incidente
   - Verificar se coincide com deploy recente

**Ações:**
- Acessar CloudWatch Logs da Lambda específica
- Buscar stack traces e mensagens de erro
- Verificar se é erro de código ou infraestrutura
- Considerar rollback se erro persistente

---

### Cenário 3: "Sistema está fora do ar"

**Sintomas:**
- Nenhuma resposta das APIs
- Timeout em todas as requisições

**Investigação no Dashboard:**

1. **Verificar Throughput do API Gateway**
   - Widget: `[ENV] Fibonacci - API Gateway Throughput` ou `[ENV] Nigredo - API Gateway Throughput`
   - **Normal**: Requisições constantes
   - **Crítico**: Queda abrupta para zero

2. **Verificar Invocações das Lambdas**
   - Widget: `[ENV] Fibonacci - Lambda Invocations` ou `[ENV] Nigredo - Lambda Invocations`
   - **Normal**: Invocações constantes
   - **Crítico**: Queda para zero

3. **Verificar Conexões do Aurora**
   - Widget: `[ENV] Aurora - Database Connections`
   - **Normal**: 10-50 conexões
   - **Crítico**: 0 conexões ou > 80 conexões

**Ações:**
- Verificar status do API Gateway no console AWS
- Verificar status das Lambdas (throttling, erros)
- Verificar status do Aurora (disponibilidade)
- Verificar se há manutenção programada da AWS
- Escalar para suporte AWS se necessário

---

### Cenário 4: "Banco de dados está sobrecarregado"

**Sintomas:**
- Queries lentas
- Timeouts de conexão
- Erros de "too many connections"

**Investigação no Dashboard:**

1. **Verificar CPU do Aurora**
   - Widget: `[ENV] Aurora - CPU Utilization`
   - **Normal**: < 70%
   - **Alerta**: 70-85%
   - **Crítico**: > 85%

2. **Verificar Conexões do Aurora**
   - Widget: `[ENV] Aurora - Database Connections`
   - **Normal**: 10-50 conexões
   - **Alerta**: 50-70 conexões
   - **Crítico**: > 80 conexões

3. **Verificar Storage Livre**
   - Widget: `[ENV] Aurora - Free Storage Space`
   - **Normal**: > 10GB
   - **Alerta**: 5-10GB
   - **Crítico**: < 5GB

**Ações:**
- Conectar ao Aurora e executar:
  ```sql
  SELECT * FROM pg_stat_statements 
  ORDER BY total_time DESC 
  LIMIT 10;
  ```
- Identificar queries lentas ou sem índices
- Verificar se há locks de tabelas
- Otimizar queries problemáticas
- Considerar aumentar capacidade do Aurora Serverless
- Implementar connection pooling (RDS Proxy)

---

### Cenário 5: "Pico de tráfego inesperado"

**Sintomas:**
- Aumento súbito de requisições
- Possível ataque DDoS
- Custos aumentando

**Investigação no Dashboard:**

1. **Verificar Throughput do API Gateway**
   - Widget: `[ENV] Fibonacci - API Gateway Throughput` ou `[ENV] Nigredo - API Gateway Throughput`
   - Identificar pico anormal de requisições

2. **Verificar Erros 4xx**
   - Widget: `[ENV] Fibonacci - API Gateway Errors` ou `[ENV] Nigredo - API Gateway Errors`
   - Olhar para: Linha laranja (4xx Errors)
   - Muitos 4xx podem indicar tentativas de acesso não autorizado

3. **Verificar Invocações das Lambdas**
   - Widget: `[ENV] Fibonacci - Lambda Invocations` ou `[ENV] Nigredo - Lambda Invocations`
   - Verificar se todas as Lambdas estão com pico ou apenas algumas

**Ações:**
- Verificar logs do WAF (se configurado)
- Identificar IPs de origem suspeitos
- Verificar se é tráfego legítimo (campanha, evento)
- Considerar ativar rate limiting
- Bloquear IPs maliciosos via WAF
- Monitorar custos no Cost Explorer

---

## 🔍 Padrões de Métricas

### Padrão Normal (Saudável)

```
API Gateway:
  Latência p50: ~50ms
  Latência p90: ~150ms
  Latência p99: ~500ms
  Erros 5xx: 0-2 por minuto
  Throughput: Constante com variações naturais

Lambda:
  Invocações: Constantes
  Erros: < 1% das invocações
  Duração avg: < 1000ms
  Duração p95: < 3000ms

Aurora:
  CPU: 20-40%
  Conexões: 10-30
  Storage: > 10GB livre
```

### Padrão de Alerta (Atenção)

```
API Gateway:
  Latência p50: ~200ms
  Latência p90: ~800ms
  Latência p99: ~3000ms
  Erros 5xx: 5-10 por minuto
  Throughput: Picos ou quedas significativas

Lambda:
  Invocações: Picos anormais
  Erros: 1-5% das invocações
  Duração avg: 1000-3000ms
  Duração p95: 3000-5000ms

Aurora:
  CPU: 70-85%
  Conexões: 50-70
  Storage: 5-10GB livre
```

### Padrão Crítico (Ação Imediata)

```
API Gateway:
  Latência p50: > 500ms
  Latência p90: > 2000ms
  Latência p99: > 5000ms
  Erros 5xx: > 10 por minuto
  Throughput: Queda abrupta ou pico extremo

Lambda:
  Invocações: Queda para zero ou pico extremo
  Erros: > 5% das invocações
  Duração avg: > 3000ms
  Duração p95: > 5000ms

Aurora:
  CPU: > 85%
  Conexões: > 80
  Storage: < 5GB livre
```

---

## 📝 Checklist de Investigação

Ao receber um alerta ou reportar um problema, siga esta ordem:

### 1. Identificar o Sintoma
- [ ] Qual é o problema reportado?
- [ ] Quando começou?
- [ ] Está afetando dev ou prod?
- [ ] Quantos usuários estão afetados?

### 2. Acessar o Dashboard
- [ ] Abrir dashboard correto (dev ou prod)
- [ ] Ajustar período para focar no incidente
- [ ] Identificar widgets relevantes

### 3. Coletar Evidências
- [ ] Capturar screenshots dos widgets problemáticos
- [ ] Anotar valores das métricas
- [ ] Identificar correlações entre métricas
- [ ] Verificar se há padrão temporal

### 4. Investigar Causa Raiz
- [ ] Verificar logs do CloudWatch
- [ ] Verificar deploys recentes
- [ ] Verificar mudanças de configuração
- [ ] Verificar integrações externas

### 5. Aplicar Correção
- [ ] Implementar fix ou rollback
- [ ] Validar que métricas voltaram ao normal
- [ ] Documentar causa raiz e solução
- [ ] Atualizar runbooks se necessário

---

## 🛠️ Comandos Úteis

### Acessar Logs de uma Lambda

```powershell
# Ver logs recentes
aws logs tail /aws/lambda/fibonacci-api-handler-dev --follow

# Buscar erros específicos
aws logs filter-log-events `
  --log-group-name "/aws/lambda/fibonacci-api-handler-dev" `
  --filter-pattern "ERROR" `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
```

### Verificar Métricas via CLI

```powershell
# Latência do API Gateway
aws cloudwatch get-metric-statistics `
  --namespace AWS/ApiGateway `
  --metric-name Latency `
  --dimensions Name=ApiId,Value=<api-id> `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") `
  --end-time $(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") `
  --period 300 `
  --statistics Average,p99

# Erros de Lambda
aws cloudwatch get-metric-statistics `
  --namespace AWS/Lambda `
  --metric-name Errors `
  --dimensions Name=FunctionName,Value=fibonacci-api-handler-dev `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") `
  --end-time $(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") `
  --period 300 `
  --statistics Sum
```

### Queries no Aurora

```sql
-- Top 10 queries mais lentas
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Conexões ativas
SELECT 
  count(*) as total_connections,
  state,
  wait_event_type
FROM pg_stat_activity 
GROUP BY state, wait_event_type;

-- Locks ativos
SELECT 
  pid,
  usename,
  pg_blocking_pids(pid) as blocked_by,
  query as blocked_query
FROM pg_stat_activity 
WHERE cardinality(pg_blocking_pids(pid)) > 0;
```

---

## 📚 Recursos Adicionais

- [OBSERVABILITY-GUARDRAILS-AWS.md](./OBSERVABILITY-GUARDRAILS-AWS.md) - Documentação completa de observabilidade
- [INDEX-OPERATIONS-AWS.md](./INDEX-OPERATIONS-AWS.md) - Índice operacional geral
- [ROLLBACK-OPERACIONAL-AWS.md](./ROLLBACK-OPERACIONAL-AWS.md) - Procedimentos de rollback
- [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1)

---

**Última Atualização**: 18 de novembro de 2025  
**Versão**: 1.0  
**Autor**: Kiro AI

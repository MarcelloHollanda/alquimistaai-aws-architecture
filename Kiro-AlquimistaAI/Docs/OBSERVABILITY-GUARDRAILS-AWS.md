# AlquimistaAI – Guardrails de Observabilidade – AWS

> **⚠️ ARQUITETURA OFICIAL**: Lambda + API Gateway + Aurora PostgreSQL + DynamoDB (AWS).  
> Supabase = legado/laboratório, não faz parte do fluxo de produção.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Observabilidade](#arquitetura-de-observabilidade)
3. [Dashboards de Observabilidade](#dashboards-de-observabilidade)
4. [SNS de Alertas Operacionais](#sns-de-alertas-operacionais)
5. [Alarmes CloudWatch - Fibonacci](#alarmes-cloudwatch---fibonacci)
6. [Alarmes CloudWatch - Nigredo](#alarmes-cloudwatch---nigredo)
7. [Alarmes CloudWatch - Aurora](#alarmes-cloudwatch---aurora)
8. [Retenção de Logs](#retenção-de-logs)
9. [Fluxos de Ação](#fluxos-de-ação)
10. [Troubleshooting](#troubleshooting)
11. [Checklist de Validação](#checklist-de-validação)

---

## Visão Geral

Os **Guardrails de Observabilidade** do AlquimistaAI são controles automatizados que monitoram a saúde operacional dos serviços, detectam problemas e enviam alertas proativos para a equipe de operações.

### Objetivos

- ✅ Detectar erros e problemas antes que afetem usuários
- ✅ Monitorar performance de APIs e Lambdas
- ✅ Alertar sobre problemas de banco de dados
- ✅ Fornecer visibilidade operacional em tempo real

### Diferença entre Tipos de Alertas

| Tipo | Propósito | Exemplos |
|------|-----------|----------|
| **Segurança** | Ameaças e atividades suspeitas | GuardDuty findings, acessos não autorizados |
| **Custo** | Gastos anormais e estouros de orçamento | Budget alerts, anomalias de custo |
| **Operacional** | Erros, performance e disponibilidade | 5XX errors, Lambda failures, CPU alta |

### Componentes Implementados

| Componente | Descrição | Status |
|------------|-----------|--------|
| **SNS Topic Ops** | Canal de notificações operacionais | ✅ Ativo |
| **Alarmes Fibonacci** | API 5XX, Lambda Errors, Throttles | ✅ Ativo |
| **Alarmes Nigredo** | API 5XX, Lambda Errors | ✅ Ativo |
| **Alarmes Aurora** | CPU, Conexões | ✅ Ativo |
| **Retenção de Logs** | 30 dias para Lambda e API Gateway | ✅ Configurado |

---

## Arquitetura de Observabilidade

```
┌─────────────────────────────────────────────────────────────────┐
│                      Serviços Monitorados                        │
├─────────────────────────────────────────────────────────────────┤
│  Fibonacci API  │  Fibonacci Lambda  │  Nigredo API/Lambda      │
│  Aurora CPU     │  Aurora Connections │                         │
└──────────┬──────┴──────────┬─────────┴──────────┬──────────────┘
           │                 │                    │
           ▼                 ▼                    ▼
    ┌──────────────────────────────────────────────────┐
    │           CloudWatch Metrics & Alarms            │
    │  • 5XX Errors (API Gateway)                      │
    │  • Lambda Errors & Throttles                     │
    │  • Aurora CPU & Connections                      │
    └──────────────────┬───────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   SNS Topic          │
            │  ops-alerts          │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   Email Subscribers  │
            │  - Equipe Operações  │
            │  - Equipe DevOps     │
            └──────────────────────┘
```

---

## Dashboards de Observabilidade

### Visão Geral

Os dashboards de observabilidade fornecem visibilidade consolidada em tempo real sobre o estado dos serviços críticos do AlquimistaAI. Cada ambiente (dev e prod) possui seu próprio dashboard com métricas de API Gateway, Lambda e Aurora PostgreSQL.

### Dashboards Disponíveis

#### AlquimistaAI-Dev-Overview

- **Ambiente:** Desenvolvimento
- **Propósito:** Monitoramento contínuo durante desenvolvimento e testes
- **Acesso:** CloudWatch Console > Dashboards > AlquimistaAI-Dev-Overview

#### AlquimistaAI-Prod-Overview

- **Ambiente:** Produção
- **Propósito:** Monitoramento de produção e resposta a incidentes
- **Acesso:** CloudWatch Console > Dashboards > AlquimistaAI-Prod-Overview

### Métricas Principais

#### API Gateway (Fibonacci e Nigredo)

| Métrica | Descrição | Valores Normais | Ação se Anormal |
|---------|-----------|-----------------|-----------------|
| **Latência p50** | Latência mediana das requisições | < 100ms | Investigar queries lentas |
| **Latência p90** | 90% das requisições abaixo deste valor | < 300ms | Otimizar código/queries |
| **Latência p99** | 99% das requisições abaixo deste valor | < 1000ms | Identificar gargalos |
| **Erros 4xx** | Erros de cliente (bad request, não autorizado) | < 5% das requisições | Verificar validações |
| **Erros 5xx** | Erros de servidor (falhas internas) | < 0.1% das requisições | Investigar logs urgente |
| **Throughput** | Requisições por minuto | Varia por ambiente | Monitorar tendências |

#### Lambda Functions

| Métrica | Descrição | Valores Normais | Ação se Anormal |
|---------|-----------|-----------------|-----------------|
| **Invocações** | Total de execuções | Varia por função | Monitorar picos |
| **Erros** | Falhas de execução | < 1% das invocações | Verificar logs |
| **Duração (avg)** | Tempo médio de execução | < 3000ms | Otimizar código |
| **Duração (p95)** | 95% das execuções abaixo deste valor | < 5000ms | Identificar lentidão |

#### Aurora PostgreSQL

| Métrica | Descrição | Valores Normais | Ação se Anormal |
|---------|-----------|-----------------|-----------------|
| **CPU Utilization** | Uso de CPU do cluster | < 70% | Otimizar queries |
| **Database Connections** | Conexões ativas | < 50 | Verificar connection pooling |
| **Free Storage Space** | Espaço livre em disco | > 10GB | Limpar dados antigos |

### Como Acessar os Dashboards

#### Via Console AWS

1. Acesse o [AWS Console](https://console.aws.amazon.com/)
2. Navegue para **CloudWatch** > **Dashboards**
3. Selecione o dashboard desejado:
   - `AlquimistaAI-Dev-Overview`
   - `AlquimistaAI-Prod-Overview`
4. Visualize as métricas em tempo real

#### Via AWS CLI

```powershell
# Listar dashboards disponíveis
aws cloudwatch list-dashboards

# Obter definição do dashboard dev
aws cloudwatch get-dashboard `
  --dashboard-name AlquimistaAI-Dev-Overview

# Obter definição do dashboard prod
aws cloudwatch get-dashboard `
  --dashboard-name AlquimistaAI-Prod-Overview
```

#### Via URL Direta

```
# Dev
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=AlquimistaAI-Dev-Overview

# Prod
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=AlquimistaAI-Prod-Overview
```

### O Que Olhar Primeiro em Caso de Incidente

Quando um alerta operacional é recebido ou um problema é reportado, siga esta ordem de investigação:

#### 1. Erros 5xx no API Gateway

**Indicador:** Problemas no backend (Lambda, banco de dados, integrações)

**Ações:**
- Verificar widget de erros 5xx do Fibonacci ou Nigredo
- Identificar se é um pico isolado ou tendência
- Correlacionar com horário do deploy recente
- Verificar logs das Lambdas correspondentes

#### 2. Latência p99 Elevada

**Indicador:** Degradação de performance

**Ações:**
- Verificar widget de latência do API Gateway
- Comparar p50, p90 e p99 para identificar outliers
- Verificar CPU do Aurora no mesmo período
- Verificar duração das Lambdas
- Investigar queries lentas no banco

#### 3. Erros nas Lambdas

**Indicador:** Falhas de execução (exceções, timeouts)

**Ações:**
- Identificar qual Lambda está falhando (Fibonacci ou Nigredo)
- Verificar widget de erros por função
- Acessar CloudWatch Logs da função específica
- Buscar stack traces e mensagens de erro
- Verificar se é erro de código ou infraestrutura

#### 4. CPU Aurora > 80%

**Indicador:** Banco de dados sobrecarregado

**Ações:**
- Verificar widget de CPU do Aurora
- Verificar número de conexões ativas
- Identificar queries lentas:
  ```sql
  SELECT * FROM pg_stat_statements 
  ORDER BY total_time DESC 
  LIMIT 10;
  ```
- Verificar se há queries sem índices
- Considerar otimização ou scaling

#### 5. Conexões Aurora Altas

**Indicador:** Possível vazamento de conexões

**Ações:**
- Verificar widget de conexões do Aurora
- Verificar se Lambdas estão fechando conexões
- Revisar configuração de connection pooling
- Verificar logs de erro "too many connections"
- Considerar implementar RDS Proxy

### Interpretação de Padrões

#### Padrão Normal

```
Latência p50: ~50ms
Latência p90: ~150ms
Latência p99: ~500ms
Erros 5xx: 0-2 por minuto
CPU Aurora: 20-40%
Conexões: 10-30
```

#### Padrão de Alerta

```
Latência p50: ~200ms
Latência p90: ~800ms
Latência p99: ~3000ms
Erros 5xx: 5-10 por minuto
CPU Aurora: 70-85%
Conexões: 50-70
```

#### Padrão Crítico

```
Latência p50: > 500ms
Latência p90: > 2000ms
Latência p99: > 5000ms
Erros 5xx: > 10 por minuto
CPU Aurora: > 85%
Conexões: > 80
```

### Dicas de Uso

1. **Monitore Tendências:** Observe padrões ao longo do tempo, não apenas valores pontuais
2. **Compare Ambientes:** Use dev para validar mudanças antes de prod
3. **Correlacione Métricas:** Erros 5xx + CPU alta = problema de banco
4. **Use Zoom:** Ajuste o período de visualização para focar no incidente
5. **Salve Snapshots:** Capture telas de incidentes para análise posterior

### Personalização

Os dashboards são criados automaticamente via CDK e podem ser personalizados:

```typescript
// Adicionar novos widgets ao dashboard
dashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: 'Minha Métrica Customizada',
    left: [myCustomMetric]
  })
);
```

Para mudanças permanentes, edite `lib/observability-dashboard-stack.ts` e faça redeploy.

---

## SNS de Alertas Operacionais

### Configuração

**Nome do Topic:** `alquimista-ops-alerts-{env}`

**Exemplos:**
- `alquimista-ops-alerts-dev`
- `alquimista-ops-alerts-prod`

**ARN Exportado:** `{env}-OpsAlertTopicArn`

### Como Adicionar Assinantes

#### Via Variável de Ambiente (Deploy)

```powershell
# Definir email antes do deploy
$env:OPS_ALERT_EMAIL = "operacoes@alquimista.ai"
cdk deploy SecurityStack-dev --context env=dev
```

#### Via Console AWS

1. Acessar [SNS Console](https://console.aws.amazon.com/sns/v3/home)
2. Clicar em "Topics"
3. Localizar `alquimista-ops-alerts-{env}`
4. Clicar em "Create subscription"
5. Protocol: Email
6. Endpoint: operacoes@alquimista.ai
7. Clicar em "Create subscription"
8. **Importante:** Confirmar assinatura no email recebido

### Como Testar Alertas

```powershell
# Publicar mensagem de teste
aws sns publish `
  --topic-arn "arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-ops-alerts-dev" `
  --subject "Teste de Alerta Operacional" `
  --message "Este é um teste do sistema de alertas operacionais."
```

---

## Alarmes CloudWatch - Fibonacci

### 1. Fibonacci API 5XX Errors

**Nome:** `fibonacci-api-5xx-errors-{env}`

**Métrica:** `5XXError` (AWS/ApiGateway)

**Threshold:** >= 5 erros em 5 minutos

**Evaluation Periods:** 1

**Descrição:** Erros 5XX indicam problemas no backend (Lambda, banco de dados, etc.)

**Ação:** SNS `alquimista-ops-alerts-{env}`

**O que fazer:**
1. Verificar logs da Lambda do Fibonacci
2. Verificar conectividade com Aurora
3. Verificar se há deploy recente
4. Verificar métricas de CPU/memória da Lambda

### 2. Fibonacci Lambda Errors

**Nome:** `fibonacci-lambda-errors-{env}`

**Métrica:** `Errors` (AWS/Lambda)

**Threshold:** >= 3 erros em 5 minutos

**Evaluation Periods:** 1

**Descrição:** Erros na execução da Lambda (exceções não tratadas, timeouts, etc.)

**Ação:** SNS `alquimista-ops-alerts-{env}`

**O que fazer:**
1. Acessar CloudWatch Logs da Lambda
2. Identificar stack trace do erro
3. Verificar se é erro de código ou infraestrutura
4. Verificar se há mudanças recentes no código

### 3. Fibonacci Lambda Throttles

**Nome:** `fibonacci-lambda-throttles-{env}`

**Métrica:** `Throttles` (AWS/Lambda)

**Threshold:** >= 1 throttle em 10 minutos (2 períodos de 5 min)

**Evaluation Periods:** 2

**Descrição:** Lambda atingiu limite de concorrência

**Ação:** SNS `alquimista-ops-alerts-{env}`

**O que fazer:**
1. Verificar concorrência configurada da Lambda
2. Verificar se há pico de tráfego inesperado
3. Considerar aumentar reserved concurrency
4. Verificar se há loops infinitos ou chamadas recursivas

---

## Alarmes CloudWatch - Nigredo

### 1. Nigredo API 5XX Errors

**Nome:** `nigredo-api-5xx-errors-{env}`

**Métrica:** `5XXError` (AWS/ApiGateway)

**Threshold:** >= 5 erros em 5 minutos

**Evaluation Periods:** 1

**Descrição:** Erros 5XX no API Gateway do Nigredo

**Ação:** SNS `alquimista-ops-alerts-{env}`

**O que fazer:**
1. Verificar logs das Lambdas do Nigredo
2. Verificar conectividade com Aurora (schema nigredo)
3. Verificar integrações com serviços externos
4. Verificar se há problemas de autenticação

### 2. Nigredo Lambda Errors (por função)

**Nome:** `nigredo-lambda-{function-name}-errors-{env}`

**Métrica:** `Errors` (AWS/Lambda)

**Threshold:** >= 3 erros em 5 minutos

**Evaluation Periods:** 1

**Descrição:** Erros em Lambdas específicas do Nigredo

**Ação:** SNS `alquimista-ops-alerts-{env}`

**Funções Monitoradas:**
- `create-lead`
- `list-leads`
- `get-lead`
- Outras conforme configuração

**O que fazer:**
1. Identificar qual Lambda está falhando
2. Verificar logs específicos da função
3. Verificar se é problema de validação de dados
4. Verificar integrações com Fibonacci

---

## Alarmes CloudWatch - Aurora

### 1. Aurora CPU High

**Nome:** `aurora-cpu-high-{env}`

**Métrica:** `CPUUtilization` (AWS/RDS)

**Threshold:** >= 80% por 10 minutos (2 períodos de 5 min)

**Evaluation Periods:** 2

**Descrição:** CPU do cluster Aurora está alta

**Ação:** SNS `alquimista-ops-alerts-{env}`

**O que fazer:**
1. Verificar queries lentas no Aurora
   ```sql
   SELECT * FROM pg_stat_statements 
   ORDER BY total_time DESC 
   LIMIT 10;
   ```
2. Verificar se há queries sem índices
3. Verificar se há lock de tabelas
4. Considerar otimizar queries problemáticas
5. Considerar aumentar capacidade do Aurora Serverless

### 2. Aurora Connections High

**Nome:** `aurora-connections-high-{env}`

**Métrica:** `DatabaseConnections` (AWS/RDS)

**Threshold:** >= 80 conexões por 10 minutos (2 períodos de 5 min)

**Evaluation Periods:** 2

**Descrição:** Número de conexões ao Aurora está alto

**Ação:** SNS `alquimista-ops-alerts-{env}`

**O que fazer:**
1. Verificar connection pooling nas Lambdas
2. Verificar se há conexões não fechadas
3. Verificar logs de erro de "too many connections"
4. Revisar configuração de `max_connections` no Aurora
5. Considerar implementar connection pooling (RDS Proxy)

---

## Retenção de Logs

### Configuração Atual

| Serviço | Log Group | Retenção | Status |
|---------|-----------|----------|--------|
| Lambda Fibonacci | `/aws/lambda/fibonacci-*` | 30 dias | ✅ |
| Lambda Nigredo | `/aws/lambda/nigredo-*` | 30 dias | ✅ |
| Lambda Platform | `/aws/lambda/platform-*` | 30 dias | ✅ |
| API Gateway Fibonacci | `/aws/apigateway/fibonacci-*` | 30 dias | ✅ |
| API Gateway Nigredo | `/aws/apigateway/nigredo-*` | 30 dias | ✅ |

### Como Verificar Retenção

```powershell
# Listar log groups e suas retenções
aws logs describe-log-groups `
  --query 'logGroups[*].[logGroupName,retentionInDays]' `
  --output table
```

### Como Alterar Retenção

#### Via CDK (Recomendado)

```typescript
// Ao criar Lambda
const myFunction = new lambda.Function(this, 'MyFunction', {
  // ... outras configurações
  logRetention: logs.RetentionDays.THIRTY_DAYS,
});
```

#### Via AWS CLI

```powershell
# Alterar retenção para 30 dias
aws logs put-retention-policy `
  --log-group-name "/aws/lambda/my-function" `
  --retention-in-days 30
```

---

## Fluxos de Ação

### Fluxo 1: Alerta de 5XX na API

```
┌─────────────────────────────────────────────────────────────┐
│  1. CloudWatch detecta >= 5 erros 5XX em 5 minutos          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Alarme entra em estado ALARM                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  3. SNS envia email para equipe de operações                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Equipe investiga logs e identifica causa                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Equipe aplica correção (hotfix ou rollback)             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Alarme volta para estado OK                             │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo 2: Alerta de Lambda Errors

```
┌─────────────────────────────────────────────────────────────┐
│  1. Lambda falha >= 3 vezes em 5 minutos                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Alarme dispara e envia para SNS                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Equipe acessa CloudWatch Logs                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Identifica stack trace e causa raiz                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Corrige código ou configuração                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Deploy da correção                                      │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo 3: Alerta de CPU Alta no Aurora

```
┌─────────────────────────────────────────────────────────────┐
│  1. CPU do Aurora >= 80% por 10 minutos                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Alarme dispara                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Equipe verifica queries lentas                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Identifica queries sem índices ou ineficientes          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Otimiza queries ou adiciona índices                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  6. CPU volta ao normal                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Problema: Não estou recebendo alertas operacionais

**Possíveis causas:**

1. **Assinatura SNS não confirmada**
   - Verificar email de confirmação
   - Reenviar confirmação se necessário

2. **Email na lista de spam**
   - Verificar pasta de spam
   - Adicionar remetente à lista de confiáveis

3. **Alarme não configurado**
   ```powershell
   # Listar alarmes
   aws cloudwatch describe-alarms `
     --alarm-name-prefix "fibonacci-" `
     --query 'MetricAlarms[*].[AlarmName,StateValue]' `
     --output table
   ```

**Solução:**

```powershell
# Adicionar nova assinatura
aws sns subscribe `
  --topic-arn "arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-ops-alerts-dev" `
  --protocol email `
  --notification-endpoint "operacoes@alquimista.ai"
```

### Problema: Muitos falsos positivos

**Possíveis causas:**

1. **Threshold muito baixo**
2. **Tráfego com picos naturais**
3. **Alarme muito sensível**

**Solução:**

```powershell
# Ajustar threshold do alarme
aws cloudwatch put-metric-alarm `
  --alarm-name "fibonacci-api-5xx-errors-dev" `
  --comparison-operator GreaterThanThreshold `
  --evaluation-periods 2 `
  --metric-name 5XXError `
  --namespace AWS/ApiGateway `
  --period 300 `
  --statistic Sum `
  --threshold 10 `
  --alarm-actions "arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-ops-alerts-dev"
```

### Problema: Alarme não dispara quando deveria

**Possíveis causas:**

1. **Métrica não está sendo coletada**
2. **Dimensões incorretas**
3. **Threshold muito alto**

**Diagnóstico:**

```powershell
# Verificar se métrica existe
aws cloudwatch get-metric-statistics `
  --namespace AWS/Lambda `
  --metric-name Errors `
  --dimensions Name=FunctionName,Value=fibonacci-handler `
  --start-time 2024-01-01T00:00:00Z `
  --end-time 2024-01-01T23:59:59Z `
  --period 300 `
  --statistics Sum
```

**Solução:**

1. Verificar que o recurso (Lambda, API) existe
2. Verificar que o nome está correto
3. Ajustar threshold se necessário

### Problema: Logs não estão sendo retidos

**Possíveis causas:**

1. **Retenção não configurada**
2. **Log group não existe**

**Diagnóstico:**

```powershell
# Verificar retenção do log group
aws logs describe-log-groups `
  --log-group-name-prefix "/aws/lambda/fibonacci" `
  --query 'logGroups[*].[logGroupName,retentionInDays]'
```

**Solução:**

```powershell
# Configurar retenção de 30 dias
aws logs put-retention-policy `
  --log-group-name "/aws/lambda/fibonacci-handler" `
  --retention-in-days 30
```

---

## Checklist de Validação

### Validação Inicial (Pós-Deploy)

- [ ] SecurityStack deployado com sucesso
- [ ] SNS Topic `alquimista-ops-alerts-{env}` criado
- [ ] Alarmes do Fibonacci criados
- [ ] Alarmes do Nigredo criados (se aplicável)
- [ ] Alarmes do Aurora criados (se aplicável)
- [ ] Retenção de logs configurada (30 dias)

### Validação de Configuração

- [ ] Email de operações adicionado ao SNS Topic
- [ ] Assinatura de email confirmada
- [ ] Alarmes aparecem no console CloudWatch
- [ ] Thresholds configurados corretamente
- [ ] Ações SNS configuradas em todos os alarmes

### Validação de Funcionamento

- [ ] Teste de envio SNS bem-sucedido
- [ ] Email de teste recebido
- [ ] Alarmes em estado OK
- [ ] Métricas sendo coletadas
- [ ] Logs sendo retidos por 30 dias

### Comandos de Validação

```powershell
# 1. Verificar stack deployado
cdk list

# 2. Ver outputs da stack
aws cloudformation describe-stacks `
  --stack-name SecurityStack-dev `
  --query 'Stacks[0].Outputs'

# 3. Listar alarmes
aws cloudwatch describe-alarms `
  --query 'MetricAlarms[*].[AlarmName,StateValue,ActionsEnabled]' `
  --output table

# 4. Listar assinaturas SNS
aws sns list-subscriptions-by-topic `
  --topic-arn "arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-ops-alerts-dev"

# 5. Verificar retenção de logs
aws logs describe-log-groups `
  --log-group-name-prefix "/aws/lambda" `
  --query 'logGroups[*].[logGroupName,retentionInDays]' `
  --output table

# 6. Testar envio SNS
aws sns publish `
  --topic-arn "arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-ops-alerts-dev" `
  --subject "Teste" `
  --message "Teste de alerta operacional"

# 7. Verificar estado dos alarmes
aws cloudwatch describe-alarms `
  --alarm-names "fibonacci-api-5xx-errors-dev" "fibonacci-lambda-errors-dev" `
  --query 'MetricAlarms[*].[AlarmName,StateValue,StateReason]'
```

---

## Recursos Adicionais

### Links Úteis

- [CloudWatch Alarms Documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)
- [CloudWatch Logs Retention](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/Working-with-log-groups-and-streams.html)
- [SNS Documentation](https://docs.aws.amazon.com/sns/latest/dg/welcome.html)
- [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/home)
- [SNS Console](https://console.aws.amazon.com/sns/v3/home)

### Comandos Úteis

```powershell
# Ver métricas de uma Lambda
aws cloudwatch get-metric-statistics `
  --namespace AWS/Lambda `
  --metric-name Invocations `
  --dimensions Name=FunctionName,Value=fibonacci-handler `
  --start-time 2024-01-01T00:00:00Z `
  --end-time 2024-01-01T23:59:59Z `
  --period 3600 `
  --statistics Sum

# Ver logs recentes de uma Lambda
aws logs tail /aws/lambda/fibonacci-handler --follow

# Forçar alarme para teste (não recomendado em prod)
aws cloudwatch set-alarm-state `
  --alarm-name "fibonacci-api-5xx-errors-dev" `
  --state-value ALARM `
  --state-reason "Teste manual"
```

---

## Conclusão

Os Guardrails de Observabilidade do AlquimistaAI fornecem visibilidade e controle sobre a saúde operacional dos serviços, permitindo que a equipe:

- ✅ Detecte problemas antes que afetem usuários
- ✅ Responda rapidamente a incidentes
- ✅ Mantenha alta disponibilidade
- ✅ Tome decisões baseadas em dados

**Próximos Passos:**

1. Configurar emails de alerta
2. Ajustar thresholds conforme necessário
3. Monitorar alarmes nas primeiras semanas
4. Refinar configurações baseado em experiência
5. Considerar adicionar mais alarmes conforme necessário

---

**Documentação criada em:** 2024-01-15  
**Última atualização:** 2024-01-15  
**Versão:** 1.0  
**Autor:** Kiro AI

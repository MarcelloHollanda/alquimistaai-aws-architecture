# CloudWatch Alarms - Fibonacci Ecosystem

## Overview

Este documento descreve os alarmes do CloudWatch configurados para monitorar a saúde e performance do Ecossistema Alquimista.AI. Os alarmes são essenciais para detectar problemas antes que afetem os usuários e garantir SLA adequado.

## Arquitetura de Notificações

```
CloudWatch Alarms
       ↓
   SNS Topic (fibonacci-alarms-{env})
       ↓
   ┌────────────────────────────┐
   │  Email Subscriptions       │
   │  Slack Webhooks (futuro)   │
   │  PagerDuty (futuro)        │
   └────────────────────────────┘
```

## Alarmes Configurados

### 1. High Error Rate Alarm

**Nome**: `fibonacci-high-error-rate-{env}`

**Descrição**: Detecta taxa de erro alta na Lambda principal

**Métrica**: Lambda Errors (Sum)

**Threshold**: ≥ 10 erros em 2 minutos consecutivos

**Ação Recomendada**:
1. Verificar logs do CloudWatch: `/aws/lambda/fibonacci-api-handler-{env}`
2. Verificar X-Ray traces para identificar causa raiz
3. Verificar se há mudanças recentes no código
4. Verificar integrações externas (MCP servers)

**Severidade**: 🔴 CRÍTICA

---

### 2. High Latency Alarm

**Nome**: `fibonacci-high-latency-{env}`

**Descrição**: Detecta latência alta (P95) na Lambda principal

**Métrica**: Lambda Duration (p95)

**Threshold**: ≥ 3000ms (3 segundos) por 2 de 3 períodos de 5 minutos

**Ação Recomendada**:
1. Verificar X-Ray traces para identificar gargalos
2. Verificar performance do Aurora (CPU, connections)
3. Verificar latência de integrações MCP
4. Considerar aumentar memória da Lambda
5. Verificar cold starts (adicionar provisioned concurrency se necessário)

**Severidade**: 🟡 ALTA

---

### 3. DLQ Not Empty Alarm

**Nome**: `fibonacci-dlq-not-empty-{env}`

**Descrição**: Detecta mensagens na Dead Letter Queue

**Métrica**: SQS ApproximateNumberOfMessagesVisible (Maximum)

**Threshold**: ≥ 1 mensagem

**Ação Recomendada**:
1. Acessar console SQS e inspecionar mensagens na DLQ
2. Identificar padrão de falhas (mesmo lead_id, mesmo agente, etc)
3. Verificar logs do agente que falhou
4. Corrigir problema e reprocessar mensagens manualmente
5. Purgar DLQ após correção

**Severidade**: 🔴 CRÍTICA

**Script de Reprocessamento**:
```bash
# Mover mensagens da DLQ de volta para fila principal
aws sqs receive-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/{account}/fibonacci-dlq-{env} \
  --max-number-of-messages 10 \
  --output json | \
jq -r '.Messages[] | .Body' | \
while read body; do
  aws sqs send-message \
    --queue-url https://sqs.us-east-1.amazonaws.com/{account}/fibonacci-main-{env} \
    --message-body "$body"
done
```

---

### 4. Aurora CPU High Alarm

**Nome**: `fibonacci-aurora-cpu-high-{env}`

**Descrição**: Detecta CPU alta no cluster Aurora

**Métrica**: RDS CPUUtilization (Average)

**Threshold**: ≥ 80% por 2 de 3 períodos de 5 minutos

**Ação Recomendada**:
1. Verificar queries lentas no Aurora:
   ```sql
   SELECT * FROM pg_stat_statements 
   ORDER BY total_time DESC 
   LIMIT 10;
   ```
2. Verificar número de conexões ativas:
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```
3. Considerar aumentar `serverlessV2MaxCapacity` no CDK
4. Implementar connection pooling via RDS Proxy
5. Otimizar queries com índices apropriados

**Severidade**: 🟡 ALTA

---

### 5. Estimated Cost High Alarm

**Nome**: `fibonacci-estimated-cost-high-{env}`

**Descrição**: Detecta invocações Lambda acima do esperado (proxy para custos)

**Métrica**: Lambda Invocations (Sum)

**Threshold**: 
- Dev: ≥ 10,000 invocações/hora
- Staging: ≥ 10,000 invocações/hora
- Prod: ≥ 50,000 invocações/hora

**Ação Recomendada**:
1. Verificar se há loop infinito ou retry excessivo
2. Verificar se há ataque DDoS (verificar WAF logs)
3. Verificar se há campanha de marketing não planejada
4. Revisar AWS Cost Explorer para custos reais
5. Implementar rate limiting mais agressivo se necessário

**Severidade**: 🟡 MÉDIA

**Nota**: Para monitoramento de custos real, configure AWS Budgets:
```bash
aws budgets create-budget \
  --account-id {account-id} \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

---

### 6. API Gateway 5xx Errors Alarm

**Nome**: `fibonacci-api-5xx-errors-{env}`

**Descrição**: Detecta erros 5xx no API Gateway

**Métrica**: API Gateway 5XXError (Sum)

**Threshold**: ≥ 5 erros em 2 minutos consecutivos

**Ação Recomendada**:
1. Verificar logs do API Gateway
2. Verificar se Lambda está retornando erros 500
3. Verificar se há timeout na Lambda
4. Verificar se há problema de permissões IAM
5. Verificar integrações downstream

**Severidade**: 🔴 CRÍTICA

---

### 7. Lambda Throttle Alarm

**Nome**: `fibonacci-lambda-throttles-{env}`

**Descrição**: Detecta throttling da Lambda (concorrência excedida)

**Métrica**: Lambda Throttles (Sum)

**Threshold**: ≥ 10 throttles em 2 períodos de 5 minutos

**Ação Recomendada**:
1. Verificar limite de concorrência da conta AWS:
   ```bash
   aws lambda get-account-settings
   ```
2. Considerar adicionar reserved concurrency:
   ```typescript
   this.apiHandler.addReservedConcurrentExecutions(100);
   ```
3. Implementar backoff exponencial no cliente
4. Solicitar aumento de limite via AWS Support

**Severidade**: 🟡 ALTA

---

### 8. Old Messages Alarm

**Nome**: `fibonacci-old-messages-{env}`

**Descrição**: Detecta mensagens antigas na fila principal

**Métrica**: SQS ApproximateAgeOfOldestMessage (Maximum)

**Threshold**: ≥ 300 segundos (5 minutos)

**Ação Recomendada**:
1. Verificar se consumers estão processando mensagens
2. Verificar se há erro recorrente impedindo processamento
3. Verificar se há backpressure de sistemas downstream
4. Considerar aumentar número de consumers (Lambda concurrency)
5. Verificar se visibilityTimeout está apropriado

**Severidade**: 🟡 MÉDIA

---

### 9. Critical System Alarm (Composite)

**Nome**: `fibonacci-critical-system-{env}`

**Descrição**: Alarme composto que dispara quando múltiplos alarmes estão ativos

**Regra**: 
- High Error Rate ALARM **OU**
- (High Latency ALARM **E** DLQ Not Empty ALARM)

**Ação Recomendada**:
1. **ESCALAÇÃO IMEDIATA** para equipe de plantão
2. Verificar status de todos os componentes
3. Considerar rollback para versão anterior
4. Ativar plano de disaster recovery se necessário
5. Comunicar status aos stakeholders

**Severidade**: 🔴 CRÍTICA - ESCALAÇÃO AUTOMÁTICA

---

## Configuração de Notificações

### Adicionar Email Subscription

```bash
# Via AWS CLI
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:{account}:fibonacci-alarms-{env} \
  --protocol email \
  --notification-endpoint ops@alquimista.ai

# Confirmar subscription no email recebido
```

### Adicionar Slack Webhook (Futuro)

```typescript
// Em lib/fibonacci-stack.ts
import * as chatbot from 'aws-cdk-lib/aws-chatbot';

const slackChannel = new chatbot.SlackChannelConfiguration(this, 'SlackChannel', {
  slackChannelConfigurationName: 'fibonacci-alerts',
  slackWorkspaceId: 'YOUR_WORKSPACE_ID',
  slackChannelId: 'YOUR_CHANNEL_ID'
});

alarmTopic.addSubscription(
  new sns_subscriptions.LambdaSubscription(slackNotifierLambda)
);
```

### Adicionar PagerDuty (Futuro)

```bash
# Criar integration key no PagerDuty
# Adicionar como HTTPS subscription no SNS
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:{account}:fibonacci-alarms-{env} \
  --protocol https \
  --notification-endpoint https://events.pagerduty.com/integration/{key}/enqueue
```

## Dashboards de Alarmes

Os alarmes são visualizados no CloudWatch Dashboard:

1. **Fibonacci Core Dashboard**: Métricas principais + status de alarmes
2. **Alarms Dashboard** (criar manualmente):
   - Status de todos os alarmes
   - Histórico de transições (OK → ALARM → OK)
   - Tempo médio de resolução (MTTR)

## Testes de Alarmes

### Testar High Error Rate Alarm

```bash
# Gerar erros propositalmente
for i in {1..15}; do
  curl -X POST https://{api-url}/events \
    -H "Content-Type: application/json" \
    -d '{"invalid": "payload"}'
done

# Verificar alarme no console CloudWatch
aws cloudwatch describe-alarms \
  --alarm-names fibonacci-high-error-rate-{env} \
  --query 'MetricAlarms[0].StateValue'
```

### Testar DLQ Alarm

```bash
# Enviar mensagem inválida para fila
aws sqs send-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/{account}/fibonacci-main-{env} \
  --message-body '{"invalid": "message without required fields"}'

# Aguardar 3 tentativas de processamento (falhará e irá para DLQ)
# Verificar alarme
aws cloudwatch describe-alarms \
  --alarm-names fibonacci-dlq-not-empty-{env}
```

## Métricas de SLA

Com base nos alarmes, definimos os seguintes SLAs:

| Métrica | Target | Alarme |
|---------|--------|--------|
| Availability | 99.9% | High Error Rate |
| Latency (P95) | < 3s | High Latency |
| Error Rate | < 0.1% | High Error Rate |
| Message Processing | < 5min | Old Messages |

## Runbooks

### Runbook: High Error Rate

1. **Identificar**: Verificar logs e X-Ray traces
2. **Isolar**: Identificar se é problema específico de um agente
3. **Mitigar**: 
   - Se problema em agente específico: desabilitar agente
   - Se problema geral: rollback para versão anterior
4. **Resolver**: Corrigir código e fazer deploy
5. **Validar**: Monitorar métricas por 30 minutos
6. **Documentar**: Adicionar post-mortem

### Runbook: DLQ Not Empty

1. **Inspecionar**: Verificar mensagens na DLQ
2. **Classificar**: Identificar tipo de falha (transient vs permanent)
3. **Corrigir**: 
   - Transient: Reprocessar mensagens
   - Permanent: Corrigir código e reprocessar
4. **Validar**: Confirmar que mensagens foram processadas
5. **Limpar**: Purgar DLQ
6. **Prevenir**: Adicionar validação para evitar recorrência

## Custos de Alarmes

| Recurso | Quantidade | Custo Mensal |
|---------|-----------|--------------|
| CloudWatch Alarms | 9 alarmes | $0.90 |
| SNS Topic | 1 topic | $0.00 |
| SNS Notifications | ~1000/mês | $0.50 |
| **Total** | | **~$1.40/mês** |

## Próximos Passos

1. ✅ Implementar alarmes básicos
2. ⏳ Configurar email subscriptions
3. ⏳ Integrar com Slack
4. ⏳ Integrar com PagerDuty
5. ⏳ Criar runbooks automatizados (Lambda)
6. ⏳ Implementar auto-remediation para problemas comuns
7. ⏳ Criar dashboard de SLA
8. ⏳ Implementar anomaly detection com CloudWatch Anomaly Detection

## Referências

- [CloudWatch Alarms Documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)
- [CloudWatch Composite Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Create_Composite_Alarm.html)
- [SNS Best Practices](https://docs.aws.amazon.com/sns/latest/dg/sns-best-practices.html)
- [Lambda Monitoring Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-metrics.html)

---

**Última atualização**: 2025-01-12  
**Versão**: 1.0  
**Responsável**: Equipe DevOps Alquimista.AI

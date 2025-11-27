# 🔔 Guardrails de Observabilidade - Referência Rápida

## 🚀 Deploy

```powershell
# Deploy com email de operações
$env:OPS_ALERT_EMAIL = "operacoes@alquimista.ai"
cdk deploy SecurityStack-dev --context env=dev
```

---

## ✅ Validação

```powershell
# Listar alarmes
aws cloudwatch describe-alarms `
  --query 'MetricAlarms[*].[AlarmName,StateValue]' `
  --output table

# Listar assinaturas SNS
aws sns list-subscriptions-by-topic `
  --topic-arn "arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-ops-alerts-dev"

# Verificar retenção de logs
aws logs describe-log-groups `
  --log-group-name-prefix "/aws/lambda" `
  --query 'logGroups[*].[logGroupName,retentionInDays]' `
  --output table
```

---

## 🧪 Testes

```powershell
# Testar SNS
aws sns publish `
  --topic-arn "arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-ops-alerts-dev" `
  --subject "Teste" `
  --message "Teste de alerta operacional"

# Ver logs recentes
aws logs tail /aws/lambda/fibonacci-handler --follow
```

---

## 📊 Alarmes Configurados

| Serviço | Alarme | Threshold |
|---------|--------|-----------|
| Fibonacci API | 5XX Errors | >= 5 em 5 min |
| Fibonacci Lambda | Errors | >= 3 em 5 min |
| Fibonacci Lambda | Throttles | >= 1 em 10 min |
| Nigredo API | 5XX Errors | >= 5 em 5 min |
| Nigredo Lambda | Errors | >= 3 em 5 min |
| Aurora | CPU | >= 80% por 10 min |
| Aurora | Connections | >= 80 por 10 min |

---

## 🚨 Resposta a Alertas

### API 5XX Errors
- Verificar logs da Lambda
- Verificar conectividade com Aurora
- Verificar deploys recentes

### Lambda Errors
- Acessar CloudWatch Logs
- Identificar stack trace
- Verificar mudanças recentes

### Lambda Throttles
- Verificar concorrência
- Verificar pico de tráfego
- Considerar aumentar reserved concurrency

### Aurora CPU High
- Verificar queries lentas
- Verificar índices
- Considerar otimizações

### Aurora Connections High
- Verificar connection pooling
- Verificar conexões não fechadas
- Considerar RDS Proxy

---

## 📚 Documentação

- [Completa](../OBSERVABILITY-GUARDRAILS-AWS.md) - 600+ linhas
- [Spec](../../.kiro/specs/ci-cd-aws-guardrails/TASK-5-COMPLETE.md) - Relatório técnico

---

## 🔗 Links Úteis

- [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/home)
- [SNS Console](https://console.aws.amazon.com/sns/v3/home)
- [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/home#logsV2:log-groups)

---

**Versão:** 1.0  
**Data:** 2025-01-17

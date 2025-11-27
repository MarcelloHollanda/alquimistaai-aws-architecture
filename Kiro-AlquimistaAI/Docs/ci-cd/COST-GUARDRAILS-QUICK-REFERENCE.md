# 💰 Guardrails de Custo - Referência Rápida

## 🚀 Deploy

```powershell
# Deploy padrão ($500/mês)
cdk deploy SecurityStack-dev --context env=dev

# Deploy customizado
# 1. Editar bin/app.ts (monthlyBudgetAmount)
# 2. Deploy
cdk deploy SecurityStack-dev --context env=dev

# Com email de alerta
$env:COST_ALERT_EMAIL = "financeiro@alquimista.ai"
cdk deploy SecurityStack-dev --context env=dev
```

---

## ✅ Validação

```powershell
# Compilar
npm run build

# Sintetizar
cdk synth SecurityStack-dev --context env=dev

# Ver outputs (após deploy)
aws cloudformation describe-stacks `
  --stack-name SecurityStack-dev `
  --query 'Stacks[0].Outputs'

# Listar budgets
aws budgets describe-budgets --account-id ACCOUNT_ID

# Listar anomaly monitors
aws ce get-anomaly-monitors

# Listar assinaturas SNS
aws sns list-subscriptions
```

---

## 🧪 Testes

```powershell
# Testar SNS
aws sns publish `
  --topic-arn "arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-cost-alerts-dev" `
  --subject "Teste" `
  --message "Teste de alerta de custo"

# Ver gastos do mês
aws ce get-cost-and-usage `
  --time-period Start=2024-01-01,End=2024-01-31 `
  --granularity MONTHLY `
  --metrics BlendedCost

# Ver gastos por serviço
aws ce get-cost-and-usage `
  --time-period Start=2024-01-01,End=2024-01-31 `
  --granularity MONTHLY `
  --metrics BlendedCost `
  --group-by Type=DIMENSION,Key=SERVICE
```

---

## 📊 Thresholds

| Threshold | Tipo | Ação |
|-----------|------|------|
| 80% | FORECASTED | ⚠️ Revisar gastos |
| 100% | ACTUAL | 🚨 Investigação urgente |
| 120% | ACTUAL | 🔥 Emergência |
| $50 | Anomalia | 🔍 Investigar causa |

---

## 🚨 Resposta a Alertas

### 80% ⚠️
- Tempo: 24h
- Revisar dashboard
- Identificar otimizações

### 100% 🚨
- Tempo: 4h
- Investigação imediata
- Mitigar gastos

### 120% 🔥
- Tempo: Imediato
- Emergência
- Verificar segurança

### Anomalia 🔍
- Tempo: 12h
- Revisar detalhes
- Correlacionar eventos

---

## 📚 Documentação

- [Completa](../COST-GUARDRAILS-AWS.md) - 400+ linhas
- [Spec](../../.kiro/specs/ci-cd-aws-guardrails/TASK-4-COMPLETE.md) - Relatório técnico

---

## 🔗 Links Úteis

- [AWS Budgets Console](https://console.aws.amazon.com/billing/home#/budgets)
- [Cost Anomaly Detection](https://console.aws.amazon.com/cost-management/home#/anomaly-detection)
- [Cost Explorer](https://console.aws.amazon.com/cost-management/home#/cost-explorer)
- [SNS Console](https://console.aws.amazon.com/sns/v3/home)

---

**Versão:** 1.0  
**Data:** 2025-01-17

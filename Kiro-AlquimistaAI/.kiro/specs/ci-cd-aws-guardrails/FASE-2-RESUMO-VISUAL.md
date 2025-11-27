# 🎯 Fase 2: Resumo Visual - Configuração OIDC

## 📊 Progresso Atual

```
Fase 1: ████████████████████ 100% ✅ COMPLETA
Fase 2: ░░░░░░░░░░░░░░░░░░░░   0% ⏳ EM EXECUÇÃO
Fase 3: ░░░░░░░░░░░░░░░░░░░░   0% ⏳ AGUARDANDO
Fase 4: ░░░░░░░░░░░░░░░░░░░░   0% ⏳ AGUARDANDO
```

---

## 🚀 O Que Fazer AGORA

### Opção 1: Comandos Manuais (Recomendado) ⭐

**Abra**: `.kiro/specs/ci-cd-aws-guardrails/FASE-2-COMANDOS-MANUAIS.md`

**Siga os 7 passos**:
1. ✅ Obter Account ID
2. ✅ Criar Identity Provider OIDC
3. ✅ Criar Trust Policy
4. ✅ Criar IAM Role
5. ✅ Criar Permissions Policy
6. ✅ Anexar Policy à Role
7. ✅ Configurar GitHub Secrets

**Tempo**: 10-15 minutos

---

## 📋 Comandos Rápidos

### 1. Obter Account ID

```powershell
$ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
Write-Host "Account ID: $ACCOUNT_ID"
```

### 2. Criar Identity Provider

```powershell
aws iam create-open-id-connect-provider `
    --url "https://token.actions.githubusercontent.com" `
    --client-id-list "sts.amazonaws.com" `
    --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1"
```

### 3. Criar Role (após criar trust-policy.json)

```powershell
aws iam create-role `
    --role-name GitHubActionsAlquimistaAICICD `
    --assume-role-policy-document file://trust-policy.json `
    --description "Role para GitHub Actions executar deploy do AlquimistaAI"
```

### 4. Criar Policy (após criar permissions-policy.json)

```powershell
aws iam create-policy `
    --policy-name GitHubActionsAlquimistaAIPolicy `
    --policy-document file://permissions-policy.json `
    --description "Permissoes para GitHub Actions fazer deploy do AlquimistaAI"
```

### 5. Anexar Policy

```powershell
aws iam attach-role-policy `
    --role-name GitHubActionsAlquimistaAICICD `
    --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/GitHubActionsAlquimistaAIPolicy"
```

---

## 🔑 ARNs Importantes

Após executar os comandos, você terá:

```
Identity Provider ARN:
arn:aws:iam::207933152643:oidc-provider/token.actions.githubusercontent.com

Role ARN (para GitHub Secrets):
arn:aws:iam::207933152643:role/GitHubActionsAlquimistaAICICD

Policy ARN:
arn:aws:iam::207933152643:policy/GitHubActionsAlquimistaAIPolicy
```

---

## 🎯 GitHub Secrets

**Acesse**: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/settings/secrets/actions

**Adicione**:

| Nome | Valor |
|------|-------|
| `AWS_ROLE_ARN` | `arn:aws:iam::207933152643:role/GitHubActionsAlquimistaAICICD` |
| `AWS_REGION` | `us-east-1` |

---

## ✅ Checklist Rápido

- [ ] Account ID obtido
- [ ] Identity Provider criado
- [ ] Trust Policy criada (arquivo JSON)
- [ ] IAM Role criada
- [ ] Permissions Policy criada (arquivo JSON)
- [ ] Policy anexada à Role
- [ ] GitHub Secret `AWS_ROLE_ARN` adicionado
- [ ] GitHub Secret `AWS_REGION` adicionado

---

## 🎉 Após Completar

**Progresso Atualizado**:
```
Fase 1: ████████████████████ 100% ✅ COMPLETA
Fase 2: ████████████████████ 100% ✅ COMPLETA
Fase 3: ░░░░░░░░░░░░░░░░░░░░   0% ⏳ PRONTA
Fase 4: ░░░░░░░░░░░░░░░░░░░░   0% ⏳ AGUARDANDO
```

**Próximo Passo**: Fase 3 - Executar Testes

---

**Documentação Completa**: `.kiro/specs/ci-cd-aws-guardrails/FASE-2-COMANDOS-MANUAIS.md`

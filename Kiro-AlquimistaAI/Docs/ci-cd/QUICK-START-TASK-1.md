# 🚀 Quick Start - Pipeline CI Base (Tarefa 1)

## TL;DR

Pipeline de CI implementado! Valida código em PRs e push para main. Usa OIDC para autenticação segura na AWS.

## ⚡ Configuração Rápida (5 passos)

### 1️⃣ Criar Identity Provider OIDC

```powershell
aws iam create-open-id-connect-provider `
  --url https://token.actions.githubusercontent.com `
  --client-id-list sts.amazonaws.com `
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### 2️⃣ Criar Trust Policy

Crie `github-actions-trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
      },
      "StringLike": {
        "token.actions.githubusercontent.com:sub": "repo:MarcelloHollanda/alquimistaai-aws-architecture:*"
      }
    }
  }]
}
```

**⚠️ Substitua `ACCOUNT_ID` pelo seu AWS Account ID!**

### 3️⃣ Criar IAM Role

```powershell
aws iam create-role `
  --role-name GitHubActionsAlquimistaAICICD `
  --assume-role-policy-document file://github-actions-trust-policy.json
```

### 4️⃣ Anexar Permissões

```powershell
# Anexar política gerenciada (temporário, para teste rápido)
aws iam attach-role-policy `
  --role-name GitHubActionsAlquimistaAICICD `
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

# ⚠️ IMPORTANTE: Substituir por política customizada em produção!
# Veja docs/CI-CD-PIPELINE-ALQUIMISTAAI.md para política detalhada
```

### 5️⃣ Atualizar Workflow

```powershell
# Obter ARN da role
aws iam get-role --role-name GitHubActionsAlquimistaAICICD --query 'Role.Arn' --output text

# Editar .github/workflows/ci-cd-alquimistaai.yml
# Substituir <ACCOUNT_ID> pelo seu Account ID na linha:
# role-to-assume: arn:aws:iam::<ACCOUNT_ID>:role/GitHubActionsAlquimistaAICICD
```

## ✅ Testar

```powershell
# 1. Criar branch de teste
git checkout -b test/pipeline

# 2. Fazer mudança
echo "# Test" >> README.md

# 3. Commit e push
git add README.md
git commit -m "test: pipeline CI"
git push origin test/pipeline

# 4. Criar PR no GitHub
# 5. Verificar que workflow executa ✅
```

## 📋 Checklist

- [ ] Identity Provider OIDC criado
- [ ] IAM Role criada
- [ ] Permissões anexadas
- [ ] ARN atualizado no workflow
- [ ] PR de teste criado
- [ ] Workflow executou com sucesso
- [ ] Comentário apareceu no PR

## 🆘 Problemas Comuns

### "User is not authorized to perform: sts:AssumeRoleWithWebIdentity"

**Solução:** Trust policy incorreta. Verifique:
- Identity Provider foi criado?
- Trust policy referencia o provider correto?
- Repositório está correto na condition?

### "No OpenIDConnect provider found"

**Solução:** Identity Provider não foi criado. Execute passo 1️⃣.

### "Access Denied" durante CDK synth

**Solução:** Permissões insuficientes. Verifique passo 4️⃣.

## 📚 Documentação Completa

- **Guia Completo:** `docs/CI-CD-PIPELINE-ALQUIMISTAAI.md`
- **Spec Completa:** `.kiro/specs/ci-cd-aws-guardrails/`
- **Status:** `.kiro/specs/ci-cd-aws-guardrails/TASK-1-COMPLETE.md`

## 🎯 Próximos Passos

Após configurar e testar:

1. **Tarefa 2:** Implementar deploy automático
2. **Tarefa 3:** Adicionar guardrails de segurança
3. **Tarefa 4:** Adicionar guardrails de custo
4. **Tarefa 5:** Adicionar observabilidade

## 💡 Dicas

- Use `PowerUserAccess` apenas para teste inicial
- Crie política customizada para produção
- Teste em branch separada primeiro
- Mantenha ARN da role documentado
- Revise logs do workflow para debug

---

**Tempo estimado:** 15-30 minutos
**Dificuldade:** Intermediária
**Pré-requisitos:** AWS CLI configurado, permissões IAM

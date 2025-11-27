# 🚀 FASE 2 - Execução OIDC (AGORA)

## ⏱️ Tempo Estimado: 10-15 minutos

---

## 📋 Pré-requisitos

✅ AWS CLI configurado e autenticado
✅ Permissões IAM adequadas
✅ Account ID: `207933152643`
✅ Região: `us-east-1`

---

## 🎯 ETAPA 1: Verificar Account ID (30 segundos)

Abra o PowerShell e execute:

```powershell
aws sts get-caller-identity --query Account --output text
```

**Resultado Esperado:** `207933152643`

✅ **Confirme que o Account ID está correto antes de prosseguir**

---

## 🎯 ETAPA 2: Criar OIDC Provider (1 minuto)

Execute este comando:

```powershell
aws iam create-open-id-connect-provider `
  --url https://token.actions.githubusercontent.com `
  --client-id-list sts.amazonaws.com `
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 `
  --region us-east-1
```

**Resultado Esperado:**
```json
{
    "OpenIDConnectProviderArn": "arn:aws:iam::207933152643:oidc-provider/token.actions.githubusercontent.com"
}
```

**⚠️ Se receber erro "EntityAlreadyExists":**
- Isso é OK! O provider já existe
- Anote o ARN: `arn:aws:iam::207933152643:oidc-provider/token.actions.githubusercontent.com`
- Prossiga para a próxima etapa

---

## 🎯 ETAPA 3: Criar Trust Policy (2 minutos)

O arquivo `trust-policy-template.json` já está pronto na raiz do projeto.

**Verifique o conteúdo:**

```powershell
cat trust-policy-template.json
```

**Deve conter:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::207933152643:oidc-provider/token.actions.githubusercontent.com"
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
    }
  ]
}
```

✅ **Confirme que o arquivo está correto**

---

## 🎯 ETAPA 4: Criar IAM Role (2 minutos)

Execute:

```powershell
aws iam create-role `
  --role-name GitHubActionsAlquimistaAICICD `
  --assume-role-policy-document file://trust-policy-template.json `
  --description "Role para GitHub Actions executar CI/CD do AlquimistaAI" `
  --region us-east-1
```

**Resultado Esperado:**
```json
{
    "Role": {
        "RoleName": "GitHubActionsAlquimistaAICICD",
        "Arn": "arn:aws:iam::207933152643:role/GitHubActionsAlquimistaAICICD",
        ...
    }
}
```

**⚠️ Se receber erro "EntityAlreadyExists":**
- A role já existe
- Anote o ARN: `arn:aws:iam::207933152643:role/GitHubActionsAlquimistaAICICD`
- Prossiga para a próxima etapa

---

## 🎯 ETAPA 5: Criar Permissions Policy (2 minutos)

O arquivo `permissions-policy-template.json` já está pronto na raiz do projeto.

**Verifique o conteúdo:**

```powershell
cat permissions-policy-template.json
```

**Deve conter permissões para:**
- CloudFormation
- Lambda
- API Gateway
- S3
- CloudWatch
- IAM (limitado)
- Secrets Manager
- RDS/Aurora
- EC2/VPC
- CloudFront
- WAF

✅ **Confirme que o arquivo está correto**

**Crie a policy:**

```powershell
aws iam create-policy `
  --policy-name GitHubActionsAlquimistaAICICDPolicy `
  --policy-document file://permissions-policy-template.json `
  --description "Permissoes para GitHub Actions CI/CD AlquimistaAI" `
  --region us-east-1
```

**Resultado Esperado:**
```json
{
    "Policy": {
        "PolicyName": "GitHubActionsAlquimistaAICICDPolicy",
        "Arn": "arn:aws:iam::207933152643:policy/GitHubActionsAlquimistaAICICDPolicy",
        ...
    }
}
```

**⚠️ Se receber erro "EntityAlreadyExists":**
- A policy já existe
- Anote o ARN: `arn:aws:iam::207933152643:policy/GitHubActionsAlquimistaAICICDPolicy`
- Prossiga para a próxima etapa

---

## 🎯 ETAPA 6: Anexar Policy à Role (1 minuto)

Execute:

```powershell
aws iam attach-role-policy `
  --role-name GitHubActionsAlquimistaAICICD `
  --policy-arn arn:aws:iam::207933152643:policy/GitHubActionsAlquimistaAICICDPolicy `
  --region us-east-1
```

**Resultado Esperado:** Nenhuma saída (sucesso silencioso)

**Verifique se a policy foi anexada:**

```powershell
aws iam list-attached-role-policies `
  --role-name GitHubActionsAlquimistaAICICD `
  --region us-east-1
```

**Deve mostrar:**
```json
{
    "AttachedPolicies": [
        {
            "PolicyName": "GitHubActionsAlquimistaAICICDPolicy",
            "PolicyArn": "arn:aws:iam::207933152643:policy/GitHubActionsAlquimistaAICICDPolicy"
        }
    ]
}
```

✅ **Confirme que a policy está anexada**

---

## 🎯 ETAPA 7: Configurar GitHub Secrets (2 minutos)

### 7.1 Acesse o GitHub

Abra no navegador:
```
https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/settings/secrets/actions
```

### 7.2 Adicione os Secrets

**Secret 1: AWS_ROLE_ARN**
- Clique em "New repository secret"
- Name: `AWS_ROLE_ARN`
- Value: `arn:aws:iam::207933152643:role/GitHubActionsAlquimistaAICICD`
- Clique em "Add secret"

**Secret 2: AWS_REGION**
- Clique em "New repository secret"
- Name: `AWS_REGION`
- Value: `us-east-1`
- Clique em "Add secret"

### 7.3 Verifique os Secrets

Você deve ver na lista:
- ✅ `AWS_ROLE_ARN`
- ✅ `AWS_REGION`

---

## ✅ VALIDAÇÃO FINAL

Execute este comando para validar a configuração:

```powershell
# Verificar Role
aws iam get-role --role-name GitHubActionsAlquimistaAICICD --region us-east-1

# Verificar Policy anexada
aws iam list-attached-role-policies --role-name GitHubActionsAlquimistaAICICD --region us-east-1

# Verificar OIDC Provider
aws iam list-open-id-connect-providers --region us-east-1
```

---

## 🎉 FASE 2 COMPLETA!

### ✅ Checklist Final

- [ ] OIDC Provider criado
- [ ] IAM Role criada
- [ ] Permissions Policy criada e anexada
- [ ] GitHub Secrets configurados

### 📊 Progresso Geral

```
Fase 1: ████████████████████ 100% ✅ COMPLETA
Fase 2: ████████████████████ 100% ✅ COMPLETA
Fase 3: ░░░░░░░░░░░░░░░░░░░░   0% ⏳ PRÓXIMA
```

---

## 🚀 PRÓXIMOS PASSOS

### AGORA: Testar Workflow (5 minutos)

1. **Criar branch de teste:**
   ```powershell
   git checkout -b test/oidc-setup
   ```

2. **Fazer commit:**
   ```powershell
   git add .
   git commit -m "test: validar configuração OIDC"
   ```

3. **Push:**
   ```powershell
   git push origin test/oidc-setup
   ```

4. **Abrir Pull Request:**
   - Acesse: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/pulls
   - Clique em "New pull request"
   - Base: `main` ← Compare: `test/oidc-setup`
   - Clique em "Create pull request"

5. **Monitorar execução:**
   - Acesse a aba "Actions"
   - Verifique se o workflow está executando
   - Aguarde conclusão

### DEPOIS: Fase 3 - Testes Completos

Após validar o workflow, prosseguiremos para testes completos do pipeline CI/CD.

---

## 🆘 Troubleshooting

### Erro: "Access Denied"
- Verifique se você está autenticado no AWS CLI
- Execute: `aws sts get-caller-identity`

### Erro: "EntityAlreadyExists"
- Recursos já existem (OK!)
- Prossiga para a próxima etapa

### Erro: "Invalid thumbprint"
- Use o thumbprint correto: `6938fd4d98bab03faadb97b34396831e3780aea1`

### GitHub Secrets não aparecem
- Verifique se você tem permissões de admin no repositório
- Tente fazer logout/login no GitHub

---

**Me avise quando completar cada etapa para eu acompanhar seu progresso!** 🚀

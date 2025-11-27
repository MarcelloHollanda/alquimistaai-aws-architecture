# 🚀 Fase 2: Comandos Manuais para Configuração OIDC

**Status**: ✅ PRONTO PARA EXECUÇÃO  
**Tempo Estimado**: 10-15 minutos  
**Pré-requisito**: AWS CLI configurado

---

## 📋 Informações Necessárias

Antes de começar, anote estas informações:

```powershell
# 1. Obter Account ID
$ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
Write-Host "Account ID: $ACCOUNT_ID"

# 2. Definir variáveis
$REPOSITORY = "MarcelloHollanda/alquimistaai-aws-architecture"
$ROLE_NAME = "GitHubActionsAlquimistaAICICD"
$POLICY_NAME = "GitHubActionsAlquimistaAIPolicy"
```

---

## 🔧 Passo 1: Criar Identity Provider OIDC

```powershell
# Verificar se já existe
aws iam list-open-id-connect-providers

# Se não existir, criar
aws iam create-open-id-connect-provider `
    --url "https://token.actions.githubusercontent.com" `
    --client-id-list "sts.amazonaws.com" `
    --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1"
```

**Resultado Esperado**: Identity Provider criado ou mensagem que já existe

---

## 🔧 Passo 2: Criar Trust Policy

Crie um arquivo `trust-policy.json` com o seguinte conteúdo (substitua `ACCOUNT_ID` e `REPOSITORY`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
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
          "token.actions.githubusercontent.com:sub": "repo:REPOSITORY:*"
        }
      }
    }
  ]
}
```

**Exemplo com valores reais**:
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

---

## 🔧 Passo 3: Criar IAM Role

```powershell
# Criar role
aws iam create-role `
    --role-name GitHubActionsAlquimistaAICICD `
    --assume-role-policy-document file://trust-policy.json `
    --description "Role para GitHub Actions executar deploy do AlquimistaAI"

# Anotar o ARN da role
$ROLE_ARN = "arn:aws:iam::$ACCOUNT_ID:role/GitHubActionsAlquimistaAICICD"
Write-Host "Role ARN: $ROLE_ARN"
```

**Resultado Esperado**: Role criada com sucesso

---

## 🔧 Passo 4: Criar Permissions Policy

Crie um arquivo `permissions-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "s3:*",
        "lambda:*",
        "apigateway:*",
        "iam:PassRole",
        "iam:GetRole",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRolePolicy",
        "iam:ListRolePolicies",
        "iam:ListAttachedRolePolicies",
        "rds:*",
        "ec2:*",
        "logs:*",
        "cloudwatch:*",
        "sns:*",
        "sqs:*",
        "events:*",
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:PutParameter",
        "kms:Decrypt",
        "kms:DescribeKey",
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
        "wafv2:*",
        "cloudtrail:*",
        "guardduty:*",
        "budgets:*",
        "ce:*"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 🔧 Passo 5: Criar e Anexar Policy

```powershell
# Criar policy
aws iam create-policy `
    --policy-name GitHubActionsAlquimistaAIPolicy `
    --policy-document file://permissions-policy.json `
    --description "Permissoes para GitHub Actions fazer deploy do AlquimistaAI"

# Anotar o ARN da policy
$POLICY_ARN = "arn:aws:iam::$ACCOUNT_ID:policy/GitHubActionsAlquimistaAIPolicy"
Write-Host "Policy ARN: $POLICY_ARN"

# Anexar policy à role
aws iam attach-role-policy `
    --role-name GitHubActionsAlquimistaAICICD `
    --policy-arn $POLICY_ARN
```

**Resultado Esperado**: Policy criada e anexada com sucesso

---

## 🔧 Passo 6: Validar Configuração

```powershell
# Verificar Identity Provider
aws iam list-open-id-connect-providers

# Verificar Role
aws iam get-role --role-name GitHubActionsAlquimistaAICICD

# Verificar políticas anexadas
aws iam list-attached-role-policies --role-name GitHubActionsAlquimistaAICICD
```

**Resultado Esperado**: Todos os recursos criados e configurados

---

## 🔧 Passo 7: Configurar GitHub Secrets

### 7.1. Anotar os ARNs

```powershell
# Exibir ARNs para copiar
Write-Host "`n=== ARNs PARA GITHUB SECRETS ===" -ForegroundColor Green
Write-Host "Role ARN: arn:aws:iam::$ACCOUNT_ID:role/GitHubActionsAlquimistaAICICD" -ForegroundColor Cyan
Write-Host "Region: us-east-1" -ForegroundColor Cyan
```

### 7.2. Adicionar Secrets no GitHub

1. **Acesse**: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/settings/secrets/actions

2. **Clique em "New repository secret"**

3. **Adicione o primeiro secret**:
   - Nome: `AWS_ROLE_ARN`
   - Valor: `arn:aws:iam::207933152643:role/GitHubActionsAlquimistaAICICD`
   - Clique em "Add secret"

4. **Adicione o segundo secret**:
   - Nome: `AWS_REGION`
   - Valor: `us-east-1`
   - Clique em "Add secret"

---

## ✅ Checklist de Validação

Marque cada item conforme completa:

- [ ] Identity Provider OIDC criado
- [ ] Trust Policy criada
- [ ] IAM Role criada
- [ ] Permissions Policy criada
- [ ] Policy anexada à Role
- [ ] GitHub Secret `AWS_ROLE_ARN` configurado
- [ ] GitHub Secret `AWS_REGION` configurado
- [ ] Validação executada com sucesso

---

## 🎯 Próximo Passo

Após completar todos os passos acima:

**Fase 3**: Testar o Workflow

1. Criar uma branch de teste
2. Fazer um commit
3. Abrir Pull Request
4. Monitorar execução do workflow

**Documentação**: `.kiro/specs/ci-cd-aws-guardrails/TASK-8-TESTING-GUIDE.md`

---

## 🚨 Troubleshooting

### Erro: "EntityAlreadyExists"
**Solução**: O recurso já existe. Pule para o próximo passo.

### Erro: "AccessDenied"
**Solução**: Verifique se seu usuário AWS tem permissões IAM adequadas.

### Erro: "InvalidInput"
**Solução**: Verifique se substituiu corretamente `ACCOUNT_ID` e `REPOSITORY` nos arquivos JSON.

---

**Status**: ✅ PRONTO PARA EXECUÇÃO  
**Tempo Total**: 10-15 minutos  
**Confiança**: Alta

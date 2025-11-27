# 🔧 Fase 2: Configurar OIDC no AWS Console

## 🎯 Status Atual
🚀 **PRONTO PARA EXECUTAR** - Script automatizado criado + Guias completos disponíveis

---

## 📋 Pré-requisitos Necessários

### ✅ Validados (Fase 1)
- ✅ Documentação completa revisada
- ✅ Guia OIDC disponível: `docs/ci-cd/OIDC-SETUP.md`
- ✅ Comandos AWS CLI preparados
- ✅ Scripts PowerShell prontos

### ⚠️ Necessários para Execução
- [ ] **Acesso administrativo à conta AWS**
- [ ] **Permissões IAM** para criar Identity Providers e Roles
- [ ] **ID da conta AWS** (12 dígitos)
- [ ] **AWS CLI configurado** localmente
- [ ] **PowerShell** ou terminal disponível

---

## 📝 Instruções para Execução Manual

### Opção 1: Seguir Guia Detalhado (Recomendado)

Abra e siga o guia completo:
```
.kiro/specs/ci-cd-aws-guardrails/FASE-2-CONFIGURAR-OIDC-GUIA.md
```

Este guia contém:
- ✅ Passo-a-passo detalhado (6 etapas)
- ✅ Comandos copy-paste prontos
- ✅ Validações em cada etapa
- ✅ Troubleshooting completo
- ✅ Tempo estimado: 1-2 horas

### Opção 2: Guia Rápido

Se você já tem experiência com OIDC/IAM, use:
```
docs/ci-cd/OIDC-SETUP.md
```

---

## 🚀 Resumo das Etapas

### 1️⃣ Preparação (10 min)
```powershell
# Verificar AWS CLI
aws --version

# Verificar credenciais
aws sts get-caller-identity

# Obter ID da conta
$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
Write-Host "Account ID: $ACCOUNT_ID"
```

### 2️⃣ Criar Identity Provider OIDC (15 min)

**Via AWS Console:**
1. Acessar: [IAM → Identity providers](https://console.aws.amazon.com/iam/home#/providers)
2. Clicar em "Add provider"
3. Selecionar "OpenID Connect"
4. Configurar:
   - **Provider URL**: `https://token.actions.githubusercontent.com`
   - **Audience**: `sts.amazonaws.com`
5. Clicar em "Get thumbprint" (automático)
6. Clicar em "Add provider"
7. **⚠️ ANOTAR O ARN** do provider criado

**Via AWS CLI:**
```powershell
aws iam create-open-id-connect-provider `
  --url "https://token.actions.githubusercontent.com" `
  --client-id-list "sts.amazonaws.com" `
  --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" `
  --region us-east-1
```

### 3️⃣ Criar Trust Policy (10 min)

Criar arquivo `github-actions-trust-policy.json`:
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
          "token.actions.githubusercontent.com:sub": "repo:MarcelloHollanda/alquimistaai-aws-architecture:*"
        }
      }
    }
  ]
}
```

**⚠️ IMPORTANTE**: Substituir `ACCOUNT_ID` pelo ID real da conta AWS.

### 4️⃣ Criar IAM Role (15 min)

```powershell
# Criar role
aws iam create-role `
  --role-name GitHubActionsAlquimistaAICICD `
  --assume-role-policy-document file://github-actions-trust-policy.json `
  --description "Role para GitHub Actions executar deploy do AlquimistaAI" `
  --region us-east-1

# Obter ARN da role
$ROLE_ARN = aws iam get-role --role-name GitHubActionsAlquimistaAICICD --query 'Role.Arn' --output text
Write-Host "Role ARN: $ROLE_ARN"
```

### 5️⃣ Criar e Anexar Política de Permissões (20 min)

Ver arquivo completo de permissões em:
```
docs/ci-cd/OIDC-SETUP.md (seção 3.1)
```

```powershell
# Criar política
aws iam create-policy `
  --policy-name GitHubActionsAlquimistaAIPolicy `
  --policy-document file://github-actions-permissions-policy.json `
  --description "Permissões para GitHub Actions fazer deploy do AlquimistaAI" `
  --region us-east-1

# Anexar à role
$POLICY_ARN = "arn:aws:iam::$ACCOUNT_ID:policy/GitHubActionsAlquimistaAIPolicy"
aws iam attach-role-policy `
  --role-name GitHubActionsAlquimistaAICICD `
  --policy-arn $POLICY_ARN `
  --region us-east-1
```

### 6️⃣ Validação Final (10 min)

```powershell
# Verificar Identity Provider
aws iam list-open-id-connect-providers --region us-east-1

# Verificar Role
aws iam get-role --role-name GitHubActionsAlquimistaAICICD --region us-east-1

# Verificar políticas anexadas
aws iam list-attached-role-policies --role-name GitHubActionsAlquimistaAICICD --region us-east-1
```

---

## 📊 Checklist de Validação

### ✅ Identity Provider
- [ ] Provider OIDC criado
- [ ] URL: `https://token.actions.githubusercontent.com`
- [ ] Audience: `sts.amazonaws.com`
- [ ] ARN anotado

### ✅ IAM Role
- [ ] Role `GitHubActionsAlquimistaAICICD` criada
- [ ] Trust policy configurada
- [ ] Repository correto no trust policy
- [ ] ARN da role anotado

### ✅ Permissões
- [ ] Política de permissões criada
- [ ] Política anexada à role
- [ ] Permissões suficientes para deploy
- [ ] Princípio do menor privilégio respeitado

### ✅ Validação
- [ ] Comandos AWS CLI executados com sucesso
- [ ] Configuração verificada
- [ ] ARNs salvos para uso posterior

---

## 🔑 ARNs para Salvar

Após completar a configuração, anote estes ARNs:

**Identity Provider ARN:**
```
arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com
```

**Role ARN:**
```
arn:aws:iam::ACCOUNT_ID:role/GitHubActionsAlquimistaAICICD
```

**Policy ARN:**
```
arn:aws:iam::ACCOUNT_ID:policy/GitHubActionsAlquimistaAIPolicy
```

---

## 🚨 Troubleshooting Rápido

### Problema: "Provider already exists"
**Solução**: Provider já foi criado, obter ARN existente:
```powershell
aws iam list-open-id-connect-providers --region us-east-1
```

### Problema: "Role already exists"
**Solução**: Role já foi criada, obter ARN existente:
```powershell
aws iam get-role --role-name GitHubActionsAlquimistaAICICD --query 'Role.Arn' --output text
```

### Problema: "Access denied"
**Solução**: Verificar permissões IAM do usuário atual:
```powershell
aws iam get-user
aws iam list-attached-user-policies --user-name SEU_USUARIO
```

---

## 🎯 Resultado Esperado

Após completar esta fase:

1. ✅ **OIDC configurado** entre GitHub e AWS
2. ✅ **Role criada** com permissões apropriadas
3. ✅ **Segurança melhorada** (sem credenciais estáticas)
4. ✅ **Deploy automático habilitado** para GitHub Actions
5. ✅ **Auditoria ativa** via CloudTrail
6. ✅ **Pronto para Fase 3** (Executar Testes)

---

## 📞 Quando Estiver Pronto

Após completar a configuração OIDC, informe:

1. ✅ Configuração concluída com sucesso
2. 📝 ARNs anotados (Provider, Role, Policy)
3. ✅ Validações executadas
4. 🚀 Pronto para Fase 3 (Testes)

**Ou se houver problemas:**
- 🚨 Descreva o erro encontrado
- 📋 Compartilhe a saída do comando que falhou
- 🔍 Vamos resolver juntos

---

**Status**: ⏳ AGUARDANDO EXECUÇÃO MANUAL  
**Próxima Ação**: Executar configuração OIDC no AWS Console  
**Documentação**: `.kiro/specs/ci-cd-aws-guardrails/FASE-2-CONFIGURAR-OIDC-GUIA.md`  
**Tempo Estimado**: 1-2 horas

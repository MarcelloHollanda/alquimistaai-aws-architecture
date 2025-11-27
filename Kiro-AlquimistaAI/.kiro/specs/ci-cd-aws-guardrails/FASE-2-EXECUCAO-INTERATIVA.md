# 🚀 Fase 2: Execução Interativa - Configurar OIDC

**Status**: 🔄 EM EXECUÇÃO  
**Início**: Agora  
**Tempo Estimado**: 1-2 horas

---

## 📋 Pré-Requisitos - Verificação

Antes de começar, vamos verificar se você tem tudo necessário:

### ✅ Checklist de Pré-Requisitos

- [ ] **Acesso AWS Console** - Você consegue acessar https://console.aws.amazon.com/?
- [ ] **Permissões IAM** - Você tem permissões para criar Identity Providers e Roles?
- [ ] **AWS CLI Instalado** - Execute: `aws --version`
- [ ] **AWS CLI Configurado** - Execute: `aws sts get-caller-identity`
- [ ] **PowerShell Disponível** - Você está no Windows com PowerShell?
- [ ] **ID da Conta AWS** - Você sabe o ID da sua conta (12 dígitos)?

---

## 🎯 Etapa 1: Preparação (10 min)

### 1.1 Verificar AWS CLI

Execute no PowerShell:

```powershell
# Verificar versão do AWS CLI
aws --version

# Verificar credenciais configuradas
aws sts get-caller-identity

# Obter e salvar o ID da conta
$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
Write-Host "✅ Account ID: $ACCOUNT_ID"

# Salvar em variável de ambiente para uso posterior
$env:AWS_ACCOUNT_ID = $ACCOUNT_ID
```

**Resultado Esperado**:
```
aws-cli/2.x.x Python/3.x.x Windows/10 exe/AMD64
{
    "UserId": "AIDAXXXXXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/seu-usuario"
}
✅ Account ID: 123456789012
```

### 1.2 Criar Diretório de Trabalho

```powershell
# Criar diretório para arquivos temporários
New-Item -ItemType Directory -Force -Path "oidc-setup"
Set-Location "oidc-setup"

Write-Host "✅ Diretório de trabalho criado: $(Get-Location)"
```

### 1.3 Verificar Região AWS

```powershell
# Verificar região configurada
$AWS_REGION = aws configure get region
if ([string]::IsNullOrEmpty($AWS_REGION)) {
    $AWS_REGION = "us-east-1"
    Write-Host "⚠️ Região não configurada, usando padrão: us-east-1"
} else {
    Write-Host "✅ Região AWS: $AWS_REGION"
}

$env:AWS_DEFAULT_REGION = $AWS_REGION
```

**✅ Checkpoint 1**: Você completou a preparação?
- [ ] AWS CLI funcionando
- [ ] Account ID obtido
- [ ] Diretório criado
- [ ] Região verificada

---

## 🎯 Etapa 2: Criar Identity Provider OIDC (15 min)

### Opção A: Via AWS Console (Recomendado para Primeira Vez)

#### 2.1 Acessar Console IAM

1. Abra: https://console.aws.amazon.com/iam/home#/providers
2. Faça login com suas credenciais AWS
3. Você deve ver a página "Identity providers"

#### 2.2 Criar Provider

1. Clique no botão **"Add provider"** (laranja, canto superior direito)
2. Selecione **"OpenID Connect"**
3. Preencha os campos:
   - **Provider URL**: `https://token.actions.githubusercontent.com`
   - **Audience**: `sts.amazonaws.com`
4. Clique em **"Get thumbprint"** (deve preencher automaticamente)
5. Clique em **"Add provider"**

#### 2.3 Anotar ARN do Provider

Após criar, você verá uma tela de confirmação com o ARN:

```
arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com
```

**⚠️ IMPORTANTE**: Copie e salve este ARN!

Execute no PowerShell para salvar:

```powershell
# Cole o ARN que você copiou do console
$OIDC_PROVIDER_ARN = "arn:aws:iam::$env:AWS_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
Write-Host "✅ OIDC Provider ARN salvo: $OIDC_PROVIDER_ARN"

# Salvar em arquivo para referência
$OIDC_PROVIDER_ARN | Out-File -FilePath "oidc-provider-arn.txt" -Encoding UTF8
```

### Opção B: Via AWS CLI (Alternativa)

Se preferir usar CLI:

```powershell
# Criar Identity Provider via CLI
aws iam create-open-id-connect-provider `
  --url "https://token.actions.githubusercontent.com" `
  --client-id-list "sts.amazonaws.com" `
  --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1"

# Verificar criação
aws iam list-open-id-connect-providers

# Salvar ARN
$OIDC_PROVIDER_ARN = "arn:aws:iam::$env:AWS_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
Write-Host "✅ OIDC Provider criado: $OIDC_PROVIDER_ARN"
```

### 2.4 Validar Criação

```powershell
# Listar providers para confirmar
aws iam list-open-id-connect-providers

# Obter detalhes do provider
aws iam get-open-id-connect-provider `
  --open-id-connect-provider-arn $OIDC_PROVIDER_ARN
```

**Resultado Esperado**:
```json
{
    "Url": "https://token.actions.githubusercontent.com",
    "ClientIDList": [
        "sts.amazonaws.com"
    ],
    "ThumbprintList": [
        "6938fd4d98bab03faadb97b34396831e3780aea1"
    ]
}
```

**✅ Checkpoint 2**: Provider OIDC criado?
- [ ] Provider criado com sucesso
- [ ] ARN anotado e salvo
- [ ] Validação executada
- [ ] Sem erros

---

## 🎯 Etapa 3: Criar Trust Policy (10 min)

### 3.1 Criar Arquivo de Trust Policy

Execute no PowerShell:

```powershell
# Criar trust policy com substituição automática do Account ID
$trustPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::$env:AWS_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
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
"@

# Salvar em arquivo
$trustPolicy | Out-File -FilePath "github-actions-trust-policy.json" -Encoding UTF8

Write-Host "✅ Trust policy criada: github-actions-trust-policy.json"
Write-Host "📄 Conteúdo:"
Get-Content "github-actions-trust-policy.json"
```

### 3.2 Validar JSON

```powershell
# Validar se o JSON está correto
try {
    $json = Get-Content "github-actions-trust-policy.json" | ConvertFrom-Json
    Write-Host "✅ JSON válido!"
} catch {
    Write-Host "❌ Erro no JSON: $_"
}
```

**✅ Checkpoint 3**: Trust Policy criada?
- [ ] Arquivo criado
- [ ] Account ID substituído corretamente
- [ ] JSON válido
- [ ] Repository correto no policy

---

## 🎯 Etapa 4: Criar IAM Role (15 min)

### 4.1 Criar Role

```powershell
# Criar IAM Role
aws iam create-role `
  --role-name GitHubActionsAlquimistaAICICD `
  --assume-role-policy-document file://github-actions-trust-policy.json `
  --description "Role para GitHub Actions executar deploy do AlquimistaAI"

Write-Host "✅ Role criada: GitHubActionsAlquimistaAICICD"
```

### 4.2 Obter ARN da Role

```powershell
# Obter ARN da role
$ROLE_ARN = aws iam get-role `
  --role-name GitHubActionsAlquimistaAICICD `
  --query 'Role.Arn' `
  --output text

Write-Host "✅ Role ARN: $ROLE_ARN"

# Salvar em arquivo
$ROLE_ARN | Out-File -FilePath "role-arn.txt" -Encoding UTF8

# Salvar em variável de ambiente
$env:GITHUB_ROLE_ARN = $ROLE_ARN
```

### 4.3 Verificar Role

```powershell
# Verificar detalhes da role
aws iam get-role --role-name GitHubActionsAlquimistaAICICD

# Verificar trust policy
aws iam get-role `
  --role-name GitHubActionsAlquimistaAICICD `
  --query 'Role.AssumeRolePolicyDocument'
```

**✅ Checkpoint 4**: Role criada?
- [ ] Role criada com sucesso
- [ ] ARN obtido e salvo
- [ ] Trust policy verificada
- [ ] Sem erros

---

## 🎯 Etapa 5: Criar Política de Permissões (20 min)

### 5.1 Criar Arquivo de Permissões

```powershell
# Criar política de permissões
$permissionsPolicy = @"
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
"@

# Salvar em arquivo
$permissionsPolicy | Out-File -FilePath "github-actions-permissions-policy.json" -Encoding UTF8

Write-Host "✅ Permissions policy criada: github-actions-permissions-policy.json"
```

### 5.2 Criar Política no IAM

```powershell
# Criar política
aws iam create-policy `
  --policy-name GitHubActionsAlquimistaAIPolicy `
  --policy-document file://github-actions-permissions-policy.json `
  --description "Permissões para GitHub Actions fazer deploy do AlquimistaAI"

Write-Host "✅ Policy criada: GitHubActionsAlquimistaAIPolicy"
```

### 5.3 Obter ARN da Política

```powershell
# Construir ARN da política
$POLICY_ARN = "arn:aws:iam::$env:AWS_ACCOUNT_ID:policy/GitHubActionsAlquimistaAIPolicy"

Write-Host "✅ Policy ARN: $POLICY_ARN"

# Salvar em arquivo
$POLICY_ARN | Out-File -FilePath "policy-arn.txt" -Encoding UTF8
```

### 5.4 Anexar Política à Role

```powershell
# Anexar política à role
aws iam attach-role-policy `
  --role-name GitHubActionsAlquimistaAICICD `
  --policy-arn $POLICY_ARN

Write-Host "✅ Policy anexada à role com sucesso!"
```

### 5.5 Verificar Anexação

```powershell
# Listar políticas anexadas à role
aws iam list-attached-role-policies `
  --role-name GitHubActionsAlquimistaAICICD

Write-Host "✅ Verificação completa!"
```

**✅ Checkpoint 5**: Política criada e anexada?
- [ ] Política criada
- [ ] ARN obtido
- [ ] Política anexada à role
- [ ] Verificação executada

---

## 🎯 Etapa 6: Validação Final (10 min)

### 6.1 Verificar Todos os Componentes

```powershell
Write-Host "`n=== VALIDAÇÃO FINAL ===" -ForegroundColor Green

# 1. Verificar Identity Provider
Write-Host "`n1. Identity Provider OIDC:" -ForegroundColor Yellow
aws iam list-open-id-connect-providers

# 2. Verificar Role
Write-Host "`n2. IAM Role:" -ForegroundColor Yellow
aws iam get-role --role-name GitHubActionsAlquimistaAICICD --query 'Role.Arn'

# 3. Verificar Políticas Anexadas
Write-Host "`n3. Políticas Anexadas:" -ForegroundColor Yellow
aws iam list-attached-role-policies --role-name GitHubActionsAlquimistaAICICD

# 4. Verificar Trust Policy
Write-Host "`n4. Trust Policy:" -ForegroundColor Yellow
aws iam get-role `
  --role-name GitHubActionsAlquimistaAICICD `
  --query 'Role.AssumeRolePolicyDocument'

Write-Host "`n✅ Validação completa!" -ForegroundColor Green
```

### 6.2 Criar Resumo de ARNs

```powershell
# Criar arquivo de resumo com todos os ARNs
$summary = @"
=== RESUMO DA CONFIGURAÇÃO OIDC ===

Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Account ID: $env:AWS_ACCOUNT_ID
Região: $env:AWS_DEFAULT_REGION

=== ARNs CRIADOS ===

1. Identity Provider ARN:
$OIDC_PROVIDER_ARN

2. IAM Role ARN:
$env:GITHUB_ROLE_ARN

3. IAM Policy ARN:
$POLICY_ARN

=== PRÓXIMOS PASSOS ===

1. Adicionar o Role ARN aos GitHub Secrets:
   - Nome do secret: AWS_ROLE_ARN
   - Valor: $env:GITHUB_ROLE_ARN

2. Configurar região nos GitHub Secrets:
   - Nome do secret: AWS_REGION
   - Valor: $env:AWS_DEFAULT_REGION

3. Testar o workflow GitHub Actions

=== COMANDOS DE VALIDAÇÃO ===

# Verificar provider
aws iam list-open-id-connect-providers

# Verificar role
aws iam get-role --role-name GitHubActionsAlquimistaAICICD

# Verificar políticas
aws iam list-attached-role-policies --role-name GitHubActionsAlquimistaAICICD

"@

# Salvar resumo
$summary | Out-File -FilePath "oidc-setup-summary.txt" -Encoding UTF8

Write-Host "`n✅ Resumo salvo em: oidc-setup-summary.txt" -ForegroundColor Green
Write-Host "`n📄 Conteúdo do resumo:" -ForegroundColor Cyan
Write-Host $summary
```

### 6.3 Teste de Sintaxe (Opcional)

```powershell
# Tentar simular assume role (vai falhar por falta de token, mas valida sintaxe)
Write-Host "`n=== TESTE DE SINTAXE ===" -ForegroundColor Yellow
Write-Host "Tentando assume role (esperado falhar por falta de token)..." -ForegroundColor Gray

try {
    aws sts assume-role-with-web-identity `
      --role-arn $env:GITHUB_ROLE_ARN `
      --role-session-name "test-session" `
      --web-identity-token "dummy-token" 2>&1
} catch {
    Write-Host "⚠️ Erro esperado (token inválido): $_" -ForegroundColor Gray
}

Write-Host "✅ Se o erro foi sobre token inválido, a configuração está correta!" -ForegroundColor Green
```

**✅ Checkpoint 6**: Validação completa?
- [ ] Todos os componentes verificados
- [ ] ARNs salvos em arquivo
- [ ] Resumo criado
- [ ] Sem erros críticos

---

## 📊 Resumo Final

### ✅ O Que Foi Criado

1. **Identity Provider OIDC**
   - URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`
   - ARN: Salvo em `oidc-provider-arn.txt`

2. **IAM Role**
   - Nome: `GitHubActionsAlquimistaAICICD`
   - Trust Policy: Configurada para GitHub Actions
   - ARN: Salvo em `role-arn.txt`

3. **IAM Policy**
   - Nome: `GitHubActionsAlquimistaAIPolicy`
   - Permissões: CloudFormation, Lambda, S3, etc.
   - ARN: Salvo em `policy-arn.txt`

### 📁 Arquivos Criados

```
oidc-setup/
├── github-actions-trust-policy.json
├── github-actions-permissions-policy.json
├── oidc-provider-arn.txt
├── role-arn.txt
├── policy-arn.txt
└── oidc-setup-summary.txt
```

### 🎯 Próximos Passos

1. **Configurar GitHub Secrets** (Fase 3)
2. **Testar Workflow** (Fase 3)
3. **Deploy em Dev** (Fase 3)
4. **Deploy em Prod** (Fase 4)

---

## 🚨 Troubleshooting

### Problema: "EntityAlreadyExists"

**Causa**: Provider, Role ou Policy já existe

**Solução**:
```powershell
# Listar providers existentes
aws iam list-open-id-connect-providers

# Listar roles existentes
aws iam list-roles --query 'Roles[?RoleName==`GitHubActionsAlquimistaAICICD`]'

# Se existir, obter ARN
$ROLE_ARN = aws iam get-role --role-name GitHubActionsAlquimistaAICICD --query 'Role.Arn' --output text
```

### Problema: "AccessDenied"

**Causa**: Usuário não tem permissões IAM

**Solução**:
```powershell
# Verificar permissões do usuário
aws iam get-user
aws iam list-attached-user-policies --user-name SEU_USUARIO

# Solicitar permissões ao administrador AWS
```

### Problema: "InvalidInput"

**Causa**: JSON malformado

**Solução**:
```powershell
# Validar JSON
Get-Content "github-actions-trust-policy.json" | ConvertFrom-Json

# Recriar arquivo se necessário
```

---

## ✅ Checklist Final

- [ ] Identity Provider OIDC criado
- [ ] IAM Role criada
- [ ] Trust Policy configurada
- [ ] IAM Policy criada
- [ ] Policy anexada à Role
- [ ] Todos os ARNs salvos
- [ ] Resumo criado
- [ ] Validação executada
- [ ] Sem erros críticos
- [ ] Pronto para Fase 3

---

**Status**: ✅ FASE 2 COMPLETA  
**Próxima Fase**: Fase 3 - Configurar GitHub Secrets e Testar  
**Tempo Gasto**: ___ minutos  
**Confiança**: Alta

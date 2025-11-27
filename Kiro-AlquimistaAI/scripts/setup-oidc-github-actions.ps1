# Script de Configuração OIDC para GitHub Actions
# Projeto: AlquimistaAI AWS Architecture
# Descrição: Configura autenticação federada entre GitHub Actions e AWS

param(
    [Parameter(Mandatory=$false)]
    [string]$Repository = "MarcelloHollanda/alquimistaai-aws-architecture",
    
    [Parameter(Mandatory=$false)]
    [string]$RoleName = "GitHubActionsAlquimistaAICICD",
    
    [Parameter(Mandatory=$false)]
    [string]$PolicyName = "GitHubActionsAlquimistaAIPolicy",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipValidation
)

# Cores para output
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

# Função para exibir mensagens
function Write-Step {
    param([string]$Message, [string]$Color = $InfoColor)
    Write-Host "`n=== $Message ===" -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $SuccessColor
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $ErrorColor
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $InfoColor
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $WarningColor
}

# Início do script
Write-Step "Configuração OIDC para GitHub Actions" "Cyan"
Write-Info "Repositório: $Repository"
Write-Info "Role: $RoleName"
Write-Info "Policy: $PolicyName"

# Etapa 1: Verificar pré-requisitos
Write-Step "Etapa 1: Verificando Pré-requisitos"

# Verificar AWS CLI
try {
    $awsVersion = aws --version 2>&1
    Write-Success "AWS CLI instalado: $awsVersion"
} catch {
    Write-Error-Custom "AWS CLI não encontrado. Instale: https://aws.amazon.com/cli/"
    exit 1
}

# Verificar credenciais AWS
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    $ACCOUNT_ID = $identity.Account
    $USER_ARN = $identity.Arn
    
    Write-Success "Credenciais AWS configuradas"
    Write-Info "Account ID: $ACCOUNT_ID"
    Write-Info "User: $USER_ARN"
    
    # Salvar em variáveis de ambiente
    $env:AWS_ACCOUNT_ID = $ACCOUNT_ID
} catch {
    Write-Error-Custom "Credenciais AWS não configuradas. Execute: aws configure"
    exit 1
}

# Verificar região
$AWS_REGION = aws configure get region
if ([string]::IsNullOrEmpty($AWS_REGION)) {
    $AWS_REGION = "us-east-1"
    Write-Warning-Custom "Região não configurada, usando padrão: us-east-1"
} else {
    Write-Success "Região AWS: $AWS_REGION"
}
$env:AWS_DEFAULT_REGION = $AWS_REGION

# Criar diretório de trabalho
$workDir = "oidc-setup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Force -Path $workDir | Out-Null
Set-Location $workDir
Write-Success "Diretório de trabalho criado: $(Get-Location)"

# Etapa 2: Criar Identity Provider OIDC
Write-Step "Etapa 2: Criando Identity Provider OIDC"

$OIDC_PROVIDER_ARN = "arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"

# Verificar se já existe
$existingProviders = aws iam list-open-id-connect-providers --output json | ConvertFrom-Json
$providerExists = $existingProviders.OpenIDConnectProviderList | Where-Object { $_.Arn -eq $OIDC_PROVIDER_ARN }

if ($providerExists) {
    Write-Warning-Custom "Identity Provider já existe: $OIDC_PROVIDER_ARN"
    Write-Info "Pulando criação..."
} else {
    try {
        aws iam create-open-id-connect-provider `
            --url "https://token.actions.githubusercontent.com" `
            --client-id-list "sts.amazonaws.com" `
            --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" `
            --output json | Out-Null
        
        Write-Success "Identity Provider criado: $OIDC_PROVIDER_ARN"
    } catch {
        Write-Error-Custom "Erro ao criar Identity Provider: $_"
        exit 1
    }
}

# Salvar ARN
$OIDC_PROVIDER_ARN | Out-File -FilePath "oidc-provider-arn.txt" -Encoding UTF8

# Etapa 3: Criar Trust Policy
Write-Step "Etapa 3: Criando Trust Policy"

$trustPolicyTemplate = @'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "OIDC_PROVIDER_ARN_PLACEHOLDER"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:REPOSITORY_PLACEHOLDER:*"
        }
      }
    }
  ]
}
'@

$trustPolicy = $trustPolicyTemplate.Replace("OIDC_PROVIDER_ARN_PLACEHOLDER", $OIDC_PROVIDER_ARN).Replace("REPOSITORY_PLACEHOLDER", $Repository)
$trustPolicy | Out-File -FilePath "github-actions-trust-policy.json" -Encoding UTF8
Write-Success "Trust policy criada: github-actions-trust-policy.json"

# Validar JSON
try {
    $trustPolicy | ConvertFrom-Json | Out-Null
    Write-Success "Trust policy JSON válido"
} catch {
    Write-Error-Custom "Trust policy JSON inválido: $_"
    exit 1
}

# Etapa 4: Criar IAM Role
Write-Step "Etapa 4: Criando IAM Role"

$ROLE_ARN = "arn:aws:iam::${ACCOUNT_ID}:role/${RoleName}"

# Verificar se role já existe
try {
    $existingRole = aws iam get-role --role-name $RoleName --output json 2>&1 | ConvertFrom-Json
    Write-Warning-Custom "Role já existe: $ROLE_ARN"
    Write-Info "Atualizando trust policy..."
    
    # Atualizar trust policy
    aws iam update-assume-role-policy `
        --role-name $RoleName `
        --policy-document file://github-actions-trust-policy.json
    
    Write-Success "Trust policy atualizada"
} catch {
    # Role não existe, criar
    try {
        aws iam create-role `
            --role-name $RoleName `
            --assume-role-policy-document file://github-actions-trust-policy.json `
            --description "Role para GitHub Actions executar deploy do AlquimistaAI" `
            --output json | Out-Null
        
        Write-Success "Role criada: $ROLE_ARN"
    } catch {
        Write-Error-Custom "Erro ao criar role: $_"
        exit 1
    }
}

# Salvar ARN
$ROLE_ARN | Out-File -FilePath "role-arn.txt" -Encoding UTF8
$env:GITHUB_ROLE_ARN = $ROLE_ARN

# Etapa 5: Criar Política de Permissões
Write-Step "Etapa 5: Criando Política de Permissões"

$permissionsPolicy = @'
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
'@

$permissionsPolicy | Out-File -FilePath "github-actions-permissions-policy.json" -Encoding UTF8
Write-Success "Permissions policy criada: github-actions-permissions-policy.json"

$POLICY_ARN = "arn:aws:iam::${ACCOUNT_ID}:policy/${PolicyName}"

# Verificar se policy já existe
try {
    $existingPolicy = aws iam get-policy --policy-arn $POLICY_ARN --output json 2>&1 | ConvertFrom-Json
    Write-Warning-Custom "Policy já existe: $POLICY_ARN"
    Write-Info "Usando policy existente..."
} catch {
    # Policy não existe, criar
    try {
        aws iam create-policy `
            --policy-name $PolicyName `
            --policy-document file://github-actions-permissions-policy.json `
            --description "Permissões para GitHub Actions fazer deploy do AlquimistaAI" `
            --output json | Out-Null
        
        Write-Success "Policy criada: $POLICY_ARN"
    } catch {
        Write-Error-Custom "Erro ao criar policy: $_"
        exit 1
    }
}

# Salvar ARN
$POLICY_ARN | Out-File -FilePath "policy-arn.txt" -Encoding UTF8

# Etapa 6: Anexar Política à Role
Write-Step "Etapa 6: Anexando Política à Role"

try {
    aws iam attach-role-policy `
        --role-name $RoleName `
        --policy-arn $POLICY_ARN 2>&1 | Out-Null
    
    Write-Success "Policy anexada à role com sucesso"
} catch {
    if ($_ -match "EntityAlreadyExists") {
        Write-Warning-Custom "Policy já estava anexada à role"
    } else {
        Write-Error-Custom "Erro ao anexar policy: $_"
        exit 1
    }
}

# Etapa 7: Validação
if (-not $SkipValidation) {
    Write-Step "Etapa 7: Validando Configuração"
    
    # Verificar provider
    Write-Info "Verificando Identity Provider..."
    $providers = aws iam list-open-id-connect-providers --output json | ConvertFrom-Json
    if ($providers.OpenIDConnectProviderList | Where-Object { $_.Arn -eq $OIDC_PROVIDER_ARN }) {
        Write-Success "Identity Provider OK"
    } else {
        Write-Error-Custom "Identity Provider não encontrado"
    }
    
    # Verificar role
    Write-Info "Verificando Role..."
    try {
        $role = aws iam get-role --role-name $RoleName --output json | ConvertFrom-Json
        Write-Success "Role OK: $($role.Role.Arn)"
    } catch {
        Write-Error-Custom "Role não encontrada"
    }
    
    # Verificar políticas anexadas
    Write-Info "Verificando políticas anexadas..."
    $attachedPolicies = aws iam list-attached-role-policies --role-name $RoleName --output json | ConvertFrom-Json
    if ($attachedPolicies.AttachedPolicies | Where-Object { $_.PolicyArn -eq $POLICY_ARN }) {
        Write-Success "Policy anexada OK"
    } else {
        Write-Error-Custom "Policy não anexada"
    }
}

# Criar resumo
Write-Step "Criando Resumo" "Green"

$currentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$currentLocation = Get-Location

$summary = @"
=== CONFIGURACAO OIDC COMPLETA ===

Data: $currentDate
Account ID: $ACCOUNT_ID
Regiao: $AWS_REGION
Repositorio: $Repository

=== ARNs CRIADOS ===

1. Identity Provider ARN:
$OIDC_PROVIDER_ARN

2. IAM Role ARN:
$ROLE_ARN

3. IAM Policy ARN:
$POLICY_ARN

=== PROXIMOS PASSOS ===

1. Adicionar o Role ARN aos GitHub Secrets:
   
   Acesse: https://github.com/$Repository/settings/secrets/actions
   
   Adicione os seguintes secrets:
   
   Nome: AWS_ROLE_ARN
   Valor: $ROLE_ARN
   
   Nome: AWS_REGION
   Valor: $AWS_REGION

2. Testar o workflow GitHub Actions:
   
   - Faca um commit em uma branch
   - Abra um Pull Request
   - Verifique se o workflow executa com sucesso

3. Monitorar logs:
   
   - GitHub Actions: https://github.com/$Repository/actions
   - CloudWatch: https://console.aws.amazon.com/cloudwatch/
   - CloudTrail: https://console.aws.amazon.com/cloudtrail/

=== COMANDOS DE VALIDACAO ===

# Verificar provider
aws iam list-open-id-connect-providers

# Verificar role
aws iam get-role --role-name $RoleName

# Verificar politicas anexadas
aws iam list-attached-role-policies --role-name $RoleName

=== ARQUIVOS CRIADOS ===

$currentLocation
- github-actions-trust-policy.json
- github-actions-permissions-policy.json
- oidc-provider-arn.txt
- role-arn.txt
- policy-arn.txt
- oidc-setup-summary.txt

=== TROUBLESHOOTING ===

Se encontrar problemas:
- Consulte: docs/ci-cd/TROUBLESHOOTING.md
- Verifique logs do CloudTrail
- Revise permissoes IAM do usuario

=== ROLLBACK (SE NECESSARIO) ===

# Desanexar policy
aws iam detach-role-policy --role-name $RoleName --policy-arn $POLICY_ARN

# Deletar role
aws iam delete-role --role-name $RoleName

# Deletar policy
aws iam delete-policy --policy-arn $POLICY_ARN

# Deletar provider
aws iam delete-open-id-connect-provider --open-id-connect-provider-arn $OIDC_PROVIDER_ARN

"@

$summary | Out-File -FilePath "oidc-setup-summary.txt" -Encoding UTF8

Write-Host "`n"
Write-Host $summary
Write-Host "`n"

Write-Success "Resumo salvo em: $currentLocation\oidc-setup-summary.txt"

Write-Step "CONFIGURACAO OIDC COMPLETA!" "Green"
Write-Info "Proximo passo: Configurar GitHub Secrets"
Write-Info "Documentacao: .kiro/specs/ci-cd-aws-guardrails/FASE-2-EXECUCAO-INTERATIVA.md"

# Retornar ao diretório original
Set-Location ..

exit 0

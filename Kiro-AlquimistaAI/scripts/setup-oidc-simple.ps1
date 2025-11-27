# Script Simplificado de Configuração OIDC para GitHub Actions
# Projeto: AlquimistaAI AWS Architecture

param(
    [string]$Repository = "MarcelloHollanda/alquimistaai-aws-architecture",
    [string]$RoleName = "GitHubActionsAlquimistaAICICD",
    [string]$PolicyName = "GitHubActionsAlquimistaAIPolicy"
)

Write-Host "`n=== Configuracao OIDC para GitHub Actions ===" -ForegroundColor Cyan
Write-Host "Repositorio: $Repository" -ForegroundColor White
Write-Host "Role: $RoleName" -ForegroundColor White
Write-Host "Policy: $PolicyName`n" -ForegroundColor White

# Etapa 1: Verificar AWS CLI
Write-Host "Etapa 1: Verificando AWS CLI..." -ForegroundColor Yellow
$awsVersion = aws --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ AWS CLI instalado: $awsVersion" -ForegroundColor Green
} else {
    Write-Host "❌ AWS CLI nao encontrado" -ForegroundColor Red
    exit 1
}

# Etapa 2: Obter Account ID
Write-Host "`nEtapa 2: Obtendo Account ID..." -ForegroundColor Yellow
$identityJson = aws sts get-caller-identity --output json 2>&1
if ($LASTEXITCODE -eq 0) {
    $identity = $identityJson | ConvertFrom-Json
    $ACCOUNT_ID = $identity.Account
    Write-Host "✅ Account ID: $ACCOUNT_ID" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao obter Account ID. Configure: aws configure" -ForegroundColor Red
    exit 1
}

# Etapa 3: Verificar/Criar Identity Provider
Write-Host "`nEtapa 3: Verificando Identity Provider OIDC..." -ForegroundColor Yellow
$OIDC_PROVIDER_ARN = "arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"

$existingProviders = aws iam list-open-id-connect-providers --output json | ConvertFrom-Json
$providerExists = $existingProviders.OpenIDConnectProviderList | Where-Object { $_.Arn -eq $OIDC_PROVIDER_ARN }

if ($providerExists) {
    Write-Host "ℹ️  Identity Provider ja existe" -ForegroundColor Cyan
} else {
    Write-Host "Criando Identity Provider..." -ForegroundColor White
    aws iam create-open-id-connect-provider `
        --url "https://token.actions.githubusercontent.com" `
        --client-id-list "sts.amazonaws.com" `
        --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" | Out-Null
    Write-Host "✅ Identity Provider criado" -ForegroundColor Green
}

# Etapa 4: Criar Trust Policy JSON
Write-Host "`nEtapa 4: Criando Trust Policy..." -ForegroundColor Yellow
$trustPolicyPath = "trust-policy-oidc.json"
$trustPolicyJson = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Principal = @{
                Federated = $OIDC_PROVIDER_ARN
            }
            Action = "sts:AssumeRoleWithWebIdentity"
            Condition = @{
                StringEquals = @{
                    "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
                }
                StringLike = @{
                    "token.actions.githubusercontent.com:sub" = "repo:${Repository}:*"
                }
            }
        }
    )
} | ConvertTo-Json -Depth 10

$trustPolicyJson | Out-File -FilePath $trustPolicyPath -Encoding UTF8
Write-Host "✅ Trust policy criada: $trustPolicyPath" -ForegroundColor Green

# Etapa 5: Criar/Atualizar IAM Role
Write-Host "`nEtapa 5: Criando/Atualizando IAM Role..." -ForegroundColor Yellow
$ROLE_ARN = "arn:aws:iam::${ACCOUNT_ID}:role/${RoleName}"

$roleCheck = aws iam get-role --role-name $RoleName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "ℹ️  Role ja existe, atualizando trust policy..." -ForegroundColor Cyan
    aws iam update-assume-role-policy --role-name $RoleName --policy-document "file://$trustPolicyPath"
    Write-Host "✅ Trust policy atualizada" -ForegroundColor Green
} else {
    Write-Host "Criando nova role..." -ForegroundColor White
    aws iam create-role `
        --role-name $RoleName `
        --assume-role-policy-document "file://$trustPolicyPath" `
        --description "Role para GitHub Actions executar deploy do AlquimistaAI" | Out-Null
    Write-Host "✅ Role criada: $ROLE_ARN" -ForegroundColor Green
}

# Etapa 6: Criar Permissions Policy JSON
Write-Host "`nEtapa 6: Criando Permissions Policy..." -ForegroundColor Yellow
$permissionsPolicyPath = "permissions-policy-oidc.json"
$permissionsPolicyJson = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Action = @(
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
            )
            Resource = "*"
        }
    )
} | ConvertTo-Json -Depth 10

$permissionsPolicyJson | Out-File -FilePath $permissionsPolicyPath -Encoding UTF8
Write-Host "✅ Permissions policy criada: $permissionsPolicyPath" -ForegroundColor Green

# Etapa 7: Criar/Obter Policy ARN
Write-Host "`nEtapa 7: Criando/Obtendo Policy..." -ForegroundColor Yellow
$POLICY_ARN = "arn:aws:iam::${ACCOUNT_ID}:policy/${PolicyName}"

$policyCheck = aws iam get-policy --policy-arn $POLICY_ARN 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "ℹ️  Policy ja existe: $POLICY_ARN" -ForegroundColor Cyan
} else {
    Write-Host "Criando nova policy..." -ForegroundColor White
    aws iam create-policy `
        --policy-name $PolicyName `
        --policy-document "file://$permissionsPolicyPath" `
        --description "Permissoes para GitHub Actions fazer deploy do AlquimistaAI" | Out-Null
    Write-Host "✅ Policy criada: $POLICY_ARN" -ForegroundColor Green
}

# Etapa 8: Anexar Policy à Role
Write-Host "`nEtapa 8: Anexando Policy à Role..." -ForegroundColor Yellow
$attachResult = aws iam attach-role-policy --role-name $RoleName --policy-arn $POLICY_ARN 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Policy anexada com sucesso" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Policy ja estava anexada ou erro: $attachResult" -ForegroundColor Cyan
}

# Limpar arquivos temporários
Remove-Item -Path $trustPolicyPath -Force -ErrorAction SilentlyContinue
Remove-Item -Path $permissionsPolicyPath -Force -ErrorAction SilentlyContinue

# Exibir resumo
Write-Host "`n=== CONFIGURACAO OIDC COMPLETA ===" -ForegroundColor Green
Write-Host "`nARNs Criados:" -ForegroundColor Yellow
Write-Host "Identity Provider: $OIDC_PROVIDER_ARN" -ForegroundColor White
Write-Host "IAM Role: $ROLE_ARN" -ForegroundColor White
Write-Host "IAM Policy: $POLICY_ARN" -ForegroundColor White

Write-Host "`nPROXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Acesse: https://github.com/$Repository/settings/secrets/actions" -ForegroundColor White
Write-Host "2. Adicione o secret:" -ForegroundColor White
Write-Host "   Nome: AWS_ROLE_ARN" -ForegroundColor Cyan
Write-Host "   Valor: $ROLE_ARN" -ForegroundColor Cyan
Write-Host "3. Adicione o secret:" -ForegroundColor White
Write-Host "   Nome: AWS_REGION" -ForegroundColor Cyan
Write-Host "   Valor: us-east-1" -ForegroundColor Cyan

Write-Host "`n✅ Script concluido com sucesso!" -ForegroundColor Green
Write-Host ""

exit 0

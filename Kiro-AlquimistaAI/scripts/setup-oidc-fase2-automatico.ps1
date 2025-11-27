# Script Automatizado - Configuração OIDC Fase 2
# AlquimistaAI CI/CD Pipeline
# Account ID: 207933152643

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FASE 2 - Configuração OIDC Automática" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$ACCOUNT_ID = "207933152643"
$REGION = "us-east-1"
$ROLE_NAME = "GitHubActionsAlquimistaAICICD"
$POLICY_NAME = "GitHubActionsAlquimistaAICICDPolicy"

# Função para exibir status
function Show-Status {
    param($Message, $Type = "Info")
    $color = switch ($Type) {
        "Success" { "Green" }
        "Error" { "Red" }
        "Warning" { "Yellow" }
        default { "White" }
    }
    Write-Host "[$Type] $Message" -ForegroundColor $color
}

# ETAPA 1: Verificar Account ID
Write-Host "ETAPA 1: Verificando Account ID..." -ForegroundColor Yellow
try {
    $currentAccount = aws sts get-caller-identity --query Account --output text
    if ($currentAccount -eq $ACCOUNT_ID) {
        Show-Status "Account ID verificado: $currentAccount" "Success"
    } else {
        Show-Status "Account ID incorreto! Esperado: $ACCOUNT_ID, Atual: $currentAccount" "Error"
        exit 1
    }
} catch {
    Show-Status "Erro ao verificar Account ID: $_" "Error"
    exit 1
}

Write-Host ""

# ETAPA 2: Criar OIDC Provider
Write-Host "ETAPA 2: Criando OIDC Provider..." -ForegroundColor Yellow
try {
    $oidcResult = aws iam create-open-id-connect-provider `
        --url https://token.actions.githubusercontent.com `
        --client-id-list sts.amazonaws.com `
        --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 `
        --region $REGION 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Show-Status "OIDC Provider criado com sucesso!" "Success"
        $oidcResult | ConvertFrom-Json | ConvertTo-Json
    } else {
        if ($oidcResult -like "*EntityAlreadyExists*") {
            Show-Status "OIDC Provider já existe (OK)" "Warning"
        } else {
            Show-Status "Erro ao criar OIDC Provider: $oidcResult" "Error"
        }
    }
} catch {
    Show-Status "Erro: $_" "Error"
}

Write-Host ""

# ETAPA 3: Verificar Trust Policy
Write-Host "ETAPA 3: Verificando Trust Policy..." -ForegroundColor Yellow
if (Test-Path "trust-policy-template.json") {
    Show-Status "Trust Policy encontrada: trust-policy-template.json" "Success"
    Get-Content "trust-policy-template.json" | Write-Host
} else {
    Show-Status "Arquivo trust-policy-template.json não encontrado!" "Error"
    exit 1
}

Write-Host ""

# ETAPA 4: Criar IAM Role
Write-Host "ETAPA 4: Criando IAM Role..." -ForegroundColor Yellow
try {
    $roleResult = aws iam create-role `
        --role-name $ROLE_NAME `
        --assume-role-policy-document file://trust-policy-template.json `
        --description "Role para GitHub Actions executar CI/CD do AlquimistaAI" `
        --region $REGION 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Show-Status "IAM Role criada com sucesso!" "Success"
        $roleArn = ($roleResult | ConvertFrom-Json).Role.Arn
        Show-Status "Role ARN: $roleArn" "Success"
    } else {
        if ($roleResult -like "*EntityAlreadyExists*") {
            Show-Status "IAM Role já existe (OK)" "Warning"
            $roleArn = "arn:aws:iam::${ACCOUNT_ID}:role/$ROLE_NAME"
        } else {
            Show-Status "Erro ao criar IAM Role: $roleResult" "Error"
        }
    }
} catch {
    Show-Status "Erro: $_" "Error"
}

Write-Host ""

# ETAPA 5: Verificar Permissions Policy
Write-Host "ETAPA 5: Verificando Permissions Policy..." -ForegroundColor Yellow
if (Test-Path "permissions-policy-template.json") {
    Show-Status "Permissions Policy encontrada: permissions-policy-template.json" "Success"
} else {
    Show-Status "Arquivo permissions-policy-template.json não encontrado!" "Error"
    exit 1
}

# Criar Policy
Write-Host "Criando Permissions Policy..." -ForegroundColor Yellow
try {
    $policyResult = aws iam create-policy `
        --policy-name $POLICY_NAME `
        --policy-document file://permissions-policy-template.json `
        --description "Permissoes para GitHub Actions CI/CD AlquimistaAI" `
        --region $REGION 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Show-Status "Permissions Policy criada com sucesso!" "Success"
        $policyArn = ($policyResult | ConvertFrom-Json).Policy.Arn
        Show-Status "Policy ARN: $policyArn" "Success"
    } else {
        if ($policyResult -like "*EntityAlreadyExists*") {
            Show-Status "Permissions Policy já existe (OK)" "Warning"
            $policyArn = "arn:aws:iam::${ACCOUNT_ID}:policy/$POLICY_NAME"
        } else {
            Show-Status "Erro ao criar Permissions Policy: $policyResult" "Error"
        }
    }
} catch {
    Show-Status "Erro: $_" "Error"
}

Write-Host ""

# ETAPA 6: Anexar Policy à Role
Write-Host "ETAPA 6: Anexando Policy à Role..." -ForegroundColor Yellow
try {
    $attachResult = aws iam attach-role-policy `
        --role-name $ROLE_NAME `
        --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/$POLICY_NAME" `
        --region $REGION 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Show-Status "Policy anexada com sucesso!" "Success"
    } else {
        Show-Status "Aviso ao anexar policy: $attachResult" "Warning"
    }
} catch {
    Show-Status "Erro: $_" "Error"
}

# Verificar anexação
Write-Host "Verificando policies anexadas..." -ForegroundColor Yellow
try {
    $attachedPolicies = aws iam list-attached-role-policies `
        --role-name $ROLE_NAME `
        --region $REGION | ConvertFrom-Json
    
    Show-Status "Policies anexadas à role:" "Success"
    $attachedPolicies.AttachedPolicies | ForEach-Object {
        Write-Host "  - $($_.PolicyName)" -ForegroundColor Green
    }
} catch {
    Show-Status "Erro ao verificar policies: $_" "Error"
}

Write-Host ""

# RESUMO FINAL
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMO DA CONFIGURAÇÃO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Account ID: $ACCOUNT_ID" -ForegroundColor White
Write-Host "Região: $REGION" -ForegroundColor White
Write-Host "Role Name: $ROLE_NAME" -ForegroundColor White
Write-Host "Role ARN: arn:aws:iam::${ACCOUNT_ID}:role/$ROLE_NAME" -ForegroundColor Green
Write-Host "Policy Name: $POLICY_NAME" -ForegroundColor White
Write-Host "Policy ARN: arn:aws:iam::${ACCOUNT_ID}:policy/$POLICY_NAME" -ForegroundColor Green
Write-Host ""

# PRÓXIMOS PASSOS
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PRÓXIMOS PASSOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ETAPA 7: Configurar GitHub Secrets" -ForegroundColor Yellow
Write-Host ""
Write-Host "Acesse: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/settings/secrets/actions" -ForegroundColor White
Write-Host ""
Write-Host "Adicione os seguintes secrets:" -ForegroundColor White
Write-Host ""
Write-Host "1. AWS_ROLE_ARN" -ForegroundColor Cyan
Write-Host "   Value: arn:aws:iam::${ACCOUNT_ID}:role/$ROLE_NAME" -ForegroundColor Green
Write-Host ""
Write-Host "2. AWS_REGION" -ForegroundColor Cyan
Write-Host "   Value: $REGION" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FASE 2 COMPLETA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

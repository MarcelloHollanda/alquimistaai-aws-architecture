# Script para corrigir e fazer redeploy do NigredoStack
# Autor: Kiro AI Assistant

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Nigredo Stack - Fix & Redeploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se AWS CLI esta instalado
Write-Host "1. Verificando AWS CLI..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version 2>&1
    Write-Host "   OK AWS CLI encontrado: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERRO AWS CLI nao encontrado. Instale: https://aws.amazon.com/cli/" -ForegroundColor Red
    exit 1
}

# Verificar se CDK esta instalado
Write-Host "2. Verificando AWS CDK..." -ForegroundColor Yellow
try {
    $cdkVersion = npx cdk --version 2>&1
    Write-Host "   OK AWS CDK encontrado: $cdkVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERRO AWS CDK nao encontrado. Instale: npm install -g aws-cdk" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Passo 1: Deletar Stack com Erro" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar status do stack
Write-Host "Verificando status do NigredoStack-dev..." -ForegroundColor Yellow
$stackStatus = aws cloudformation describe-stacks --stack-name NigredoStack-dev --query 'Stacks[0].StackStatus' --output text 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   Status atual: $stackStatus" -ForegroundColor Yellow
    
    if ($stackStatus -eq "ROLLBACK_COMPLETE" -or $stackStatus -like "*FAILED*") {
        Write-Host ""
        Write-Host "Stack precisa ser deletado antes do redeploy." -ForegroundColor Yellow
        $confirm = Read-Host "Deseja deletar o stack NigredoStack-dev? (S/N)"
        
        if ($confirm -eq "S" -or $confirm -eq "s") {
            Write-Host "Deletando stack..." -ForegroundColor Yellow
            aws cloudformation delete-stack --stack-name NigredoStack-dev
            
            Write-Host "Aguardando delecao completa (isso pode levar alguns minutos)..." -ForegroundColor Yellow
            aws cloudformation wait stack-delete-complete --stack-name NigredoStack-dev
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   OK Stack deletado com sucesso!" -ForegroundColor Green
            } else {
                Write-Host "   ERRO ao deletar stack. Verifique no console AWS." -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "Delecao cancelada pelo usuario." -ForegroundColor Yellow
            exit 0
        }
    } elseif ($stackStatus -eq "CREATE_COMPLETE" -or $stackStatus -eq "UPDATE_COMPLETE") {
        Write-Host "   INFO Stack ja esta em estado valido. Pulando delecao." -ForegroundColor Cyan
    }
} else {
    Write-Host "   INFO Stack nao existe. Pronto para criar." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Passo 2: Sintetizar Template CDK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Sintetizando template do NigredoStack-dev..." -ForegroundColor Yellow
npx cdk synth NigredoStack-dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ERRO ao sintetizar template. Verifique os logs acima." -ForegroundColor Red
    exit 1
}

Write-Host "   OK Template sintetizado com sucesso!" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Passo 3: Deploy do Stack Corrigido" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$confirmDeploy = Read-Host "Deseja fazer o deploy do NigredoStack-dev? (S/N)"

if ($confirmDeploy -eq "S" -or $confirmDeploy -eq "s") {
    Write-Host "Iniciando deploy..." -ForegroundColor Yellow
    Write-Host ""
    
    npx cdk deploy NigredoStack-dev --verbose --require-approval never
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  OK Deploy Concluido com Sucesso!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Proximos passos:" -ForegroundColor Cyan
        Write-Host "1. Verifique os outputs do stack no console AWS CloudFormation" -ForegroundColor White
        Write-Host "2. Teste os endpoints da API Nigredo" -ForegroundColor White
        Write-Host "3. Verifique os dashboards do CloudWatch" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "  ERRO no Deploy" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Verifique os logs acima para detalhes do erro." -ForegroundColor Yellow
        Write-Host "Consulte NIGREDO-EXPORT-FIX-SUMMARY.md para mais informacoes." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "Deploy cancelado pelo usuario." -ForegroundColor Yellow
    exit 0
}

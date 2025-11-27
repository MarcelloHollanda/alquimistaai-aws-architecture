# Script Simplificado - Configuracao dos Grupos Cognito
# Painel Operacional AlquimistaAI

param(
    [Parameter(Mandatory=$true)]
    [string]$UserPoolId,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuracao Grupos Cognito" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "User Pool ID: $UserPoolId" -ForegroundColor Yellow
Write-Host "Regiao: $Region" -ForegroundColor Yellow
Write-Host ""

# Verificar AWS CLI
$awsCheck = Get-Command aws -ErrorAction SilentlyContinue
if (-not $awsCheck) {
    Write-Host "X AWS CLI nao encontrado" -ForegroundColor Red
    exit 1
}
Write-Host "OK AWS CLI encontrado" -ForegroundColor Green

Write-Host ""
Write-Host "Criando grupos..." -ForegroundColor Cyan
Write-Host ""

# Definir grupos
$grupos = @(
    @{Nome="INTERNAL_ADMIN"; Desc="Administradores internos da AlquimistaAI"; Prec=1},
    @{Nome="INTERNAL_SUPPORT"; Desc="Equipe de suporte interno da AlquimistaAI"; Prec=2},
    @{Nome="TENANT_ADMIN"; Desc="Administradores de tenants (clientes)"; Prec=3},
    @{Nome="TENANT_USER"; Desc="Usuarios regulares de tenants (clientes)"; Prec=4}
)

$sucessos = 0

# Criar cada grupo
foreach ($grupo in $grupos) {
    Write-Host "Criando grupo: $($grupo.Nome)..." -NoNewline
    
    $output = & aws cognito-idp create-group --group-name $grupo.Nome --user-pool-id $UserPoolId --description $grupo.Desc --precedence $grupo.Prec --region $Region 2>&1
    $outputString = $output | Out-String
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
        $sucessos++
        continue
    }
    
    if ($outputString -match "GroupExistsException") {
        Write-Host " (ja existe)" -ForegroundColor Yellow
        $sucessos++
        continue
    }
    
    Write-Host " ERRO" -ForegroundColor Red
    Write-Host "  Erro: $outputString" -ForegroundColor Red
}

# Resumo
Write-Host ""
if ($sucessos -eq 4) {
    Write-Host "Grupos processados: $sucessos/4" -ForegroundColor Green
} else {
    Write-Host "Grupos processados: $sucessos/4" -ForegroundColor Yellow
}

# Listar grupos
Write-Host ""
Write-Host "Verificando grupos criados..." -ForegroundColor Cyan
aws cognito-idp list-groups --user-pool-id $UserPoolId --region $Region --query 'Groups[].GroupName' --output table

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuracao Concluida!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "1. Verificar grupos no console AWS Cognito" -ForegroundColor White
Write-Host "2. Abrir tasks.md e comecar Task 2" -ForegroundColor White
Write-Host ""
Write-Host "Comando para abrir tasks:" -ForegroundColor Yellow
Write-Host "code .kiro\specs\operational-dashboard-alquimistaai\tasks.md" -ForegroundColor Yellow
Write-Host ""

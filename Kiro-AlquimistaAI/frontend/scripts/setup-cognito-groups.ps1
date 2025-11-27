param(
    [string]$Region = "us-east-1",
    [string]$UserPoolId = "us-east-1_Y8p2TeMbv"
)

Write-Host "========================================"
Write-Host "  Setup de Grupos Cognito - AlquimistaAI"
Write-Host "========================================"
Write-Host ""

# 1) Validar AWS CLI / User Pool
Write-Host "[1/3] Validando User Pool..." -ForegroundColor Cyan

try {
    $poolJson = aws cognito-idp describe-user-pool `
        --region $Region `
        --user-pool-id $UserPoolId 2>$null
    
    if (-not $?) {
        throw "Nao foi possivel descrever o User Pool (verifique conta/regiao)."
    }
    
    $pool = $poolJson | ConvertFrom-Json
    Write-Host "OK - User Pool encontrado:" $pool.UserPool.Name "($UserPoolId)" -ForegroundColor Green
} catch {
    Write-Host "X User Pool nao encontrado ou acesso negado." -ForegroundColor Red
    Write-Host "  - Region: $Region"
    Write-Host "  - UserPoolId: $UserPoolId"
    Write-Host "  - Verifique se a AWS CLI esta na conta 207933152643 (aws sts get-caller-identity)." -ForegroundColor Yellow
    exit 1
}

function Ensure-Group {
    param(
        [string]$Name,
        [string]$Description
    )
    
    Write-Host "  > Verificando grupo '$Name'..." -NoNewline
    
    aws cognito-idp get-group `
        --region $Region `
        --user-pool-id $UserPoolId `
        --group-name $Name 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ja existe." -ForegroundColor DarkYellow
        return
    }
    
    Write-Host " criando..." -NoNewline
    
    aws cognito-idp create-group `
        --region $Region `
        --user-pool-id $UserPoolId `
        --group-name $Name `
        --description $Description 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    }
    else {
        Write-Host " FALHOU" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "[2/3] Criando grupos padrao..." -ForegroundColor Cyan

Ensure-Group -Name "INTERNAL_ADMIN"    -Description "Administradores internos AlquimistaAI"
Ensure-Group -Name "INTERNAL_SUPPORT"  -Description "Suporte interno AlquimistaAI"
Ensure-Group -Name "TENANT_ADMIN"      -Description "Administrador de empresa (cliente)"
Ensure-Group -Name "TENANT_USER"       -Description "Usuario comum de empresa (cliente)"

Write-Host ""
Write-Host "[3/3] Concluido." -ForegroundColor Cyan
Write-Host "Agora atribua usuarios aos grupos pelo console Cognito ou em um script separado." -ForegroundColor Yellow

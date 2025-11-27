# Script de setup inicial para AWS (PowerShell)
# Este script configura o ambiente e faz o bootstrap da conta AWS

$ErrorActionPreference = "Stop"

Write-Host "🚀 Fibonacci AWS Setup" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

# Verificar se AWS CLI está instalado
try {
    $null = Get-Command aws -ErrorAction Stop
    Write-Host "✓ AWS CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI não encontrado" -ForegroundColor Red
    Write-Host "Instale o AWS CLI: https://aws.amazon.com/cli/"
    exit 1
}

# Verificar se Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado" -ForegroundColor Red
    Write-Host "Instale o Node.js 18+: https://nodejs.org/"
    exit 1
}

# Verificar credenciais AWS
Write-Host ""
Write-Host "Verificando credenciais AWS..."
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    $accountId = $identity.Account
    $userArn = $identity.Arn
    
    Write-Host "✓ Credenciais válidas" -ForegroundColor Green
    Write-Host "  Account ID: $accountId"
    Write-Host "  User: $userArn"
} catch {
    Write-Host "❌ Credenciais AWS inválidas ou não configuradas" -ForegroundColor Red
    Write-Host "Execute: aws configure"
    exit 1
}

# Verificar se é a conta correta
if ($accountId -ne "207933152643") {
    Write-Host "⚠️  Aviso: Account ID diferente do esperado" -ForegroundColor Yellow
    Write-Host "  Esperado: 207933152643"
    Write-Host "  Atual: $accountId"
    $response = Read-Host "Deseja continuar? (s/n)"
    if ($response -ne "s" -and $response -ne "S") {
        exit 1
    }
}

# Instalar dependências
Write-Host ""
Write-Host "Instalando dependências do projeto..."
npm install

Write-Host "✓ Dependências instaladas" -ForegroundColor Green

# Bootstrap CDK
Write-Host ""
Write-Host "Fazendo bootstrap da conta AWS para CDK..."
Write-Host "Isso pode levar alguns minutos..."

try {
    npm run bootstrap
    Write-Host "✓ Bootstrap concluído" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no bootstrap" -ForegroundColor Red
    exit 1
}

# Verificar se secrets existem
Write-Host ""
Write-Host "Verificando secrets no Secrets Manager..."

function Test-Secret {
    param($SecretName)
    try {
        $null = aws secretsmanager describe-secret --secret-id $SecretName --region us-east-1 2>$null
        Write-Host "✓ $SecretName existe" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "⚠️  $SecretName não encontrado" -ForegroundColor Yellow
        return $false
    }
}

$secretsMissing = $false

if (-not (Test-Secret "fibonacci/mcp/whatsapp")) {
    $secretsMissing = $true
}

if (-not (Test-Secret "fibonacci/mcp/enrichment")) {
    $secretsMissing = $true
}

if (-not (Test-Secret "fibonacci/mcp/calendar")) {
    $secretsMissing = $true
}

if ($secretsMissing) {
    Write-Host ""
    Write-Host "⚠️  Alguns secrets não foram encontrados" -ForegroundColor Yellow
    Write-Host "Você pode criá-los agora ou depois. Veja SETUP.md para instruções."
    Write-Host ""
    $response = Read-Host "Deseja criar secrets vazios agora? (s/n)"
    
    if ($response -eq "s" -or $response -eq "S") {
        Write-Host "Criando secrets vazios..."
        
        try {
            aws secretsmanager create-secret `
                --name fibonacci/mcp/whatsapp `
                --secret-string '{\"apiKey\":\"\"}' `
                --region us-east-1 2>$null
        } catch {
            Write-Host "Secret whatsapp já existe"
        }
        
        try {
            aws secretsmanager create-secret `
                --name fibonacci/mcp/enrichment `
                --secret-string '{\"googlePlacesApiKey\":\"\",\"linkedInClientId\":\"\",\"linkedInClientSecret\":\"\",\"linkedInAccessToken\":\"\"}' `
                --region us-east-1 2>$null
        } catch {
            Write-Host "Secret enrichment já existe"
        }
        
        try {
            aws secretsmanager create-secret `
                --name fibonacci/mcp/calendar `
                --secret-string '{\"clientId\":\"\",\"clientSecret\":\"\",\"refreshToken\":\"\"}' `
                --region us-east-1 2>$null
        } catch {
            Write-Host "Secret calendar já existe"
        }
        
        Write-Host "✓ Secrets criados (vazios)" -ForegroundColor Green
        Write-Host "Atualize-os depois com suas API keys reais"
    }
}

# Synth para verificar configuração
Write-Host ""
Write-Host "Verificando configuração do CDK..."
try {
    npm run synth | Out-Null
    Write-Host "✓ Configuração válida" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro na configuração" -ForegroundColor Red
    exit 1
}

# Resumo
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Setup concluído com sucesso!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:"
Write-Host ""
Write-Host "1. Configure as API keys nos secrets (veja SETUP.md)"
Write-Host "2. Execute o deploy:"
Write-Host "   npm run deploy:dev"
Write-Host ""
Write-Host "3. Após o deploy, execute as migrações:"
Write-Host "   npm run db:migrate"
Write-Host "   npm run db:seed"
Write-Host ""
Write-Host "Para mais informações, consulte SETUP.md"
Write-Host ""

<#
.SYNOPSIS
    Script para criar secrets do Micro Agente de Disparo e Agendamento no AWS Secrets Manager.

.DESCRIPTION
    Este script cria 3 secrets no AWS Secrets Manager com o padrão de nomenclatura oficial:
    
    - /repo/terraform/micro-agente-disparo-agendamento/whatsapp
    - /repo/terraform/micro-agente-disparo-agendamento/email
    - /repo/terraform/micro-agente-disparo-agendamento/calendar
    
    O script detecta automaticamente se os secrets já existem e usa put-secret-value para atualizar.
    Os valores sensíveis são solicitados em tempo de execução via Read-Host (não são logados).

.PARAMETER Region
    Região AWS onde os secrets serão criados (padrão: us-east-1)

.EXAMPLE
    .\create-secrets.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\create-secrets.ps1

.NOTES
    - Requer AWS CLI configurado com credenciais válidas
    - Não versionar este script com valores hardcoded
    - Os valores são solicitados em tempo de execução para segurança
    - Região padrão: us-east-1 (conforme padrão do projeto AlquimistaAI)
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

# ============================================
# Funções Auxiliares
# ============================================

function Write-Header {
    param(
        [string]$Text
    )
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $Text -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Test-SecretExists {
    param(
        [string]$SecretName,
        [string]$Region
    )
    
    try {
        $null = aws secretsmanager describe-secret --region $Region --secret-id $SecretName 2>&1
        return $true
    }
    catch {
        return $false
    }
}

function New-OrUpdateSecret {
    param(
        [string]$SecretName,
        [string]$Description,
        [string]$SecretValue,
        [string]$Region
    )
    
    $exists = Test-SecretExists -SecretName $SecretName -Region $Region
    
    if ($exists) {
        Write-Host "  Secret já existe. Atualizando valor..." -ForegroundColor Yellow
        try {
            aws secretsmanager put-secret-value --region $Region --secret-id $SecretName --secret-string $SecretValue | Out-Null
            Write-Host "   Secret atualizado com sucesso!" -ForegroundColor Green
            return $true
        }
        catch {
            Write-Host "   Erro ao atualizar secret: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    }
    else {
        Write-Host "  Secret não existe. Criando..." -ForegroundColor Yellow
        try {
            aws secretsmanager create-secret --region $Region --name $SecretName --description $Description --secret-string $SecretValue | Out-Null
            Write-Host "   Secret criado com sucesso!" -ForegroundColor Green
            return $true
        }
        catch {
            Write-Host "   Erro ao criar secret: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    }
}

function Get-SecretInput {
    param(
        [string]$Prompt,
        [string]$DefaultValue = ""
    )
    
    if ($DefaultValue) {
        $value = Read-Host "$Prompt (padrão: $DefaultValue)"
        if ([string]::IsNullOrWhiteSpace($value)) {
            return $DefaultValue
        }
        return $value
    }
    else {
        $value = Read-Host $Prompt
        return $value
    }
}

# ============================================
# Início do Script
# ============================================

Write-Header "Criação de Secrets - Micro Agente Disparo e Agendamento"

Write-Host "Este script criará 3 secrets no AWS Secrets Manager:" -ForegroundColor White
Write-Host "  1. /repo/terraform/micro-agente-disparo-agendamento/whatsapp" -ForegroundColor Gray
Write-Host "  2. /repo/terraform/micro-agente-disparo-agendamento/email" -ForegroundColor Gray
Write-Host "  3. /repo/terraform/micro-agente-disparo-agendamento/calendar" -ForegroundColor Gray
Write-Host ""
Write-Host "Região AWS: $Region" -ForegroundColor Cyan
Write-Host ""

# Verificar AWS CLI
Write-Host "Verificando AWS CLI..." -ForegroundColor Yellow
try {
    $awsIdentity = aws sts get-caller-identity --region $Region --output json | ConvertFrom-Json
    Write-Host " AWS CLI configurado" -ForegroundColor Green
    Write-Host "  Account: $($awsIdentity.Account)" -ForegroundColor Gray
    Write-Host "  UserId: $($awsIdentity.UserId)" -ForegroundColor Gray
}
catch {
    Write-Host " Erro: AWS CLI não está configurado ou credenciais inválidas" -ForegroundColor Red
    Write-Host "  Execute 'aws configure' para configurar suas credenciais" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "IMPORTANTE: Os valores sensíveis serão solicitados agora." -ForegroundColor Yellow
Write-Host "            Esses valores NÃO serão exibidos nos logs." -ForegroundColor Yellow
Write-Host ""

$continue = Read-Host "Deseja continuar? (S/N)"
if ($continue -notmatch '^[Ss]$') {
    Write-Host "Operação cancelada pelo usuário." -ForegroundColor Yellow
    exit 0
}

# ============================================
# Coletar Valores dos Secrets
# ============================================

Write-Header "Coletando Valores dos Secrets"

# WhatsApp
Write-Host "1. MCP WhatsApp" -ForegroundColor Cyan
$whatsappEndpoint = Get-SecretInput "   Endpoint WhatsApp" "https://SEU-ENDPOINT-WHATSAPP-AQUI"
$whatsappApiKey   = Get-SecretInput "   API Key WhatsApp"  "SUA_API_KEY_WHATSAPP_AQUI"

# Email
Write-Host ""
Write-Host "2. MCP Email" -ForegroundColor Cyan
$emailEndpoint = Get-SecretInput "   Endpoint Email" "https://SEU-ENDPOINT-EMAIL-AQUI"
$emailApiKey   = Get-SecretInput "   API Key Email"  "SUA_API_KEY_EMAIL_AQUI"

# Calendar
Write-Host ""
Write-Host "3. MCP Calendar" -ForegroundColor Cyan
$calendarEndpoint = Get-SecretInput "   Endpoint Calendar" "https://SEU-ENDPOINT-CALENDAR-AQUI"
$calendarApiKey   = Get-SecretInput "   API Key Calendar"  "SUA_API_KEY_CALENDAR_AQUI"
$calendarId       = Get-SecretInput "   Calendar ID"       "vendas@alquimista.ai"

# ============================================
# Criar/Atualizar Secrets
# ============================================

Write-Header "Criando/Atualizando Secrets no AWS"

$results = @{
    whatsapp = $false
    email    = $false
    calendar = $false
}

# 1. Secret WhatsApp
Write-Host "1. Processando secret MCP WhatsApp..." -ForegroundColor Yellow
$whatsappSecretName = "/repo/terraform/micro-agente-disparo-agendamento/whatsapp"
$whatsappSecretValue = @{
    endpoint = $whatsappEndpoint
    api_key  = $whatsappApiKey
} | ConvertTo-Json -Compress

$results.whatsapp = New-OrUpdateSecret -SecretName $whatsappSecretName -Description "Credenciais MCP WhatsApp para Micro Agente de Disparo e Agendamento" -SecretValue $whatsappSecretValue -Region $Region

Write-Host ""

# 2. Secret Email
Write-Host "2. Processando secret MCP Email..." -ForegroundColor Yellow
$emailSecretName = "/repo/terraform/micro-agente-disparo-agendamento/email"
$emailSecretValue = @{
    endpoint = $emailEndpoint
    api_key  = $emailApiKey
} | ConvertTo-Json -Compress

$results.email = New-OrUpdateSecret -SecretName $emailSecretName -Description "Credenciais MCP Email para Micro Agente de Disparo e Agendamento" -SecretValue $emailSecretValue -Region $Region

Write-Host ""

# 3. Secret Calendar
Write-Host "3. Processando secret MCP Calendar..." -ForegroundColor Yellow
$calendarSecretName = "/repo/terraform/micro-agente-disparo-agendamento/calendar"
$calendarSecretValue = @{
    endpoint    = $calendarEndpoint
    api_key     = $calendarApiKey
    calendar_id = $calendarId
} | ConvertTo-Json -Compress

$results.calendar = New-OrUpdateSecret -SecretName $calendarSecretName -Description "Credenciais MCP Calendar para Micro Agente de Disparo e Agendamento" -SecretValue $calendarSecretValue -Region $Region

# ============================================
# Resumo Final
# ============================================

Write-Header "Resumo da Operação"

$successCount = ($results.Values | Where-Object { $_ -eq $true }).Count
$totalCount   = $results.Count

Write-Host ("Secrets processados: {0}/{1}" -f $successCount, $totalCount) -ForegroundColor $(if ($successCount -eq $totalCount) { "Green" } else { "Yellow" })

Write-Host ""

if ($results.whatsapp) {
    Write-Host "   $whatsappSecretName" -ForegroundColor Green
} else {
    Write-Host "   $whatsappSecretName" -ForegroundColor Red
}

if ($results.email) {
    Write-Host "   $emailSecretName" -ForegroundColor Green
} else {
    Write-Host "   $emailSecretName" -ForegroundColor Red
}

if ($results.calendar) {
    Write-Host "   $calendarSecretName" -ForegroundColor Green
} else {
    Write-Host "   $calendarSecretName" -ForegroundColor Red
}

Write-Host ""
Write-Host "Comandos úteis:" -ForegroundColor White
Write-Host ""
Write-Host "  # Listar secrets criados" -ForegroundColor Gray
Write-Host "  aws secretsmanager list-secrets --region $Region --query ""SecretList[?contains(Name, 'micro-agente-disparo-agendamento')].Name""" -ForegroundColor Gray
Write-Host ""
Write-Host "  # Verificar um secret específico (sem mostrar valor)" -ForegroundColor Gray
Write-Host "  aws secretsmanager describe-secret --region $Region --secret-id $whatsappSecretName" -ForegroundColor Gray
Write-Host ""
Write-Host "  # Atualizar um secret manualmente" -ForegroundColor Gray
Write-Host "  aws secretsmanager put-secret-value --region $Region --secret-id NOME_DO_SECRET --secret-string '{""endpoint"":""URL"",""api_key"":""KEY""}'" -ForegroundColor Gray
Write-Host ""

if ($successCount -eq $totalCount) {
    Write-Host " Todos os secrets foram criados/atualizados com sucesso!" -ForegroundColor Green
    exit 0
} else {
    Write-Host " Alguns secrets falharam. Verifique os erros acima." -ForegroundColor Yellow
    exit 1
}

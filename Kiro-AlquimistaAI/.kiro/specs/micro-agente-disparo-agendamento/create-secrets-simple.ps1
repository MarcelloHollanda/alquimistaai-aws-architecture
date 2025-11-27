# Script para criar secrets do Micro Agente de Disparo e Agendamento

$ErrorActionPreference = "Stop"

Write-Host "Criando Secrets - Micro Agente Disparo e Agendamento" -ForegroundColor Cyan

$region = "us-east-1"
$env = "dev"

# Secret 1: MCP WhatsApp
Write-Host "1. Criando secret para MCP WhatsApp..." -ForegroundColor Yellow
$whatsappSecretName = "/alquimista/$env/agente-disparo-agenda/mcp-whatsapp"
$whatsappSecretValue = '{"endpoint":"https://SEU-ENDPOINT-WHATSAPP","api_key":"SUA_API_KEY_WHATSAPP"}'

try {
    aws secretsmanager create-secret --region $region --name $whatsappSecretName --description "Credenciais MCP WhatsApp" --secret-string $whatsappSecretValue
    Write-Host "Secret MCP WhatsApp criado!" -ForegroundColor Green
} catch {
    Write-Host "Erro ao criar secret MCP WhatsApp (pode já existir)" -ForegroundColor Yellow
}

# Secret 2: MCP Email
Write-Host "2. Criando secret para MCP Email..." -ForegroundColor Yellow
$emailSecretName = "/alquimista/$env/agente-disparo-agenda/mcp-email"
$emailSecretValue = '{"endpoint":"https://SEU-ENDPOINT-EMAIL","api_key":"SUA_API_KEY_EMAIL"}'

try {
    aws secretsmanager create-secret --region $region --name $emailSecretName --description "Credenciais MCP Email" --secret-string $emailSecretValue
    Write-Host "Secret MCP Email criado!" -ForegroundColor Green
} catch {
    Write-Host "Erro ao criar secret MCP Email (pode já existir)" -ForegroundColor Yellow
}

# Secret 3: MCP Calendar
Write-Host "3. Criando secret para MCP Calendar..." -ForegroundColor Yellow
$calendarSecretName = "/alquimista/$env/agente-disparo-agenda/mcp-calendar"
$calendarSecretValue = '{"endpoint":"https://SEU-ENDPOINT-CALENDAR","api_key":"SUA_API_KEY_CALENDAR","calendar_id":"vendas@alquimista.ai"}'

try {
    aws secretsmanager create-secret --region $region --name $calendarSecretName --description "Credenciais MCP Calendar" --secret-string $calendarSecretValue
    Write-Host "Secret MCP Calendar criado!" -ForegroundColor Green
} catch {
    Write-Host "Erro ao criar secret MCP Calendar (pode já existir)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Secrets criados:" -ForegroundColor Cyan
Write-Host "  1. $whatsappSecretName"
Write-Host "  2. $emailSecretName"
Write-Host "  3. $calendarSecretName"
Write-Host ""
Write-Host "IMPORTANTE: Substitua os valores placeholder pelos dados reais!" -ForegroundColor Yellow

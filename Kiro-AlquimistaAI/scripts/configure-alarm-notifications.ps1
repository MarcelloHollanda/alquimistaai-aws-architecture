# Script para configurar notificações de alarmes do CloudWatch
# Uso: .\scripts\configure-alarm-notifications.ps1 -Env <env> -Email <email>

param(
    [Parameter(Mandatory=$true)]
    [string]$Env,
    
    [Parameter(Mandatory=$true)]
    [string]$Email
)

# Função para imprimir mensagens coloridas
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

Write-Info "Configurando notificações de alarmes para ambiente: $Env"
Write-Info "Email: $Email"

# Obter Account ID
try {
    $AccountId = (aws sts get-caller-identity --query Account --output text)
    Write-Info "Account ID: $AccountId"
} catch {
    Write-Error-Custom "Erro ao obter Account ID. Verifique se AWS CLI está configurado."
    exit 1
}

# Nome do SNS Topic
$TopicName = "fibonacci-alarms-$Env"
$TopicArn = "arn:aws:sns:us-east-1:${AccountId}:${TopicName}"

Write-Info "SNS Topic: $TopicArn"

# Verificar se o topic existe
try {
    aws sns get-topic-attributes --topic-arn $TopicArn 2>&1 | Out-Null
    Write-Info "SNS Topic encontrado!"
} catch {
    Write-Error-Custom "SNS Topic não encontrado: $TopicArn"
    Write-Error-Custom "Execute o deploy primeiro: npm run deploy:$Env"
    exit 1
}

# Verificar se já existe subscription para este email
$ExistingSubscription = aws sns list-subscriptions-by-topic `
    --topic-arn $TopicArn `
    --query "Subscriptions[?Endpoint=='$Email'].SubscriptionArn" `
    --output text

if ($ExistingSubscription -and $ExistingSubscription -ne "None") {
    Write-Warning-Custom "Subscription já existe para $Email"
    Write-Info "Subscription ARN: $ExistingSubscription"
    
    # Verificar status
    try {
        $Status = aws sns get-subscription-attributes `
            --subscription-arn $ExistingSubscription `
            --query "Attributes.PendingConfirmation" `
            --output text 2>$null
        
        if ($Status -eq "true") {
            Write-Warning-Custom "Subscription está pendente de confirmação"
            Write-Info "Verifique o email $Email e clique no link de confirmação"
        } else {
            Write-Info "Subscription está ativa!"
        }
    } catch {
        Write-Warning-Custom "Não foi possível verificar status da subscription"
    }
} else {
    # Criar subscription
    Write-Info "Criando subscription para $Email..."
    
    $SubscriptionArn = aws sns subscribe `
        --topic-arn $TopicArn `
        --protocol email `
        --notification-endpoint $Email `
        --query "SubscriptionArn" `
        --output text
    
    Write-Info "Subscription criada: $SubscriptionArn"
    Write-Warning-Custom "IMPORTANTE: Verifique o email $Email e clique no link de confirmação!"
}

# Listar todas as subscriptions
Write-Info "`nSubscriptions atuais para $TopicName:"
aws sns list-subscriptions-by-topic `
    --topic-arn $TopicArn `
    --query "Subscriptions[*].[Protocol,Endpoint,SubscriptionArn]" `
    --output table

# Testar notificação
$Response = Read-Host "`nDeseja enviar uma notificação de teste? (y/n)"
if ($Response -eq "y" -or $Response -eq "Y") {
    Write-Info "Enviando notificação de teste..."
    
    $Message = @"
Este é um teste de notificação do sistema de alarmes do Fibonacci.

Ambiente: $Env
Data/Hora: $(Get-Date)

Se você recebeu este email, as notificações estão configuradas corretamente!

---
Fibonacci Ecosystem - Alquimista.AI
"@
    
    aws sns publish `
        --topic-arn $TopicArn `
        --subject "Teste de Notificação - Fibonacci Alarms" `
        --message $Message
    
    Write-Info "Notificação de teste enviada!"
    Write-Info "Verifique o email $Email"
}

# Mostrar alarmes configurados
Write-Info "`nAlarmes configurados para $Env:"
aws cloudwatch describe-alarms `
    --alarm-name-prefix "fibonacci-" `
    --query "MetricAlarms[?contains(AlarmName, '$Env')].[AlarmName,StateValue]" `
    --output table

Write-Info "`n✅ Configuração concluída!"
Write-Info "`nPróximos passos:"
Write-Host "1. Confirme a subscription no email $Email (se ainda não confirmou)"
Write-Host "2. Verifique os alarmes no console CloudWatch"
Write-Host "3. Teste os alarmes com: npm run test:alarms"
Write-Host ""
Write-Info "Para adicionar mais emails, execute:"
Write-Host "  .\scripts\configure-alarm-notifications.ps1 -Env $Env -Email <outro-email>"

#!/bin/bash

# Script para configurar notificações de alarmes do CloudWatch
# Uso: ./scripts/configure-alarm-notifications.sh <env> <email>

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar argumentos
if [ $# -lt 2 ]; then
    print_error "Uso: $0 <env> <email>"
    echo "Exemplo: $0 dev ops@alquimista.ai"
    exit 1
fi

ENV=$1
EMAIL=$2

print_info "Configurando notificações de alarmes para ambiente: $ENV"
print_info "Email: $EMAIL"

# Obter Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
print_info "Account ID: $ACCOUNT_ID"

# Nome do SNS Topic
TOPIC_NAME="fibonacci-alarms-${ENV}"
TOPIC_ARN="arn:aws:sns:us-east-1:${ACCOUNT_ID}:${TOPIC_NAME}"

print_info "SNS Topic: $TOPIC_ARN"

# Verificar se o topic existe
if ! aws sns get-topic-attributes --topic-arn "$TOPIC_ARN" &> /dev/null; then
    print_error "SNS Topic não encontrado: $TOPIC_ARN"
    print_error "Execute o deploy primeiro: npm run deploy:${ENV}"
    exit 1
fi

print_info "SNS Topic encontrado!"

# Verificar se já existe subscription para este email
EXISTING_SUBSCRIPTION=$(aws sns list-subscriptions-by-topic \
    --topic-arn "$TOPIC_ARN" \
    --query "Subscriptions[?Endpoint=='${EMAIL}'].SubscriptionArn" \
    --output text)

if [ -n "$EXISTING_SUBSCRIPTION" ] && [ "$EXISTING_SUBSCRIPTION" != "None" ]; then
    print_warning "Subscription já existe para $EMAIL"
    print_info "Subscription ARN: $EXISTING_SUBSCRIPTION"
    
    # Verificar status
    STATUS=$(aws sns get-subscription-attributes \
        --subscription-arn "$EXISTING_SUBSCRIPTION" \
        --query "Attributes.PendingConfirmation" \
        --output text 2>/dev/null || echo "unknown")
    
    if [ "$STATUS" == "true" ]; then
        print_warning "Subscription está pendente de confirmação"
        print_info "Verifique o email $EMAIL e clique no link de confirmação"
    else
        print_info "Subscription está ativa!"
    fi
else
    # Criar subscription
    print_info "Criando subscription para $EMAIL..."
    
    SUBSCRIPTION_ARN=$(aws sns subscribe \
        --topic-arn "$TOPIC_ARN" \
        --protocol email \
        --notification-endpoint "$EMAIL" \
        --query "SubscriptionArn" \
        --output text)
    
    print_info "Subscription criada: $SUBSCRIPTION_ARN"
    print_warning "IMPORTANTE: Verifique o email $EMAIL e clique no link de confirmação!"
fi

# Listar todas as subscriptions
print_info "\nSubscriptions atuais para $TOPIC_NAME:"
aws sns list-subscriptions-by-topic \
    --topic-arn "$TOPIC_ARN" \
    --query "Subscriptions[*].[Protocol,Endpoint,SubscriptionArn]" \
    --output table

# Testar notificação
read -p "Deseja enviar uma notificação de teste? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Enviando notificação de teste..."
    
    aws sns publish \
        --topic-arn "$TOPIC_ARN" \
        --subject "Teste de Notificação - Fibonacci Alarms" \
        --message "Este é um teste de notificação do sistema de alarmes do Fibonacci.

Ambiente: $ENV
Data/Hora: $(date)

Se você recebeu este email, as notificações estão configuradas corretamente!

---
Fibonacci Ecosystem - Alquimista.AI"
    
    print_info "Notificação de teste enviada!"
    print_info "Verifique o email $EMAIL"
fi

# Mostrar alarmes configurados
print_info "\nAlarmes configurados para $ENV:"
aws cloudwatch describe-alarms \
    --alarm-name-prefix "fibonacci-" \
    --query "MetricAlarms[?contains(AlarmName, '${ENV}')].[AlarmName,StateValue]" \
    --output table

print_info "\n✅ Configuração concluída!"
print_info "\nPróximos passos:"
echo "1. Confirme a subscription no email $EMAIL (se ainda não confirmou)"
echo "2. Verifique os alarmes no console CloudWatch"
echo "3. Teste os alarmes com: npm run test:alarms"
echo ""
print_info "Para adicionar mais emails, execute:"
echo "  $0 $ENV <outro-email>"

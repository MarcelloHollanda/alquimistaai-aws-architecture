# Comandos Rápidos - Sistema de Billing

## 🚀 Início Rápido

### Ver Status Atual
```bash
cat docs/billing/PROGRESSO-IMPLEMENTACAO.md
```

### Ver Próximos Passos
```bash
cat docs/billing/PROXIMOS-PASSOS.md
```

### Ver Resumo da Sessão
```bash
cat docs/billing/RESUMO-SESSAO.md
```

---

## 💾 Database

### Executar Migration
```bash
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME \
  -f database/migrations/008_create_billing_tables.sql
```

### Verificar Tabelas Criadas
```bash
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME \
  -c "\dt" | grep -E "(commercial_requests|trials|payment_events|subscriptions)"
```

### Ver Estrutura das Tabelas
```bash
# Commercial Requests
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME \
  -c "\d commercial_requests"

# Trials
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME \
  -c "\d trials"

# Payment Events
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME \
  -c "\d payment_events"

# Subscriptions
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME \
  -c "\d subscriptions"
```

---

## 🔧 Backend

### Instalar Dependências
```bash
cd lambda/platform
npm install stripe pg aws-sdk
```

### Compilar TypeScript
```bash
cd lambda/platform
tsc --noEmit
```

### Testar Handler Localmente (SAM)
```bash
# Get Agents
sam local invoke GetAgentsFunction

# Commercial Contact
sam local invoke CommercialContactFunction \
  --event events/commercial-contact.json

# Trial Start
sam local invoke TrialStartFunction \
  --event events/trial-start.json

# Trial Invoke
sam local invoke TrialInvokeFunction \
  --event events/trial-invoke.json

# Create Checkout
sam local invoke CreateCheckoutFunction \
  --event events/create-checkout.json

# Get Subscription
sam local invoke GetSubscriptionFunction \
  --event events/get-subscription.json

# Webhook Payment
sam local invoke WebhookPaymentFunction \
  --event events/webhook-payment.json
```

### Criar Eventos de Teste
```bash
mkdir -p lambda/platform/events

# Exemplo: Commercial Contact
cat > lambda/platform/events/commercial-contact.json << 'EOF'
{
  "httpMethod": "POST",
  "body": "{\"companyName\":\"Empresa Teste\",\"contactName\":\"João Silva\",\"email\":\"joao@teste.com\",\"whatsapp\":\"84999999999\",\"selectedAgents\":[],\"selectedSubnucleos\":[\"saude\"],\"message\":\"Gostaria de mais informações\"}"
}
EOF

# Exemplo: Trial Start
cat > lambda/platform/events/trial-start.json << 'EOF'
{
  "httpMethod": "POST",
  "body": "{\"userId\":\"user-123\",\"targetType\":\"agent\",\"targetId\":\"agent-456\"}"
}
EOF
```

---

## 🎨 Frontend

### Instalar Dependências
```bash
cd frontend
npm install zustand
```

### Iniciar Dev Server
```bash
cd frontend
npm run dev
```

### Build de Produção
```bash
cd frontend
npm run build
```

### Verificar Tipos TypeScript
```bash
cd frontend
npx tsc --noEmit
```

### Testar Clients
```bash
cd frontend

# Criar arquivo de teste
cat > src/lib/__tests__/agents-client.test.ts << 'EOF'
import { listAgents, calculateMonthlyTotal } from '../agents-client';

describe('Agents Client', () => {
  it('should calculate monthly total', () => {
    const agents = [
      { id: '1', name: 'Agent 1', priceMonthly: 29.90 },
      { id: '2', name: 'Agent 2', priceMonthly: 29.90 },
    ];
    expect(calculateMonthlyTotal(agents)).toBe(59.80);
  });
});
EOF

# Executar testes
npm test
```

---

## ☁️ AWS / CDK

### Sintetizar Stack
```bash
cdk synth AlquimistaStack --context env=dev
```

### Deploy Stack
```bash
cdk deploy AlquimistaStack --context env=dev
```

### Listar Stacks
```bash
cdk list
```

### Ver Diff
```bash
cdk diff AlquimistaStack --context env=dev
```

### Destruir Stack (cuidado!)
```bash
cdk destroy AlquimistaStack --context env=dev
```

---

## 🔐 Secrets Manager

### Criar Secret para Stripe
```bash
# Secret Key
aws secretsmanager create-secret \
  --name /alquimista/dev/stripe/secret-key \
  --secret-string "sk_test_..." \
  --region us-east-1

# Webhook Secret
aws secretsmanager create-secret \
  --name /alquimista/dev/stripe/webhook-secret \
  --secret-string "whsec_..." \
  --region us-east-1
```

### Atualizar Secret
```bash
aws secretsmanager update-secret \
  --secret-id /alquimista/dev/stripe/secret-key \
  --secret-string "sk_test_novo..." \
  --region us-east-1
```

### Recuperar Secret
```bash
aws secretsmanager get-secret-value \
  --secret-id /alquimista/dev/stripe/secret-key \
  --region us-east-1 \
  --query SecretString \
  --output text
```

### Listar Secrets
```bash
aws secretsmanager list-secrets \
  --region us-east-1 \
  --query 'SecretList[?contains(Name, `alquimista`)].Name' \
  --output table
```

---

## 💳 Stripe

### Instalar Stripe CLI
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.0/stripe_1.19.0_linux_x86_64.tar.gz
tar -xvf stripe_1.19.0_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

### Login no Stripe
```bash
stripe login
```

### Testar Webhook Localmente
```bash
# Forward webhooks para localhost
stripe listen --forward-to localhost:3000/api/billing/webhook

# Em outro terminal, disparar evento de teste
stripe trigger checkout.session.completed
```

### Criar Webhook no Stripe
```bash
stripe webhooks create \
  --url https://api.alquimista.ai/api/billing/webhook \
  --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.payment_succeeded,invoice.payment_failed
```

### Listar Webhooks
```bash
stripe webhooks list
```

### Ver Logs de Webhooks
```bash
stripe webhooks tail
```

---

## 🧪 Testes

### Testar Endpoint de Agentes
```bash
curl -X GET https://api.alquimista.ai/api/agents
```

### Testar Contato Comercial
```bash
curl -X POST https://api.alquimista.ai/api/commercial/contact \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Empresa Teste",
    "contactName": "João Silva",
    "email": "joao@teste.com",
    "whatsapp": "84999999999",
    "selectedAgents": [],
    "selectedSubnucleos": ["saude"],
    "message": "Gostaria de mais informações"
  }'
```

### Testar Trial Start
```bash
curl -X POST https://api.alquimista.ai/api/trials/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "targetType": "agent",
    "targetId": "agent-456"
  }'
```

### Testar Trial Invoke
```bash
curl -X POST https://api.alquimista.ai/api/trials/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "targetType": "agent",
    "targetId": "agent-456",
    "message": "Olá, como você pode me ajudar?"
  }'
```

### Testar Create Checkout
```bash
curl -X POST https://api.alquimista.ai/api/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-123",
    "selectedAgents": ["agent-1", "agent-2"],
    "totalAmount": 59.80
  }'
```

### Testar Get Subscription
```bash
curl -X GET "https://api.alquimista.ai/api/billing/subscription?tenantId=tenant-123"
```

---

## 📊 Monitoramento

### Ver Logs do Lambda (CloudWatch)
```bash
# Get Agents
aws logs tail /aws/lambda/GetAgentsFunction --follow

# Commercial Contact
aws logs tail /aws/lambda/CommercialContactFunction --follow

# Trial Start
aws logs tail /aws/lambda/TrialStartFunction --follow

# Trial Invoke
aws logs tail /aws/lambda/TrialInvokeFunction --follow

# Create Checkout
aws logs tail /aws/lambda/CreateCheckoutFunction --follow

# Get Subscription
aws logs tail /aws/lambda/GetSubscriptionFunction --follow

# Webhook Payment
aws logs tail /aws/lambda/WebhookPaymentFunction --follow
```

### Ver Métricas do Lambda
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=GetAgentsFunction \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

---

## 🔍 Debug

### Ver Variáveis de Ambiente do Lambda
```bash
aws lambda get-function-configuration \
  --function-name GetAgentsFunction \
  --query 'Environment.Variables'
```

### Invocar Lambda Diretamente
```bash
aws lambda invoke \
  --function-name GetAgentsFunction \
  --payload '{"httpMethod":"GET"}' \
  response.json

cat response.json
```

### Ver Erros Recentes
```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/GetAgentsFunction \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '1 hour ago' +%s)000
```

---

## 📦 Deploy Completo

### Deploy Backend + Frontend
```bash
# 1. Deploy CDK (Backend)
cdk deploy AlquimistaStack --context env=dev

# 2. Build Frontend
cd frontend
npm run build

# 3. Deploy Frontend para S3
aws s3 sync out/ s3://alquimista-frontend-dev/ --delete

# 4. Invalidar CloudFront
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

---

## 🧹 Limpeza

### Remover Recursos AWS
```bash
# Destruir stack
cdk destroy AlquimistaStack --context env=dev

# Remover secrets
aws secretsmanager delete-secret \
  --secret-id /alquimista/dev/stripe/secret-key \
  --force-delete-without-recovery

aws secretsmanager delete-secret \
  --secret-id /alquimista/dev/stripe/webhook-secret \
  --force-delete-without-recovery
```

### Limpar Build Local
```bash
# Backend
cd lambda/platform
rm -rf node_modules
rm -rf dist

# Frontend
cd frontend
rm -rf node_modules
rm -rf .next
rm -rf out
```

---

## 📝 Notas

### Variáveis de Ambiente Importantes
```bash
export DATABASE_HOST="..."
export DATABASE_NAME="alquimista_dev"
export DATABASE_USER="..."
export DATABASE_PASSWORD="..."
export AWS_REGION="us-east-1"
export STRIPE_SECRET_KEY="sk_test_..."
export STRIPE_WEBHOOK_SECRET="whsec_..."
export FRONTEND_URL="https://alquimista.ai"
```

### Aliases Úteis
```bash
# Adicionar ao ~/.bashrc ou ~/.zshrc
alias billing-status="cat docs/billing/PROGRESSO-IMPLEMENTACAO.md"
alias billing-next="cat docs/billing/PROXIMOS-PASSOS.md"
alias billing-logs="aws logs tail /aws/lambda/GetAgentsFunction --follow"
alias billing-deploy="cdk deploy AlquimistaStack --context env=dev"
```

---

**Última Atualização**: 2025-11-17

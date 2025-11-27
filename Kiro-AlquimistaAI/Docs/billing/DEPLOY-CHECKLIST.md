# ✅ Checklist de Deploy - Sistema de Checkout e Pagamento

## 📋 Pré-Deploy

### 1. Configuração do Stripe

#### 1.1 Criar Conta Stripe
- [ ] Criar conta no [Stripe Dashboard](https://dashboard.stripe.com)
- [ ] Ativar modo de produção
- [ ] Configurar informações da empresa
- [ ] Adicionar conta bancária para recebimentos

#### 1.2 Criar Produto e Preço
- [ ] Criar produto "Agente AlquimistaAI"
  - Nome: "Agente AlquimistaAI"
  - Descrição: "Agente de IA especializado para automação"
- [ ] Criar preço recorrente
  - Valor: R$ 29,90
  - Periodicidade: Mensal
  - Moeda: BRL
- [ ] Copiar Price ID (ex: `price_1234567890`)
- [ ] Salvar em variável de ambiente: `STRIPE_AGENT_PRICE_ID`

#### 1.3 Obter API Keys
- [ ] Copiar Publishable Key (pk_live_...)
- [ ] Copiar Secret Key (sk_live_...)
- [ ] **NUNCA** commitar as keys no código

### 2. Configuração AWS

#### 2.1 Secrets Manager - Dev
```bash
# Stripe Secret Key
aws secretsmanager create-secret \
  --name /alquimista/dev/stripe/secret-key \
  --secret-string "sk_test_..." \
  --region us-east-1

# Stripe Webhook Secret (será preenchido após criar webhook)
aws secretsmanager create-secret \
  --name /alquimista/dev/stripe/webhook-secret \
  --secret-string "whsec_..." \
  --region us-east-1

# Stripe Publishable Key
aws secretsmanager create-secret \
  --name /alquimista/dev/stripe/publishable-key \
  --secret-string "pk_test_..." \
  --region us-east-1
```

- [ ] Secret Key criado em dev
- [ ] Webhook Secret criado em dev (placeholder)
- [ ] Publishable Key criado em dev

#### 2.2 Secrets Manager - Prod
```bash
# Stripe Secret Key
aws secretsmanager create-secret \
  --name /alquimista/prod/stripe/secret-key \
  --secret-string "sk_live_..." \
  --region us-east-1

# Stripe Webhook Secret (será preenchido após criar webhook)
aws secretsmanager create-secret \
  --name /alquimista/prod/stripe/webhook-secret \
  --secret-string "whsec_..." \
  --region us-east-1

# Stripe Publishable Key
aws secretsmanager create-secret \
  --name /alquimista/prod/stripe/publishable-key \
  --secret-string "pk_live_..." \
  --region us-east-1
```

- [ ] Secret Key criado em prod
- [ ] Webhook Secret criado em prod (placeholder)
- [ ] Publishable Key criado em prod

#### 2.3 Variáveis de Ambiente
Criar arquivo `.env.local` (não commitar):
```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_AGENT_PRICE_ID=price_...

# Frontend
FRONTEND_URL=https://app.alquimista.ai
```

- [ ] Arquivo .env.local criado
- [ ] Variáveis configuradas
- [ ] Arquivo adicionado ao .gitignore

### 3. Database

#### 3.1 Aplicar Migrations - Dev
```bash
# Conectar ao Aurora Dev
psql -h alquimista-aurora-dev.cluster-xxxxx.us-east-1.rds.amazonaws.com \
     -U admin \
     -d alquimista_dev

# Aplicar migration
\i database/migrations/008_create_billing_tables.sql

# Verificar tabelas criadas
\dt
```

- [ ] Migration aplicada em dev
- [ ] Tabelas criadas:
  - [ ] subscriptions
  - [ ] subscription_intents
  - [ ] subscription_items
  - [ ] payment_events
  - [ ] trials
  - [ ] commercial_requests

#### 3.2 Aplicar Migrations - Prod
```bash
# Conectar ao Aurora Prod
psql -h alquimista-aurora-prod.cluster-xxxxx.us-east-1.rds.amazonaws.com \
     -U admin \
     -d alquimista_prod

# Aplicar migration
\i database/migrations/008_create_billing_tables.sql

# Verificar tabelas criadas
\dt
```

- [ ] Migration aplicada em prod
- [ ] Tabelas criadas (mesma lista acima)
- [ ] Backup do banco realizado antes da migration

### 4. Código

#### 4.1 Validação de Código
```bash
# Compilar TypeScript
npm run build

# Executar testes
npm test

# Verificar linting
npm run lint
```

- [ ] Código compila sem erros
- [ ] Todos os testes passando (32/32)
- [ ] Sem warnings críticos
- [ ] Linting OK

#### 4.2 Validação de Dependências
```bash
# Verificar vulnerabilidades
npm audit

# Atualizar dependências críticas se necessário
npm audit fix
```

- [ ] Sem vulnerabilidades críticas
- [ ] Dependências atualizadas

## 🚀 Deploy

### 5. Deploy Backend - Dev

#### 5.1 Sintetizar Stack
```bash
npm run build
cdk synth AlquimistaStack-dev --context env=dev
```

- [ ] Síntese bem-sucedida
- [ ] Template CloudFormation gerado

#### 5.2 Deploy
```bash
cdk deploy AlquimistaStack-dev --context env=dev
```

- [ ] Deploy bem-sucedido
- [ ] Lambdas criadas:
  - [ ] alquimista-create-checkout-session-dev
  - [ ] alquimista-webhook-payment-dev
  - [ ] alquimista-get-subscription-dev
  - [ ] alquimista-trial-start-dev
  - [ ] alquimista-trial-invoke-dev
  - [ ] alquimista-commercial-contact-dev
- [ ] Rotas criadas no API Gateway:
  - [ ] POST /api/billing/create-checkout-session
  - [ ] POST /api/billing/webhook
  - [ ] GET /api/billing/subscription
  - [ ] POST /api/trials/start
  - [ ] POST /api/trials/invoke
  - [ ] POST /api/commercial/contact

#### 5.3 Obter Outputs
```bash
aws cloudformation describe-stacks \
  --stack-name AlquimistaStack-dev \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

- [ ] API Gateway URL obtida
- [ ] Lambda ARNs obtidos
- [ ] Outputs salvos para referência

### 6. Configurar Webhook no Stripe - Dev

#### 6.1 Criar Endpoint
1. Ir em [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Clicar em "Add endpoint"
3. Configurar:
   - **Endpoint URL:** `https://api-dev.alquimista.ai/api/billing/webhook`
   - **Description:** "AlquimistaAI Billing Webhook - Dev"
   - **Events to send:**
     - [x] checkout.session.completed
     - [x] invoice.payment_succeeded
     - [x] invoice.payment_failed
     - [x] customer.subscription.updated
     - [x] customer.subscription.deleted
4. Clicar em "Add endpoint"
5. Copiar "Signing secret" (whsec_...)

- [ ] Webhook criado no Stripe
- [ ] Signing secret copiado

#### 6.2 Atualizar Secret Manager
```bash
aws secretsmanager update-secret \
  --secret-id /alquimista/dev/stripe/webhook-secret \
  --secret-string "whsec_..." \
  --region us-east-1
```

- [ ] Webhook secret atualizado

#### 6.3 Testar Webhook
```bash
# Usar Stripe CLI
stripe listen --forward-to https://api-dev.alquimista.ai/api/billing/webhook

# Em outro terminal, disparar evento de teste
stripe trigger checkout.session.completed
```

- [ ] Webhook recebido
- [ ] Evento processado com sucesso
- [ ] Logs no CloudWatch OK

### 7. Deploy Frontend - Dev

#### 7.1 Build
```bash
cd frontend

# Configurar variáveis de ambiente
export NEXT_PUBLIC_API_URL=https://api-dev.alquimista.ai
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Build
npm run build
```

- [ ] Build bem-sucedido
- [ ] Sem erros de compilação

#### 7.2 Deploy para S3
```bash
aws s3 sync out/ s3://alquimista-frontend-dev/ --delete
```

- [ ] Arquivos enviados para S3
- [ ] CloudFront invalidation criada

#### 7.3 Testar Frontend
- [ ] Acessar https://app-dev.alquimista.ai
- [ ] Página de checkout carrega
- [ ] Seleção de agentes funciona
- [ ] Botão "Pagar" redireciona para Stripe

### 8. Testes em Dev

#### 8.1 Teste de Checkout
1. Acessar https://app-dev.alquimista.ai/app/billing/checkout
2. Selecionar 2 agentes
3. Clicar em "Pagar com cartão de crédito"
4. Usar cartão de teste: `4242 4242 4242 4242`
5. Completar pagamento
6. Verificar redirecionamento para página de sucesso

- [ ] Checkout funciona
- [ ] Redirecionamento OK
- [ ] Subscription criada no banco

#### 8.2 Teste de Webhook
1. Verificar logs da Lambda webhook-payment
2. Verificar evento registrado em payment_events
3. Verificar subscription ativada

- [ ] Webhook processado
- [ ] Evento registrado
- [ ] Subscription ativa

#### 8.3 Teste de Trial
1. Acessar página de agentes
2. Clicar em "Teste nossa IA"
3. Fazer 3 interações
4. Verificar contador de tokens

- [ ] Trial funciona
- [ ] Contador atualiza
- [ ] Limite respeitado

#### 8.4 Teste de Contato Comercial
1. Acessar formulário de contato
2. Preencher dados
3. Enviar solicitação
4. Verificar e-mail recebido

- [ ] Formulário funciona
- [ ] E-mail enviado
- [ ] Registro no banco

### 9. Deploy Produção

#### 9.1 Checklist Pré-Produção
- [ ] Todos os testes em dev passando
- [ ] Sem erros críticos nos logs
- [ ] Métricas CloudWatch OK
- [ ] Backup do banco de produção realizado
- [ ] Plano de rollback preparado

#### 9.2 Deploy Backend - Prod
```bash
npm run build
cdk deploy AlquimistaStack-prod --context env=prod
```

- [ ] Deploy bem-sucedido
- [ ] Lambdas criadas em prod
- [ ] Rotas criadas em prod

#### 9.3 Configurar Webhook - Prod
1. Criar webhook no Stripe (modo live)
2. URL: `https://api.alquimista.ai/api/billing/webhook`
3. Copiar signing secret
4. Atualizar Secrets Manager

- [ ] Webhook criado em prod
- [ ] Secret atualizado

#### 9.4 Deploy Frontend - Prod
```bash
cd frontend
export NEXT_PUBLIC_API_URL=https://api.alquimista.ai
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
npm run build
aws s3 sync out/ s3://alquimista-frontend-prod/ --delete
```

- [ ] Frontend deployado em prod

### 10. Validação Pós-Deploy

#### 10.1 Smoke Tests
```bash
# Testar health check
curl https://api.alquimista.ai/health

# Testar criação de checkout (com token válido)
curl -X POST https://api.alquimista.ai/api/billing/create-checkout-session \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"test","selectedAgents":["agent-1"],"userEmail":"test@example.com"}'
```

- [ ] Health check OK
- [ ] API respondendo
- [ ] Latência < 1s

#### 10.2 Verificar Métricas
- [ ] CloudWatch Logs funcionando
- [ ] Métricas sendo coletadas
- [ ] Alarmes configurados

#### 10.3 Teste Real de Pagamento
**ATENÇÃO:** Usar cartão real em produção!

1. Fazer checkout com valor mínimo
2. Completar pagamento
3. Verificar subscription criada
4. Verificar webhook processado
5. Verificar e-mail de confirmação

- [ ] Pagamento processado
- [ ] Subscription ativa
- [ ] Webhook OK

## 📊 Monitoramento Pós-Deploy

### 11. Primeiras 24 Horas

#### 11.1 Monitorar Logs
```bash
# Logs de checkout
aws logs tail /aws/lambda/alquimista-create-checkout-session-prod --follow

# Logs de webhook
aws logs tail /aws/lambda/alquimista-webhook-payment-prod --follow
```

- [ ] Sem erros críticos
- [ ] Latência dentro do esperado
- [ ] Taxa de sucesso > 99%

#### 11.2 Monitorar Métricas
- [ ] CheckoutSessionsCreated
- [ ] CheckoutSessionsCompleted
- [ ] WebhookEventsProcessed
- [ ] PaymentErrors

#### 11.3 Verificar Alarmes
- [ ] Nenhum alarme disparado
- [ ] Thresholds apropriados

### 12. Primeira Semana

#### 12.1 Análise de Dados
- [ ] Número de checkouts iniciados
- [ ] Taxa de conversão
- [ ] Taxa de abandono
- [ ] Tempo médio de checkout

#### 12.2 Feedback de Usuários
- [ ] Coletar feedback
- [ ] Identificar problemas
- [ ] Priorizar melhorias

#### 12.3 Otimizações
- [ ] Ajustar alarmes se necessário
- [ ] Otimizar queries lentas
- [ ] Melhorar UX baseado em feedback

## 🆘 Rollback

### Plano de Rollback

Se algo der errado:

#### Backend
```bash
# Reverter para versão anterior
cdk deploy AlquimistaStack-prod --context env=prod --rollback
```

#### Frontend
```bash
# Restaurar versão anterior do S3
aws s3 sync s3://alquimista-frontend-prod-backup/ s3://alquimista-frontend-prod/
```

#### Database
```bash
# Restaurar backup
# (procedimento específico do Aurora)
```

- [ ] Plano de rollback testado em dev
- [ ] Backups disponíveis
- [ ] Equipe treinada

## ✅ Checklist Final

### Pré-Deploy
- [ ] Stripe configurado
- [ ] AWS Secrets Manager configurado
- [ ] Database migrations aplicadas
- [ ] Código validado
- [ ] Testes passando

### Deploy
- [ ] Backend deployado em dev
- [ ] Frontend deployado em dev
- [ ] Testes em dev OK
- [ ] Backend deployado em prod
- [ ] Frontend deployado em prod
- [ ] Webhooks configurados

### Pós-Deploy
- [ ] Smoke tests OK
- [ ] Métricas funcionando
- [ ] Alarmes configurados
- [ ] Monitoramento ativo
- [ ] Documentação atualizada

### Validação
- [ ] Pagamento real testado
- [ ] Webhook funcionando
- [ ] Trials funcionando
- [ ] Contato comercial funcionando
- [ ] Sem erros críticos

## 📞 Contatos de Emergência

**Equipe Técnica:**
- Email: alquimistafibonacci@gmail.com
- WhatsApp: +55 84 99708-4444

**Stripe Support:**
- Email: support@stripe.com
- Dashboard: https://dashboard.stripe.com

**AWS Support:**
- Console: https://console.aws.amazon.com/support

---

**Status:** ⏳ Aguardando Deploy  
**Última Atualização:** 2024  
**Versão:** 1.0.0

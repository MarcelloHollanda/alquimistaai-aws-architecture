# Guia Rápido de Implementação - Sistema de Checkout

## 🎯 Objetivo

Implementar sistema de checkout seguro com Stripe para assinatura de planos e agentes AlquimistaAI.

## 📋 Checklist Rápido

### Pré-requisitos
- [ ] Conta Stripe criada (test mode)
- [ ] Secrets configurados no AWS Secrets Manager
- [ ] Tabelas de banco de dados existentes (migrations 008, 009)
- [ ] API Gateway configurado

### Fase 1: Setup (Tarefas 1-4)
- [ ] Criar interfaces TypeScript
- [ ] Implementar billing-client.ts
- [ ] Implementar get-subscription.ts
- [ ] Configurar Stripe SDK

### Fase 2: Checkout (Tarefas 5-6)
- [ ] Implementar create-checkout-session.ts
- [ ] Criar página de checkout com componentes

### Fase 3: Pós-Pagamento (Tarefas 7-8)
- [ ] Criar página de sucesso
- [ ] Criar página de cancelamento

### Fase 4: Webhooks (Tarefa 9)
- [ ] Implementar webhook-payment.ts
- [ ] Processar eventos do Stripe

### Fase 5: Finalização (Tarefas 10-15)
- [ ] Configurar rotas e observabilidade
- [ ] Testes E2E
- [ ] Deploy

## 🚀 Quick Start

### 1. Configurar Stripe

```bash
# Criar secrets no AWS Secrets Manager
aws secretsmanager create-secret \
  --name /alquimista/dev/stripe/secret-key \
  --secret-string "sk_test_..."

aws secretsmanager create-secret \
  --name /alquimista/dev/stripe/webhook-secret \
  --secret-string "whsec_..."
```

### 2. Instalar Dependências

```bash
# Backend
cd lambda/platform
npm install stripe

# Frontend
cd frontend
npm install
```

### 3. Criar Estrutura de Arquivos

```bash
# Frontend
frontend/src/lib/billing-client.ts
frontend/src/app/(dashboard)/billing/checkout/page.tsx
frontend/src/app/(dashboard)/billing/success/page.tsx
frontend/src/app/(dashboard)/billing/cancel/page.tsx

# Backend
lambda/platform/get-subscription.ts
lambda/platform/create-checkout-session.ts
lambda/platform/webhook-payment.ts
```

## 🔑 Pontos Críticos de Segurança

### ✅ FAZER
- Usar Stripe Checkout hospedado
- Validar assinaturas de webhooks
- Armazenar apenas IDs do Stripe
- Usar HTTPS em todas as comunicações
- Implementar rate limiting

### ❌ NUNCA FAZER
- Armazenar número de cartão
- Armazenar CVV
- Armazenar data de validade
- Processar cartão no backend
- Expor API keys no frontend

## 📊 Fluxo Visual

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  /billing/checkout      │
│  - Exibe resumo         │
│  - Botão "Pagar"        │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  POST /create-checkout  │
│  - Cria sessão Stripe   │
│  - Retorna URL          │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Stripe Checkout        │
│  (hospedado)            │
│  - Cliente paga         │
└──────┬──────────────────┘
       │
       ├─── Sucesso ───────┐
       │                   ▼
       │            ┌──────────────┐
       │            │  /success    │
       │            └──────────────┘
       │
       └─── Cancelado ────┐
                          ▼
                   ┌──────────────┐
                   │  /cancel     │
                   └──────────────┘

       ┌─────────────────────────┐
       │  Webhook (assíncrono)   │
       │  - Atualiza subscription│
       │  - Registra evento      │
       └─────────────────────────┘
```

## 🧪 Testes Essenciais

### Teste 1: Checkout Bem-Sucedido
```typescript
// 1. Acessar /billing/checkout
// 2. Verificar exibição de dados
// 3. Clicar "Pagar"
// 4. Verificar redirecionamento para Stripe
// 5. Usar cartão de teste: 4242 4242 4242 4242
// 6. Verificar redirecionamento para /success
```

### Teste 2: Checkout Cancelado
```typescript
// 1. Acessar /billing/checkout
// 2. Clicar "Pagar"
// 3. Cancelar no Stripe
// 4. Verificar redirecionamento para /cancel
```

### Teste 3: Webhook
```typescript
// 1. Usar Stripe CLI para enviar evento de teste
// stripe trigger checkout.session.completed
// 2. Verificar atualização no banco de dados
// 3. Verificar registro em payment_events
```

## 📝 Cartões de Teste Stripe

```
Sucesso: 4242 4242 4242 4242
Falha:   4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184

CVV: Qualquer 3 dígitos
Data: Qualquer data futura
```

## 🔍 Debugging

### Verificar Logs
```bash
# CloudWatch Logs
aws logs tail /aws/lambda/create-checkout-session --follow

# Stripe Dashboard
# Acessar: https://dashboard.stripe.com/test/logs
```

### Verificar Webhooks
```bash
# Stripe CLI
stripe listen --forward-to localhost:3000/api/billing/webhook

# Testar webhook
stripe trigger checkout.session.completed
```

### Verificar Banco de Dados
```sql
-- Ver assinaturas
SELECT * FROM subscriptions WHERE tenant_id = 'xxx';

-- Ver eventos de pagamento
SELECT * FROM payment_events WHERE tenant_id = 'xxx' ORDER BY created_at DESC;
```

## 🚨 Troubleshooting

### Erro: "Invalid API Key"
- Verificar secret no Secrets Manager
- Verificar permissões IAM da Lambda
- Verificar variável de ambiente STRIPE_SECRET_KEY

### Erro: "Webhook signature verification failed"
- Verificar STRIPE_WEBHOOK_SECRET
- Verificar que o body não foi modificado
- Verificar header stripe-signature

### Erro: "Subscription not found"
- Verificar que tenant existe
- Verificar que subscription foi criada
- Verificar query SQL

## 📚 Recursos Úteis

- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks/test)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [PCI Compliance](https://stripe.com/docs/security/guide)

## 🎓 Boas Práticas

1. **Sempre validar entrada** - Nunca confiar em dados do cliente
2. **Usar idempotency keys** - Evitar duplicação de sessões
3. **Implementar retry logic** - Para chamadas à API Stripe
4. **Logar tudo** - Mas nunca dados sensíveis
5. **Monitorar métricas** - Taxa de sucesso, latência, erros
6. **Testar webhooks** - Usar Stripe CLI em desenvolvimento
7. **Documentar** - Manter README atualizado

## ⚡ Performance

- Cache de dados de planos: 5 minutos
- Timeout de Lambda: 30 segundos
- Connection pooling: Habilitado
- Retry logic: 3 tentativas com backoff exponencial

## 📞 Suporte

Em caso de dúvidas:
1. Revisar documentação da spec
2. Consultar Stripe Docs
3. Verificar logs no CloudWatch
4. Testar com Stripe CLI

---

**Última atualização:** 2025-01-18
**Versão da Spec:** 1.0.0

# Configuração de Webhook no Stripe Dashboard

## Guia Passo a Passo

### 1. Acessar Stripe Dashboard

1. Acesse [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Faça login com suas credenciais
3. **IMPORTANTE:** Certifique-se de estar no ambiente correto:
   - **Test mode** para desenvolvimento
   - **Live mode** para produção

### 2. Navegar para Webhooks

1. No menu lateral, clique em **Developers**
2. Clique em **Webhooks**
3. Clique no botão **Add endpoint**

### 3. Configurar Endpoint

#### URL do Endpoint

**Desenvolvimento:**
```
https://api-dev.alquimistaai.com/api/billing/webhook
```

**Produção:**
```
https://api.alquimistaai.com/api/billing/webhook
```

#### Descrição (opcional)
```
AlquimistaAI Billing Webhook - Processa eventos de pagamento e assinatura
```

#### Versão da API
- Selecione a versão mais recente disponível
- Recomendado: `2024-11-20.acacia` ou superior

### 4. Selecionar Eventos

Marque os seguintes eventos:

#### Checkout
- ✅ `checkout.session.completed` - Checkout concluído com sucesso

#### Customer
- ✅ `customer.subscription.created` - Assinatura criada
- ✅ `customer.subscription.updated` - Assinatura atualizada
- ✅ `customer.subscription.deleted` - Assinatura cancelada

#### Invoice
- ✅ `invoice.payment_succeeded` - Pagamento de fatura bem-sucedido
- ✅ `invoice.payment_failed` - Falha no pagamento de fatura

**Total:** 6 eventos selecionados

### 5. Salvar Endpoint

1. Clique em **Add endpoint**
2. O Stripe irá criar o webhook e gerar um **Signing Secret**

### 6. Copiar Signing Secret

1. Na página do webhook recém-criado, localize a seção **Signing secret**
2. Clique em **Reveal** para exibir o secret
3. Copie o valor (começa com `whsec_...`)

**Exemplo:**
```
whsec_1234567890abcdefghijklmnopqrstuvwxyz
```

### 7. Armazenar no AWS Secrets Manager

#### Desenvolvimento

```bash
aws secretsmanager create-secret \
  --name /alquimista/dev/stripe/webhook-secret \
  --secret-string "whsec_..." \
  --region us-east-1 \
  --description "Stripe webhook signing secret for development"
```

#### Produção

```bash
aws secretsmanager create-secret \
  --name /alquimista/prod/stripe/webhook-secret \
  --secret-string "whsec_..." \
  --region us-east-1 \
  --description "Stripe webhook signing secret for production"
```

### 8. Testar Webhook

#### Opção 1: Usar Stripe Dashboard

1. Na página do webhook, clique em **Send test webhook**
2. Selecione um evento (ex: `checkout.session.completed`)
3. Clique em **Send test webhook**
4. Verifique se o status é **Succeeded**

#### Opção 2: Usar Stripe CLI

```bash
# Instalar Stripe CLI
# Windows (via Scoop)
scoop install stripe

# macOS (via Homebrew)
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Encaminhar webhooks para localhost (desenvolvimento)
stripe listen --forward-to http://localhost:3000/api/billing/webhook

# Enviar evento de teste
stripe trigger checkout.session.completed
```

### 9. Verificar Logs

#### CloudWatch Logs

```bash
# Ver logs da Lambda de webhook
aws logs tail /aws/lambda/webhook-payment-dev --follow
```

#### Stripe Dashboard

1. Na página do webhook, clique na aba **Attempts**
2. Verifique os eventos recentes e seus status
3. Clique em um evento para ver detalhes da requisição e resposta

### 10. Monitorar Webhook

#### Métricas a Observar

- **Success rate:** Deve estar > 95%
- **Response time:** Deve estar < 3 segundos
- **Failed attempts:** Deve estar próximo de 0

#### Configurar Alertas no Stripe

1. Na página do webhook, clique em **Settings**
2. Configure **Email notifications** para:
   - Webhook disabled (se muitas falhas)
   - Webhook endpoint down

---

## Troubleshooting

### Webhook Retornando 401 Unauthorized

**Causa:** Assinatura do webhook inválida

**Solução:**
1. Verifique se o signing secret está correto no Secrets Manager
2. Certifique-se de que o header `stripe-signature` está sendo enviado
3. Verifique se o body da requisição não foi modificado

### Webhook Retornando 500 Internal Server Error

**Causa:** Erro no processamento do evento

**Solução:**
1. Verifique os logs do CloudWatch
2. Verifique se o banco de dados está acessível
3. Verifique se as permissões IAM estão corretas

### Webhook Não Recebendo Eventos

**Causa:** URL incorreta ou firewall bloqueando

**Solução:**
1. Verifique se a URL está correta
2. Certifique-se de que o API Gateway está público
3. Verifique se não há WAF bloqueando requisições do Stripe

### Eventos Duplicados

**Causa:** Stripe reenvia eventos se não receber resposta 200

**Solução:**
1. Implementar idempotência no handler
2. Verificar `event.id` antes de processar
3. Retornar 200 OK rapidamente

---

## Configuração Avançada

### Retry Logic

O Stripe tenta reenviar webhooks falhados automaticamente:
- Tentativa 1: Imediatamente
- Tentativa 2: Após 1 hora
- Tentativa 3: Após 3 horas
- Tentativa 4: Após 6 horas
- Tentativa 5: Após 12 horas
- Tentativa 6: Após 24 horas

**Total:** 6 tentativas em 3 dias

### Webhook Signature Verification

O handler já implementa verificação de assinatura:

```typescript
const signature = event.headers['stripe-signature'];
const stripeEvent = stripe.webhooks.constructEvent(
  event.body,
  signature,
  webhookSecret
);
```

### Idempotência

Implementar verificação de eventos duplicados:

```typescript
// Verificar se evento já foi processado
const existingEvent = await query(
  'SELECT id FROM webhook_events WHERE stripe_event_id = $1',
  [stripeEvent.id]
);

if (existingEvent.rows.length > 0) {
  logger.info('Event already processed', { eventId: stripeEvent.id });
  return { statusCode: 200, body: JSON.stringify({ received: true }) };
}

// Registrar evento
await query(
  'INSERT INTO webhook_events (stripe_event_id, event_type, processed_at) VALUES ($1, $2, NOW())',
  [stripeEvent.id, stripeEvent.type]
);
```

---

## Checklist de Configuração

### Desenvolvimento

- [ ] Criar webhook endpoint no Stripe Dashboard (test mode)
- [ ] Configurar URL: `https://api-dev.alquimistaai.com/api/billing/webhook`
- [ ] Selecionar 6 eventos necessários
- [ ] Copiar signing secret
- [ ] Armazenar secret no Secrets Manager (dev)
- [ ] Testar com Stripe CLI
- [ ] Verificar logs no CloudWatch
- [ ] Validar eventos no Stripe Dashboard

### Produção

- [ ] Criar webhook endpoint no Stripe Dashboard (live mode)
- [ ] Configurar URL: `https://api.alquimistaai.com/api/billing/webhook`
- [ ] Selecionar 6 eventos necessários
- [ ] Copiar signing secret
- [ ] Armazenar secret no Secrets Manager (prod)
- [ ] Testar com evento real
- [ ] Configurar alertas de falha
- [ ] Monitorar métricas
- [ ] Documentar runbook

---

## Referências

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Webhook Signatures](https://stripe.com/docs/webhooks/signatures)

---

## Contatos de Suporte

**Stripe Support:**
- Dashboard: [https://support.stripe.com](https://support.stripe.com)
- Email: support@stripe.com

**AlquimistaAI DevOps:**
- Email: devops@alquimistaai.com
- Slack: #devops-alerts

---

**Última atualização:** 2025-01-18

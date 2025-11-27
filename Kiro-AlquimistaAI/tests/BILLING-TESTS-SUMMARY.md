# Resumo dos Testes - Sistema de Billing

## Visão Geral

Este documento descreve os testes implementados para o sistema de checkout e pagamento da AlquimistaAI.

## Estrutura de Testes

```
tests/
├── unit/
│   └── get-subscription.test.ts          # Testes unitários do handler de subscription
├── integration/
│   ├── create-checkout-session.test.ts   # Testes de integração do checkout
│   └── webhook-payment.test.ts           # Testes de integração dos webhooks
└── e2e/
    └── (testes end-to-end futuros)
```

## Testes Implementados

### 1. Testes de Integração - Create Checkout Session

**Arquivo:** `tests/integration/create-checkout-session.test.ts`

**Cobertura:**
- ✅ Validação de dados de entrada
  - Body ausente
  - TenantId ausente
  - SelectedAgents vazio
  - Email inválido
- ✅ Criação de sessão com dados válidos
  - Criação bem-sucedida
  - Tenant não encontrado
  - Agentes não existem
- ✅ Tratamento de erros do Stripe
  - StripeCardError
  - StripeInvalidRequestError
  - Erros genéricos
- ✅ Cálculo de valores
  - 1 agente (R$ 29,90)
  - 5 agentes (R$ 149,50)

**Comandos:**
```bash
# Executar apenas estes testes
npm run test:integration -- create-checkout-session

# Com cobertura
npm run test:integration -- create-checkout-session --coverage
```

### 2. Testes de Integração - Webhook Payment

**Arquivo:** `tests/integration/webhook-payment.test.ts`

**Cobertura:**
- ✅ Validação de assinatura
  - Body ausente
  - Signature ausente
  - Webhook secret não configurado
  - Assinatura inválida
- ✅ Processamento de checkout.session.completed
  - Evento processado com sucesso
  - Subscription intent não encontrado
- ✅ Processamento de invoice.payment_succeeded
  - Pagamento bem-sucedido
  - Invoice sem subscription
- ✅ Processamento de invoice.payment_failed
  - Falha de pagamento registrada
- ✅ Processamento de customer.subscription.updated
  - Atualização de subscription
- ✅ Processamento de customer.subscription.deleted
  - Cancelamento de subscription
- ✅ Idempotência
  - Mesmo evento processado múltiplas vezes
- ✅ Eventos não tratados
  - Retorno de sucesso sem processamento

**Comandos:**
```bash
# Executar apenas estes testes
npm run test:integration -- webhook-payment

# Com cobertura
npm run test:integration -- webhook-payment --coverage
```

### 3. Testes Unitários - Get Subscription

**Arquivo:** `tests/unit/get-subscription.test.ts`

**Cobertura:**
- ✅ Busca de subscription existente
- ✅ Subscription não encontrada
- ✅ Cálculo de valores
- ✅ Formatação de resposta

**Comandos:**
```bash
# Executar apenas estes testes
npm run test:unit -- get-subscription

# Com cobertura
npm run test:unit -- get-subscription --coverage
```

## Executando Todos os Testes

### Testes Unitários
```bash
npm run test:unit
```

### Testes de Integração
```bash
npm run test:integration
```

### Todos os Testes
```bash
npm test
```

### Com Cobertura
```bash
npm test -- --coverage
```

## Mocks Utilizados

### Stripe Client
- `createCheckoutSession`: Mock da criação de sessão de checkout
- `createOrGetCustomer`: Mock da criação/busca de customer
- `constructWebhookEvent`: Mock da validação de webhook

### Database
- `query`: Mock de todas as queries ao banco de dados

## Cenários de Teste

### Cenários Positivos
1. ✅ Criação de checkout session com 1 agente
2. ✅ Criação de checkout session com múltiplos agentes
3. ✅ Processamento de webhook de checkout completado
4. ✅ Processamento de webhook de pagamento bem-sucedido
5. ✅ Atualização de subscription via webhook

### Cenários Negativos
1. ✅ Validação de dados inválidos
2. ✅ Tenant não encontrado
3. ✅ Agentes não existem
4. ✅ Erros do Stripe
5. ✅ Webhook com assinatura inválida
6. ✅ Falha de pagamento

### Cenários de Edge Cases
1. ✅ Invoice sem subscription
2. ✅ Subscription intent não encontrado
3. ✅ Eventos não tratados
4. ✅ Idempotência de webhooks

## Métricas de Cobertura

**Meta:** 80% de cobertura em:
- Branches
- Functions
- Lines
- Statements

**Comandos para verificar:**
```bash
npm test -- --coverage --coverageReporters=text-summary
```

## Próximos Passos

### Testes E2E (Futuros)
- [ ] Fluxo completo de checkout
- [ ] Fluxo de cancelamento
- [ ] Fluxo de alteração de plano
- [ ] Integração com Stripe em ambiente de teste

### Melhorias
- [ ] Adicionar testes de performance
- [ ] Adicionar testes de carga
- [ ] Adicionar testes de segurança
- [ ] Implementar testes de regressão

## Troubleshooting

### Erro: "Cannot find module"
```bash
npm install
npm run build
```

### Erro: "Timeout"
Aumentar o timeout no jest.config.js:
```javascript
testTimeout: 60000 // 60 segundos
```

### Erro: "Mock not working"
Verificar se os mocks estão sendo limpos:
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

## Referências

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Stripe Testing](https://stripe.com/docs/testing)
- [AWS Lambda Testing](https://docs.aws.amazon.com/lambda/latest/dg/testing-functions.html)

## Contato

Para dúvidas sobre os testes, consulte:
- Documentação do projeto: `docs/billing/`
- Spec do sistema: `.kiro/specs/checkout-payment-system/`

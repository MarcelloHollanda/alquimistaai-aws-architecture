# Sistema de Checkout e Pagamento - AlquimistaAI

## Visão Geral

Esta spec define a implementação completa do sistema de checkout e pagamento com cartão de crédito para a plataforma AlquimistaAI, utilizando Stripe como provedor de pagamento e seguindo rigorosamente os padrões de segurança PCI-DSS.

## Status

✅ **Requirements:** Completo
✅ **Design:** Completo
✅ **Tasks:** Completo
⏳ **Implementation:** Pendente

## Documentos

- [requirements.md](./requirements.md) - Requisitos funcionais e não-funcionais (EARS + INCOSE)
- [design.md](./design.md) - Arquitetura, componentes, fluxos e decisões técnicas
- [tasks.md](./tasks.md) - Plano de implementação detalhado com 15 tarefas principais

## Objetivos

1. ✅ Criar tela de checkout segura e responsiva
2. ✅ Integrar com Stripe Checkout (hospedado)
3. ✅ Implementar páginas de sucesso e cancelamento
4. ✅ Processar webhooks do Stripe
5. ✅ Garantir conformidade PCI-DSS (sem armazenar dados de cartão)
6. ✅ Adicionar observabilidade completa

## Arquitetura Resumida

```
Frontend (Next.js)
    ↓
API Gateway
    ↓
Lambda Handlers
    ↓
Aurora PostgreSQL + Stripe API
```

### Componentes Principais

**Frontend:**
- `/app/billing/checkout` - Página de checkout
- `/app/billing/success` - Página de sucesso
- `/app/billing/cancel` - Página de cancelamento

**Backend:**
- `GET /api/billing/subscription` - Buscar dados de assinatura
- `POST /api/billing/create-checkout-session` - Criar sessão Stripe
- `POST /api/billing/webhook` - Processar eventos Stripe

## Segurança

### Conformidade PCI-DSS

✅ **NUNCA** armazenar dados de cartão no backend
✅ **SEMPRE** usar checkout hospedado pelo Stripe
✅ **APENAS** armazenar tokens/IDs do provedor
✅ **VALIDAR** assinaturas de webhooks

### Dados Armazenados

- ✅ `stripe_customer_id` - ID do cliente no Stripe
- ✅ `stripe_subscription_id` - ID da assinatura no Stripe
- ❌ Número de cartão
- ❌ CVV
- ❌ Data de validade

## Fluxo de Checkout

1. Cliente acessa `/app/billing/checkout`
2. Sistema busca dados da assinatura atual
3. Cliente revisa resumo (plano, agentes, valores)
4. Cliente clica "Pagar com cartão de crédito"
5. Sistema cria sessão no Stripe
6. Cliente é redirecionado para Stripe Checkout
7. Cliente preenche dados de cartão (no Stripe)
8. Stripe processa pagamento
9. Cliente retorna para `/app/billing/success` ou `/app/billing/cancel`
10. Stripe envia webhook para atualizar assinatura

## Tecnologias

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** AWS Lambda (Node.js 20), API Gateway HTTP
- **Database:** Aurora PostgreSQL Serverless v2
- **Payment:** Stripe Checkout (hospedado)
- **Secrets:** AWS Secrets Manager
- **Observability:** CloudWatch Logs, Metrics, Alarms

## Variáveis de Ambiente

### Frontend
```bash
NEXT_PUBLIC_API_BASE_URL=https://api.alquimistaai.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Backend
```bash
STRIPE_SECRET_KEY=sk_test_... # Do Secrets Manager
STRIPE_WEBHOOK_SECRET=whsec_... # Do Secrets Manager
DATABASE_HOST=aurora-cluster.us-east-1.rds.amazonaws.com
FRONTEND_BASE_URL=https://app.alquimistaai.com
```

## Secrets Manager

```
/alquimista/dev/stripe/secret-key
/alquimista/dev/stripe/webhook-secret
/alquimista/prod/stripe/secret-key
/alquimista/prod/stripe/webhook-secret
```

## Próximos Passos

Para começar a implementação:

1. Revisar os documentos de requirements e design
2. Configurar secrets no AWS Secrets Manager
3. Criar conta de teste no Stripe
4. Seguir as tarefas em ordem no [tasks.md](./tasks.md)
5. Começar pela tarefa 1: "Configurar estrutura base e tipagens"

## Comandos Úteis

```bash
# Instalar dependências
cd frontend && npm install
cd lambda && npm install

# Rodar testes
npm test

# Build
npm run build

# Deploy
cdk deploy AlquimistaStack --context env=dev
```

## Referências

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [PCI DSS Compliance](https://stripe.com/docs/security/guide)
- [Blueprint Comercial](.kiro/steering/blueprint-comercial-assinaturas.md)

## Contato

Para dúvidas sobre esta spec:
- Revisar documentos de requirements e design
- Consultar blueprint comercial existente
- Verificar implementações similares no projeto

---

**Nota:** Esta spec foi criada seguindo a metodologia EARS (Easy Approach to Requirements Syntax) e INCOSE para requisitos, garantindo clareza, testabilidade e rastreabilidade.

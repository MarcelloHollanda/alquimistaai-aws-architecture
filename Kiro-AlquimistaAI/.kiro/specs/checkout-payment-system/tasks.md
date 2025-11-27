# Plano de Implementação - Sistema de Checkout e Pagamento

- [x] 1. Configurar estrutura base e tipagens TypeScript


  - Criar interfaces TypeScript para SubscriptionSummary, CheckoutSessionResponse e PaymentEvent
  - Criar tipos para estados de assinatura e periodicidade
  - Adicionar validações de schema usando Zod ou similar
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 8.1, 8.2_

- [x] 2. Implementar cliente HTTP de billing no frontend

  - [x] 2.1 Criar arquivo `frontend/src/lib/billing-client.ts`


    - Implementar função `getSubscription(tenantId: string)`
    - Implementar função `createCheckoutSession(request: CreateCheckoutRequest)`
    - Adicionar tratamento de erros HTTP
    - Adicionar retry logic para falhas de rede
    - _Requisitos: 8.1, 8.2, 8.3_
  
  - [x] 2.2 Criar funções auxiliares de formatação


    - Implementar formatação de valores monetários (BRL)
    - Implementar formatação de CNPJ
    - Implementar formatação de datas
    - _Requisitos: 1.7, 3.3, 3.4_

- [x] 3. Implementar handler GET /api/billing/subscription



  - [x] 3.1 Criar arquivo `lambda/platform/get-subscription.ts`


    - Implementar validação de tenantId
    - Implementar query SQL para buscar subscription
    - Implementar query SQL para buscar subscription_items
    - Calcular valores totais (subtotal, taxes, total)
    - Formatar resposta no formato SubscriptionSummary
    - _Requisitos: 8.1, 8.2_
  
  - [x] 3.2 Adicionar tratamento de erros

    - Tratar caso de tenant não encontrado
    - Tratar caso de subscription não encontrada
    - Tratar erros de banco de dados
    - Adicionar logging estruturado
    - _Requisitos: 8.3_
  
  - [x] 3.3 Adicionar testes unitários




    - Testar cálculo de valores
    - Testar formatação de resposta
    - Testar tratamento de erros
    - _Requisitos: 8.1, 8.2_

- [x] 4. Configurar integração com Stripe

  - [x] 4.1 Adicionar Stripe SDK ao projeto


    - Instalar `stripe` package no backend
    - Configurar Stripe client com API key do Secrets Manager
    - Criar helper para inicializar Stripe client
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 5.4, 5.5_
  
  - [x] 4.2 Configurar secrets no AWS Secrets Manager

    - Criar secret `/alquimista/dev/stripe/secret-key`
    - Criar secret `/alquimista/dev/stripe/webhook-secret`
    - Criar secret `/alquimista/prod/stripe/secret-key`
    - Criar secret `/alquimista/prod/stripe/webhook-secret`
    - Atualizar permissões IAM das Lambdas
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 5. Implementar handler POST /api/billing/create-checkout-session

  - [x] 5.1 Criar arquivo `lambda/platform/create-checkout-session.ts`


    - Implementar validação de request body
    - Verificar se tenant existe no banco
    - Calcular valor total da assinatura
    - Buscar ou criar Stripe Customer
    - _Requisitos: 2.1, 2.2, 2.3_
  
  - [x] 5.2 Implementar criação de Stripe Checkout Session

    - Configurar line_items com plano, agentes e SubNúcleos
    - Configurar success_url e cancel_url
    - Adicionar metadata (tenantId, planId, periodicity)
    - Configurar modo subscription
    - Retornar checkoutUrl e sessionId
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 5.3 Adicionar tratamento de erros do Stripe

    - Tratar StripeCardError
    - Tratar StripeInvalidRequestError
    - Tratar erros de rede
    - Adicionar logging de erros
    - _Requisitos: 2.6_
  -

  - [x] 5.4 Adicionar testes de integração





    - Testar criação de sessão com dados válidos
    - Testar validação de dados inválidos
    - Testar tratamento de erros do Stripe
    - _Requisitos: 2.1, 2.2, 2.3_

- [x] 6. Implementar página de checkout no frontend

  - [x] 6.1 Criar arquivo `frontend/src/app/(dashboard)/billing/checkout/page.tsx`


    - Implementar busca de dados de assinatura na montagem
    - Implementar estado de loading
    - Implementar tratamento de erros
    - _Requisitos: 1.1, 1.2, 8.1, 8.2, 8.3_
  
  - [x] 6.2 Criar componente CheckoutHeader

    - Exibir logomarca da AlquimistaAI
    - Exibir nome fantasia da empresa
    - Exibir CNPJ da empresa
    - _Requisitos: 1.1, 1.2_
  
  - [x] 6.3 Criar componente PlanSummary

    - Exibir nome do plano
    - Exibir periodicidade (mensal/anual)
    - Exibir lista de SubNúcleos contratados
    - Exibir número de agentes e usuários
    - _Requisitos: 1.3, 1.4, 1.5, 1.6_
  
  - [x] 6.4 Criar componente FinancialSummary

    - Exibir valor base do plano
    - Exibir impostos/taxas se aplicável
    - Exibir total a pagar
    - Exibir nome da empresa recebedora
    - Exibir CNPJ da AlquimistaAI
    - Exibir ícones de bandeiras de cartões
    - _Requisitos: 1.7, 6.1, 6.2, 6.3_
  
  - [x] 6.5 Criar componente PaymentActions

    - Implementar botão "Pagar com cartão de crédito"
    - Implementar link "Alterar plano"
    - Adicionar loading state durante criação de sessão
    - Implementar redirecionamento para Stripe (window.location.href)
    - _Requisitos: 2.1, 2.4, 4.1, 4.2_
  
  - [x] 6.6 Criar componente SecurityNotice

    - Exibir aviso sobre processamento por parceiro certificado
    - Exibir informação sobre não armazenamento de dados de cartão
    - _Requisitos: 2.6_
  
  - [x] 6.7 Implementar responsividade

    - Adaptar layout para mobile
    - Adaptar layout para desktop
    - Testar em diferentes tamanhos de tela
    - _Requisitos: 7.1, 7.2, 7.3_

- [x] 7. Implementar página de sucesso no frontend

  - [x] 7.1 Criar arquivo `frontend/src/app/(dashboard)/billing/success/page.tsx`


    - Extrair session_id dos query params
    - Buscar detalhes da sessão (opcional)
    - Exibir mensagem de confirmação
    - _Requisitos: 3.1, 3.2_
  
  - [x] 7.2 Exibir informações da assinatura

    - Mostrar plano contratado
    - Mostrar próxima data de faturamento
    - Adicionar botão "Ir para minha área de trabalho"
    - _Requisitos: 3.3, 3.4_

- [x] 8. Implementar página de cancelamento no frontend

  - [x] 8.1 Criar arquivo `frontend/src/app/(dashboard)/billing/cancel/page.tsx`


    - Exibir mensagem de cancelamento
    - Adicionar botão "Tentar novamente"
    - Adicionar link "Alterar plano"
    - _Requisitos: 3.5, 3.6, 3.7_

- [x] 9. Implementar handler de webhooks do Stripe

  - [x] 9.1 Criar arquivo `lambda/platform/webhook-payment.ts`


    - Implementar validação de assinatura do webhook
    - Extrair tipo de evento
    - Implementar roteamento por tipo de evento
    - _Requisitos: 5.6_
  
  - [x] 9.2 Implementar processamento de checkout.session.completed

    - Extrair dados da sessão
    - Atualizar subscription no Aurora
    - Registrar evento em payment_events
    - _Requisitos: 5.4, 5.5, 5.6_
  
  - [x] 9.3 Implementar processamento de invoice.paid

    - Extrair dados da invoice
    - Atualizar status de pagamento
    - Registrar evento em payment_events
    - _Requisitos: 5.6_
  
  - [x] 9.4 Implementar processamento de invoice.payment_failed

    - Extrair dados da falha
    - Atualizar status de assinatura
    - Registrar evento em payment_events
    - Enviar notificação ao cliente (futuro)
    - _Requisitos: 5.6_
  
  - [x] 9.5 Adicionar tratamento de erros


    - Tratar assinatura inválida
    - Tratar eventos duplicados (idempotência)
    - Tratar erros de banco de dados
    - Adicionar logging detalhado
    - _Requisitos: 5.6_
  
  - [x] 9.6 Adicionar testes de integração









    - Testar validação de assinatura
    - Testar processamento de eventos
    - Testar idempotência
    - _Requisitos: 5.6_

- [x] 10. Configurar rotas no API Gateway


  - Adicionar rota GET /api/billing/subscription
  - Adicionar rota POST /api/billing/create-checkout-session
  - Adicionar rota POST /api/billing/webhook
  - Configurar CORS apropriado
  - Configurar rate limiting
  - _Requisitos: 2.1, 2.2, 5.6_

- [x] 11. Adicionar observabilidade

  - [x] 11.1 Implementar logging estruturado

    - Adicionar logs em create-checkout-session
    - Adicionar logs em webhook-payment
    - Adicionar logs em get-subscription
    - _Requisitos: 2.1, 2.2, 5.6_
  
  - [x] 11.2 Configurar métricas CloudWatch


    - Criar métrica CheckoutSessionsCreated
    - Criar métrica CheckoutSessionsCompleted
    - Criar métrica CheckoutSessionsCancelled
    - Criar métrica WebhookEventsReceived
    - Criar métrica WebhookEventsProcessed
    - Criar métrica PaymentErrors
    - _Requisitos: 2.1, 2.2, 5.6_
  
  - [x] 11.3 Configurar alarmes CloudWatch

    - Alarme para taxa de erro > 5% em create-checkout-session
    - Alarme para webhook processing failures > 10 em 5 min
    - Alarme para latência > 3s em get-subscription
    - _Requisitos: 2.1, 2.2, 5.6_

- [x] 12. Configurar webhook no Stripe Dashboard


  - Adicionar endpoint URL no Stripe Dashboard
  - Selecionar eventos a receber (checkout.session.completed, invoice.paid, etc.)
  - Copiar webhook secret para Secrets Manager
  - Testar webhook com eventos de teste
  - _Requisitos: 5.6_

- [x] 13. Testes end-to-end


  - [x] 13.1 Testar fluxo completo de checkout bem-sucedido

    - Login do usuário
    - Navegação para checkout
    - Visualização de resumo
    - Clique em "Pagar"
    - Redirecionamento para Stripe
    - Conclusão de pagamento (mock)
    - Retorno para página de sucesso
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_
  
  - [x] 13.2 Testar fluxo de cancelamento

    - Navegação para checkout
    - Clique em "Pagar"
    - Cancelamento no Stripe
    - Retorno para página de cancelamento
    - Opção de tentar novamente
    - _Requisitos: 3.5, 3.6, 3.7_
  
  - [x] 13.3 Testar alteração de plano

    - Navegação para checkout
    - Clique em "Alterar plano"
    - Redirecionamento para seleção de planos
    - Retorno ao checkout com novos dados
    - _Requisitos: 4.1, 4.2, 4.3_

- [x] 14. Documentação

  - Criar README.md com instruções de configuração
  - Documentar variáveis de ambiente necessárias
  - Documentar processo de configuração do Stripe
  - Documentar fluxos de pagamento
  - Adicionar exemplos de uso da API
  - _Requisitos: Todos_

- [x] 15. Deploy e validação

  - Deploy em ambiente dev
  - Testes manuais em dev
  - Validação de segurança (PCI-DSS)
  - Deploy em ambiente prod
  - Monitoramento pós-deploy
  - _Requisitos: Todos_

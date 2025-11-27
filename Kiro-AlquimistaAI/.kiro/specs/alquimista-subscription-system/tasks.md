# Plano de Implementação - Sistema de Assinatura AlquimistaAI

## Visão Geral

Este plano detalha as tarefas de implementação do sistema de assinatura e comercialização AlquimistaAI, seguindo a ordem lógica de dependências e construindo incrementalmente sobre funcionalidades existentes.

---

## Tarefas

- [x] 1. Configurar estrutura base e migrations de banco







  - Criar migration 009_create_subscription_tables.sql com tabelas trials, commercial_requests e payment_events
  - Adicionar índices para performance em queries frequentes
  - Criar seeds de dados de teste para agentes e SubNúcleos
  - _Requisitos: 11, 14_

- [x] 2. Implementar API de listagem de agentes



- [x] 2.1 Criar handler GET /api/agents


  - Implementar lambda/platform/list-agents.ts
  - Buscar agentes ativos do banco com informações completas
  - Retornar array formatado com id, name, segment, description, tags, priceMonthly
  - Adicionar logging estruturado e tratamento de erros
  - _Requisitos: 14_

- [x] 2.2 Adicionar rota no API Gateway


  - Configurar rota GET /api/agents no alquimista-stack.ts
  - Conectar com Lambda handler
  - Configurar CORS apropriado
  - _Requisitos: 14_

- [x] 3. Implementar sistema de trials no backend










- [ ] 3.1 Criar handler POST /api/trials/start
  - Implementar lambda/platform/trial-start.ts
  - Verificar trial existente por userId + targetType + targetId
  - Criar novo trial se não existir (startedAt, expiresAt = +24h, usageCount = 0)
  - Retornar dados do trial (id, startedAt, expiresAt, remainingTokens)


  - _Requisitos: 3, 5, 11_

- [ ] 3.2 Criar handler POST /api/trials/invoke

  - Implementar lambda/platform/trial-invoke.ts
  - Buscar trial do banco e validar existência
  - Validar limite de tempo: now - startedAt <= 24h
  - Validar limite de tokens: usageCount < 5
  - Se expirado: retornar erro 403 com mensagem apropriada
  - Se válido: incrementar usageCount usando UPDATE com WHERE


  - Processar mensagem com agente/SubNúcleo (mock inicial)
  - Retornar resposta + remainingTokens
  - _Requisitos: 3, 5, 11_






- [ ] 3.3 Adicionar rotas de trials no API Gateway
  - Configurar POST /api/trials/start no alquimista-stack.ts
  - Configurar POST /api/trials/invoke no alquimista-stack.ts
  - Adicionar rate limiting (10 req/min para invoke)
  - _Requisitos: 11_


- [ ] 4. Implementar API de contato comercial
- [ ] 4.1 Criar handler POST /api/commercial/contact
  - Implementar lambda/platform/commercial-contact.ts
  - Validar campos obrigatórios (companyName, contactName, email, whatsapp)
  - Inserir registro em commercial_requests com status 'pending'
  - Formatar e enviar e-mail para alquimistafibonacci@gmail.com usando SES
  - Incluir template com dados do cliente e seleções
  - Retornar sucesso ou erro apropriado
  - _Requisitos: 9, 10_

- [ ] 4.2 Adicionar rota de contato comercial
  - Configurar POST /api/commercial/contact no alquimista-stack.ts
  - Adicionar rate limiting (3 req/hora por IP)
  - Configurar permissões SES para envio de e-mail
  - _Requisitos: 10_

- [ ] 5. Implementar integração com gateway de pagamento
- [ ] 5.1 Configurar credenciais do gateway
  - Adicionar secrets no Secrets Manager: /alquimista/prod/billing/stripe-secret-key
  - Adicionar webhook secret: /alquimista/prod/billing/stripe-webhook-secret
  - Configurar variáveis de ambiente nas Lambdas
  - _Requisitos: 7_

- [ ] 5.2 Criar handler POST /api/billing/create-checkout-session
  - Implementar lambda/platform/create-checkout-session.ts (já existe, ajustar)
  - Validar que selectedAgents.length > 0 e selectedSubnucleos.length === 0
  - Validar cálculo: totalAmount === selectedAgents.length * 29.90
  - Buscar ou criar customer no Stripe usando tenantId
  - Criar checkout session com line_items para agentes
  - Configurar success_url e cancel_url
  - Registrar evento em payment_events
  - Retornar checkoutUrl e sessionId
  - _Requisitos: 7_

- [ ] 5.3 Criar handler POST /api/billing/webhook
  - Implementar lambda/platform/webhook-payment.ts (já existe, ajustar)
  - Validar assinatura do webhook usando webhook secret
  - Tratar eventos: checkout.session.completed, subscription.created/updated/deleted
  - Registrar todos os eventos em payment_events
  - Atualizar status de assinatura do tenant
  - Ativar agentes contratados para o tenant
  - _Requisitos: 13_

- [ ] 5.4 Adicionar rotas de billing
  - Configurar POST /api/billing/create-checkout-session (ajustar existente)
  - Configurar POST /api/billing/webhook (ajustar existente)
  - Adicionar rate limiting para create-checkout-session
  - _Requisitos: 7, 13_

- [ ] 6. Criar store de seleção no frontend
- [ ] 6.1 Implementar selection-store.ts
  - Criar store Zustand em frontend/src/stores/selection-store.ts (já existe, ajustar)
  - Adicionar estado: selectedAgentIds, selectedSubnucleoIds
  - Implementar actions: toggleAgent, toggleSubnucleo, clearSelection
  - Implementar selectors: getSelectedAgents, getTotalAgentes, getBaseSubnucleos
  - NÃO persistir em localStorage (estado efêmero)
  - _Requisitos: 12_

- [ ] 7. Criar API clients no frontend
- [ ] 7.1 Implementar agents-client.ts
  - Criar frontend/src/lib/agents-client.ts (já existe, ajustar)
  - Implementar getAgents() chamando GET /api/agents
  - Adicionar tratamento de erros e retry
  - _Requisitos: 14_

- [ ] 7.2 Implementar trials-client.ts
  - Criar frontend/src/lib/trials-client.ts (já existe, ajustar)
  - Implementar startTrial() chamando POST /api/trials/start
  - Implementar invokeTrial() chamando POST /api/trials/invoke
  - Adicionar tipos TypeScript para requests e responses
  - _Requisitos: 3, 5_

- [ ] 7.3 Implementar commercial-client.ts
  - Criar frontend/src/lib/commercial-client.ts (já existe, ajustar)
  - Implementar submitCommercialContact() chamando POST /api/commercial/contact
  - Validar dados antes de enviar
  - _Requisitos: 9_

- [ ] 7.4 Ajustar billing-client.ts
  - Atualizar frontend/src/lib/billing-client.ts (já existe)
  - Ajustar createCheckoutSession() para novo formato de request
  - Garantir validação de que não há SubNúcleos selecionados
  - _Requisitos: 7_

- [ ] 8. Criar componentes de card de agente
- [ ] 8.1 Implementar AgentCardBilling
  - Criar frontend/src/components/billing/agent-card-billing.tsx (já existe, ajustar)
  - Exibir nome, descrição, segmento e tags do agente
  - Adicionar botão "Teste nossa IA" que abre modal
  - Adicionar checkbox/toggle "Adicionar ao meu plano"
  - Aplicar estilo visual quando selecionado
  - Usar componentes shadcn/ui (Card, Button, Badge)
  - _Requisitos: 1_

- [ ] 8.2 Implementar AgentsGridBilling
  - Criar frontend/src/components/billing/agents-grid-billing.tsx (já existe, ajustar)
  - Renderizar grid responsivo de AgentCardBilling
  - Buscar agentes usando getAgents() no mount
  - Conectar com selection store para estado de seleção
  - Exibir skeleton loaders durante carregamento
  - Exibir mensagem de erro com retry se falhar
  - Adicionar texto explicativo: "Cada agente AlquimistaAI custa R$ 29,90/mês..."
  - _Requisitos: 1, 14_

- [ ] 9. Criar componentes de SubNúcleo
- [ ] 9.1 Implementar SubnucleoCard
  - Criar frontend/src/components/billing/subnucleo-card.tsx (já existe, ajustar)
  - Exibir nome, descrição e escopo do SubNúcleo
  - Mostrar texto: "A partir de R$ 365,00/mês + taxas sob consulta"
  - Adicionar botão "Teste nossa IA"
  - Adicionar botão "Tenho interesse"
  - Aplicar estilo visual quando marcado com interesse
  - _Requisitos: 4, 6_

- [ ] 9.2 Implementar FibonacciSection
  - Criar frontend/src/components/billing/fibonacci-section.tsx (já existe, ajustar)
  - Renderizar seção com título e descrição do Fibonacci
  - Renderizar grid de SubnucleoCard
  - Conectar com selection store
  - Adicionar explicação sobre processo comercial
  - _Requisitos: 4, 6_

- [ ] 10. Criar componente de resumo de seleção
- [ ] 10.1 Implementar SelectionSummary
  - Criar frontend/src/components/billing/selection-summary.tsx (já existe, ajustar)
  - Exibir lista de agentes selecionados com nomes
  - Calcular e exibir: totalAgentes = qtd × R$ 29,90
  - Exibir lista de SubNúcleos com interesse
  - Calcular e exibir: baseSubnucleos = qtd × R$ 365,00 (indicativo)
  - Adicionar texto: "+ taxas sob consulta" quando há SubNúcleos
  - Implementar lógica de botão: "Continuar para pagamento" vs "Falar com comercial"
  - Desabilitar botão se nenhuma seleção
  - _Requisitos: 2, 6, 7, 8_

- [ ] 11. Criar modal de teste (TrialModal)
- [ ] 11.1 Implementar TrialModal
  - Criar frontend/src/components/billing/trial-modal.tsx (já existe, ajustar)
  - Receber props: targetType, targetId, targetName
  - Ao abrir: chamar startTrial() e armazenar dados do trial
  - Renderizar interface de chat minimalista
  - Exibir contador: "X tokens restantes" ou "Expira em Y horas"
  - Ao enviar mensagem: chamar invokeTrial() e exibir resposta
  - Se erro 403 (expirado): exibir mensagem e CTA apropriado
  - CTA para agente: "Assine este agente" → redireciona para checkout
  - CTA para SubNúcleo: "Falar com comercial" → redireciona para contato
  - Adicionar loading states e tratamento de erros
  - _Requisitos: 3, 5_

- [ ] 12. Criar página pública AlquimistaAI
- [ ] 12.1 Implementar page.tsx da rota pública
  - Criar ou ajustar frontend/src/app/(public)/alquimistaai/page.tsx
  - Renderizar Hero section com título e descrição
  - Renderizar AgentsGridBilling
  - Renderizar FibonacciSection
  - Renderizar SelectionSummary (sidebar ou rodapé fixo)
  - Adicionar layout responsivo
  - Garantir que página é pública (sem auth)
  - _Requisitos: 1, 4, 12_

- [ ] 13. Criar página de checkout
- [ ] 13.1 Implementar checkout page
  - Criar ou ajustar frontend/src/app/(dashboard)/billing/checkout/page.tsx (já existe)
  - Proteger rota com autenticação
  - Buscar agentes selecionados do store
  - Validar que não há SubNúcleos selecionados (redirecionar se houver)
  - Exibir cabeçalho com logo e dados da empresa
  - Exibir lista de agentes selecionados
  - Exibir resumo financeiro com total mensal
  - Adicionar botão "Pagar com cartão de crédito"
  - Ao clicar: chamar createCheckoutSession() e redirecionar para checkoutUrl
  - Adicionar loading state durante criação da sessão
  - _Requisitos: 7_

- [ ] 14. Criar páginas de retorno de pagamento
- [ ] 14.1 Implementar success page
  - Criar ou ajustar frontend/src/app/(dashboard)/billing/success/page.tsx (já existe)
  - Buscar sessionId da query string
  - Buscar dados da assinatura do backend
  - Exibir mensagem de sucesso
  - Exibir resumo dos agentes contratados
  - Adicionar botão para ir ao dashboard
  - Limpar selection store
  - _Requisitos: 13_

- [ ] 14.2 Implementar cancel page
  - Criar ou ajustar frontend/src/app/(dashboard)/billing/cancel/page.tsx (já existe)
  - Exibir mensagem de cancelamento
  - Manter seleção no store
  - Adicionar link para voltar ao checkout
  - Adicionar link para contato comercial (alternativa)
  - _Requisitos: 13_

- [ ] 15. Criar página de contato comercial
- [ ] 15.1 Implementar commercial contact page
  - Criar ou ajustar frontend/src/app/(dashboard)/commercial/contact/page.tsx (já existe)
  - Renderizar formulário com campos: companyName, cnpj, contactName, email, whatsapp, message
  - Exibir SelectionSummary em modo readonly
  - Validar campos obrigatórios no frontend
  - Ao enviar: chamar submitCommercialContact()
  - Exibir mensagem de sucesso: "Recebemos sua solicitação..."
  - Limpar selection store após sucesso
  - Adicionar tratamento de erros
  - _Requisitos: 9_

- [ ] 16. Implementar fluxo de redirecionamento para login
- [ ] 16.1 Adicionar lógica de preservação de seleção
  - Quando usuário não autenticado clica "Continuar para pagamento"
  - Salvar seleção atual em sessionStorage (temporário)
  - Redirecionar para /auth/login com returnUrl=/app/billing/checkout
  - Após login bem-sucedido: restaurar seleção do sessionStorage
  - Redirecionar para returnUrl
  - Limpar sessionStorage
  - _Requisitos: 7, 12_

- [ ] 17. Adicionar validações e segurança
- [ ] 17.1 Implementar validações de negócio no backend
  - Em create-checkout-session: validar que selectedSubnucleos está vazio
  - Em create-checkout-session: validar cálculo de totalAmount
  - Em trial-invoke: usar transação SQL para incrementar contador
  - Em commercial-contact: sanitizar inputs para prevenir XSS
  - Adicionar rate limiting em todos os endpoints sensíveis
  - _Requisitos: 7, 8, 11_

- [ ] 17.2 Implementar validações no frontend
  - Validar formato de e-mail no formulário comercial
  - Validar formato de WhatsApp (apenas números)
  - Validar CNPJ se preenchido (formato)
  - Prevenir envio duplo de formulários (debounce)
  - _Requisitos: 9_

- [ ] 18. Adicionar responsividade e acessibilidade
- [ ] 18.1 Implementar layouts responsivos
  - Ajustar grid de agentes para mobile (1 coluna), tablet (2 colunas), desktop (3-4 colunas)
  - Tornar SelectionSummary responsivo (sidebar em desktop, bottom sheet em mobile)
  - Ajustar modal de trial para mobile
  - Testar em diferentes tamanhos de tela
  - _Requisitos: 15_

- [ ] 18.2 Implementar acessibilidade
  - Adicionar atributos ARIA em todos os componentes interativos
  - Garantir navegação por teclado (Tab, Enter, Esc)
  - Adicionar labels descritivos em formulários
  - Garantir contraste de cores (WCAG 2.1 AA)
  - Testar com leitor de tela
  - _Requisitos: 15_

- [ ] 19. Adicionar tratamento de erros e loading states
- [ ] 19.1 Implementar error boundaries
  - Adicionar ErrorBoundary em páginas principais
  - Exibir fallback UI amigável em caso de erro
  - Adicionar botão de retry
  - Logar erros para monitoramento
  - _Requisitos: Todos_

- [ ] 19.2 Implementar loading states
  - Adicionar skeleton loaders em grids
  - Adicionar spinners em botões durante ações
  - Adicionar loading overlay em modal de trial
  - Desabilitar botões durante processamento
  - _Requisitos: Todos_

- [ ] 20. Configurar monitoramento e logs
- [ ] 20.1 Adicionar métricas de negócio
  - Registrar evento: trial iniciado (targetType, targetId)
  - Registrar evento: trial expirado (por tempo vs tokens)
  - Registrar evento: checkout iniciado (qtd agentes, valor)
  - Registrar evento: contato comercial enviado (qtd SubNúcleos)
  - Criar dashboard CloudWatch com métricas
  - _Requisitos: Todos_

- [ ] 20.2 Configurar alertas
  - Alerta: taxa de erro em trial-invoke > 5%
  - Alerta: checkout-session falhando
  - Alerta: e-mails comerciais não enviados
  - Alerta: webhooks de pagamento falhando
  - Configurar notificações SNS
  - _Requisitos: Todos_

- [ ]* 21. Testes automatizados
- [ ]* 21.1 Escrever testes unitários frontend
  - Testar componentes: AgentCard, SelectionSummary, TrialModal
  - Testar store: actions e selectors
  - Testar cálculos de preço
  - Testar validações de formulário
  - _Requisitos: Todos_

- [ ]* 21.2 Escrever testes unitários backend
  - Testar validação de limites de trial
  - Testar cálculos de preço e validações
  - Testar formatação de e-mail
  - Testar handlers isoladamente
  - _Requisitos: Todos_

- [ ]* 21.3 Escrever testes de integração
  - Testar fluxo completo de seleção → checkout
  - Testar fluxo de trial completo
  - Testar fluxo de contato comercial
  - Testar integração com banco de dados
  - _Requisitos: Todos_

- [ ]* 21.4 Escrever testes E2E
  - Testar jornada completa: seleção → login → checkout → pagamento
  - Testar jornada: seleção SubNúcleo → contato comercial
  - Testar trial: iniciar → usar tokens → expirar
  - Usar Playwright ou Cypress
  - _Requisitos: Todos_

- [ ] 22. Documentação e deploy
- [ ] 22.1 Criar documentação técnica
  - Documentar APIs em docs/billing/API.md
  - Documentar fluxos de usuário em docs/billing/FLUXOS.md
  - Documentar configuração de gateway em docs/billing/GATEWAY-SETUP.md
  - Criar guia de troubleshooting
  - _Requisitos: Todos_

- [ ] 22.2 Preparar deploy
  - Atualizar variáveis de ambiente em .env.production
  - Configurar secrets no Secrets Manager
  - Executar migrations em staging
  - Testar fluxo completo em staging
  - Criar checklist de deploy
  - _Requisitos: Todos_

- [ ] 22.3 Deploy em produção
  - Executar migrations em produção
  - Deploy do backend (CDK)
  - Deploy do frontend (S3 + CloudFront)
  - Validar endpoints em produção
  - Monitorar logs e métricas
  - _Requisitos: Todos_

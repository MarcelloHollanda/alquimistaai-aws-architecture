# Documento de Requisitos - Sistema de Assinatura AlquimistaAI

## Introdução

Este documento especifica os requisitos para o sistema de assinatura e comercialização do ecossistema AlquimistaAI, incluindo a venda direta de agentes individuais, sistema de testes gratuitos, e processo de contato comercial para Fibonacci e SubNúcleos.

O sistema permite que clientes montem seus próprios planos combinando múltiplos agentes AlquimistaAI (R$ 29,90/mês cada), testem gratuitamente qualquer agente ou SubNúcleo (24h ou 5 tokens), e solicitem propostas comerciais para Fibonacci e SubNúcleos (R$ 365,00/mês base + taxas sob consulta).

## Glossário

- **Sistema de Assinatura**: Plataforma web que gerencia seleção, teste e contratação de agentes e SubNúcleos
- **Agente AlquimistaAI**: Agente de IA especializado em uma função específica (ex: atendimento, vendas, suporte)
- **SubNúcleo**: Conjunto especializado de funcionalidades do Fibonacci para um segmento específico (ex: Saúde, Educação)
- **Fibonacci**: Sistema orquestrador B2B principal que integra múltiplos SubNúcleos
- **Token de Interação**: Uma chamada/mensagem única enviada ao agente ou SubNúcleo durante o teste
- **Período de Teste**: Janela de 24 horas OU 5 tokens de interação (o que ocorrer primeiro)
- **Checkout Direto**: Processo automatizado de pagamento via gateway externo
- **Contato Comercial**: Processo de solicitação de proposta personalizada via formulário
- **Gateway de Pagamento**: Provedor externo (Stripe/Pagar.me) que processa pagamentos
- **Tenant**: Empresa cliente no sistema multi-tenant
- **Page AlquimistaAI**: Página pública de apresentação e seleção de agentes e SubNúcleos

## Requisitos

### Requisito 1: Seleção de Agentes AlquimistaAI

**User Story:** Como cliente potencial, quero visualizar e selecionar múltiplos agentes AlquimistaAI para montar meu plano personalizado, para que eu possa contratar apenas os agentes que preciso.

#### Critérios de Aceitação

1. WHEN o usuário acessa a Page AlquimistaAI, THE Sistema de Assinatura SHALL exibir um grid com todos os agentes AlquimistaAI disponíveis.

2. WHILE exibindo cada agente no grid, THE Sistema de Assinatura SHALL mostrar nome, descrição curta, segmento e tags do agente.

3. WHEN o usuário clica em "Adicionar ao meu plano" em um card de agente, THE Sistema de Assinatura SHALL adicionar o agente à lista de seleção e atualizar o resumo de plano.

4. WHEN o usuário remove um agente da seleção, THE Sistema de Assinatura SHALL remover o agente da lista e recalcular o valor total.

5. THE Sistema de Assinatura SHALL exibir o texto "Cada agente AlquimistaAI custa R$ 29,90/mês. Monte seu SubNúcleo escolhendo quantos agentes desejar" na Page AlquimistaAI.

### Requisito 2: Cálculo de Preço de Agentes

**User Story:** Como cliente, quero ver o valor total calculado automaticamente baseado nos agentes selecionados, para que eu saiba quanto vou pagar mensalmente.

#### Critérios de Aceitação

1. WHEN o usuário seleciona ou remove agentes AlquimistaAI, THE Sistema de Assinatura SHALL calcular o total mensal como quantidade de agentes multiplicado por R$ 29,90.

2. WHILE exibindo o resumo de seleção, THE Sistema de Assinatura SHALL mostrar a lista de agentes selecionados e a quantidade total.

3. THE Sistema de Assinatura SHALL exibir o valor total mensal formatado em reais brasileiros (R$).

4. WHEN o usuário não selecionou nenhum agente, THE Sistema de Assinatura SHALL exibir valor total de R$ 0,00.

### Requisito 3: Teste Gratuito de Agentes

**User Story:** Como cliente potencial, quero testar gratuitamente qualquer agente AlquimistaAI por 24 horas ou 5 interações, para que eu possa avaliar se o agente atende minhas necessidades antes de assinar.

#### Critérios de Aceitação

1. THE Sistema de Assinatura SHALL exibir botão "Teste nossa IA" em cada card de agente AlquimistaAI.

2. WHEN o usuário clica em "Teste nossa IA" em um agente, THE Sistema de Assinatura SHALL abrir modal de teste com interface de chat.

3. WHEN o usuário inicia um teste pela primeira vez, THE Sistema de Assinatura SHALL registrar userId, agentId, timestamp de início e contador de uso zerado.

4. WHEN o usuário envia uma mensagem no teste, THE Sistema de Assinatura SHALL incrementar o contador de tokens de interação.

5. IF o tempo desde início do teste excede 24 horas, THEN THE Sistema de Assinatura SHALL bloquear novas interações e exibir mensagem de teste encerrado.

6. IF o contador de tokens atinge 5 interações, THEN THE Sistema de Assinatura SHALL bloquear novas interações e exibir mensagem de teste encerrado.

7. WHEN o teste é encerrado, THE Sistema de Assinatura SHALL exibir CTA "Assine este agente" direcionando para checkout ou login.

### Requisito 4: Exibição de SubNúcleos Fibonacci

**User Story:** Como cliente empresarial, quero visualizar os SubNúcleos do Fibonacci disponíveis com informações de preço base, para que eu possa entender as opções antes de solicitar proposta comercial.

#### Critérios de Aceitação

1. THE Sistema de Assinatura SHALL exibir seção "Fibonacci e SubNúcleos" na Page AlquimistaAI.

2. WHILE exibindo cada SubNúcleo, THE Sistema de Assinatura SHALL mostrar nome, descrição de escopo e informação de preço.

3. THE Sistema de Assinatura SHALL exibir o texto "A partir de R$ 365,00/mês por SubNúcleo + taxa de implementação e suporte mensal (sob consulta)" em cada card de SubNúcleo.

4. THE Sistema de Assinatura SHALL exibir botão "Teste nossa IA" em cada card de SubNúcleo.

5. THE Sistema de Assinatura SHALL exibir botão "Tenho interesse" em cada card de SubNúcleo.

### Requisito 5: Teste Gratuito de SubNúcleos

**User Story:** Como cliente empresarial, quero testar gratuitamente qualquer SubNúcleo do Fibonacci por 24 horas ou 5 interações, para que eu possa avaliar a funcionalidade antes de solicitar proposta comercial.

#### Critérios de Aceitação

1. WHEN o usuário clica em "Teste nossa IA" em um SubNúcleo, THE Sistema de Assinatura SHALL abrir modal de teste com interface de chat.

2. WHEN o usuário inicia teste de SubNúcleo, THE Sistema de Assinatura SHALL registrar userId, subnucleoId, timestamp de início e contador zerado.

3. WHEN o usuário envia mensagem no teste de SubNúcleo, THE Sistema de Assinatura SHALL incrementar contador de tokens e validar limites.

4. IF o tempo desde início excede 24 horas OU contador atinge 5 tokens, THEN THE Sistema de Assinatura SHALL bloquear interações e exibir mensagem de encerramento.

5. WHEN teste de SubNúcleo é encerrado, THE Sistema de Assinatura SHALL exibir CTA "Falar com comercial" direcionando para formulário de contato.

### Requisito 6: Seleção de Interesse em SubNúcleos

**User Story:** Como cliente empresarial, quero marcar interesse em SubNúcleos do Fibonacci, para que eu possa solicitar uma proposta comercial personalizada incluindo todos os SubNúcleos desejados.

#### Critérios de Aceitação

1. WHEN o usuário clica em "Tenho interesse" em um SubNúcleo, THE Sistema de Assinatura SHALL adicionar o SubNúcleo à lista de interesse comercial.

2. WHILE o usuário tem SubNúcleos marcados com interesse, THE Sistema de Assinatura SHALL exibir cálculo indicativo baseado em R$ 365,00 por SubNúcleo.

3. THE Sistema de Assinatura SHALL exibir texto "+ taxa de implementação e suporte mensal sob consulta" junto ao cálculo indicativo.

4. WHEN o usuário remove interesse em um SubNúcleo, THE Sistema de Assinatura SHALL remover da lista e recalcular valor indicativo.

### Requisito 7: Checkout Direto para Agentes

**User Story:** Como cliente, quero finalizar a compra de agentes AlquimistaAI diretamente online, para que eu possa começar a usar os agentes imediatamente após o pagamento.

#### Critérios de Aceitação

1. WHEN o usuário seleciona pelo menos 1 agente AlquimistaAI E não marca interesse em SubNúcleos, THE Sistema de Assinatura SHALL habilitar botão "Continuar para pagamento".

2. WHEN usuário não autenticado clica em "Continuar para pagamento", THE Sistema de Assinatura SHALL redirecionar para login mantendo seleção.

3. WHEN usuário autenticado clica em "Continuar para pagamento", THE Sistema de Assinatura SHALL redirecionar para página de checkout.

4. WHILE exibindo página de checkout, THE Sistema de Assinatura SHALL mostrar lista de agentes selecionados, quantidade e valor total mensal.

5. WHEN o usuário clica em "Pagar com cartão de crédito", THE Sistema de Assinatura SHALL criar sessão no Gateway de Pagamento e redirecionar para checkout hospedado.

6. THE Sistema de Assinatura SHALL armazenar apenas customerId e subscriptionId do Gateway de Pagamento, nunca dados de cartão.

### Requisito 8: Bloqueio de Checkout com SubNúcleos

**User Story:** Como sistema, quero impedir checkout automático quando há SubNúcleos selecionados, para que todas as contratações de Fibonacci passem por avaliação comercial.

#### Critérios de Aceitação

1. WHEN o usuário marca interesse em pelo menos 1 SubNúcleo do Fibonacci, THE Sistema de Assinatura SHALL desabilitar botão "Continuar para pagamento".

2. WHEN há SubNúcleos selecionados, THE Sistema de Assinatura SHALL exibir botão "Falar com comercial" no lugar do botão de pagamento.

3. THE Sistema de Assinatura SHALL exibir mensagem "Fibonacci e SubNúcleos são contratados via nosso time comercial" quando há SubNúcleos selecionados.

4. WHEN o usuário clica em "Falar com comercial", THE Sistema de Assinatura SHALL redirecionar para página de contato comercial.

### Requisito 9: Formulário de Contato Comercial

**User Story:** Como cliente empresarial, quero enviar uma solicitação detalhada para o time comercial incluindo meus interesses e necessidades, para que eu receba uma proposta personalizada.

#### Critérios de Aceitação

1. THE Sistema de Assinatura SHALL exibir formulário de contato comercial com campos: nome da empresa, CNPJ (opcional), nome do responsável, e-mail, WhatsApp e mensagem livre.

2. WHILE exibindo formulário, THE Sistema de Assinatura SHALL mostrar em modo somente leitura a lista de agentes AlquimistaAI selecionados.

3. WHILE exibindo formulário, THE Sistema de Assinatura SHALL mostrar em modo somente leitura a lista de SubNúcleos Fibonacci selecionados.

4. THE Sistema de Assinatura SHALL validar que campos obrigatórios (nome empresa, nome responsável, e-mail, WhatsApp) estão preenchidos antes de permitir envio.

5. WHEN o usuário envia o formulário, THE Sistema de Assinatura SHALL chamar endpoint POST /api/commercial/contact com payload completo.

### Requisito 10: Processamento de Solicitação Comercial

**User Story:** Como time comercial, quero receber automaticamente por e-mail todas as solicitações de proposta, para que eu possa responder rapidamente aos clientes interessados.

#### Critérios de Aceitação

1. WHEN o backend recebe POST /api/commercial/contact, THE Sistema de Assinatura SHALL enviar e-mail para alquimistafibonacci@gmail.com com todos os dados da solicitação.

2. WHEN o backend processa solicitação comercial, THE Sistema de Assinatura SHALL registrar em tabela commercial_requests com tenantId, payload completo e timestamp.

3. WHEN o backend envia e-mail com sucesso, THE Sistema de Assinatura SHALL retornar resposta de sucesso ao frontend.

4. WHEN o frontend recebe confirmação de envio, THE Sistema de Assinatura SHALL exibir mensagem "Recebemos sua solicitação. Nossa equipe comercial entrará em contato por e-mail ou WhatsApp em breve".

5. IF o envio de e-mail falha, THEN THE Sistema de Assinatura SHALL retornar erro ao frontend e registrar falha em logs.

### Requisito 11: Validação de Limites de Teste no Backend

**User Story:** Como sistema, quero validar rigorosamente os limites de teste no backend, para que usuários não possam burlar as restrições de 24h ou 5 tokens.

#### Critérios de Aceitação

1. WHEN o backend recebe POST /api/trials/invoke, THE Sistema de Assinatura SHALL verificar se registro de trial existe para userId e targetId.

2. WHEN validando trial, THE Sistema de Assinatura SHALL calcular diferença entre timestamp atual e trialStartAt.

3. IF diferença de tempo excede 24 horas, THEN THE Sistema de Assinatura SHALL retornar erro "Período de teste encerrado" e status 403.

4. IF trialUsageCount é maior ou igual a 5, THEN THE Sistema de Assinatura SHALL retornar erro "Período de teste encerrado" e status 403.

5. WHEN validações passam, THE Sistema de Assinatura SHALL incrementar trialUsageCount, processar mensagem e retornar resposta do agente/SubNúcleo.

### Requisito 12: Persistência de Estado de Seleção

**User Story:** Como usuário, quero que minhas seleções de agentes e SubNúcleos sejam mantidas enquanto navego pelo site, para que eu não perca meu progresso ao explorar diferentes páginas.

#### Critérios de Aceitação

1. WHEN o usuário seleciona ou remove agentes/SubNúcleos, THE Sistema de Assinatura SHALL persistir estado em store global do frontend.

2. WHEN o usuário navega entre páginas da aplicação, THE Sistema de Assinatura SHALL manter estado de seleção inalterado.

3. WHEN usuário não autenticado faz seleções e realiza login, THE Sistema de Assinatura SHALL preservar seleções após autenticação.

4. WHEN o usuário fecha o navegador, THE Sistema de Assinatura SHALL limpar estado de seleção (não persistir em localStorage).

### Requisito 13: Páginas de Retorno de Pagamento

**User Story:** Como cliente, quero receber feedback claro sobre o resultado do meu pagamento, para que eu saiba se minha assinatura foi ativada com sucesso ou se preciso tentar novamente.

#### Critérios de Aceitação

1. WHEN o Gateway de Pagamento processa pagamento com sucesso, THE Sistema de Assinatura SHALL redirecionar usuário para /app/billing/success.

2. WHILE exibindo página de sucesso, THE Sistema de Assinatura SHALL mostrar resumo dos agentes contratados e valor mensal.

3. WHEN o usuário cancela pagamento no Gateway de Pagamento, THE Sistema de Assinatura SHALL redirecionar para /app/billing/cancel.

4. WHILE exibindo página de cancelamento, THE Sistema de Assinatura SHALL mostrar link para tentar pagamento novamente.

5. THE Sistema de Assinatura SHALL registrar evento de pagamento em tabela payment_events com status, valor e metadata.

### Requisito 14: Integração com Catálogo de Agentes

**User Story:** Como sistema, quero buscar dinamicamente a lista de agentes disponíveis do backend, para que o catálogo esteja sempre atualizado sem necessidade de deploy do frontend.

#### Critérios de Aceitação

1. WHEN a Page AlquimistaAI é carregada, THE Sistema de Assinatura SHALL chamar endpoint GET /api/agents.

2. WHEN o backend recebe GET /api/agents, THE Sistema de Assinatura SHALL retornar array com id, name, segment, description, tags e priceMonthly de cada agente.

3. IF a chamada GET /api/agents falha, THEN THE Sistema de Assinatura SHALL exibir mensagem de erro e botão para tentar novamente.

4. WHILE carregando dados de agentes, THE Sistema de Assinatura SHALL exibir skeleton loaders no grid.

### Requisito 15: Responsividade e Acessibilidade

**User Story:** Como usuário, quero acessar o sistema de assinatura em qualquer dispositivo com experiência otimizada, para que eu possa selecionar e contratar agentes de desktop, tablet ou mobile.

#### Critérios de Aceitação

1. THE Sistema de Assinatura SHALL adaptar layout do grid de agentes para diferentes tamanhos de tela (desktop, tablet, mobile).

2. THE Sistema de Assinatura SHALL garantir que todos os botões e controles tenham área de toque mínima de 44x44 pixels em dispositivos móveis.

3. THE Sistema de Assinatura SHALL implementar navegação por teclado em todos os componentes interativos.

4. THE Sistema de Assinatura SHALL incluir atributos ARIA apropriados em elementos de interface.

5. THE Sistema de Assinatura SHALL garantir contraste mínimo de 4.5:1 entre texto e fundo conforme WCAG 2.1 AA.

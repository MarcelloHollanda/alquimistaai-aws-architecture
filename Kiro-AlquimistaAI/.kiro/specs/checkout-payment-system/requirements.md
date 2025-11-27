# Documento de Requisitos - Sistema de Checkout e Pagamento

## Introdução

Este documento define os requisitos para o sistema de checkout e pagamento com cartão de crédito da plataforma AlquimistaAI. O sistema permitirá que clientes assinem planos e agentes através de um fluxo seguro de pagamento, utilizando um provedor externo certificado (Stripe) para processar transações com cartão de crédito, garantindo conformidade com padrões PCI-DSS.

## Glossário

- **Sistema de Checkout**: Interface web da AlquimistaAI que permite ao usuário revisar e confirmar sua assinatura antes do pagamento
- **Provedor de Pagamento**: Serviço externo certificado PCI-DSS (Stripe) que processa transações de cartão de crédito
- **Sessão de Checkout**: Contexto temporário criado no Provedor de Pagamento contendo detalhes da transação
- **Tenant**: Empresa cliente da AlquimistaAI identificada por tenantId
- **Plano**: Pacote de serviços com preço definido (Starter, Profissional, Expert, Enterprise)
- **SubNúcleo**: Módulo especializado do Fibonacci (Saúde, Vendas, Cobrança, etc.)
- **Agente AlquimistaAI**: Agente de IA individual com preço de R$ 29,90/mês
- **Backend Lambda**: Função serverless AWS Lambda que processa requisições da API
- **Checkout Hospedado**: Página de pagamento segura hospedada pelo Provedor de Pagamento

## Requisitos

### Requisito 1

**User Story:** Como cliente da AlquimistaAI, quero visualizar um resumo completo da minha assinatura antes de pagar, para que eu possa confirmar todos os detalhes antes de finalizar a compra.

#### Acceptance Criteria

1. WHEN o cliente acessa a página de checkout, THE Sistema de Checkout SHALL exibir o nome fantasia e CNPJ da empresa do cliente
2. WHEN o cliente acessa a página de checkout, THE Sistema de Checkout SHALL exibir a logomarca da AlquimistaAI no cabeçalho
3. WHEN o cliente acessa a página de checkout, THE Sistema de Checkout SHALL exibir o nome do plano selecionado
4. WHEN o cliente acessa a página de checkout, THE Sistema de Checkout SHALL exibir a periodicidade da assinatura (mensal ou anual)
5. WHEN o cliente acessa a página de checkout, THE Sistema de Checkout SHALL exibir a lista completa de SubNúcleos contratados
6. WHEN o cliente acessa a página de checkout, THE Sistema de Checkout SHALL exibir o número de agentes e usuários incluídos
7. WHEN o cliente acessa a página de checkout, THE Sistema de Checkout SHALL calcular e exibir o valor total a pagar

### Requisito 2

**User Story:** Como cliente da AlquimistaAI, quero pagar minha assinatura com cartão de crédito de forma segura, para que meus dados financeiros estejam protegidos.

#### Acceptance Criteria

1. WHEN o cliente clica no botão "Pagar com cartão de crédito", THE Backend Lambda SHALL criar uma sessão de checkout no Provedor de Pagamento
2. WHEN o Backend Lambda cria a sessão, THE Backend Lambda SHALL incluir o tenantId, plano, periodicidade e valor total
3. WHEN a sessão é criada com sucesso, THE Backend Lambda SHALL retornar uma URL segura de checkout
4. WHEN o Backend Lambda retorna a URL, THE Sistema de Checkout SHALL redirecionar o cliente para a página de pagamento hospedada
5. THE Sistema de Checkout SHALL NEVER armazenar número de cartão, CVV ou data de validade no backend
6. THE Sistema de Checkout SHALL exibir aviso informando que o pagamento é processado por parceiro certificado

### Requisito 3

**User Story:** Como cliente da AlquimistaAI, quero ser informado sobre o resultado do meu pagamento, para que eu saiba se minha assinatura foi ativada com sucesso.

#### Acceptance Criteria

1. WHEN o pagamento é concluído com sucesso, THE Provedor de Pagamento SHALL redirecionar o cliente para a página de sucesso
2. WHEN o cliente acessa a página de sucesso, THE Sistema de Checkout SHALL exibir mensagem de confirmação
3. WHEN o cliente acessa a página de sucesso, THE Sistema de Checkout SHALL exibir o plano contratado
4. WHEN o cliente acessa a página de sucesso, THE Sistema de Checkout SHALL exibir a próxima data de faturamento
5. WHEN o pagamento é cancelado, THE Provedor de Pagamento SHALL redirecionar o cliente para a página de cancelamento
6. WHEN o cliente acessa a página de cancelamento, THE Sistema de Checkout SHALL exibir mensagem informando o cancelamento
7. WHEN o cliente acessa a página de cancelamento, THE Sistema de Checkout SHALL oferecer opção de tentar novamente

### Requisito 4

**User Story:** Como cliente da AlquimistaAI, quero poder alterar meu plano antes de finalizar o pagamento, para que eu possa ajustar minha escolha se necessário.

#### Acceptance Criteria

1. WHEN o cliente está na página de checkout, THE Sistema de Checkout SHALL exibir link "Alterar plano"
2. WHEN o cliente clica em "Alterar plano", THE Sistema de Checkout SHALL redirecionar para a página de seleção de planos
3. WHEN o cliente retorna da seleção de planos, THE Sistema de Checkout SHALL atualizar o resumo com as novas informações

### Requisito 5

**User Story:** Como administrador da AlquimistaAI, quero que os dados de pagamento sejam armazenados de forma segura e compatível com PCI-DSS, para que a empresa esteja em conformidade com regulamentações.

#### Acceptance Criteria

1. THE Backend Lambda SHALL NEVER armazenar número completo de cartão de crédito
2. THE Backend Lambda SHALL NEVER armazenar código CVV
3. THE Backend Lambda SHALL NEVER armazenar data de validade de cartão
4. WHEN o Provedor de Pagamento processa um pagamento, THE Backend Lambda SHALL armazenar apenas o customerId do provedor
5. WHEN o Provedor de Pagamento processa um pagamento, THE Backend Lambda SHALL armazenar apenas o subscriptionId do provedor
6. WHEN ocorre um evento de pagamento, THE Backend Lambda SHALL registrar o evento na tabela payment_events

### Requisito 6

**User Story:** Como cliente da AlquimistaAI, quero visualizar informações sobre a empresa recebedora do pagamento, para que eu tenha transparência sobre a transação.

#### Acceptance Criteria

1. WHEN o cliente acessa a página de checkout, THE Sistema de Checkout SHALL exibir o nome da empresa recebedora "AlquimistaAI Tecnologia Ltda."
2. WHEN o cliente acessa a página de checkout, THE Sistema de Checkout SHALL exibir o CNPJ da AlquimistaAI
3. WHEN o cliente acessa a página de checkout, THE Sistema de Checkout SHALL exibir ícones das bandeiras de cartões aceitos (Visa, MasterCard)

### Requisito 7

**User Story:** Como desenvolvedor, quero que o sistema de checkout seja responsivo, para que clientes possam realizar pagamentos tanto em desktop quanto em dispositivos móveis.

#### Acceptance Criteria

1. WHEN o cliente acessa a página de checkout em dispositivo móvel, THE Sistema de Checkout SHALL adaptar o layout para telas pequenas
2. WHEN o cliente acessa a página de checkout em desktop, THE Sistema de Checkout SHALL exibir layout otimizado para telas grandes
3. THE Sistema de Checkout SHALL utilizar componentes shadcn/ui para garantir consistência visual

### Requisito 8

**User Story:** Como cliente da AlquimistaAI, quero que o sistema busque automaticamente meus dados de assinatura atual, para que eu não precise reinserir informações já cadastradas.

#### Acceptance Criteria

1. WHEN a página de checkout é carregada, THE Sistema de Checkout SHALL chamar o endpoint GET /api/billing/subscription
2. WHEN o endpoint retorna dados, THE Sistema de Checkout SHALL preencher automaticamente o resumo da assinatura
3. IF o endpoint retorna erro, THEN THE Sistema de Checkout SHALL exibir mensagem de erro apropriada

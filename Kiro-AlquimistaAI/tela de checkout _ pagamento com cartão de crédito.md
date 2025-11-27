\# CONTEXTO GERAL  
Aplicação SaaS multi-tenant da AlquimistaAI rodando na AWS. Já existem:  
\- Planos de assinatura e SubNúcleos definidos (Prompt 2\)  
\- Auth via Cognito  
\- Backend serverless

Objetivo aqui: criar \*\*tela de checkout / pagamento com cartão de crédito\*\*, alinhada a boas práticas de segurança (PCI). Não queremos manipular dados de cartão diretamente no backend; vamos usar um provedor como \*\*Stripe Checkout\*\* ou similar.

\# ARQUITETURA DE PAGAMENTO (REFERÊNCIA)  
\- Frontend:  
  \- Página \`/app/billing/checkout\`  
  \- Usuário visualiza:  
    \- Dados da empresa (nome, CNPJ, logomarca da AlquimistaAI no topo)  
    \- Plano escolhido  
    \- SubNúcleos e agentes selecionados  
    \- Valor total (mensal ou anual)  
  \- Botão “Pagar com cartão de crédito”  
\- Backend (Lambda):  
  \- Endpoint \`POST /api/billing/create-checkout-session\`  
    \- Recebe tenantId, plano, periodicidade, quantidade de usuários, etc.  
    \- Cria uma sessão de checkout no provedor de pagamentos (ex.: Stripe)  
    \- Retorna URL segura do checkout  
\- Fluxo:  
  \- Ao clicar em “Pagar com cartão”, frontend chama \`/api/billing/create-checkout-session\`  
  \- Redireciona o usuário para a página de pagamento hospedada pelo provedor  
  \- Após pagamento, usuário volta para \`/app/billing/success\` ou \`/app/billing/cancel\`

\# REQUISITOS DA TELA DE CHECKOUT (Next.js 14\)  
Página \`/app/billing/checkout\`:

Seções:  
1\. Cabeçalho:  
   \- Logomarca da AlquimistaAI  
   \- Nome fantasia da empresa do cliente  
   \- CNPJ da empresa do cliente  
2\. Resumo do Plano:  
   \- Nome do plano (Starter / Profissional / Expert / Enterprise)  
   \- Periodicidade (mensal/anual)  
   \- Lista de SubNúcleos contratados  
   \- Nº de agentes e usuários  
3\. Resumo financeiro:  
   \- Valor base do plano  
   \- Impostos/Taxas, se aplicável  
   \- Total a pagar hoje  
4\. Ações:  
   \- Botão principal: “Pagar com cartão de crédito”  
   \- Link “Alterar plano” (volta para \`/app/billing/plans\`)  
   \- Aviso: “Pagamento processado por parceiro certificado (ex.: Stripe). Seus dados de cartão não são armazenados pela AlquimistaAI.”

Comportamento:  
\- Ao montar a página:  
  \- Buscar dados atuais da assinatura do tenant em \`GET /api/billing/subscription\`  
\- Ao clicar em “Pagar com cartão”:  
  \- Chamar \`POST /api/billing/create-checkout-session\`  
  \- Receber \`checkoutUrl\`  
  \- Fazer \`window.location.href \= checkoutUrl\`

\# PÁGINAS ADICIONAIS  
1\. \`/app/billing/success\`  
   \- Mensagem de sucesso  
   \- Mostrar plano e próxima data de faturamento  
   \- Botão “Ir para minha área de trabalho”

2\. \`/app/billing/cancel\`  
   \- Mensagem de pagamento cancelado  
   \- Opção de tentar novamente ou alterar plano

\# ALINHAMENTO COM CONTA BANCÁRIA E OPERADORAS  
\- Exibir na tela de checkout:  
  \- Nome da empresa recebedora: “AlquimistaAI Tecnologia Ltda.” (placeholder)  
  \- CNPJ da AlquimistaAI  
  \- Bandeiras de cartões aceitos (Visa, MasterCard, etc.) apenas como ícones visuais  
\- O processamento real de cartão será feito pelo provedor (Stripe ou outro), que fará o repasse para a conta bancária da AlquimistaAI configurada no painel desse provedor.  
\- Não gerar código que salve número completo de cartão, CVV ou data de validade no backend.

\# REQUISITOS TÉCNICOS  
\- Usar componentes shadcn/ui para cards, botões, alerts  
\- Layout responsivo, focado em uso em desktop e mobile  
\- Código organizado em:  
  \- \`/src/app/app/billing/checkout/page.tsx\`  
  \- \`/src/app/app/billing/success/page.tsx\`  
  \- \`/src/app/app/billing/cancel/page.tsx\`  
  \- \`/src/lib/billing-client.ts\` para chamadas de API  
\- Preparar tipagens TypeScript para:  
  \- \`SubscriptionSummary\`  
  \- \`CheckoutSessionResponse\`

Gere todo o código das páginas e componentes necessários, pronto para uso, sem expor segredos e seguindo boas práticas de segurança.


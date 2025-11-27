# 

Objetivo: gerar um app **Vite \+ React \+ TypeScript \+ Tailwind** com **shadcn/ui**, **React Router**, **TanStack Query**, tema **HSL** idêntico ao fornecido, **layout AppLayout (sidebar \+ topbar)** e **todas as rotas** já preenchidas com **UI funcional de placeholders** para o subnúcleo **Nigredo** (prospecção). O código deve compilar imediatamente.

`Você é um gerador de projetos React. Crie do zero um app Vite + React + TypeScript com Tailwind e shadcn/ui, seguindo exatamente as instruções:`

`1) Metadados do Projeto`  
`- Nome do app: nigredo-app`  
`- Descrição: Núcleo de Prospecção – Nigredo (subnúcleo do Fibonacci) para prospecção, higienização, enriquecimento, disparos, atendimento, agendamento e relatórios.`  
`- Padrões: ESLint + Prettier, alias "@/"`

`2) Dependências`  
`- Instale: react-router-dom, @tanstack/react-query, clsx, lucide-react, tailwindcss-animate, zod, react-hook-form`  
`- shadcn/ui (componentes básicos: Button, Card, Badge, Tabs, Table, Dialog, DropdownMenu, Input, Textarea, Select, Sheet, Tooltip, Toaster/Sonner)`  
`- NÃO crie dependência de backend. Apenas placeholders (services) e envs.`

`3) Estrutura de pastas`  
`- src/`  
  `- app/ (rotas)`  
  `- components/ui/ (shadcn gerados)`  
  `- components/layout/AppLayout.tsx (sidebar + topbar responsivas)`  
  `- contexts/{AuthContext,TenantContext}.tsx (mocks com estado in-memory)`  
  `- pages/{Dashboard,Leads,Estrategia,Aprovacoes,Disparo,Conversas,Agendamentos,Relatorios,Agentes,Config,Objecoes,Experimentos,Aprendizado,IntegrationTests,Login,Auth,NotFound}.tsx`  
  `- lib/{theme.ts, utils.ts}`  
  `- services/{supabase.client.ts (stub), scheduler.ts (stub), whatsapp.ts (stub), email.ts (stub)}`  
  `- styles/{index.css}`  
  `- main.tsx, App.tsx`  
`- public/ logos (placeholders: fibonacci.svg, nigredo.svg, alquimistaai.svg)`

`4) Roteamento (idêntico ao fornecido)`  
`- BrowserRouter com Routes para:`  
  `"/", "/login", "/auth", "/leads", "/estrategia", "/aprovacoes",`  
  `"/disparo", "/conversas", "/agendamentos", "/relatorios",`  
  `"/agentes", "/config", "/users", "/experimentos", "/aprendizado",`  
  `"/objecoes", "/integration-tests", "*" → NotFound`  
`- Envolva com QueryClientProvider, AuthProvider, TenantProvider, TooltipProvider, Toasters`  
`- (Rotas e providers devem refletir exatamente App.tsx do projeto de referência.)`

`5) Layout (AppLayout)`  
`- Sidebar esquerda fixa (desktop) e Sheet/Drawer (mobile); topbar com título "Nigredo — Núcleo de Prospecção" e slot de ações (Pesquisar, Criar Lote, Importar CSV).`  
`- Sidebar seções (ícones lucide): Dashboard, Leads, Estratégia, Aprovações, Disparo, Conversas, Agendamentos, Relatórios, Agentes, Config, Usuários, Experimentos, Aprendizado, Objeções, Integration Tests.`  
`- Rodapé do sidebar: “Fibonacci — A inteligência que orquestra a transmutação · AlquimistaAI — Transmutando dados em ouro · Nigredo — Purificação alquímica dos dados brutos”.`  
`- Responsividade: full mobile-first, com content container fluido.`

`6) Tema (copiar os tokens HSL abaixo exatamente)`  
`- Em src/styles/index.css declare @tailwind base, components, utilities e o seguinte bloco :root/.dark com variáveis HSL e gradientes (background, foreground, card, popover, primary, secondary, muted, accent, destructive, success, warning, info, border, input, ring, radius, gradient-*, shadow-*, sidebar-*) exatamente como:`

`[COLE AQUI, SEM ALTERAR, o bloco de variáveis HSL e gradientes do meu index.css + os mapeamentos do tailwind.config.ts correspondentes. Não invente cores. Use o mesmo mapping de 'extend.colors', 'backgroundImage', 'boxShadow', 'borderRadius', 'keyframes' e 'animation'.]`

`7) tailwind.config.ts`  
`- Use o mapeamento de cores que referencia as CSS variables HSL, exatamente como no meu arquivo (extend.colors → border,input,ring,background,foreground, primary{DEFAULT,foreground,glow}, secondary, destructive, success, warning, info, muted, accent, popover, card, sidebar{...}; backgroundImage; boxShadow; borderRadius; animations accordion-down/up).`  
`- content: ["./src/**/*.{ts,tsx}"]`  
`- darkMode: ["class"]`  
`- plugins: [require("tailwindcss-animate")]`

`8) App.tsx e main.tsx`  
`- Recrie a estrutura com QueryClientProvider, AuthProvider, TenantProvider, TooltipProvider, Toaster, Sonner e as rotas descritas no item 4.`  
`- Providers podem ser mocks (sem lógica real de auth/tenant).`

`9) Páginas (conteúdo funcional de UI, sem backend):`  
`- Dashboard: KPIs em Cards e um Timeline/Activity (placeholders) para o fluxo Recebimento → Estratégia → Disparo → Atendimento → Sentimento → Agendamento → Relatórios (exibir status e contadores).`  
`- Leads: Upload CSV (input), “Higienizar” (btn), “Enriquecer” (btn), tabela com colunas padrão (Empresa, Contato, Telefone, Email, Setor, Porte, Score, Status). Ações: Validar, Marcar Lote, Excluir Duplicados.`  
`- Estratégia: Abas “Segmentação”, “Mensagens”, “Testes A/B”, “ABM (Contas)”. Forms com zod/react-hook-form; botões para “Gerar Roteiros Topo/Meio/Fundo”.`  
`- Aprovações: Lista de campanhas e mensagens com Badges de status (Aprovado, Pendente, Ajustar).`  
`- Disparo: Controles de janela (seg-sex 08–18h), cadência, limites, botões “Iniciar Lote”, “Pausar”, “Reenviar Follow-up”, log de eventos.`  
`- Conversas: Inbox unificada (placeholder) com filtros (Canal, Lote, Sentimento).`  
`- Agendamentos: Calendário simples (placeholder) + tabela de reuniões com status (Confirmado, Ajustar, Sem resposta).`  
`- Relatórios: Cards e tabelas (Taxa de abertura, Respostas, Interesse, Agendamentos, Conversão por lote, Objeções recorrentes). Export (CSV/JSON – mock).`  
`- Agentes: Lista descritiva dos 7 agentes principais + complementares, cada um em Card com descrição curta e “Ver contratos” (abre Dialog com JSON Schema **placeholder**).`  
`- Config: Abas “Canais”, “SLOs”, “LGPD/Consentimento”, “Quotas e Meters”, “Chaves & Webhooks” (somente forms placeholders e instruções).`  
`- Users, Experimentos, Aprendizado, Objeções, IntegrationTests, Login, Auth, NotFound: conteúdo mínimo coerente, conforme rotas.`

`10) Conteúdo editorial das páginas (use estes trechos como texto informativo nos cards/headers):`  
`- Nigredo é o subnúcleo do Fibonacci voltado à prospecção com fluxo: Recebimento (higieniza/organiza) → Estratégia → Disparo → Atendimento → Análise de Sentimento → Agendamento → Relatórios. (coloque descrições curtas em cada página)`  
`- Destaques: arquitetura fractal, governança LGPD, auditoria, rate-limits, idempotência, SLOs por canal (ex.: WhatsApp P90≤30s, E-mail P90≤2h). (apenas como texto explicativo)`  
`- Slogans (rodapé e About):`   
  `- “Fibonacci — A inteligência que orquestra a transmutação.”`  
  `- “AlquimistaAI — Transmutando dados em ouro.”`  
  `- “Nigredo — Purificação alquímica dos dados brutos.”`

`11) Serviços (stubs) e Env`  
`- Crie services/* com funções assíncronas fake: importLeads(), hygienize(), enrich(), planCampaign(), scheduleSend(), classifySentiment(), bookMeeting(), generateReport() — todas retornando Promises com mocks.`  
`- Crie src/services/supabase.client.ts com TODO e leitura de envs:`  
  `VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (sem uso real).`  
`- Não chamar APIs reais, apenas simular com setTimeout e dados dummy.`

`12) Acessibilidade e UX`  
`- Todos os botões com aria-label; foco visível; teclado acessível em Sidebar/Dialogs; textos em PT-BR.`

`13) Entregáveis`  
`- Projeto deve compilar e rodar.`   
`- Não use imagens externas obrigatórias. Coloque SVGs placeholders para logos.`  
`- Forneça todos os arquivos: main.tsx, App.tsx, tailwind.config.ts, src/styles/index.css (com variáveis HSL), components/layout/AppLayout.tsx, todas as pages e providers stubados.`   
`- Nada de backends; tudo client-side.`

`14) Qualidade`  
`- Tipos TypeScript nos props.`  
`- Sem avisos do TypeScript.`  
`- Código limpo e modular.`


**\# \*\*Arquitetura do Dashboard Fibonacci v2\*\***

**\#\# \*\*0\\) Objetivo e princípios\*\***

\* **\*\*Objetivo:\*\*** painel administrativo da AlquimistaAI (produto **\*\*Fibonacci\*\***) para governança, custos/quotas, usuários, subnúcleos, integrações, agentes e prompts — “no-code” para operação não-técnica.

\* **\*\*Princípios:\*\*** multi-tenant, **\*\*RBAC\*\*** (admin/ops/viewer), **\*\*LGPD by-design\*\***, **\*\*assinatura HMAC\*\*** em chamadas, **\*\*observabilidade\*\*** (trace\\\_id, audits, métricas), **\*\*demo-first\*\*** (sem backend) e **\*\*prod-ready\*\*** (com Replit/Supabase).

\---

**\#\# \*\*1\\) Stack de Frontend\*\***

\* **\*\*Next.js (App Router) \\+ TypeScript\*\***

\* **\*\*Tailwind CSS\*\*** \\+ **\*\*shadcn/ui\*\*** (Button, Card, Table, Tabs, Dialog, Sheet, Badge, Toast, Input, Select, Switch, Tooltip)

\* **\*\*lucide-react\*\*** (ícones), **\*\*TanStack Table\*\*** (tabelas), **\*\*React Query\*\*** (dados), **\*\*react-hook-form \\+ zod\*\*** (forms/validação), **\*\*recharts\*\*** (gráficos)

\* **\*\*Theming\*\***: claro/escuro; identidade **\*\*Fibonacci/AlquimistaAI\*\*** (ouro, preto, cinzas; bordas \`rounded-2xl\`, sombras suaves)

\---

**\#\# \*\*2\\) Mapa de Rotas\*\***

\`/admin\`    
  \`├─ /visao-geral          \# KPIs, gráficos, atividade recente\`    
  \`├─ /consumo              \# custos, quotas, alertas\`    
  \`├─ /faturas              \# invoices\`    
  \`├─ /usuarios             \# gestão de usuários/roles\`    
  \`├─ /subnucleos           \# status por subnúcleo \+ detalhe\`    
  \`├─ /logs                 \# auditoria, eventos, busca/filters\`    
  \`├─ /config               \# tema, SLOs, segurança/HMAC, preferências\`    
  \`├─ /integracoes          \# catálogo \+ conexões (tenant/usuário)\`    
  \`│    ├─ /catalogo\`    
  \`│    ├─ /conexoes\`    
  \`│    ├─ /usuarios\`    
  \`│    ├─ /webhooks\`    
  \`│    └─ /teste\`    
  \`├─ /agentes-especialistas  \# catálogo visual dos 32 agentes (cards)\`    
  \`└─ /estudio-agentes        \# CRUD/versão/import/export/teste de prompts (no-code)\`

**\*\*Sem conflitos com “Configurações”:\*\***

\* **\*\*/admin/config\*\*** \\= segurança/tema/SLO/HMAC (fonte única do segredo)

\* **\*\*/admin/integracoes\*\*** \\= catálogo e conexões; **\*\*lê\*\*** o \`secret\_last4\` e usa webhooks, mas **\*\*não\*\*** rotaciona segredos (operação fica em **\*\*Config\*\***)

\---

**\#\# \*\*3\\) Componentização (pasta \`/components\`)\*\***

\* **\*\*UI base:\*\*** \`components/ui/\*\` (shadcn extendido)

\* **\*\*Charts:\*\*** \`components/charts/{AreaChart,BarChart,PieChart,KPICompact}.tsx\`

\* **\*\*DataTable:\*\*** \`components/data-table/{DataTable.tsx, Columns.ts}\`

\* **\*\*Filters:\*\*** \`components/filters/{DateRange, TenantSelect, SubnucleoMulti, StatusBadge}.tsx\`

\* **\*\*Cards KPI:\*\*** \`components/cards/{KpiCard,QuotaBar}.tsx\`

\* **\*\*Logs:\*\*** \`components/logs/{LogRow, LogDrawer}.tsx\`

\* **\*\*Agentes (catálogo):\*\*** \`AgentCard.tsx\`, \`AgentDetailDialog.tsx\`, \`AgentCompositionDrawer.tsx\`

\* **\*\*Estúdio (no-code):\*\*** \`StudioEditor.tsx\` (tabs: Geral, Prompts, Schemas, Ferramentas, Teste, Histórico)

\* **\*\*Integrações:\*\*** \`IntegrationCard.tsx\`, \`WebhookPanel.tsx\`, \`TestPanel.tsx\`, \`CatalogTable.tsx\`

\---

**\#\# \*\*4\\) Estado, Dados e Modo Demo\*\***

\* **\*\*React Query\*\*** com chaves por rota e filtros (ex.: \`\["agents", params\]\`, \`\["logs", range\]\`)

\* **\*\*Demo Mode\*\***: se \`AWS\_GATEWAY\_BASE\_URL\` **\*\*vazio\*\***, ler/escrever em **\*\*localStorage\*\*** (ex.: \`agents\_demo\`, \`tenant\_integrations\_demo\`) e mocks (\`/lib/mock\*.ts\`); se presente, liga na API do **\*\*Gateway Replit\*\***

\* **\*\*Headers padrão\*\*** em requisições: \`X-Trace-Id\`, \`X-Tenant-Id\`, \`X-Signature\` (gerados por \`lib/headers.ts\`)

\---

**\#\# \*\*5\\) Integração com Backend (stubs prontos)\*\***

**\#\#\# \*\*5.1 Libs de API do front\*\***

\* \`lib/api.ts\` → KPIs, custos, quotas, invoices, usuários, subnúcleos, logs, ping

\* \`lib/apiAgents.ts\` → listar/obter/toggle/compose

\* \`lib/apiAgentsStudio.ts\` → CRUD/versões/import/export/teste (no-code)

\* \`lib/apiIntegrations.ts\` → catálogo, conexões (tenant/usuário), webhooks, teste

**\#\#\# \*\*5.2 Assinatura segura\*\***

\* \`lib/headers.ts\`

  \* \`makeTraceId()\` (uuid v4)

  \* \`makeSignedHeaders(method, path, body, tenantId)\` → \`X-Signature \= HMAC\_SHA256(secret, method+path+body+traceId+tenantId)\`

\---

**\#\# \*\*6\\) Segurança, LGPD, RBAC\*\***

\* **\*\*RBAC\*\***: \`admin\` (total), \`ops\` (operacional sem segurança), \`viewer\` (somente leitura)

\* **\*\*LGPD:\*\*** PII mascarada por padrão; “revelar” apenas a \`admin\`; consentimentos/escopos visíveis

\* **\*\*Auditoria:\*\*** toda ação sensível em \`audits\` (com \`trace\_id\`, \`actor\_id\`, \`tenant\_id\`)

\* **\*\*SLOs & Taxonomia de erros:\*\*** exibidos em tooltips e linhas de status (ex.: WA P90≤30s, Email P90≤2h)

\---

**\#\# \*\*7\\) Domínios de Dados (banco de dados – visão do front)\*\***

(DDL do banco fica no backend; aqui, somente o **\*\*contrato\*\*** que o front espera)

**\*\*Núcleo:\*\***

\* \`agents\` → \`{ id, slug, name, category, subnucleo\_id, status, version, prompt\_system, prompt\_instructions, input\_schema, output\_schema, tools\[\], metadata, tenant\_id, updated\_at }\`

\* \`agent\_logs\` → \`{ id, agent\_id, tenant\_id, trace\_id, actor\_id, subnucleo\_id, latency\_ms, cost\_estimate, status, created\_at }\`

\* \`agent\_compositions\` → \`{ id, tenant\_id, name, agents\[\], created\_at }\`

\* \`users\` (admin view) → \`{ id, email, name, role, tenant\_id, last\_login\_at }\`

\* \`subnucleos\` → \`{ id, name, status, p50, p90, errors\_by\_cat, uptime\_24h }\`

\* \`costs\`, \`quotas\`, \`invoices\`, \`audits\`, \`events\` (tabelas de governança/financeiro/observabilidade)

**\*\*Integrações:\*\***

\* \`integrations\_catalog\` → catálogo global (admin-plataforma)

\* \`tenant\_integrations\` → conexões por tenant (status, last4, config)

\* \`integration\_credentials\` → **\*\*não exposto ao front\*\*** (manipulado via Gateway/service role)

\* \`webhook\_settings\` → URL e eventos habilitados; \`secret\_last4\` referenciado (rotação em **\*\*/admin/config\*\***)

\---

**\#\# \*\*8\\) Módulos e Telas (detalhe funcional)\*\***

**\#\#\# \*\*8.1 Visão Geral\*\***

\* **\*\*KPI Cards\*\***: Custo do mês, Tokens consumidos, Usuários ativos, Subnúcleos ativos, Alertas/SLO

\* **\*\*Gráficos\*\***: consumo/dia (área), consumo por subnúcleo (barra stack), distribuição de status (pizza)

\* **\*\*Atividade recente\*\***: 20 últimos eventos

**\#\#\# \*\*8.2 Consumo\*\***

\* Gráfico consumo vs quota por subnúcleo

\* Tabela **\*\*costs/quotas\*\*** com filtros (período, subnúcleo, canal, status\\\_quota) e badges 80/95%

**\#\#\# \*\*8.3 Faturas\*\***

\* Lista **\*\*invoices\*\*** (período, valor, método, status); ação **\*\*Baixar PDF\*\*** (placeholder)

**\#\#\# \*\*8.4 Usuários\*\***

\* Tabela: nome, e-mail, **\*\*papel\*\***, tenant; ações (alterar papel, desativar, reset link); **\*\*Drawer\*\*** com histórico (audits)

**\#\#\# \*\*8.5 Subnúcleos\*\***

\* **\*\*Grid\*\***: status (verde/amarelo/vermelho), uptime 24h, chamadas/min, P50/P90, erros/categoria

\* **\*\*Detalhe\*\*** (rota dinâmica): KPIs, endpoints, últimas execuções, contratos (read-only)

**\#\#\# \*\*8.6 Logs\*\***

\* Busca full-text \\+ filtros: data, \`trace\_id\`, \`actor\_id\`, \`subnucleo\_id\`, categoria (events/audits/errors), latência, canal

\* **\*\*Infinite scroll\*\***, **\*\*Export CSV\*\***, **\*\*Copiar JSON\*\***

**\#\#\# \*\*8.7 Configurações\*\***

\* **\*\*Tema\*\*** (cores/logo), **\*\*Preferências\*\***

\* **\*\*SLOs\*\*** por canal

\* **\*\*Segurança\*\***: chave/segredo HMAC (**\*\*rotação aqui\*\***), teste de assinatura

**\#\#\# \*\*8.8 Integrações** *\*(sem conflito com Config)\****\*\***

\* **\*\*/catalogo\*\*** (admin-plataforma): nome, tipo (OAuth/API Key/Webhook/Service), escopos, **\*\*habilitar/disable\*\***

\* **\*\*/conexoes\*\*** (tenant): **\*\*Conectar/Desconectar/Rotacionar chave\*\*** (chama Gateway), mostrar \`last4\`

\* **\*\*/usuarios\*\***: conexões pessoais (Gmail/Calendar/LinkedIn/YouTube)

\* **\*\*/webhooks\*\***: URL e **\*\*eventos habilitados\*\***; ver \`secret\_last4\` **\*\*somente leitura\*\***

\* **\*\*/teste\*\***: ping por integração (latência, escopos)

**\#\#\# \*\*8.9 Agentes Especialistas (32 agentes)\*\***

\* **\*\*/agentes-especialistas\*\***: catálogo (cards) dos 32 agentes; filtros; **\*\*Combinar\*\*** (seleção múltipla → \`agent\_compositions\`)

\* **\*\*Detalhe\*\*** por agente: Visão Geral, Métricas (recharts), Contratos MCP, Logs

**\#\#\# \*\*8.10 Estúdio de Agentes (no-code)\*\***

\* **\*\*CRUD/Versão\*\***: criar/editar/duplicar/arquivar; **\*\*Publicar\*\*** versão

\* **\*\*Prompts\*\***: \`prompt\_system\` \\+ \`prompt\_instructions\`

\* **\*\*Schemas\*\***: input/output (JSON) com validação zod

\* **\*\*Ferramentas (MCP)\*\***: multiselect (\`audit.log\`, \`whatsapp.send\`, \`email.send\`, \`social.post\`, \`calendar.createEvent\`…)

\* **\*\*Teste\*\***: entrada JSON → executa (mock ou real) → responde JSON; feedback 👍/👎

\* **\*\*Importar/Exportar JSON\*\***: para seed/backup/portabilidade

\* **\*\*RBAC\*\***: edição só para \`admin\`/\`ops\`; \`viewer\` lê

\---

**\#\# \*\*9\\) Endpoints esperados (Gateway)\*\***

O front funciona sem eles (demo). Ao ligar no AWS, usa-os automaticamente:

\`GET   /admin/kpis?periodo=...\`    
\`GET   /admin/costs        GET /admin/quotas\`    
\`GET   /admin/invoices\`    
\`GET   /admin/users\`    
\`GET   /admin/subnucleos   GET /admin/subnucleos/:id\`    
\`GET   /admin/logs?...\`    
\`POST  /admin/ping\`

\`\# Agentes (catálogo)\`    
\`GET   /admin/agents?filters...\`    
\`GET   /admin/agents/:id\`    
\`PATCH /admin/agents/:id            \# toggle status / metadados\`    
\`POST  /admin/agents/composition    \# cria combinação\`

\`\# Estúdio de Agentes (no-code)\`    
\`PUT   /admin/agents                \# upsert 1 agente\`    
\`POST  /admin/agents/import         \# importa array\`    
\`POST  /admin/agents/:slug/test     \# executa (sandbox)\`    
\`POST  /admin/agents/:slug/publish  \# marca versão ativa\`    
\`GET   /admin/agents/:slug/versions \# histórico\`

\`\# Integrações\`    
\`GET   /admin/integrations/catalog\`    
\`PUT   /admin/integrations/catalog\`    
\`PATCH /admin/integrations/catalog/:id/enabled\`

\`GET   /admin/integrations/connections\`    
\`POST  /admin/integrations/connections/:id/connect\`    
\`POST  /admin/integrations/connections/:id/rotate\`    
\`DELETE/admin/integrations/connections/:id\`

\`GET   /admin/integrations/webhooks\`    
\`POST  /admin/integrations/test\`

**\*\*Cabeçalhos obrigatórios em todas:\*\*** \`X-Trace-Id\`, \`X-Tenant-Id\`, \`X-Signature (HMAC)\`.

\---

**\#\# \*\*10\\) Performance, Qualidade e Acessibilidade\*\***

\* **\*\*Code-split\*\*** por rota e lazy para dialogs pesados

\* **\*\*Skeletons\*\*** e **\*\*loading states\*\*** com React Suspense

\* **\*\*Cache\*\*** com React Query \\+ revalidação por foco

\* **\*\*A11y\*\***: foco visível, \`aria-\*\`, contraste, navegação por teclado

\* **\*\*Testes mínimos\*\***: smoke (render), lógica de filtros, helpers de assinatura

\---

**\#\# \*\*11\\) Feature Flags & Releases\*\***

\* **\*\*Flags por tenant\*\*** (ex.: liberar Integrações Beta só para alguns)

\* **\*\*Versão semântico-visual\*\*** (mostrar \`v2.x\` no footer)

\* **\*\*Changelog\*\*** embutido (drawer “O que há de novo”)

\---

**\#\# \*\*12\\) Implantação incremental (sem backend pronto)\*\***

1\. **\*\*Fase 1 (Já):\*\*** rodar em **\*\*Demo Mode\*\*** com mocks e \`agents\_seed.json\` (import direto no Estúdio)

2\. **\*\*Fase 2:\*\*** apontar \`AWS\_GATEWAY\_BASE\_URL\` e validar **\*\*ping/headers\*\***

3\. **\*\*Fase 3:\*\*** ligar listas (agents, costs, quotas, users, logs…) ao Gateway

4\. **\*\*Fase 4:\*\*** ativar **\*\*Integrações\*\*** (catálogo → conexões) e **\*\*publicar versões\*\*** de agentes

5\. **\*\*Fase 5:\*\*** hardening (SLOs, auditoria, LGPD, flags, testes)

\---

**\#\# \*\*13\\) Identidade Visual\*\***

\* **\*\*Fibonacci\*\*** — “A inteligência que orquestra a transmutação.”

\* **\*\*AlquimistaAI\*\*** — “Transmutando dados em ouro.”

\* Paleta: **\*\*ouro \\\#D4AF37\*\***, **\*\*preto \\\#141414\*\***, cinzas; modo claro com fundos suaves e alto contraste; animações discretas


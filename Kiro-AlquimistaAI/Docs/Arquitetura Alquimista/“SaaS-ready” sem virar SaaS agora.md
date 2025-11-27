**“SaaS-ready” sem virar SaaS agora. A ideia é rodar monousuário (single tenant) com *overhead quase zero*, mas já com os ganchos certos para ligar multiempresa quando for a hora. Segue um plano enxuto, com o que mudar já (baixo custo) e o que fica “adormecido” para ativar depois.**

---

# **Estratégia geral**

* **Operar hoje como está: um único cliente/empresa.**

* **SaaS-ready no esquema/dados e no código: coloque “marcadores” que não pesam agora (ex.: `tenant_id` com valor fixo), para evitar refator grande quando migrar.**

* **Custos mínimos: sem auth sofisticada, sem billing, sem cluster — só estrutura para ligar isso depois.**

  ---

  ## **1\) Banco de dados: pronto para multi-tenant, mas com 1 tenant**

**Agora**

* **Adicione a coluna `tenant_id` nas tabelas de domínio e preencha com um UUID fixo (ex.: `00000000-0000-0000-0000-000000000000`).**

* **Não precisa habilitar RLS ainda (ou habilite e use uma única policy simples).**

**SQL mínimo**

* **`-- uma vez só`**  
* **`alter table empresas   add column if not exists tenant_id uuid not null default '00000000-0000-0000-0000-000000000000';`**  
* **`alter table contatos   add column if not exists tenant_id uuid not null default '00000000-0000-0000-0000-000000000000';`**  
* **`alter table leads      add column if not exists tenant_id uuid not null default '00000000-0000-0000-0000-000000000000';`**  
* **`alter table estrategias add column if not exists tenant_id uuid not null default '00000000-0000-0000-0000-000000000000';`**  
* **`-- ...repita para as demais (mensagens_modelo, inbound_msgs, dnc, agendamentos, event_log, outbox, etc)`**


**Depois (quando virar SaaS)**

* **Habilite RLS e políticas por `tenant_id`; crie tabela `tenants`; remova o `DEFAULT` e passe a setar por request.**

  ---

  ## **2\) API/middlewares: *noop* agora, multi-tenant depois**

**Agora**

* **Crie um middleware que injeta o tenant default em cada request sem custo de validação:**

* **`// middleware/tenant.ts`**  
* **`export function monoTenant(req, _res, next) {`**  
*   **`req.context = { tenantId: process.env.DEFAULT_TENANT_ID || "00000000-0000-0000-0000-000000000000", roles: ["admin"] };`**  
*   **`next();`**  
* **`}`**  
    
* **Em cada handler/worker, inclua o tenant nos inserts/queries (mesmo que fixo).**

**Depois**

* **Troque por um middleware que lê `X-Tenant`/JWT e faz `set_config('app.tenant_id', $1, true)`; habilite rate-limit por tenant.**

  ---

  ## **3\) Outbox/workers: partição lógica “fingida”**

**Agora**

* **Continue usando sua outbox, inclua `tenant_id` no payload e/ou coluna — sempre o default.**

* **Índices não mudam custo.**

**Depois**

* **Particione consultas por tenant e rode múltiplos workers em paralelo (um por partição/tenant, se necessário).**

  ---

  ## **4\) Webhooks e integrações: um perfil só, formato multi**

**Agora**

* **Tenha uma configuração de WhatsApp/Gmail/Calendar (tabela `integrations` com uma linha).**

* **O webhook de WA aponta para um único endpoint e grava tudo com o `tenant_id` default.**

**Depois**

* **A mesma tabela vira `tenant_integrations(tenant_id, kind, config…)` com N linhas — sem mudar chamadas.**

  ---

  ## **5\) Frontend: multi-tenant “desligado”**

**Agora**

* **Envie `X-Tenant` com valor fixo no Axios (ou nem envie; tanto faz em mono).**

* **RBAC simples (admin) — *feature flags* por ambiente.**

**Depois**

* **Ative seleção de empresa/tenant, RBAC por usuário e branding por tenant (logo/cores).**

  ---

  ## **6\) Métricas e logs: etiquetas opcionais**

**Agora**

* **Opcional: adicione `tenant="<default>"` como *label* nas métricas Prometheus.**  
   **Se não quiser, mantenha como está — custo zero.**

* **Logs já trazem `trace_id`; inclua `tenant_id` (fixo) só para manter padrão.**

**Depois**

* **Dashboards por tenant ficam triviais (filtro `tenant=`).**

  ---

  ## **7\) Aprovações (quatro-olhos): ligadas, mas simples**

**Agora**

* **Mantenha o fluxo de aprovação, porém com um único grupo (seu time).**

* **Se só você usa, pode desligar a validação de “autor ≠ aprovador” via env/flag.**

**Depois**

* **Ative regras por tenant e quorum configurável.**

  ---

  ## **8\) Custos: o que não ativar agora**

* **Auth/SSO (Auth0/Clerk): deixe para quando vender o SaaS.**

* **Billing (Stripe) e planos: só quando tiver 2-3 clientes pagantes.**

* **Redis para rate-limit por tenant: desnecessário em mono.**

* **Infra duplicada (staging enorme): mantenha leve.**

  ---

  ## **9\) Checklist “em 1 dia”**

* **Adicionar `tenant_id` (default fixo) nas tabelas principais.**

* **Ajustar inserts/updates/selects para carregar/salvar `tenant_id`.**

* **Middleware monoTenant ativo na API e nos workers.**

* **(Opcional) Label `tenant="<default>"` nas métricas.**

* **Scripts de seed criam `DEFAULT_TENANT_ID` e integrações únicas.**

* **Doc curta: “Como ligar multi-tenant depois” (passo-a-passo abaixo).**

  ---

  ## **10\) Quando for migrar para SaaS (sem refatorar tudo)**

1. **Criar tabela `tenants` e interface de provisionamento.**

2. **Remover `DEFAULT` de `tenant_id` nas tabelas; manter a coluna.**

3. **Substituir `monoTenant` por middleware que lê `X-Tenant`/JWT e seta `app.tenant_id`.**

4. **(Opcional) Habilitar RLS em etapas (comece por tabelas sensíveis).**

5. **Separar integrations por tenant e mover as atuais para o tenant “legacy”.**

6. **Ativar RBAC real no frontend, billing e rate-limit por tenant.**

   ---

   ## **Exemplos prontos para colar**

**Env**

* **`DEFAULT_TENANT_ID=00000000-0000-0000-0000-000000000000`**


**Insert com tenant (hoje e amanhã)**

* **`insert into leads (id, empresa_id, contato_id, score, tenant_id)`**  
* **`values ($1, $2, $3, $4, $5);`**  
* **`-- $5 = DEFAULT_TENANT_ID hoje; amanhã = req.context.tenantId`**


**Worker outbox (pseudocódigo)**

* **`const tenantId = process.env.DEFAULT_TENANT_ID;`**  
* **`await pool.query("select set_config('app.tenant_id', $1, true)", [tenantId]);`**  
* **`// consome outbox normalmente; payloads já trazem tenant_id`**


**Axios (frontend)**

* **`api.interceptors.request.use(cfg => {`**  
*   **`cfg.headers = { ...(cfg.headers || {}), "X-Tenant": import.meta.env.VITE_TENANT_KEY || "default" };`**  
*   **`return cfg;`**  
* **`});`**  
    
  ---

  ### **Conclusão**

* **Sim, é o melhor dos dois mundos: você mantém a ideia inicial rodando barata e estável hoje, e evita “cirurgia maior” quando virar SaaS.**

* **O segredo é colar `tenant_id` agora (mesmo fixo) e centralizar a injeção (middleware). Todo o resto (RLS, billing, SSO, rate-limit por tenant) vira chave liga/desliga quando for a hora.**  
* 


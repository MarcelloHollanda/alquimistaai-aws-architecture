# **PROMPT 3 — Criação do “Nigredo — Núcleo de Prospecção” (Backend \+ Frontend na AWS)**

*(via Kiro · Serverless AWS · integrado e pronto pós-deploy)*

Use este prompt no **Kiro**, apontando para o repositório Git que será o **monorepo do Nigredo** (pode ser um novo repo ou uma pasta dentro do monorepo AlquimistaAI/AWS).  
 Objetivo: criar **backend \+ frontend** do Nigredo, **na AWS us-east-1**, já integrados, alinhados à arquitetura serverless que você usa no Fibonacci.

---

## **1\. Contexto**

Projeto: **Nigredo — Núcleo de Prospecção**, subnúcleo da **Alquimista.AI**.

* Função: ser o **núcleo de prospecção B2B**, com 7 agentes especialistas:

  * Agente de Recebimento

  * Agente de Estratégia

  * Agente de Disparo

  * Agente de Atendimento

  * Agente de Análise de Sentimento

  * Agente de Agendamento

  * Agente de Relatórios

* A arquitetura padrão da empresa na AWS (já usada no Fibonacci Orquestrador) é:

  * **Região:** `us-east-1`

  * **Backend:** API Gateway HTTP \+ Lambda (Node 20\)

  * **Banco relacional:** Aurora Serverless v2 (Postgres, Multi-AZ)

  * **Frontend:** S3 \+ CloudFront (páginas estáticas)

  * **IaC:** Terraform com backend remoto em S3 \+ lock DynamoDB

  * **Segredos:** AWS Secrets Manager em `/repo/aws/<nome-serviço>/*`

* **Identidade visual do Nigredo já existe** e deve ser mantida:

  * Não mudar cores, fontes, logo e layout geral já em uso.

  * Este prompt é focado na **arquitetura e no código**, não em redesenho.

---

## **2\. Arquitetura Geral na AWS**

Crie uma arquitetura **serverless** para o Nigredo, compatível com o padrão já usado no Fibonacci:

* **Backend Nigredo API**

  * Implementado como **AWS Lambda (Node 20 \+ TypeScript)**.

  * Exposto via **API Gateway HTTP API**:

    * Ex.: `nigredo-api-dev-http` e `nigredo-api-prod-http`.

  * Conectado à mesma **VPC** já usada pelo Aurora (subnets privadas, SGs compatíveis).

* **Banco de Dados**

  * Usar o mesmo cluster **Aurora Serverless v2 Postgres** já existente do ecossistema (cluster do Fibonacci),

  * Criar um **schema dedicado** para o Nigredo (ex.: `nigredo`) com suas próprias tabelas.

  * Multi-AZ, snapshots automáticos e tags obrigatórias de custo.

* **Frontend Nigredo**

  * App em **Next.js** (gerando build estático para deploy em S3 \+ CloudFront).

  * Buckets:

    * `alquimistaai-nigredo-frontend-dev`

    * `alquimistaai-nigredo-frontend-prod`

  * Distribuições CloudFront apontando para os buckets respectivos.

  * HTTPS via ACM, compressão e cache adequados.

* **Infra como Código (Terraform)**

Estrutura de diretórios:

 `/terraform`  
  `/modules`  
    `/app_nigredo_api`  
    `/app_nigredo_frontend`  
  `/envs`  
    `/dev`  
    `/prod`

*   
  * Backend de estado:

    * S3 (já existente, mesmo padrão do Fibonacci)

    * DynamoDB para lock

  * Segredos em **AWS Secrets Manager**:

    * Ex.: `/repo/aws/nigredo/DATABASE_URL`, `/repo/aws/nigredo/FIBONACCI_API_BASE_URL`, etc.

---

## **3\. Estrutura do Repositório**

No repositório que o Kiro irá preparar:

`/nigredo`  
  `/backend`  
    `src/`  
    `prisma/ ou migrations/`  
    `package.json`  
    `tsconfig.json`  
  `/frontend`  
    `app/ ou src/`  
    `public/`  
    `package.json`  
    `next.config.mjs`  
    `tsconfig.json`  
  `/terraform`  
    `/modules`  
      `/app_nigredo_api`  
      `/app_nigredo_frontend`  
    `/envs`  
      `/dev`  
        `main.tf`  
      `/prod`  
        `main.tf`  
  `.gitignore`  
  `README.md`

---

## **4\. Backend Nigredo (AWS Lambda \+ Aurora)**

### **4.1 Stack do Backend**

* **Runtime:** Node.js 20 \+ TypeScript

* Framework HTTP interno para Lambda:

  * Pode ser Express ou Fastify adaptado via handler, ou rota nativa do API Gateway; escolha uma abordagem simples e documente.

* ORM: **Prisma** (Postgres) apontando para o schema `nigredo` no Aurora.

* Validação: **Zod** para inputs JSON.

* Log: `pino` ou equivalente, com saída estruturada para CloudWatch.

* Tests: Jest/Vitest básicos (health, services).

### **4.2 Modelos (Aurora / Prisma)**

No schema `nigredo` do Aurora, crie estruturas equivalentes (via Prisma ou SQL) para:

* **Lead**

* **Campaign / Lote**

* **Conversation**

* **Meeting (Agendamento)**

* **NigredoEvent** (para integração com Fibonacci, com `event_id` único)

Mesma modelagem conceitual do prompt anterior (não precisa repetir todos os campos nesse texto, apenas manter a estrutura: IDs UUID, JSONB para metadata, timestamps, enum de status).

### **4.3 Rotas HTTP da Nigredo API (Lambda)**

Implementar Lambda com roteamento para:

* `GET /api/nigredo/health`

* `GET /api/nigredo/pipeline/status`

* `GET /api/nigredo/pipeline/metrics`

* `GET /api/nigredo/leads`

* `GET /api/nigredo/leads/{id}`

* `GET /api/nigredo/leads/{id}/timeline`

* `GET /api/nigredo/conversations`

* `GET /api/nigredo/conversations/{id}`

* `GET /api/nigredo/meetings`

* `POST /api/nigredo/meetings`

* `GET /api/nigredo/reports/summary`

Características:

* Todas as rotas expostas pelo **API Gateway HTTP API**.

* Integradas a uma única Lambda handler (como o Fibonacci faz) com roteamento interno por `event.rawPath` e `event.requestContext.http.method`.

* Respostas sempre em JSON com status coerente.

### **4.4 Integração com Fibonacci (pré-pronta)**

No backend Nigredo:

* Criar um cliente interno para o Fibonacci:

`const FIBONACCI_API_BASE_URL = process.env.FIBONACCI_API_BASE_URL;`  
`const FIBONACCI_NIGREDO_TOKEN = process.env.FIBONACCI_NIGREDO_TOKEN;`

* Função `sendNigredoEvent(event: NigredoEventPayload)` que:

  * Salva o evento em `nigredo_events`/`NigredoEvent`.

  * Opcionalmente chama `POST /public/nigredo-event` na API do Fibonacci, com:

    * `x-client-id: nigredo`

    * auth via `FIBONACCI_NIGREDO_TOKEN`.

As variáveis devem vir do **AWS Secrets Manager** (`/repo/aws/nigredo/*`) injetadas na Lambda via Terraform.

### **4.5 Terraform — Módulo `app_nigredo_api`**

Em `terraform/modules/app_nigredo_api`:

* Criar:

  * `aws_lambda_function.nigredo_api`

    * Runtime nodejs20.x

    * Código da pasta `/backend` (empacotado via CI/CD).

    * VPC config para acessar Aurora.

    * Variáveis de ambiente lidas do Secrets Manager (via `aws_secretsmanager_secret` data ou parâmetro).

  * `aws_apigatewayv2_api.nigredo_http`

  * `aws_apigatewayv2_integration.lambda`

  * `aws_apigatewayv2_route` para cada rota principal (`/api/nigredo/*`)

  * `aws_apigatewayv2_stage` (`$default`)

* Outputs:

  * `nigredo_api_url` (ex.: `https://xxxxx.execute-api.us-east-1.amazonaws.com`)

Nos `envs/dev` e `envs/prod`:

* Instanciar o módulo `app_nigredo_api` com:

  * Nome lógico (`nigredo-api-dev-http`, `nigredo-api-prod-http`)

  * VPC/Subnets/SecurityGroups corretos

  * ARNs do Aurora

  * Secrets necessários

---

## **5\. Frontend Nigredo (Next.js \+ S3 \+ CloudFront)**

### **5.1 Stack do Frontend**

* **Next.js 14 (App Router) \+ TypeScript**

* **React 18**

* Estilos: **reutilizar a identidade visual atual do Nigredo**

  * Não criar nova paleta de cores

  * Não trocar fontes

  * Não mudar logo/estrutura geral

* **React Query (TanStack Query)** para consumir a API do Nigredo.

* Build para **static export** ou `next build` pronto para servir via S3+CloudFront (sem SSR dinâmico na AWS por enquanto).

### **5.2 Páginas e Rotas (App Router)**

Mesma estrutura conceitual:

`/frontend/app`  
  `/(nigredo)`  
    `layout.tsx`  
    `page.tsx              -> Painel`  
    `agentes/page.tsx`  
    `pipeline/page.tsx`  
    `pipeline/[id]/page.tsx`  
    `conversas/page.tsx`  
    `agendamentos/page.tsx`  
    `relatorios/page.tsx`  
    `governanca/page.tsx`

Cada página consome a Nigredo API hospedada na AWS, usando:

`const NIGREDO_API_BASE_URL = process.env.NEXT_PUBLIC_NIGREDO_API_BASE_URL;`

E hooks em `frontend/hooks/useNigredo.ts` com React Query (`useNigredoHealth`, `useDashboardStats`, etc.), mantendo o visual já existente.

### **5.3 Deploy Estático em S3 \+ CloudFront**

* `next.config.mjs` preparado para:

  * `output: "export"` (se for static export) **ou**

  * servir via `next build` \+ upload do `.next` para S3 se optar por apenas assets estáticos.

* Scripts:

  * `npm run build` → gera artefatos para S3.

### **5.4 Terraform — Módulo `app_nigredo_frontend`**

Em `terraform/modules/app_nigredo_frontend`:

* Criar:

  * `aws_s3_bucket.nigredo_frontend` (para dev e prod, via módulo parametrizado)

  * Configuração de site estático desabilitado (usar somente como origem do CloudFront).

  * `aws_cloudfront_distribution.nigredo_frontend`

    * OAC/Origin Access Control para ler do bucket S3

    * HTTPS, compressão, TTLs.

Nos `envs/dev` e `envs/prod`:

* Instanciar o módulo duas vezes (`dev` e `prod`), gerando outputs:

  * `nigredo_frontend_domain_name` (URL pública do CloudFront).

---

## **6\. Integração Backend ↔ Frontend na AWS**

* Injetar no frontend, em dev/prod:

`NEXT_PUBLIC_NIGREDO_API_BASE_URL=https://<nigredo-api-id>.execute-api.us-east-1.amazonaws.com`

* CI/CD (opcional para este prompt, mas desejável):

  * Pipeline GitHub Actions que:

    * Faz build do backend, empacota e faz deploy via Terraform \+ artefatos da Lambda (ou S3).

    * Faz build do frontend, faz upload para o bucket S3 de cada ambiente.

  * Autenticação via OIDC \+ IAM Roles na AWS (seguindo o padrão da empresa).

---

## **7\. Pronto para uso pós-deploy**

Ao final, o Kiro deve deixar:

1. **Backend Nigredo**:

   * Lambda \+ API Gateway HTTP operando na AWS us-east-1.

   * Conectado ao Aurora Serverless v2 (schema `nigredo`).

Health em `GET /api/nigredo/health` respondendo algo como:

 `{`  
  `"ok": true,`  
  `"service": "Nigredo Núcleo de Prospecção",`  
  `"environment": "dev|prod",`  
  `"db_status": "connected"`  
`}`

*   
2. **Frontend Nigredo**:

   * Build Next.js pronto em S3.

   * Servido por CloudFront em URL pública (dev e prod).

   * Consumindo a Nigredo API via `NEXT_PUBLIC_NIGREDO_API_BASE_URL`.

3. **IaC completa em Terraform**:

   * Módulos `app_nigredo_api` e `app_nigredo_frontend`.

   * `envs/dev` e `envs/prod` instanciando os módulos.

   * Integração com o backend de estado S3+DynamoDB já existente.

4. **Segurança & Segredos**:

   * Todos os segredos do Nigredo em **AWS Secrets Manager**:

     * `/repo/aws/nigredo/DATABASE_URL`

     * `/repo/aws/nigredo/FIBONACCI_API_BASE_URL`

     * `/repo/aws/nigredo/FIBONACCI_NIGREDO_TOKEN`

   * Lambda lendo variáveis a partir desses segredos via Terraform.

5. **Identidade visual**:

   * **Nada alterado** no visual do Nigredo:

     * Cores, fontes, logo e layout geral iguais ao padrão já adotado.

   * Toda melhoria é estrutural (arquitetura, organização de código, integração AWS).


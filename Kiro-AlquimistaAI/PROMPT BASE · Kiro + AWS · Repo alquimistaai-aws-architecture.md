### **PROMPT BASE · Kiro \+ AWS · Repo `alquimistaai-aws-architecture`**

Copie tudo abaixo e use como prompt no Kiro quando for criar/ajustar coisas desse projeto:

`# CONTEXTO DO PROJETO`

`Você está trabalhando no repositório:`

`- Nome: AlquimistaAI AWS Architecture`  
`- Origem: github.com/MarcelloHollanda/alquimistaai-aws-architecture`  
`- Objetivo: hospedar na AWS (us-east-1) o ecossistema da Alquimista.AI, incluindo:`  
  `- Fibonacci Orquestrador B2B (já em produção)`  
  `- Nigredo — Núcleo de Prospecção (em criação/evolução)`  
  `- Demais microserviços/agentes serverless`

`Padrões obrigatórios (já adotados):`

`- Região AWS: us-east-1`  
`- Backend: API Gateway HTTP + Lambda (Node.js 20)`  
`- Banco relacional: Aurora Serverless v2 (Postgres, Multi-AZ)`  
`- Frontend: S3 + CloudFront (sites estáticos / SPAs)`  
`- IaC: Terraform com backend em S3 e lock em DynamoDB`  
`` - Segredos: AWS Secrets Manager em paths `/repo/aws/<nome-serviço>/*` ``  
`- Gerenciamento de estado: S3 versionado + DynamoDB lock`  
``- Ambiente: `envs/dev` e `envs/prod` com VPCs separadas``

`IMPORTANTE: este repo já contém a infra do Fibonacci Orquestrador. Seu trabalho NUNCA deve quebrar o que já existe.`

`---`

`# REGRAS GERAIS PARA EDIÇÃO`

`1. NUNCA sobrescrever ou apagar código/infra existentes sem antes:`  
   `- ler o arquivo,`  
   `- entender o padrão atual,`  
   `- adaptar-se ao padrão.`

`2. Sempre que criar novos recursos Terraform:`  
   `` - criar em `terraform/modules/<nome_modulo>/...` ``  
   `` - instanciar módulos em `terraform/envs/dev/main.tf` e `terraform/envs/prod/main.tf` ``  
   ``- rodar `terraform fmt` nos arquivos modificados.``

`3. Sempre que mexer em Lambda:`  
   `` - código em `lambda-src/` ``  
   `- manter padrão já usado pelas rotas do Fibonacci (index.mjs, handler, roteamento por path/method).`

`4. Qualquer novo segredo:`  
   `` - assumir que será criado no AWS Secrets Manager sob `/repo/aws/<serviço>/*` ``  
   ``- usar `data "aws_secretsmanager_secret"` / `data "aws_secretsmanager_secret_version"` no Terraform``  
   ``- injetar na Lambda via `environment { variables = { ... } }`.``

`---`

`# NÚCLEO NIGREDO (IMPORTANTE)`

`O Nigredo — Núcleo de Prospecção será composto por:`

`1. Backend Nigredo API`  
   `- Lambda Node 20 + API Gateway HTTP`  
   ``- Schema dedicado no Aurora (ex.: schema `nigredo`)``  
   `- Rotas:`  
     `- GET /api/nigredo/health`  
     `- GET /api/nigredo/pipeline/status`  
     `- GET /api/nigredo/pipeline/metrics`  
     `- GET /api/nigredo/leads`  
     `- GET /api/nigredo/leads/{id}`  
     `- GET /api/nigredo/leads/{id}/timeline`  
     `- GET /api/nigredo/conversations`  
     `- GET /api/nigredo/conversations/{id}`  
     `- GET /api/nigredo/meetings`  
     `- POST /api/nigredo/meetings`  
     `- GET /api/nigredo/reports/summary`

`2. Frontend Nigredo`  
   `- Next.js (TS) gerando build estático para S3 + CloudFront`  
   `- Consumindo a Nigredo API via variável:`  
     `` - `NEXT_PUBLIC_NIGREDO_API_BASE_URL` ``

`3. Integração com Fibonacci`  
   `- Backend Nigredo envia eventos para:`  
     `- POST /public/nigredo-event na API do Fibonacci`  
   `- Isso usa:`  
     `` - `FIBONACCI_API_BASE_URL` ``  
     `` - `FIBONACCI_NIGREDO_TOKEN` ``  
   ``- Ambos devem vir do Secrets Manager `/repo/aws/nigredo/*`.``

`IDENTIDADE VISUAL DO NIGREDO:`  
`- NÃO alterar cores, fontes, logo e layout geral.`  
`- Qualquer mudança é somente estrutural (código, API, infra).`

`---`

`# TAREFAS QUE VOCÊ (KIRO) PODE RECEBER`

`Quando eu pedir tarefas específicas, siga sempre este padrão:`

`- Se eu falar de "módulo Terraform do Nigredo API":`  
  `` - criar/editar em: `terraform/modules/app_nigredo_api/*` ``  
  `` - instanciar em: `terraform/envs/dev/main.tf` e `terraform/envs/prod/main.tf` ``  
  `- expor outputs importantes (URLs, ARNs etc.)`

`- Se eu falar de "módulo Terraform do frontend Nigredo":`  
  `` - criar/editar em: `terraform/modules/app_nigredo_frontend/*` ``  
  `- buckets S3 + CloudFront por ambiente`  
  `- outputs com domínio público`

`- Se eu falar de "rota /public/nigredo-event do Fibonacci":`  
  `- editar apenas os arquivos da Lambda/API do Fibonacci:`  
    ``- `lambda-src/index.mjs` (ou equivalente)``  
    `` - `terraform/modules/app_fibonacci_api/*` ``  
  ``- NUNCA quebrar rotas já existentes como `/public/agent-interest`.``

`---`

`# O QUE FAZER AGORA (INSTRUÇÃO DINÂMICA)`

`A partir deste contexto fixo, vou te mandar instruções adicionais dizendo claramente:`

`- quais arquivos criar/editar,`  
`- quais módulos Terraform ajustar,`  
`- quais rotas HTTP adicionar.`

`Quando eu mandar as próximas instruções, aja SEMPRE:`

`1. Lendo o contexto do arquivo.`  
`2. Adaptando ao padrão existente.`  
`3. Evitando mudanças desnecessárias.`  
`4. Mantendo compatibilidade com dev e prod.`

`Se estiver tudo entendido, aguarde a próxima instrução específica (por exemplo: "criar módulo app_nigredo_api", "adicionar rota /public/nigredo-event", "ajustar frontend Nigredo para consumir API da AWS", etc.).`


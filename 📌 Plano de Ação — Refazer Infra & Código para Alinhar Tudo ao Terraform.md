## **📌 Plano de Ação — Refazer Infra & Código para Alinhar Tudo ao Terraform**

A ideia aqui é **refazer com calma e consciência**, não “apagar tudo e sair reescrevendo”. Vamos em fases, com checkpoints claros.

### **Fase 0 — Congelamento Lógico & Organização**

1. **Congelar o estado atual de referência (CDK)**

   * Garantir que o repositório CDK atual (`alquimistaai-aws-architecture` \+ Kiro) esteja:

     * Em uma branch marcada, por exemplo: `legacy/cdk-architecture-inicial`.

     * Com um documento resumo tipo: `docs/ARQUITETURA-CDK-LEGADA-SUMARIO.md` explicando o que existe hoje.

   * Objetivo: ter um “snapshot” histórico para consulta, sem seguir expandindo em CDK.

2. **Definir repositório(s) Terraform**

   * Decidir se:

     * Usaremos o **mesmo repo** atual, com uma pasta `terraform/`, ou

     * Um **novo repo** só para o Terraform da plataforma (ex.: `alquimistaai-terraform`).

   * Padrão de diretórios (fixo):

     * `terraform/`

       * `modules/`

       * `envs/dev/`

       * `envs/prod/`

3. **Documento de governança da migração**

   * Criar algo como `docs/MIGRACAO-CDK-PARA-TERRAFORM-PLANO-GERAL.md` com:

     * A decisão oficial (texto acima).

     * As fases deste plano.

     * Regras: nada novo em CDK; tudo novo em Terraform.

---

### **Fase 1 — Terreno Limpo & Backends Terraform**

1. **Configurar backend remoto do Terraform**

   * Criar (ou confirmar) bucket S3 e tabela DynamoDB para o state:

     * S3 versionado \+ criptografado (ex.: `alquimistaai-terraform-state`).

     * DynamoDB (ex.: `alquimistaai-terraform-locks`).

   * Configurar em `terraform/envs/dev/backend.tf` e `terraform/envs/prod/backend.tf`.

2. **Definir providers e estrutura base**

   * `terraform/envs/dev/main.tf` e `terraform/envs/prod/main.tf` contendo:

     * `provider "aws"` fixando `region = "us-east-1"`.

     * Blocos de chamadas de módulos (ainda vazios): VPC, segurança, banco, app, frontend.

3. **Check de segurança**

   * Documento/checklist: `docs/SEGURANCA-BASE-TERRAFORM-CHECKLIST.md`:

     * Confirmação de que o state não está público.

     * Bucket e tabela com tags padrão.

---

### **Fase 2 — VPC, Segurança e “Fundação” em Terraform**

1. **Migrar VPC dev/prod para Terraform**

   * Criar módulo `terraform/modules/networking`:

     * VPC dev e prod com CIDRs distintos.

     * Subnets públicas/privadas.

     * NATs (se necessário) e regras básicas de segurança.

   * Declarar em `envs/dev/main.tf` e `envs/prod/main.tf`.

2. **Migrar guardrails de segurança para Terraform**

   * Módulo `terraform/modules/security_guardrails`:

     * CloudTrail (trail único com logs em S3).

     * GuardDuty ativado em us-east-1.

     * SNS para alertas de segurança.

     * Integração GuardDuty → EventBridge → SNS.

3. **Migrar guardrails de custo para Terraform**

   * AWS Budgets (80/100/120%).

   * Cost Anomaly Detection (\~US$ 50).

   * SNS de custo.

4. **Padronizar tags de recursos**

   * Módulo base com locals de tags:

     * `Project = "AlquimistaAI"`

     * `Environment = "dev|prod"`

     * `Owner`, etc.

---

### **Fase 3 — Banco de Dados & Segredos (Aurora \+ Secrets Manager)**

1. **Módulo Aurora**

   * `terraform/modules/aurora_fibonacci`:

     * Cluster Aurora PostgreSQL Serverless v2.

     * Multi-AZ.

     * Param groups, subnets, SGs.

   * Instanciar nos `envs/dev` e `envs/prod`.

2. **Segredos \+ rotação**

   * Módulo `terraform/modules/secrets` com:

     * Secrets Manager para credenciais Aurora.

     * Configuração de rotação automática (Lambda de rotação).

   * Adotar convenção de caminho:

     * Ex.: `/repo/aws/alquimistaai/aurora-fibonacci-dev`.

3. **Documentação**

   * Atualizar docs do banco:

     * `docs/AURORA-TERRAFORM-OFICIAL.md` explicando nova fonte de verdade.

---

### **Fase 4 — Backend Fibonacci / Nigredo / Plataforma em Terraform**

1. **Módulo de API e funções Lambda**

   * `terraform/modules/app_fibonacci_api`

     * Funções Lambda principais do Fibonacci Orquestrador.

     * API Gateway HTTP com rotas corretas (`/`, `/health`, `/tenant/*`, etc., conforme for consolidado).

   * `terraform/modules/app_nigredo_api` (quando for a vez).

   * `terraform/modules/app_alquimista_platform` (painel operacional).

2. **Integração com banco e segredos**

   * Variáveis de ambiente das Lambdas apontando para:

     * Endpoint do Aurora.

     * Secrets Manager path.

   * Políticas IAM mínimas para ler os segredos.

3. **Eventos e agendamentos**

   * Módulo `terraform/modules/events`:

     * EventBridge rules, schedulers.

     * Dead-letter queues se precisar.

4. **Checkpoints**

   * Para cada módulo grande:

     * `terraform plan` e `terraform apply` em dev.

     * Smoke tests manuais das rotas principais.

---

### **Fase 5 — Frontend S3 \+ CloudFront \+ WAF em Terraform**

1. **Buckets e CloudFront**

   * `terraform/modules/frontend`:

     * Buckets S3 dev/prod.

     * CloudFront distributions dev/prod.

     * Integração com WAF.

2. **WAF**

   * `terraform/modules/waf`:

     * WebACL dev/prod.

     * Logging em CloudWatch Logs (padrão já estabelecido).

   * Associar às distributions.

3. **Deploy scripts**

   * Scripts (PowerShell) para:

     * `aws s3 sync` do build do frontend para os buckets.

   * Documentar: `docs/frontend/FRONTEND-TERRAFORM-DEPLOY.md`.

---

### **Fase 6 — CI/CD Atualizado para Terraform**

1. **Workflow GitHub Actions**

   * Atualizar ou criar `.github/workflows/ci-cd-terraform.yml`:

     * Jobs:

       * `plan-dev` (pull request).

       * `apply-dev` (merge em main).

       * `plan-prod` (gatilho manual).

       * `apply-prod` (deploy controlado).

     * Autenticação via OIDC (mantendo padrão atual).

2. **Scripts de validação**

   * Adaptar scripts existentes (smoke tests, validação de migrations) para o novo contexto Terraform.

   * Atualizar docs:

     * `docs/CI-CD-TERRAFORM-PIPELINE-ALQUIMISTAAI.md`.

---

### **Fase 7 — Limpeza de CDK & Convergência Final**

1. **Descomissionar CDK com cuidado**

   * Depois que:

     * Toda infra estiver criada e estável via Terraform, e

     * CI/CD Terraform estiver rodando bem,

   * Planejar:

     * Remoção gradual das stacks CDK (via `cdk destroy`) **após** Terraform assumir esses recursos.

     * Ou utilizar `terraform import` se necessário para recursos criados por CDK que serão mantidos.

2. **Arquivar CDK**

   * Manter a branch `legacy/cdk-architecture-inicial` como histórico.

   * Documentar em:

     * `docs/ARQUITETURA-CDK-LEGADA-ARQUIVADA.md` → “não manter mais infra em CDK”.

3. **Revisar documentação geral**

   * Atualizar:

     * `docs/STATUS-GERAL-SISTEMA-ALQUIMISTAAI.md`

     * `docs/STATUS-GERAL-SISTEMA-ALQUIMISTAAI-SHORT-INDEX.md`

   * Garantir que todos os canais apontem para **Terraform** como fonte de verdade da infra.

---

### **Como vou usar esse plano daqui pra frente**

* Vou tratar **esta decisão \+ plano** como referência fixa (“memória permanente”) até você dizer que a migração foi concluída.

* Cada vez que você trouxer:

  * Logs do Kiro,

  * Erros de Terraform,

  * Dúvidas sobre módulos,

* eu vou localizar **em qual Fase** estamos e agir mantendo esse plano como trilho — sem inventar arquitetura nova no meio.

Quando você quiser começar pela **primeira ação concreta**, posso transformar a Fase 0 \+ Fase 1 em um **prompt único para o Kiro** (em Markdown) para ele já criar a estrutura inicial `terraform/` \+ backend remoto \+ docs de governança da migração.


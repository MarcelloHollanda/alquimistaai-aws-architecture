# **Solicitação de evolução da ARQUITETURA EXISTENTE do Fibonacci Orquestrador (brownfield · AWS serverless)**

## **Contexto**

* Região: **us-east-1**

* Backend com arquitetura **serverless**:

  * **Amazon API Gateway (HTTP API)** como camada de entrada.

  * **AWS Lambda (Node.js)** como compute principal.

  * Banco de dados relacional em **Amazon Aurora Serverless v2 (PostgreSQL)**.

* Resposta atual das APIs (ambiente de saúde verificada):

  * **DEV**

    * API HTTP: `fibonacci-api-dev-http`

    * ID: `c5loeivg0k`

    * Endpoint base: `https://c5loeivg0k.execute-api.us-east-1.amazonaws.com/`

Resposta em `/`:

 {  
  "ok": true,  
  "service": "Fibonacci Orquestrador",  
  "environment": "dev",  
  "db\_status": "connected"  
}

*   
  * **PROD**

    * API HTTP: `fibonacci-api-prod-http` (nome lógico, ID oficial abaixo)

    * ID: `ogsd1547nd`

    * Endpoint base: `https://ogsd1547nd.execute-api.us-east-1.amazonaws.com/`

Resposta em `/`:

 {  
  "ok": true,  
  "service": "Fibonacci Orquestrador",  
  "environment": "prod",  
  "db\_status": "connected"  
}

* 

### **Infraestrutura como Código já existente**

* Repositório principal (monorepo) no GitHub:  
   `github.com/MarcelloHollanda/alquimistaai-aws-architecture`

* Trabalho local (Windows):  
   `C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\`

* Estrutura Terraform:

  * Diretório raiz: `terraform/`

  * Módulos reutilizáveis em: `terraform/modules/`

    * Inclui, entre outros:

      * `terraform/modules/app_fibonacci_api/`

      * `terraform/modules/banco_fibonacci_aurora/`

  * Ambientes:

    * `terraform/envs/dev/`

    * `terraform/envs/prod/`

  * Backend remoto:

    * Bucket S3 do state (já existente, **não recriar**):  
       `alquimistaai-terraform-state`

    * Tabela DynamoDB de lock (já existente, **não recriar**):  
       `alquimistaai-terraform-locks`

* Banco de dados:

  * Aurora Serverless v2 PostgreSQL do Fibonacci já criado via módulo  
     `terraform/modules/banco_fibonacci_aurora/`

  * Banco e conexão já testados, conforme resposta `db_status: "connected"`.

### **Segurança, governança e custos (fundação já criada)**

* VPCs separadas para `dev` e `prod` (CIDRs distintos), com sub-redes e NAT configurados.

* **CloudTrail** e **GuardDuty** já habilitados na conta.

* **AWS Budgets** e **Cost Anomaly Detection** configurados em nível de conta (podem ser ampliados, mas não recriados).

* Padrão de tags obrigatório já adotado (ex.: `Project`, `Env`, `Owner`, `CostCenter`).

* Secrets sensíveis sendo movidos/provisionados para **AWS Secrets Manager** (padrão de path a ser mantido).

### **Situação atual específica do módulo da API**

No módulo `terraform/modules/app_fibonacci_api/`, ao rodar `terraform plan/apply`, foi identificado o erro:

Error: Reference to undeclared resource

  on ..\\..\\modules\\app\_fibonacci\_api\\main.tf line 135, in resource "aws\_apigatewayv2\_route" "public\_agent\_interest\_post":  
  135:   target    \= "integrations/${aws\_apigatewayv2\_integration.lambda.id}"

A managed resource "aws\_apigatewayv2\_integration" "lambda" has not been declared in module.fibonacci\_api.

Ou seja:

* Existe um recurso `aws_apigatewayv2_route "public_agent_interest_post"` tentando referenciar um `aws_apigatewayv2_integration.lambda` que **não foi declarado** nesse módulo.

* A intenção dessa rota é expor a URL:  
   `POST /public/agent-interest`  
   apontando para a **mesma Lambda principal** do Fibonacci Orquestrador (que já atende `GET /`).

### **Situação atual específica do código Lambda**

No arquivo `lambda-src/index.mjs` (ou arquivo equivalente do handler principal), há um trecho de código planejado para a rota de interesse de agente:

if (event.requestContext?.http?.method \=== "POST" &&  
    event.rawPath \=== "/public/agent-interest") {

  let payload \= {};  
  try {  
    payload \= JSON.parse(event.body || "{}");  
  } catch (e) {  
    console.error("Erro ao parsear body:", e);  
  }

  console.log("agent-interest", {  
    ...payload,  
    receivedAt: new Date().toISOString()  
  });

  return {  
    statusCode: 200,  
    // TODO: completar resposta JSON para o frontend  
  };  
}

Essa lógica ainda está **incompleta** (falta fechar a resposta estruturada, erros, etc.) e precisa ser integrada de forma limpa no switch/roteador atual da Lambda.

### **Escopo exato da evolução desejada**

Queremos uma evolução **incremental** e **sem downtime** do Fibonacci Orquestrador com foco em:

1. **Nova rota pública de interesse de agente**

   * Criar/corrigir a rota `POST /public/agent-interest` nos ambientes **dev** e **prod**, usando o HTTP API já existente:

     * Não criar uma nova API HTTP.

     * Não duplicar o recurso principal de API; apenas adicionar rota e integração.

   * A rota deve:

     * Apontar para a Lambda principal já usada na rota `/` do Fibonacci.

     * Aceitar `Content-Type: application/json`.

Devolver uma resposta simples de confirmação ao frontend, por exemplo:

 {  
  "ok": true,  
  "received": true,  
  "trace\_id": "\<id\>",  
  "environment": "\<dev|prod\>"  
}

*   
2. **Correção do módulo Terraform `app_fibonacci_api`**

   * Ajustar o módulo para:

     * Declarar corretamente o recurso `aws_apigatewayv2_integration` usado pela rota `public_agent_interest_post`, ou

     * Reutilizar uma integração existente (se for o padrão da API).

Eliminar o erro:

 Reference to undeclared resource aws\_apigatewayv2\_integration.lambda

*   
  * Manter o padrão de nome dos recursos e tags já usados no módulo.

  * Garantir que `terraform plan` fique limpo em `envs/dev` e `envs/prod`.

3. **Refino do código da Lambda**

   * Finalizar a implementação do bloco:

     * `POST /public/agent-interest`

   * Incluir:

     * Validação mínima do payload.

     * Log estruturado com `requestId` / `traceId`.

     * Respostas adequadas para:

       * Sucesso (200).

       * Body inválido (400).

   * Garantir que a lógica da nova rota não afete as rotas já existentes (principalmente `/`).

4. **Observabilidade mínima da nova rota**

   * Adicionar **CloudWatch Alarms** para a API HTTP e/ou Lambda relacionados a essa rota:

     * Exemplo: taxa de erros 4xx/5xx acima de um limiar (em dev e prod).

     * Latência p95 acima de um limite razoável.

   * Enviar alertas para um **SNS Topic** (pode ser um tópico já existente de alertas gerais da AlquimistaAI, ou um novo recurso se necessário).

5. **Ajustes pontuais no CI/CD**

   * Garantir que o workflow atual de **GitHub Actions**:

     * Faça `terraform plan` e `apply` para os módulos afetados (`app_fibonacci_api` e, se necessário, o módulo de Lambda).

     * Realize o build/deploy da nova versão da Lambda.

     * Utilize **versions/aliases** da Lambda (ex.: `live`) para permitir rollback rápido.

---

## **Tarefa**

Com base no contexto acima, produza uma solução **incremental** para evoluir o Fibonacci Orquestrador **sem quebrar o que já está em produção**. Tudo deve ser pensado como “refatoração com migração suave”, **sem recriação de recursos fundamentais** e com foco na nova rota `POST /public/agent-interest`, correção do módulo `app_fibonacci_api`, melhoria do código da Lambda e observabilidade mínima.

## **Componentes Necessários**

1. **Plano de Evolução (alto nível)**

   * Liste claramente as mudanças propostas, classificadas por:

     * API & Routing (nova rota).

     * Infra Terraform (módulo `app_fibonacci_api`).

     * Código Lambda.

     * Observabilidade (CloudWatch \+ SNS).

     * CI/CD (GitHub Actions).

   * Indique quais mudanças:

     * São apenas de código (Lambda).

     * Exigem alterações em Terraform (API, integrações, alarms).

   * Sugira a ordem recomendada:

     * Primeiro em `dev` → validação → depois `prod`.

2. **Atualizações de Terraform (patches incrementais)**

   * Proponha **modificações em arquivos existentes**, não apenas blocos soltos:

     * Principalmente em:

       * `terraform/modules/app_fibonacci_api/main.tf`

       * Eventuais outputs/variables se forem necessários.

     * E, se necessário, referências em:

       * `terraform/envs/dev/main.tf`

       * `terraform/envs/prod/main.tf`

   * Sempre explicite:

     * Onde o novo recurso deve ser adicionado.

     * O que deve ser removido/ajustado para eliminar o erro de referência `aws_apigatewayv2_integration.lambda`.

   * Inclua comentários em Terraform explicando:

     * O papel da rota `POST /public/agent-interest`.

     * Como a integração com a Lambda é feita.

3. **Atualizações de Código (Lambda / Node.js)**

   * Forneça um exemplo completo de implementação da lógica:

     * Detecção da combinação `POST + /public/agent-interest`.

     * Parse/validação do `event.body`.

     * Log estruturado (incluindo `event.requestContext.requestId`).

     * Resposta JSON amigável ao frontend.

   * Mostre como integrar essa condição na estrutura atual do handler (sem quebrar o `/`).

   * Se necessário, sugira uma pequena refatoração para organização de rotas, mas sem exagerar na complexidade.

4. **Ajustes no CI/CD (GitHub Actions)**

   * Descreva, em YAML comentado, as modificações necessárias no pipeline existente para:

     * Rodar `terraform plan` e `apply` focados nos módulos afetados.

     * Buildar e publicar a nova versão da Lambda.

     * Atualizar o alias estável (`live` ou equivalente).

   * O pipeline deve:

     * Aplicar primeiro em `dev`.

     * Ter um fluxo distinto para promoção para `prod`.

5. **Guia de Migração Sem Downtime**

   * Forneça um passo a passo concreto para:

     * Aplicar as mudanças em `dev` (infra \+ código \+ CI/CD).

     * Testar a nova rota em `dev`:

       * Exemplo de chamada `curl` ou comando HTTP para `POST /public/agent-interest`.

     * Promover a mudança para `prod` com segurança.

   * Explique:

     * Como fazer rollback rápido (voltar para a versão anterior da Lambda, e/ou remover a rota se necessário).

     * Onde olhar logs e métricas (CloudWatch) caso algo saia errado.

## **Requisitos**

* **Nunca recriar**:

  * VPCs base de dev/prod.

  * Cluster Aurora Serverless v2 principal do Fibonacci.

  * APIs HTTP principais (`c5loeivg0k` e `ogsd1547nd`).

  * Backend remoto do Terraform (S3 \+ DynamoDB).

* Todas as mudanças devem ser feitas como **evolução incremental** da infra e código existentes.

* Manter o padrão:

  * Lambda \+ API Gateway \+ Aurora Serverless v2.

  * **AWS Secrets Manager** para segredos (sem credenciais em código ou state).

  * **GitHub Actions \+ OIDC** para CI/CD.

* Explicar com comentários claros nas partes de código e Terraform o motivo das principais escolhas (segurança, performance, custo).

* Formatar tudo em Markdown, com blocos de código incrementais (patches) e instruções claras.


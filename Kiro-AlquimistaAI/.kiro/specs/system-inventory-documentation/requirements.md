# Requirements Document

## Introduction

Este documento define os requisitos para a criação de um inventário completo e consolidado do Sistema AlquimistaAI. O objetivo é gerar documentação técnica abrangente que sirva como referência operacional para a equipe e como base de memória permanente para ferramentas de IA que acompanham o desenvolvimento do projeto.

## Glossary

- **Sistema AlquimistaAI**: Ecossistema completo hospedado na AWS que inclui Fibonacci Orquestrador, Nigredo e demais microserviços
- **Fibonacci Orquestrador**: Sistema de orquestração principal para gestão de leads e automações B2B
- **Nigredo**: Núcleo de prospecção dedicado à qualificação de leads
- **CDK (Cloud Development Kit)**: Framework de Infrastructure as Code da AWS usado no projeto
- **Stack**: Conjunto de recursos AWS gerenciados como uma unidade pelo CDK
- **Aurora**: Serviço de banco de dados relacional gerenciado da AWS (PostgreSQL)
- **API Gateway**: Serviço AWS para criação e gerenciamento de APIs REST e HTTP
- **Lambda**: Serviço de computação serverless da AWS
- **Cognito**: Serviço de autenticação e autorização da AWS
- **CloudWatch**: Serviço de monitoramento e observabilidade da AWS
- **WAF (Web Application Firewall)**: Firewall de aplicação web da AWS
- **GuardDuty**: Serviço de detecção de ameaças da AWS
- **CloudTrail**: Serviço de auditoria e logging de ações na AWS
- **OIDC (OpenID Connect)**: Protocolo de autenticação usado para integração GitHub Actions
- **IaC (Infrastructure as Code)**: Prática de gerenciar infraestrutura através de código

## Requirements

### Requirement 1

**User Story:** Como desenvolvedor do projeto, quero ter acesso a um documento consolidado que descreva toda a infraestrutura AWS, para que eu possa entender rapidamente a topologia do sistema sem precisar consultar múltiplos arquivos.

#### Acceptance Criteria

1. WHEN o documento de inventário é consultado THEN o sistema SHALL apresentar uma lista completa de todas as stacks CDK com seus respectivos ambientes (dev/prod)
2. WHEN uma stack é documentada THEN o sistema SHALL listar todos os recursos principais (APIs, Lambdas, bancos de dados, buckets S3, distributions CloudFront)
3. WHEN recursos AWS são listados THEN o sistema SHALL incluir identificadores únicos (IDs, ARNs, nomes lógicos) sem expor segredos ou credenciais
4. WHEN a região AWS é mencionada THEN o sistema SHALL especificar claramente us-east-1 como região principal
5. WHEN múltiplos ambientes existem THEN o sistema SHALL diferenciar claramente recursos de dev e prod

### Requirement 2

**User Story:** Como arquiteto de dados, quero documentação clara sobre o estado atual dos bancos de dados e migrations, para que eu possa entender a estrutura de dados e histórico de mudanças.

#### Acceptance Criteria

1. WHEN o banco de dados Aurora é documentado THEN o sistema SHALL especificar engine, modo (Serverless v2), região e identificadores do cluster
2. WHEN schemas de banco são listados THEN o sistema SHALL enumerar todos os schemas principais (alquimista_platform, fibonacci_core, nigredo_leads)
3. WHEN migrations são documentadas THEN o sistema SHALL listar todas as migrations oficiais com número, nome de arquivo e resumo das alterações
4. WHEN decisões sobre migrations são registradas THEN o sistema SHALL documentar claramente casos especiais (como migration 009 duplicada)
5. WHEN o fluxo oficial de migrations é descrito THEN o sistema SHALL referenciar os scripts PowerShell corretos para aplicação

### Requirement 3

**User Story:** Como desenvolvedor backend, quero documentação detalhada de todas as APIs do sistema, para que eu possa identificar rapidamente qual API usar para cada funcionalidade.

#### Acceptance Criteria

1. WHEN APIs são documentadas THEN o sistema SHALL listar tipo (HTTP/REST), ID, endpoint base e ambiente para cada API
2. WHEN a API do Fibonacci é descrita THEN o sistema SHALL incluir rotas principais e propósito de negócio
3. WHEN a API do Nigredo é descrita THEN o sistema SHALL documentar integração com Aurora/DynamoDB e rotas disponíveis
4. WHEN a API do Painel Operacional é descrita THEN o sistema SHALL identificar claramente a stack que a cria e diferenciá-la da API do Fibonacci
5. WHEN rotas de API são listadas THEN o sistema SHALL incluir pelo menos as rotas críticas (/health, /tenant/*, /internal/*)

### Requirement 4

**User Story:** Como desenvolvedor frontend, quero documentação clara sobre a estrutura do frontend e suas integrações, para que eu possa entender como o painel operacional se conecta aos backends.

#### Acceptance Criteria

1. WHEN o frontend Next.js é documentado THEN o sistema SHALL descrever a estrutura App Router com rotas principais
2. WHEN a integração com Cognito é descrita THEN o sistema SHALL explicar o fluxo de autenticação (Hosted UI, callback, grupos)
3. WHEN testes são mencionados THEN o sistema SHALL reportar o status atual (38/38 testes de segurança, 27/27 testes de middleware)
4. WHEN clients de API são listados THEN o sistema SHALL identificar api-client.ts, tenant-client.ts, internal-client.ts e outros
5. WHEN variáveis de ambiente são referenciadas THEN o sistema SHALL explicar como as URLs base são construídas

### Requirement 5

**User Story:** Como engenheiro de segurança, quero documentação completa sobre autenticação e autorização, para que eu possa auditar e validar as configurações de segurança.

#### Acceptance Criteria

1. WHEN o User Pool Cognito é documentado THEN o sistema SHALL incluir nome, região, ID do pool e IDs de clientes
2. WHEN grupos Cognito são listados THEN o sistema SHALL enumerar INTERNAL_ADMIN, INTERNAL_SUPPORT, TENANT_ADMIN, TENANT_USER com suas funções
3. WHEN usuários DEV são documentados THEN o sistema SHALL listar apenas e-mails e grupos, sem senhas ou tokens
4. WHEN o domínio Hosted UI é mencionado THEN o sistema SHALL incluir a URL configurada
5. WHEN segredos são referenciados THEN o sistema SHALL apenas indicar localização, nunca valores reais

### Requirement 6

**User Story:** Como engenheiro DevOps, quero documentação completa do pipeline CI/CD, para que eu possa entender e manter o processo de deploy.

#### Acceptance Criteria

1. WHEN o workflow CI/CD é documentado THEN o sistema SHALL descrever triggers (push, tags, dispatch) e jobs principais
2. WHEN a integração OIDC é descrita THEN o sistema SHALL mencionar a role assumida (GitHubActionsRole) e variáveis necessárias
3. WHEN scripts de validação são listados THEN o sistema SHALL incluir validate-system-complete.ps1, smoke-tests-api-dev.ps1 e outros
4. WHEN ambientes são mencionados THEN o sistema SHALL diferenciar deploy automático (dev) de manual com proteção (prod)
5. WHEN testes de workflow são referenciados THEN o sistema SHALL apontar para documentos de teste (TEST-LOG.md, RESUMO-TESTE-CI-CD.md)

### Requirement 7

**User Story:** Como engenheiro de infraestrutura, quero documentação dos guardrails de segurança, custo e observabilidade, para que eu possa monitorar e manter a saúde do sistema.

#### Acceptance Criteria

1. WHEN guardrails de segurança são documentados THEN o sistema SHALL descrever CloudTrail, GuardDuty, WAF e SNS topics
2. WHEN guardrails de custo são descritos THEN o sistema SHALL mencionar AWS Budgets (limiares 80/100/120%) e Cost Anomaly Detection
3. WHEN guardrails de observabilidade são listados THEN o sistema SHALL incluir dashboards CloudWatch com widgets principais
4. WHEN WebACLs do WAF são documentadas THEN o sistema SHALL listar log groups e ARNs de destino (sem :*)
5. WHEN SNS topics são mencionados THEN o sistema SHALL descrever suas finalidades (alertas de segurança, notificações)

### Requirement 8

**User Story:** Como desenvolvedor, quero uma tabela de referência de variáveis de ambiente, para que eu possa configurar corretamente os diferentes componentes do sistema.

#### Acceptance Criteria

1. WHEN variáveis de ambiente são listadas THEN o sistema SHALL incluir nome, onde é usada, onde é armazenada e descrição funcional
2. WHEN variáveis sensíveis são mencionadas THEN o sistema SHALL usar formato mascarado (sk_live_********, AKIA************)
3. WHEN integrações externas são documentadas THEN o sistema SHALL listar nome, arquivos principais e variáveis necessárias
4. WHEN webhooks são mencionados THEN o sistema SHALL incluir URLs sem expor segredos
5. WHEN múltiplos locais de armazenamento existem THEN o sistema SHALL diferenciar .env.local, Secrets Manager e SSM Parameter Store

### Requirement 9

**User Story:** Como líder técnico, quero uma seção de gaps e riscos conhecidos, para que eu possa priorizar melhorias e mitigações.

#### Acceptance Criteria

1. WHEN gaps são listados THEN o sistema SHALL incluir problemas conhecidos com referências específicas (arquivo/linha)
2. WHEN riscos são documentados THEN o sistema SHALL descrever configurações manuais não codificadas em IaC
3. WHEN dependências externas são mencionadas THEN o sistema SHALL indicar falta de monitoramento quando aplicável
4. WHEN próximos passos são sugeridos THEN o sistema SHALL limitar a 5-10 bullets priorizados
5. WHEN inconsistências são encontradas THEN o sistema SHALL registrar diferenças entre documentação e código

### Requirement 10

**User Story:** Como ferramenta de IA, quero um índice compacto com identificadores-chave, para que eu possa rapidamente recuperar informações essenciais do sistema.

#### Acceptance Criteria

1. WHEN o índice compacto é gerado THEN o sistema SHALL começar com bloco de identificadores-chave (região, cluster, APIs, pools)
2. WHEN IDs de recursos são listados THEN o sistema SHALL incluir API Gateway IDs, CloudFront distribution IDs, User Pool IDs
3. WHEN URLs são documentadas THEN o sistema SHALL listar endpoints base de todas as APIs principais
4. WHEN buckets S3 são mencionados THEN o sistema SHALL identificar buckets críticos (frontend, logs)
5. WHEN o formato é definido THEN o sistema SHALL usar seções curtas e estrutura simples para parsing por IA

## Constraints

- O documento principal DEVE ser criado em `docs/STATUS-GERAL-SISTEMA-ALQUIMISTAAI.md`
- O índice compacto DEVE ser criado em `docs/STATUS-GERAL-SISTEMA-ALQUIMISTAAI-SHORT-INDEX.md`
- NENHUM arquivo gerado DEVE conter senhas, segredos, chaves privadas ou tokens reais
- Todos os documentos DEVEM ser escritos em português brasileiro
- Os documentos DEVEM fazer referência cruzada aos materiais existentes sem duplicar conteúdo
- Comandos e exemplos DEVEM ser compatíveis com Windows (PowerShell/cmd)
- O documento DEVE ser autossuficiente para leitura humana
- O índice compacto DEVE ser otimizado para consumo por IA
- Valores sensíveis DEVEM ser mascarados (sk_live_********, AKIA************)
- Inconsistências encontradas DEVEM ser registradas na seção de Gaps com referências precisas

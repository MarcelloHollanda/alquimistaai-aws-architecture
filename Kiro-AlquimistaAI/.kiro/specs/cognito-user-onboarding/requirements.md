# Requisitos - Onboarding de Usuários no Cognito (AlquimistaAI)

## Introdução

Este documento define os requisitos para padronizar e documentar o processo de onboarding de usuários no Amazon Cognito para a plataforma AlquimistaAI. O sistema já possui infraestrutura de autenticação validada (38/38 testes de segurança passando), mas falta a materialização de usuários e grupos reais no Cognito, além de documentação operacional para a equipe não-técnica.

## Glossário

- **User Pool**: Pool de usuários do Amazon Cognito que armazena identidades e credenciais
- **Cognito Group**: Grupo de permissões no Cognito (INTERNAL_ADMIN, INTERNAL_SUPPORT, TENANT_ADMIN, TENANT_USER)
- **Claim**: Atributo JWT retornado pelo Cognito após autenticação (sub, email, cognito:groups, custom:tenant_id)
- **Authorization Middleware**: Middleware backend que valida claims do Cognito
- **Tenant**: Cliente da plataforma AlquimistaAI (empresa que contrata os serviços)
- **INTERNAL User**: Usuário da equipe interna AlquimistaAI
- **TENANT User**: Usuário cliente da plataforma
- **Fibonacci**: Sistema de orquestração principal B2B
- **Painel Operacional**: Dashboard interno para gestão de tenants e operações

## Requisitos

### Requisito 1

**User Story:** Como administrador de sistema, quero ter User Pools padronizados no Cognito para ambientes dev e prod, para que a infraestrutura de identidade seja consistente e rastreável.

#### Acceptance Criteria

1. WHEN o sistema é configurado THEN o Cognito SHALL ter User Pools nomeados "fibonacci-users-dev" e "fibonacci-users-prod" na região us-east-1
2. WHEN um User Pool é criado THEN o sistema SHALL configurar claims obrigatórios: sub, email, cognito:groups e custom:tenant_id
3. WHEN a infraestrutura é auditada THEN o sistema SHALL permitir cross-check via CloudFormation para validar recursos do Cognito
4. WHEN um ambiente é provisionado THEN o sistema SHALL garantir que o authorization-middleware está configurado para ler os claims corretos

### Requisito 2

**User Story:** Como administrador de sistema, quero criar grupos oficiais de permissão no Cognito, para que o controle de acesso seja granular e alinhado com os perfis de usuário.

#### Acceptance Criteria

1. WHEN grupos são criados no User Pool THEN o sistema SHALL criar exatamente quatro grupos: INTERNAL_ADMIN, INTERNAL_SUPPORT, TENANT_ADMIN, TENANT_USER
2. WHEN um usuário é autenticado THEN o Cognito SHALL incluir os grupos do usuário no claim "cognito:groups"
3. WHEN o backend valida permissões THEN o authorization-middleware SHALL reconhecer os quatro grupos oficiais
4. WHEN grupos são nomeados THEN o sistema SHALL usar os nomes exatos definidos (case-sensitive) para compatibilidade com testes

### Requisito 3

**User Story:** Como CEO da AlquimistaAI, quero ser criado como primeiro usuário INTERNAL_ADMIN, para que eu possa acessar o painel operacional com permissões completas.

#### Acceptance Criteria

1. WHEN o primeiro usuário interno é criado THEN o sistema SHALL criar usuário com nome "marcello.admin" e e-mail verificado
2. WHEN o usuário é provisionado THEN o sistema SHALL adicionar o usuário ao grupo INTERNAL_ADMIN
3. WHEN o usuário faz login THEN o sistema SHALL retornar claims com cognito:groups contendo "INTERNAL_ADMIN"
4. WHEN o usuário acessa o painel THEN o sistema SHALL permitir acesso a todos os tenants e configurações globais

### Requisito 4

**User Story:** Como administrador de sistema, quero criar usuários de suporte interno (INTERNAL_SUPPORT), para que a equipe operacional possa auxiliar clientes sem poderes administrativos críticos.

#### Acceptance Criteria

1. WHEN um usuário de suporte é criado THEN o sistema SHALL criar usuário com prefixo "support.internal" e e-mail corporativo
2. WHEN o usuário é provisionado THEN o sistema SHALL adicionar o usuário ao grupo INTERNAL_SUPPORT
3. WHEN o usuário acessa o sistema THEN o sistema SHALL permitir visualização de tenants e troubleshooting
4. WHEN o usuário tenta ações críticas THEN o sistema SHALL bloquear alterações de billing e configurações sensíveis

### Requisito 5

**User Story:** Como administrador de sistema, quero um fluxo padronizado para criar clientes (TENANT_ADMIN), para que novos contratos sejam onboardados de forma consistente e segura.

#### Acceptance Criteria

1. WHEN um novo cliente é onboardado THEN o sistema SHALL criar registro de tenant com UUID único no Aurora/DynamoDB
2. WHEN o tenant é criado THEN o sistema SHALL criar usuário Cognito com nome "cliente-x-admin" e e-mail do responsável
3. WHEN o usuário é provisionado THEN o sistema SHALL definir atributo custom:tenant_id com o UUID do tenant
4. WHEN o usuário é configurado THEN o sistema SHALL adicionar o usuário ao grupo TENANT_ADMIN
5. WHEN o tenant_id é validado THEN o authorization-middleware SHALL garantir isolamento por tenant_id

### Requisito 6

**User Story:** Como usuário TENANT_ADMIN, quero poder criar usuários TENANT_USER no meu tenant, para que minha equipe possa usar a plataforma com permissões restritas.

#### Acceptance Criteria

1. WHEN um TENANT_ADMIN cria usuário THEN o sistema SHALL criar usuário Cognito com custom:tenant_id do tenant do admin
2. WHEN o usuário é criado THEN o sistema SHALL adicionar o usuário ao grupo TENANT_USER
3. WHEN o usuário acessa o sistema THEN o sistema SHALL permitir apenas acesso ao próprio tenant
4. WHEN o usuário tenta acessar outro tenant THEN o sistema SHALL bloquear acesso baseado em tenant_id

### Requisito 7

**User Story:** Como administrador de sistema, quero replicar a estrutura de dev em prod com governança, para que o ambiente de produção seja seguro e auditável.

#### Acceptance Criteria

1. WHEN o ambiente prod é configurado THEN o sistema SHALL criar User Pool "fibonacci-users-prod" com mesmos grupos de dev
2. WHEN usuários internos são criados em prod THEN o sistema SHALL usar e-mails corporativos (não pessoais)
3. WHEN o ambiente prod é provisionado THEN o sistema SHALL ter no mínimo 2 usuários INTERNAL_ADMIN para evitar lock-out
4. WHEN novos clientes são onboardados em prod THEN o sistema SHALL seguir o mesmo fluxo de dev após contrato assinado

### Requisito 8

**User Story:** Como membro da equipe não-técnica, quero documentação operacional clara, para que eu possa criar e gerenciar usuários sem conhecimento técnico profundo.

#### Acceptance Criteria

1. WHEN a documentação é criada THEN o sistema SHALL incluir guia passo a passo com screenshots para localizar User Pools
2. WHEN grupos são documentados THEN o sistema SHALL explicar o propósito e permissões de cada grupo
3. WHEN o fluxo de onboarding é documentado THEN o sistema SHALL incluir checklists rápidos para dev e prod
4. WHEN a documentação é atualizada THEN o sistema SHALL adicionar entradas no índice docs/INDEX-OPERATIONS-AWS.md

### Requisito 9

**User Story:** Como desenvolvedor, quero que os testes de segurança continuem passando, para que mudanças no Cognito não quebrem o contrato de segurança.

#### Acceptance Criteria

1. WHEN usuários são criados no Cognito THEN o sistema SHALL manter 38/38 testes de segurança passando
2. WHEN mudanças são feitas em auth THEN o sistema SHALL executar tests/security/operational-dashboard-security.test.ts
3. WHEN testes falham THEN o sistema SHALL bloquear deploy até correção
4. WHEN a suite de testes é executada THEN o sistema SHALL validar isolamento por tenant_id e permissões por grupo

### Requisito 10

**User Story:** Como administrador de sistema, quero checklists operacionais, para que eu possa validar rapidamente se os ambientes estão configurados corretamente.

#### Acceptance Criteria

1. WHEN o checklist de dev é executado THEN o sistema SHALL validar User Pool, grupos, usuários e testes de segurança
2. WHEN o checklist de prod é executado THEN o sistema SHALL validar User Pool, grupos, múltiplos INTERNAL_ADMIN e e-mails corporativos
3. WHEN um novo cliente é onboardado THEN o sistema SHALL seguir checklist de criação de tenant, usuário Cognito e validação de acesso
4. WHEN checklists são documentados THEN o sistema SHALL incluir comandos específicos para cada etapa

### Requisito 11

**User Story:** Como administrador de sistema, quero integração clara entre Cognito e testes de segurança, para que o contrato de segurança seja explícito e auditável.

#### Acceptance Criteria

1. WHEN a documentação é criada THEN o sistema SHALL explicar que testes de segurança são o contrato oficial entre Cognito e backend
2. WHEN mudanças são feitas THEN o sistema SHALL exigir execução de npm test -- tests/security/operational-dashboard-security.test.ts
3. WHEN testes passam THEN o sistema SHALL documentar que 38/38 testes verdes são pré-requisito para deploy
4. WHEN falhas ocorrem THEN o sistema SHALL bloquear deploy e exigir correção antes de prosseguir

### Requisito 12

**User Story:** Como administrador de sistema, quero documentação sobre atributos customizados do Cognito, para que o tenant_id seja corretamente configurado e validado.

#### Acceptance Criteria

1. WHEN um usuário cliente é criado THEN o sistema SHALL documentar como definir custom:tenant_id no Cognito
2. WHEN o backend valida acesso THEN o authorization-middleware SHALL ler custom:tenant_id do token JWT
3. WHEN o isolamento é testado THEN o sistema SHALL garantir que usuários só acessam dados do próprio tenant_id
4. WHEN a documentação é criada THEN o sistema SHALL incluir exemplos de configuração de atributos customizados

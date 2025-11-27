# Requisitos — Painel Operacional AlquimistaAI

## Introdução

Este documento define os requisitos para o **Painel Operacional AlquimistaAI**, um sistema dual que diferencia usuários internos (equipe AlquimistaAI) de clientes (tenants), fornecendo interfaces e funcionalidades específicas para cada tipo de usuário dentro do mesmo ecossistema de autenticação.

O sistema permitirá que:
- **Clientes** acessem um dashboard focado em seus próprios dados, agentes contratados, integrações e uso.
- **Equipe interna AlquimistaAI** acesse um painel operacional completo com visão global de todos os clientes, métricas agregadas, comandos operacionais e gestão centralizada.

## Glossário

- **Sistema**: Painel Operacional AlquimistaAI (frontend + backend)
- **Tenant**: Empresa cliente da AlquimistaAI
- **Usuário Interno**: Membro da equipe AlquimistaAI (admin ou suporte)
- **Usuário Cliente**: Usuário pertencente a um tenant específico
- **Dashboard do Cliente**: Interface para usuários clientes
- **Painel Operacional**: Interface para usuários internos
- **Cognito**: Amazon Cognito (serviço de autenticação)
- **Aurora**: Amazon Aurora PostgreSQL (banco de dados relacional)
- **DynamoDB**: Amazon DynamoDB (banco de dados NoSQL)
- **API Gateway**: Amazon API Gateway (gateway de APIs)
- **Lambda**: AWS Lambda (funções serverless)
- **Comando Operacional**: Ação administrativa executada pela equipe interna
- **KPI**: Key Performance Indicator (indicador-chave de desempenho)
- **MRR**: Monthly Recurring Revenue (receita recorrente mensal)

---

## Requisitos

### Requisito 1: Diferenciação de Usuários

**User Story:** Como administrador do sistema, quero que usuários sejam automaticamente direcionados para a interface apropriada após login, para que cada tipo de usuário acesse apenas as funcionalidades relevantes ao seu papel.

#### Acceptance Criteria

1. WHEN um usuário completa autenticação no Cognito, THE Sistema SHALL extrair grupos e claims do token JWT
2. IF o token contém grupo `INTERNAL_ADMIN` ou `INTERNAL_SUPPORT`, THEN THE Sistema SHALL redirecionar para rota `/app/company`
3. IF o token não contém grupos internos, THEN THE Sistema SHALL redirecionar para rota `/app/dashboard`
4. THE Sistema SHALL armazenar tipo de usuário em estado global do frontend
5. THE Sistema SHALL validar permissões em cada requisição ao backend através de middleware

### Requisito 2: Autenticação e Autorização

**User Story:** Como desenvolvedor, quero um sistema robusto de autorização baseado em papéis, para que apenas usuários autorizados acessem recursos específicos.

#### Acceptance Criteria

1. THE Sistema SHALL utilizar Cognito como fonte única de autenticação
2. THE Sistema SHALL suportar quatro grupos de usuários: `INTERNAL_ADMIN`, `INTERNAL_SUPPORT`, `TENANT_ADMIN`, `TENANT_USER`
3. WHEN uma requisição é feita para rotas `/internal/*`, THE Sistema SHALL validar presença de grupos `INTERNAL_ADMIN` ou `INTERNAL_SUPPORT`
4. WHEN uma requisição é feita para rotas `/tenant/*`, THE Sistema SHALL validar que `tenant_id` do token corresponde ao recurso solicitado
5. IF validação de autorização falha, THEN THE Sistema SHALL retornar erro HTTP 403 com mensagem descritiva

### Requisito 3: Dashboard do Cliente

**User Story:** Como usuário cliente, quero visualizar informações sobre minha empresa, agentes contratados e uso, para que eu possa gerenciar minha conta e monitorar performance.

#### Acceptance Criteria

1. THE Sistema SHALL exibir página inicial em `/app/dashboard` com KPIs do tenant
2. THE Sistema SHALL exibir lista de agentes contratados em `/app/dashboard/agents`
3. THE Sistema SHALL exibir status de subnúcleos Fibonacci em `/app/dashboard/fibonacci`
4. THE Sistema SHALL exibir integrações ativas em `/app/dashboard/integrations`
5. THE Sistema SHALL exibir gráficos de uso em `/app/dashboard/usage`
6. THE Sistema SHALL exibir histórico de suporte em `/app/dashboard/support`
7. THE Sistema SHALL carregar dados apenas do tenant do usuário autenticado

### Requisito 4: Painel Operacional Interno

**User Story:** Como membro da equipe interna AlquimistaAI, quero visualizar dados agregados de todos os clientes, para que eu possa monitorar a saúde geral da plataforma e tomar decisões operacionais.

#### Acceptance Criteria

1. THE Sistema SHALL exibir visão geral operacional em `/app/company` com KPIs globais
2. THE Sistema SHALL exibir tabela de todos os tenants em `/app/company/tenants` com filtros e busca
3. THE Sistema SHALL exibir detalhes completos de tenant em `/app/company/tenants/[tenantId]`
4. THE Sistema SHALL exibir visão agregada de agentes em `/app/company/agents`
5. THE Sistema SHALL exibir mapa de integrações em `/app/company/integrations`
6. THE Sistema SHALL exibir console de operações em `/app/company/operations`
7. THE Sistema SHALL exibir visão financeira em `/app/company/billing`

### Requisito 5: APIs do Cliente

**User Story:** Como desenvolvedor, quero APIs específicas para clientes que retornem apenas dados do tenant autenticado, para garantir isolamento de dados entre clientes.

#### Acceptance Criteria

1. THE Sistema SHALL implementar endpoint `GET /tenant/me` retornando dados da empresa
2. THE Sistema SHALL implementar endpoint `GET /tenant/agents` retornando agentes do tenant
3. THE Sistema SHALL implementar endpoint `GET /tenant/integrations` retornando integrações do tenant
4. THE Sistema SHALL implementar endpoint `GET /tenant/usage` retornando métricas de uso do tenant
5. THE Sistema SHALL implementar endpoint `GET /tenant/incidents` retornando incidentes do tenant
6. WHEN requisição é feita a endpoints `/tenant/*`, THE Sistema SHALL filtrar dados por `tenant_id` do token

### Requisito 6: APIs Internas

**User Story:** Como membro da equipe interna, quero APIs que forneçam visão global de todos os clientes e permitam executar comandos operacionais, para que eu possa gerenciar a plataforma eficientemente.

#### Acceptance Criteria

1. THE Sistema SHALL implementar endpoint `GET /internal/tenants` retornando lista de todos os tenants
2. THE Sistema SHALL implementar endpoint `GET /internal/tenants/{id}` retornando detalhes completos de tenant
3. THE Sistema SHALL implementar endpoint `GET /internal/tenants/{id}/agents` retornando agentes do tenant
4. THE Sistema SHALL implementar endpoint `GET /internal/usage/overview` retornando métricas globais
5. THE Sistema SHALL implementar endpoint `GET /internal/billing/overview` retornando visão financeira global
6. THE Sistema SHALL implementar endpoint `POST /internal/operations/commands` para criar comandos operacionais
7. THE Sistema SHALL implementar endpoint `GET /internal/operations/commands` para listar comandos executados

### Requisito 7: Modelo de Dados

**User Story:** Como desenvolvedor, quero um modelo de dados que suporte multi-tenancy e rastreamento de uso, para que possamos armazenar e consultar informações de forma eficiente.

#### Acceptance Criteria

1. THE Sistema SHALL utilizar tabela `tenants` existente em Aurora schema `alquimista_platform`
2. THE Sistema SHALL criar tabela `tenant_users` relacionando usuários Cognito com tenants
3. THE Sistema SHALL criar tabela `tenant_agents` rastreando agentes contratados por tenant
4. THE Sistema SHALL criar tabela `tenant_integrations` armazenando integrações por tenant
5. THE Sistema SHALL criar tabela `tenant_usage_daily` agregando métricas diárias por tenant
6. THE Sistema SHALL criar tabela `operational_events` registrando ações operacionais
7. THE Sistema SHALL criar tabela DynamoDB `operational_commands` para comandos assíncronos

### Requisito 8: Comandos Operacionais

**User Story:** Como membro da equipe interna, quero executar comandos operacionais através do painel, para que eu possa resolver problemas e realizar manutenções sem acesso direto à infraestrutura.

#### Acceptance Criteria

1. THE Sistema SHALL permitir criação de comandos através de interface em `/app/company/operations`
2. THE Sistema SHALL suportar tipos de comando: `REPROCESS_QUEUE`, `RESET_TOKEN`, `RESTART_AGENT`, `HEALTH_CHECK`
3. WHEN comando é criado, THE Sistema SHALL armazenar em DynamoDB com status `PENDING`
4. THE Sistema SHALL processar comandos assincronamente através de Lambda
5. WHEN comando é processado, THE Sistema SHALL atualizar status para `SUCCESS` ou `ERROR`
6. THE Sistema SHALL registrar output do comando em campo `output`
7. THE Sistema SHALL exibir histórico de comandos com filtros por tipo, status e tenant

### Requisito 9: Métricas e Uso

**User Story:** Como usuário do sistema, quero visualizar métricas de uso através de gráficos e tabelas, para que eu possa entender padrões de utilização.

#### Acceptance Criteria

1. THE Sistema SHALL agregar métricas diariamente através de job Lambda
2. THE Sistema SHALL calcular total de requisições por tenant e por agente
3. THE Sistema SHALL calcular taxa de erro por tenant e por agente
4. THE Sistema SHALL calcular tempo médio de resposta por agente
5. THE Sistema SHALL exibir gráficos de linha para tendências temporais
6. THE Sistema SHALL exibir gráficos de barra para comparações entre agentes
7. THE Sistema SHALL permitir seleção de período (7 dias, 30 dias, 90 dias)

### Requisito 10: Identidade Visual

**User Story:** Como designer, quero que o painel mantenha consistência visual com o resto da plataforma AlquimistaAI, para proporcionar experiência coesa aos usuários.

#### Acceptance Criteria

1. THE Sistema SHALL reutilizar paleta de cores existente da AlquimistaAI
2. THE Sistema SHALL reutilizar tipografia existente da plataforma
3. THE Sistema SHALL reutilizar componentes UI existentes (botões, cards, tabelas)
4. THE Sistema SHALL manter layout de navegação consistente (sidebar, header)
5. THE Sistema SHALL aplicar accent visual diferenciado no Painel Operacional (badges, cores de status)

### Requisito 11: Segurança e Isolamento

**User Story:** Como arquiteto de segurança, quero garantir isolamento completo de dados entre tenants, para que nenhum cliente acesse dados de outro cliente.

#### Acceptance Criteria

1. THE Sistema SHALL validar `tenant_id` em todas as queries de dados de cliente
2. THE Sistema SHALL utilizar prepared statements para prevenir SQL injection
3. THE Sistema SHALL validar e sanitizar todos os inputs de usuário
4. THE Sistema SHALL registrar todas as ações operacionais em audit log
5. THE Sistema SHALL implementar rate limiting por tenant e por usuário
6. THE Sistema SHALL criptografar dados sensíveis em repouso usando KMS
7. THE Sistema SHALL transmitir dados apenas através de HTTPS

### Requisito 12: Performance e Escalabilidade

**User Story:** Como engenheiro de performance, quero que o sistema responda rapidamente mesmo com grande volume de dados, para proporcionar boa experiência aos usuários.

#### Acceptance Criteria

1. THE Sistema SHALL responder requisições de dashboard em menos de 2 segundos
2. THE Sistema SHALL utilizar cache Redis para dados frequentemente acessados
3. THE Sistema SHALL implementar paginação em listas com mais de 50 itens
4. THE Sistema SHALL agregar métricas em background para evitar queries pesadas em tempo real
5. THE Sistema SHALL utilizar índices apropriados em todas as tabelas
6. THE Sistema SHALL implementar lazy loading para componentes pesados

### Requisito 13: Responsividade

**User Story:** Como usuário mobile, quero acessar o painel através de dispositivos móveis, para que eu possa monitorar informações em qualquer lugar.

#### Acceptance Criteria

1. THE Sistema SHALL adaptar layout para telas com largura mínima de 320px
2. THE Sistema SHALL exibir navegação em menu hambúrguer em telas menores que 768px
3. THE Sistema SHALL ajustar tamanho de gráficos para telas pequenas
4. THE Sistema SHALL manter funcionalidades essenciais acessíveis em mobile
5. THE Sistema SHALL utilizar touch-friendly controls em dispositivos móveis

### Requisito 14: Tratamento de Erros

**User Story:** Como usuário, quero receber mensagens claras quando erros ocorrem, para que eu possa entender o problema e tomar ação apropriada.

#### Acceptance Criteria

1. WHEN erro de autenticação ocorre, THE Sistema SHALL exibir mensagem "Sessão expirada. Faça login novamente"
2. WHEN erro de autorização ocorre, THE Sistema SHALL exibir mensagem "Você não tem permissão para acessar este recurso"
3. WHEN erro de rede ocorre, THE Sistema SHALL exibir mensagem "Erro de conexão. Tente novamente"
4. WHEN erro de servidor ocorre, THE Sistema SHALL exibir mensagem genérica e registrar detalhes em log
5. THE Sistema SHALL exibir toast notifications para erros não críticos
6. THE Sistema SHALL exibir modal para erros que requerem ação do usuário

### Requisito 15: Documentação e Suporte

**User Story:** Como novo usuário da equipe interna, quero documentação clara sobre como usar o painel operacional, para que eu possa começar a trabalhar rapidamente.

#### Acceptance Criteria

1. THE Sistema SHALL incluir tooltips em funcionalidades complexas
2. THE Sistema SHALL fornecer documentação em `/docs/operational-dashboard/`
3. THE Sistema SHALL incluir exemplos de uso para cada comando operacional
4. THE Sistema SHALL documentar estrutura de permissões e grupos
5. THE Sistema SHALL fornecer guia de troubleshooting para problemas comuns

---

## Requisitos Não Funcionais

### RNF-1: Compatibilidade
- Sistema deve ser compatível com Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### RNF-2: Disponibilidade
- Sistema deve ter disponibilidade de 99.9% (excluindo manutenções programadas)

### RNF-3: Backup
- Dados devem ser backupeados diariamente com retenção de 30 dias

### RNF-4: Auditoria
- Todas as ações operacionais devem ser registradas em audit log imutável

### RNF-5: Conformidade
- Sistema deve estar em conformidade com LGPD para dados de clientes brasileiros

### RNF-6: Manutenibilidade
- Código deve seguir padrões estabelecidos no projeto (TypeScript, ESLint, Prettier)

---

## Matriz de Permissões

| Rota/Endpoint | INTERNAL_ADMIN | INTERNAL_SUPPORT | TENANT_ADMIN | TENANT_USER |
|---------------|----------------|------------------|--------------|-------------|
| `/app/dashboard/*` | ✅ | ✅ | ✅ | ✅ |
| `/app/company/*` | ✅ | ✅ | ❌ | ❌ |
| `GET /tenant/*` | ✅ | ✅ | ✅ | ✅ |
| `GET /internal/tenants` | ✅ | ✅ | ❌ | ❌ |
| `GET /internal/usage/*` | ✅ | ✅ | ❌ | ❌ |
| `GET /internal/billing/*` | ✅ | ❌ | ❌ | ❌ |
| `POST /internal/operations/commands` | ✅ | ✅ | ❌ | ❌ |

---

## Priorização

### Must Have (MVP)
- Requisitos 1, 2, 3, 4, 5, 6, 7, 11

### Should Have (Fase 2)
- Requisitos 8, 9, 14

### Could Have (Fase 3)
- Requisitos 10, 12, 13, 15

---

## Dependências

- Amazon Cognito configurado com grupos apropriados
- Aurora PostgreSQL com schema `alquimista_platform`
- DynamoDB para comandos operacionais
- API Gateway e Lambda para endpoints
- Frontend Next.js 14 com App Router
- Componentes UI shadcn/ui já implementados

---

## Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Vazamento de dados entre tenants | Alto | Baixa | Validação rigorosa de tenant_id em todas as queries |
| Performance degradada com muitos tenants | Médio | Média | Agregação de métricas em background, cache |
| Complexidade de permissões | Médio | Média | Documentação clara, testes automatizados |
| Inconsistência visual | Baixo | Baixa | Reutilização de componentes existentes |

---

## Critérios de Aceitação Globais

1. Sistema deve passar em todos os testes de segurança (OWASP Top 10)
2. Sistema deve ter cobertura de testes unitários > 80%
3. Sistema deve ter cobertura de testes de integração > 60%
4. Sistema deve ser aprovado em code review por arquiteto sênior
5. Sistema deve ter documentação completa antes de deploy em produção

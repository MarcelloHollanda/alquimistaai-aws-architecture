# Painel Operacional AlquimistaAI

## Visão Geral

O **Painel Operacional AlquimistaAI** é um sistema dual que diferencia usuários internos (equipe AlquimistaAI) de clientes (tenants), fornecendo interfaces e funcionalidades específicas para cada tipo de usuário dentro do mesmo ecossistema de autenticação.

### Funcionalidades Principais

#### Para Clientes (Tenants)
- Dashboard com visão geral da empresa
- Gerenciamento de agentes contratados
- Monitoramento de integrações
- Visualização de métricas de uso
- Histórico de suporte e incidentes

#### Para Equipe Interna
- Visão global de todos os clientes
- Métricas agregadas da plataforma
- Console de operações para comandos administrativos
- Gestão centralizada de tenants
- Visão financeira (MRR, ARR)

---

## Arquitetura

### Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: API Gateway HTTP + Lambda (Node.js 20)
- **Banco de Dados**: Aurora PostgreSQL Serverless v2
- **Cache**: ElastiCache Redis
- **Autenticação**: Amazon Cognito
- **Armazenamento de Comandos**: DynamoDB

### Fluxo de Autenticação

```
Usuário → Cognito → JWT Token (com grupos) → Frontend → API Gateway → Lambda
```

O sistema extrai os grupos do token JWT para determinar:
- **Grupos Internos**: `INTERNAL_ADMIN`, `INTERNAL_SUPPORT` → Acesso ao Painel Operacional
- **Grupos de Cliente**: `TENANT_ADMIN`, `TENANT_USER` → Acesso ao Dashboard do Cliente

---

## Estrutura de Permissões e Grupos

### Grupos do Cognito

| Grupo | Descrição | Acesso |
|-------|-----------|--------|
| `INTERNAL_ADMIN` | Administradores da AlquimistaAI | Acesso total ao painel operacional, incluindo visão financeira |
| `INTERNAL_SUPPORT` | Equipe de suporte da AlquimistaAI | Acesso ao painel operacional, exceto visão financeira |
| `TENANT_ADMIN` | Administradores de empresas clientes | Acesso total ao dashboard do cliente |
| `TENANT_USER` | Usuários de empresas clientes | Acesso limitado ao dashboard do cliente |

### Matriz de Permissões

| Rota/Endpoint | INTERNAL_ADMIN | INTERNAL_SUPPORT | TENANT_ADMIN | TENANT_USER |
|---------------|----------------|------------------|--------------|-------------|
| `/app/dashboard/*` | ✅ | ✅ | ✅ | ✅ |
| `/app/company/*` | ✅ | ✅ | ❌ | ❌ |
| `GET /tenant/*` | ✅ | ✅ | ✅ | ✅ |
| `GET /internal/tenants` | ✅ | ✅ | ❌ | ❌ |
| `GET /internal/usage/*` | ✅ | ✅ | ❌ | ❌ |
| `GET /internal/billing/*` | ✅ | ❌ | ❌ | ❌ |
| `POST /internal/operations/commands` | ✅ | ✅ | ❌ | ❌ |

### Custom Attributes

- `custom:tenant_id`: UUID do tenant associado ao usuário (obrigatório para usuários de cliente)

---

## Guia de Início Rápido

### 1. Configurar Grupos no Cognito

```powershell
# Executar script de configuração
.\scripts\setup-cognito-groups.ps1
```

Este script cria os 4 grupos necessários no Cognito User Pool.

### 2. Criar Usuário Interno

```powershell
# Criar usuário administrador interno
.\scripts\create-internal-user.ps1 -Email "admin@alquimista.ai" -Name "Admin" -Group "INTERNAL_ADMIN"
```

### 3. Criar Usuário de Tenant

```powershell
# Criar usuário de tenant
.\scripts\create-tenant-user.ps1 -Email "usuario@empresa.com" -Name "Usuario" -TenantId "uuid-do-tenant" -Group "TENANT_ADMIN"
```

### 4. Validar Configuração

```powershell
# Validar setup do Cognito
.\scripts\validate-cognito-setup.ps1
```

---

## Estrutura de Diretórios

```
docs/operational-dashboard/
├── README.md                           # Este arquivo
├── SETUP-GUIDE.md                      # Guia de configuração detalhado
├── API-ENDPOINTS.md                    # Documentação completa das APIs
├── API-ROUTES-REFERENCE.md             # Referência rápida de rotas
├── API-QUICK-REFERENCE.md              # Guia rápido de APIs
├── OPERATIONAL-COMMANDS.md             # Comandos operacionais disponíveis
├── TROUBLESHOOTING.md                  # Guia de resolução de problemas
├── PERMISSIONS-GUIDE.md                # Guia detalhado de permissões
└── ...                                 # Outros documentos técnicos
```

---

## Rotas Principais

### Dashboard do Cliente

- `/app/dashboard` - Visão geral
- `/app/dashboard/agents` - Agentes contratados
- `/app/dashboard/fibonacci` - SubNúcleos Fibonacci
- `/app/dashboard/integrations` - Integrações
- `/app/dashboard/usage` - Métricas de uso
- `/app/dashboard/support` - Suporte

### Painel Operacional

- `/app/company` - Visão geral operacional
- `/app/company/tenants` - Lista de tenants
- `/app/company/tenants/[id]` - Detalhes do tenant
- `/app/company/agents` - Visão de agentes
- `/app/company/integrations` - Mapa de integrações
- `/app/company/operations` - Console de operações
- `/app/company/billing` - Visão financeira

---

## APIs Disponíveis

### Configuração do API Gateway

✅ **Status**: Todas as rotas configuradas e funcionais

O sistema utiliza **API Gateway HTTP** com as seguintes características:

- **Autenticação**: Cognito Authorizer em todas as rotas
- **CORS**: Configurado automaticamente
- **Throttling**: 10.000 req/s (rate) + 5.000 req/s (burst)
- **Tracing**: AWS X-Ray ativo
- **Logs**: CloudWatch Logs estruturados

Para detalhes completos da configuração, consulte [API-GATEWAY-ROUTES-SUMMARY.md](./API-GATEWAY-ROUTES-SUMMARY.md).

### APIs do Cliente (`/tenant/*`)

Retornam dados filtrados pelo `tenant_id` do usuário autenticado.

- `GET /tenant/me` - Dados da empresa
- `GET /tenant/agents` - Agentes do tenant
- `GET /tenant/integrations` - Integrações do tenant
- `GET /tenant/usage` - Métricas de uso
- `GET /tenant/incidents` - Incidentes

**Autorização**: TENANT_ADMIN, TENANT_USER, INTERNAL_ADMIN, INTERNAL_SUPPORT

### APIs Internas (`/internal/*`)

Acesso apenas para usuários com grupos `INTERNAL_ADMIN` ou `INTERNAL_SUPPORT`.

- `GET /internal/tenants` - Lista todos os tenants
- `GET /internal/tenants/{id}` - Detalhes de um tenant
- `GET /internal/tenants/{id}/agents` - Agentes de um tenant
- `GET /internal/usage/overview` - Métricas globais
- `GET /internal/billing/overview` - Visão financeira (apenas INTERNAL_ADMIN)
- `POST /internal/operations/commands` - Criar comando operacional
- `GET /internal/operations/commands` - Listar comandos

**Autorização**: INTERNAL_ADMIN, INTERNAL_SUPPORT (billing requer INTERNAL_ADMIN)

### Documentação Completa

- [Referência de Rotas](./API-ROUTES-REFERENCE.md) - Documentação detalhada de cada endpoint
- [Resumo da Configuração](./API-GATEWAY-ROUTES-SUMMARY.md) - Visão técnica da implementação
- [Guia Rápido](./API-QUICK-REFERENCE.md) - Exemplos práticos de uso

---

## Comandos Operacionais

O sistema suporta execução de comandos administrativos através do console de operações.

### Tipos de Comando

| Comando | Descrição | Parâmetros |
|---------|-----------|------------|
| `REPROCESS_QUEUE` | Reprocessa fila de mensagens | `queue_name`, `message_ids` |
| `RESET_TOKEN` | Reseta token de integração | `tenant_id`, `integration_id` |
| `RESTART_AGENT` | Reinicia agente | `tenant_id`, `agent_id` |
| `HEALTH_CHECK` | Verifica saúde do sistema | `tenant_id` (opcional) |

Para mais detalhes, consulte [OPERATIONAL-COMMANDS.md](./OPERATIONAL-COMMANDS.md).

---

## Modelo de Dados

### Aurora PostgreSQL

#### Tabelas Principais

- `tenants` - Empresas clientes
- `tenant_users` - Usuários vinculados a tenants
- `tenant_agents` - Agentes contratados por tenant
- `tenant_integrations` - Integrações por tenant
- `tenant_usage_daily` - Métricas agregadas diárias
- `operational_events` - Log de eventos operacionais

### DynamoDB

#### Tabela: operational_commands

Armazena comandos operacionais com processamento assíncrono.

**Partition Key**: `command_id` (UUID)  
**Sort Key**: `created_at` (ISO timestamp)

**GSIs**:
- `tenant_id-created_at-index`
- `status-created_at-index`

**TTL**: 90 dias

---

## Agregação de Métricas

O sistema executa um job diário (2 AM UTC) que agrega métricas de uso:

- Total de requisições por tenant e agente
- Taxa de sucesso/erro
- Tempo médio de resposta
- Tokens utilizados

Os dados agregados são armazenados em `tenant_usage_daily` para consultas rápidas.

---

## Cache

O sistema utiliza ElastiCache Redis para otimizar performance:

### Estratégias de Cache

| Endpoint | TTL | Chave |
|----------|-----|-------|
| `GET /internal/tenants` | 5 min | `tenants:list:{filters}` |
| `GET /internal/usage/overview` | 10 min | `usage:overview:{period}` |
| `GET /internal/billing/overview` | 15 min | `billing:overview:{period}` |

### Invalidação

O cache é invalidado automaticamente quando:
- Dados de tenant são atualizados
- Novos agentes são ativados/desativados
- Comandos operacionais são executados

---

## Segurança

### Isolamento de Dados

- Todas as queries de cliente incluem filtro por `tenant_id`
- Validação de autorização em middleware
- Prepared statements para prevenir SQL injection

### Auditoria

Todas as ações operacionais são registradas em `operational_events`:
- Tipo de evento
- Usuário que executou
- Tenant afetado (se aplicável)
- Timestamp
- Metadata adicional

### Criptografia

- Dados em trânsito: HTTPS/TLS
- Dados em repouso: KMS
- Credenciais: AWS Secrets Manager

---

## Monitoramento

### CloudWatch Dashboards

- **Operational Dashboard**: Métricas globais da plataforma
- **Tenant Metrics**: Métricas por tenant
- **API Performance**: Latência e erros de APIs

### Alarmes

- Taxa de erro > 5%
- Latência P99 > 2s
- Falhas de autenticação
- Comandos operacionais com erro

### Logs Estruturados

Todos os handlers Lambda utilizam logging estruturado:

```typescript
logger.info('Processing request', {
  tenantId,
  userId,
  endpoint,
  duration
});
```

---

## Desenvolvimento Local

### Pré-requisitos

- Node.js 20+
- AWS CLI configurado
- Acesso ao Cognito User Pool
- Variáveis de ambiente configuradas

### Executar Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: `http://localhost:3000`

### Testar APIs

```bash
# Executar testes unitários
npm test

# Executar testes de integração
npm run test:integration

# Executar testes E2E
npm run test:e2e
```

---

## Deploy

### Ambiente Dev

```powershell
# Deploy completo
cdk deploy OperationalDashboardStack --context env=dev
```

### Ambiente Prod

```powershell
# Deploy completo
cdk deploy OperationalDashboardStack --context env=prod
```

### Validação Pós-Deploy

```powershell
# Validar deployment
.\scripts\validate-cognito-setup.ps1
```

---

## Troubleshooting

Para problemas comuns e soluções, consulte [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

### Problemas Frequentes

1. **Erro 403 ao acessar painel operacional**
   - Verificar se usuário está no grupo correto
   - Validar token JWT contém grupos

2. **Dados não aparecem no dashboard**
   - Verificar se `tenant_id` está configurado
   - Validar permissões no Aurora

3. **Comando operacional não executa**
   - Verificar logs do Lambda
   - Validar DynamoDB Streams está ativo

---

## Recursos Adicionais

- [Guia de Configuração Detalhado](./SETUP-GUIDE.md)
- [Documentação de APIs](./API-ENDPOINTS.md)
- [Guia de Permissões](./PERMISSIONS-GUIDE.md)
- [Comandos Operacionais](./OPERATIONAL-COMMANDS.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

---

## Suporte

Para dúvidas ou problemas:

- **E-mail**: alquimistafibonacci@gmail.com
- **WhatsApp**: +55 84 99708-4444
- **Documentação**: `/docs/operational-dashboard/`

---

## Changelog

### v1.0.0 (2024-01)
- Lançamento inicial do Painel Operacional
- Dashboard do Cliente
- Painel Operacional Interno
- Sistema de Comandos Operacionais
- Agregação de Métricas
- Cache Redis

---

**Última atualização**: Janeiro 2024  
**Versão**: 1.0.0

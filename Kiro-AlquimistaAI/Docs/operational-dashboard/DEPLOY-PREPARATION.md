# Preparação para Deploy - Painel Operacional AlquimistaAI

## Visão Geral

Este documento descreve todos os passos necessários para preparar e executar o deploy do Painel Operacional AlquimistaAI em ambiente de desenvolvimento e produção.

---

## Pré-requisitos

### Infraestrutura Existente

✅ **Verificar que os seguintes recursos já estão deployados:**

- [ ] FibonacciStack (Aurora, Cognito, EventBus)
- [ ] AlquimistaStack (Platform API)
- [ ] SecurityStack (CloudTrail, GuardDuty)
- [ ] WAFStack (Web ACLs)

### Ferramentas Necessárias

- [ ] AWS CLI v2 configurado
- [ ] Node.js 20.x
- [ ] AWS CDK v2 instalado globalmente
- [ ] PostgreSQL client (psql) para migrations
- [ ] Acesso ao AWS Console

---

## Checklist de Preparação

### 1. Variáveis de Ambiente

#### Backend (Lambda)

Todas as Lambdas já estão configuradas no CDK com as seguintes variáveis:

```typescript
// Variáveis comuns (já configuradas no stack)
ENV: envName
AURORA_SECRET_ARN: auroraSecretArn
AURORA_CLUSTER_ARN: auroraClusterArn
AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1'
POWERTOOLS_SERVICE_NAME: 'operational-dashboard'
REDIS_HOST: redisEndpoint
REDIS_PORT: redisPort
CACHE_ENABLED: 'true'
COMMANDS_TABLE: commandsTable.tableName
```

**Ação:** Nenhuma ação necessária - variáveis já configuradas no CDK.

#### Frontend

Criar/atualizar arquivo `.env.production`:

```bash
# API URLs
NEXT_PUBLIC_API_BASE_URL=https://<platform-api-url>
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<user-pool-id>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<client-id>
NEXT_PUBLIC_AWS_REGION=us-east-1

# Feature Flags
NEXT_PUBLIC_ENABLE_OPERATIONAL_DASHBOARD=true
```

**Ação:** Atualizar após deploy do backend.

---

### 2. Secrets Manager

#### Secrets Necessários

O sistema utiliza os seguintes secrets (já existentes):

1. **Aurora Database Credentials**
   - Path: `/alquimista/<env>/aurora/credentials`
   - Criado pelo FibonacciStack
   - ✅ Já existe

2. **Redis Password** (Opcional - ElastiCache sem senha por padrão)
   - Path: `/alquimista/<env>/redis/password`
   - Apenas se configurar autenticação no Redis

**Ação:** Verificar que o secret do Aurora existe:

```bash
aws secretsmanager describe-secret \
  --secret-id /alquimista/dev/aurora/credentials \
  --region us-east-1
```

---

### 3. Migrations de Banco de Dados

#### Migration Necessária

**Arquivo:** `database/migrations/015_create_operational_dashboard_tables.sql`

**Status:** ✅ Já criado

**Conteúdo:**
- Tabela `tenant_users`
- Tabela `tenant_agents`
- Tabela `tenant_integrations`
- Tabela `tenant_usage_daily`
- Tabela `operational_events`
- Índices apropriados

#### Executar Migration em DEV

```bash
# 1. Obter credenciais do Aurora
aws secretsmanager get-secret-value \
  --secret-id /alquimista/dev/aurora/credentials \
  --region us-east-1 \
  --query SecretString \
  --output text | jq -r

# 2. Conectar ao Aurora
psql -h <aurora-endpoint> \
     -U <username> \
     -d alquimista_platform \
     -f database/migrations/015_create_operational_dashboard_tables.sql

# 3. Verificar tabelas criadas
psql -h <aurora-endpoint> \
     -U <username> \
     -d alquimista_platform \
     -c "\dt alquimista_platform.*"
```

#### Script Automatizado

Usar o script existente:

```powershell
.\scripts\apply-migrations-aurora-dev.ps1 -MigrationFile "015_create_operational_dashboard_tables.sql"
```

---

### 4. Configuração do Cognito

#### Grupos Necessários

O sistema requer 4 grupos no Cognito User Pool:

1. **INTERNAL_ADMIN** - Administradores internos (acesso total)
2. **INTERNAL_SUPPORT** - Suporte interno (acesso limitado)
3. **TENANT_ADMIN** - Administradores de tenant
4. **TENANT_USER** - Usuários de tenant

#### Criar Grupos

```powershell
# Executar script de configuração
.\scripts\setup-cognito-groups.ps1 -Environment dev
```

Ou manualmente via AWS CLI:

```bash
# User Pool ID
USER_POOL_ID=$(aws cognito-idp list-user-pools --max-results 10 --query "UserPools[?Name=='alquimista-users-dev'].Id" --output text)

# Criar grupos
aws cognito-idp create-group \
  --user-pool-id $USER_POOL_ID \
  --group-name INTERNAL_ADMIN \
  --description "Administradores internos da AlquimistaAI" \
  --precedence 1

aws cognito-idp create-group \
  --user-pool-id $USER_POOL_ID \
  --group-name INTERNAL_SUPPORT \
  --description "Equipe de suporte interno" \
  --precedence 2

aws cognito-idp create-group \
  --user-pool-id $USER_POOL_ID \
  --group-name TENANT_ADMIN \
  --description "Administradores de tenant" \
  --precedence 10

aws cognito-idp create-group \
  --user-pool-id $USER_POOL_ID \
  --group-name TENANT_USER \
  --description "Usuários de tenant" \
  --precedence 20
```

#### Custom Attribute: tenant_id

Verificar se o atributo customizado `custom:tenant_id` existe:

```bash
aws cognito-idp describe-user-pool \
  --user-pool-id $USER_POOL_ID \
  --query "UserPool.SchemaAttributes[?Name=='custom:tenant_id']"
```

Se não existir, adicionar via Console (não pode ser adicionado via CLI após criação do pool).

#### Criar Usuários de Teste

```powershell
# Criar usuário interno admin
.\scripts\create-internal-user.ps1 `
  -Email "admin@alquimista.ai" `
  -Name "Admin Alquimista" `
  -Group "INTERNAL_ADMIN" `
  -Environment dev

# Criar usuário tenant
.\scripts\create-tenant-user.ps1 `
  -Email "cliente@empresa.com" `
  -Name "Cliente Teste" `
  -TenantId "<tenant-uuid>" `
  -Group "TENANT_ADMIN" `
  -Environment dev
```

---

### 5. Validação do CDK

#### Compilar TypeScript

```bash
npm run build
```

#### Sintetizar Stack

```bash
cdk synth OperationalDashboardStack-dev --context env=dev
```

#### Verificar Diferenças

```bash
cdk diff OperationalDashboardStack-dev --context env=dev
```

**Recursos que serão criados:**
- 1 DynamoDB Table (operational_commands)
- 2 GSIs (tenant_id-created_at-index, status-created_at-index)
- 1 VPC (se não fornecida)
- 1 ElastiCache Redis Cluster
- 2 Security Groups (Redis, Lambda)
- 12 Lambda Functions (tenant + internal APIs)
- 2 Lambda Functions (aggregate metrics, process commands)
- 1 EventBridge Rule (daily aggregation)
- 1 DynamoDB Stream Mapping
- 12 API Gateway Routes
- IAM Roles e Policies

---

### 6. Estimativa de Custos

#### Ambiente DEV (estimativa mensal)

| Recurso | Configuração | Custo Estimado |
|---------|--------------|----------------|
| ElastiCache Redis | cache.t3.micro | $12/mês |
| DynamoDB | On-demand | $5-10/mês |
| Lambda | 12 funções, baixo uso | $5-15/mês |
| VPC | NAT Gateway | $32/mês |
| CloudWatch Logs | 1 GB/mês | $0.50/mês |
| **Total DEV** | | **~$55-70/mês** |

#### Ambiente PROD (estimativa mensal)

| Recurso | Configuração | Custo Estimado |
|---------|--------------|----------------|
| ElastiCache Redis | cache.t3.medium | $50/mês |
| DynamoDB | On-demand | $20-50/mês |
| Lambda | 12 funções, uso médio | $30-80/mês |
| VPC | NAT Gateway | $32/mês |
| CloudWatch Logs | 5 GB/mês | $2.50/mês |
| **Total PROD** | | **~$135-215/mês** |

---

## Procedimento de Deploy

### Deploy em DEV

#### Passo 1: Executar Migrations

```powershell
# Aplicar migration 015
.\scripts\apply-migrations-aurora-dev.ps1 -MigrationFile "015_create_operational_dashboard_tables.sql"
```

#### Passo 2: Configurar Cognito

```powershell
# Criar grupos
.\scripts\setup-cognito-groups.ps1 -Environment dev

# Criar usuário admin de teste
.\scripts\create-internal-user.ps1 `
  -Email "admin@alquimista.ai" `
  -Name "Admin Teste" `
  -Group "INTERNAL_ADMIN" `
  -Environment dev
```

#### Passo 3: Deploy do Stack

```bash
# Deploy
cdk deploy OperationalDashboardStack-dev --context env=dev --require-approval never

# Ou com aprovação manual
cdk deploy OperationalDashboardStack-dev --context env=dev
```

#### Passo 4: Validar Deploy

```powershell
# Executar validação
.\scripts\validate-operational-dashboard-dev.ps1
```

Verificações:
- [ ] DynamoDB Table criada
- [ ] Redis Cluster ativo
- [ ] Lambdas deployadas
- [ ] Rotas API Gateway configuradas
- [ ] EventBridge Rule ativa
- [ ] Logs no CloudWatch

#### Passo 5: Testes Manuais

```bash
# 1. Obter token JWT do Cognito
# (usar AWS Console ou Amplify CLI)

# 2. Testar endpoint /tenant/me
curl -H "Authorization: Bearer <token>" \
  https://<api-url>/tenant/me

# 3. Testar endpoint /internal/tenants (usuário interno)
curl -H "Authorization: Bearer <token>" \
  https://<api-url>/internal/tenants
```

---

### Deploy em PROD

#### Pré-requisitos

- [ ] Deploy em DEV validado
- [ ] Testes de integração passando
- [ ] Testes de segurança passando
- [ ] Code review aprovado
- [ ] Documentação atualizada

#### Passo 1: Backup do Banco

```bash
# Criar snapshot manual do Aurora
aws rds create-db-cluster-snapshot \
  --db-cluster-identifier alquimista-aurora-prod \
  --db-cluster-snapshot-identifier operational-dashboard-pre-deploy-$(date +%Y%m%d-%H%M%S) \
  --region us-east-1
```

#### Passo 2: Executar Migrations

```bash
# Conectar ao Aurora PROD
psql -h <aurora-prod-endpoint> \
     -U <username> \
     -d alquimista_platform \
     -f database/migrations/015_create_operational_dashboard_tables.sql
```

#### Passo 3: Configurar Cognito PROD

```powershell
.\scripts\setup-cognito-groups.ps1 -Environment prod
```

#### Passo 4: Deploy do Stack

```bash
# Deploy em PROD
cdk deploy OperationalDashboardStack-prod --context env=prod
```

#### Passo 5: Smoke Tests

```powershell
.\scripts\smoke-tests-operational-dashboard-prod.ps1
```

#### Passo 6: Monitoramento

Verificar dashboards do CloudWatch:
- Operational Dashboard Metrics
- Lambda Errors
- API Gateway 4xx/5xx
- DynamoDB Throttles
- Redis CPU/Memory

---

## Rollback

### Rollback do Stack

```bash
# Destruir stack
cdk destroy OperationalDashboardStack-<env> --context env=<env>
```

### Rollback do Banco de Dados

```sql
-- Remover tabelas criadas
DROP TABLE IF EXISTS alquimista_platform.operational_events CASCADE;
DROP TABLE IF EXISTS alquimista_platform.tenant_usage_daily CASCADE;
DROP TABLE IF EXISTS alquimista_platform.tenant_integrations CASCADE;
DROP TABLE IF EXISTS alquimista_platform.tenant_agents CASCADE;
DROP TABLE IF EXISTS alquimista_platform.tenant_users CASCADE;
```

### Rollback do Cognito

```bash
# Remover grupos
aws cognito-idp delete-group --user-pool-id $USER_POOL_ID --group-name INTERNAL_ADMIN
aws cognito-idp delete-group --user-pool-id $USER_POOL_ID --group-name INTERNAL_SUPPORT
aws cognito-idp delete-group --user-pool-id $USER_POOL_ID --group-name TENANT_ADMIN
aws cognito-idp delete-group --user-pool-id $USER_POOL_ID --group-name TENANT_USER
```

---

## Troubleshooting

### Erro: VPC Limit Exceeded

**Problema:** Limite de VPCs na região atingido.

**Solução:** Fornecer VPC existente ao stack:

```typescript
const operationalDashboardStack = new OperationalDashboardStack(app, `OperationalDashboardStack-${envName}`, {
  // ...
  vpc: fibonacciStack.vpc, // Reutilizar VPC do Fibonacci
});
```

### Erro: Redis Connection Timeout

**Problema:** Lambdas não conseguem conectar ao Redis.

**Solução:**
1. Verificar Security Groups
2. Verificar que Lambdas estão na mesma VPC
3. Verificar subnet routing

```bash
# Verificar Security Group do Redis
aws ec2 describe-security-groups \
  --group-ids <redis-sg-id> \
  --query "SecurityGroups[0].IpPermissions"
```

### Erro: Aurora Connection Failed

**Problema:** Lambdas não conseguem conectar ao Aurora.

**Solução:**
1. Verificar IAM permissions (rds-data:ExecuteStatement)
2. Verificar secret ARN correto
3. Verificar cluster ARN correto

```bash
# Testar acesso ao secret
aws secretsmanager get-secret-value \
  --secret-id <secret-arn>
```

### Erro: DynamoDB Stream Processing Failed

**Problema:** Lambda de processamento de comandos falhando.

**Solução:**
1. Verificar logs no CloudWatch
2. Verificar permissões DynamoDB Streams
3. Verificar timeout da Lambda (deve ser >= 5 min)

```bash
# Ver logs da Lambda
aws logs tail /aws/lambda/alquimista-process-command-dev --follow
```

---

## Validação Pós-Deploy

### Checklist de Validação

#### Infraestrutura

- [ ] DynamoDB Table `alquimista-operational-commands-<env>` criada
- [ ] GSIs criados (tenant_id-created_at-index, status-created_at-index)
- [ ] ElastiCache Redis Cluster ativo
- [ ] VPC e Security Groups configurados
- [ ] 14 Lambda Functions deployadas
- [ ] EventBridge Rule ativa
- [ ] DynamoDB Stream Mapping configurado

#### Banco de Dados

- [ ] Tabela `tenant_users` criada
- [ ] Tabela `tenant_agents` criada
- [ ] Tabela `tenant_integrations` criada
- [ ] Tabela `tenant_usage_daily` criada
- [ ] Tabela `operational_events` criada
- [ ] Índices criados em todas as tabelas

#### Cognito

- [ ] Grupo `INTERNAL_ADMIN` criado
- [ ] Grupo `INTERNAL_SUPPORT` criado
- [ ] Grupo `TENANT_ADMIN` criado
- [ ] Grupo `TENANT_USER` criado
- [ ] Usuário admin de teste criado

#### API Gateway

- [ ] Rota `GET /tenant/me` configurada
- [ ] Rota `GET /tenant/agents` configurada
- [ ] Rota `GET /tenant/integrations` configurada
- [ ] Rota `GET /tenant/usage` configurada
- [ ] Rota `GET /tenant/incidents` configurada
- [ ] Rota `GET /internal/tenants` configurada
- [ ] Rota `GET /internal/tenants/{id}` configurada
- [ ] Rota `GET /internal/tenants/{id}/agents` configurada
- [ ] Rota `GET /internal/usage/overview` configurada
- [ ] Rota `GET /internal/billing/overview` configurada
- [ ] Rota `POST /internal/operations/commands` configurada
- [ ] Rota `GET /internal/operations/commands` configurada
- [ ] Cognito Authorizer configurado em todas as rotas

#### Testes Funcionais

- [ ] Endpoint `/tenant/me` retorna dados do tenant
- [ ] Endpoint `/tenant/agents` retorna lista de agentes
- [ ] Endpoint `/internal/tenants` retorna lista (apenas usuário interno)
- [ ] Endpoint `/internal/tenants` retorna 403 para usuário tenant
- [ ] Criação de comando operacional funciona
- [ ] Processamento de comando via Stream funciona
- [ ] Job de agregação de métricas executa sem erros
- [ ] Cache Redis funciona (verificar logs)

#### Monitoramento

- [ ] Logs no CloudWatch para todas as Lambdas
- [ ] Métricas no CloudWatch
- [ ] Alarmes configurados (se aplicável)
- [ ] X-Ray tracing ativo

---

## Documentação Adicional

- [README Principal](./README.md)
- [Guia de Permissões](./PERMISSIONS-GUIDE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [API Reference](./API-ROUTES-REFERENCE.md)

---

## Contatos

**Equipe de Desenvolvimento:**
- Email: dev@alquimista.ai

**Suporte AWS:**
- AWS Support Console

---

## Histórico de Versões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | 2024-01-XX | Kiro AI | Versão inicial |


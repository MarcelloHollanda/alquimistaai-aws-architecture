# Guia de Configuração — Painel Operacional AlquimistaAI

## Visão Geral

Este guia detalha os passos necessários para configurar o ambiente antes de iniciar a implementação do Painel Operacional AlquimistaAI.

---

## Pré-requisitos

- AWS CLI configurado com credenciais apropriadas
- Node.js 20+ instalado
- PostgreSQL client (psql) instalado
- Acesso ao console AWS (região us-east-1)
- Cognito User Pool já existente (do sistema atual)
- Aurora PostgreSQL cluster já existente

---

## Fase 1: Configurar Grupos no Cognito

### 1.1. Acessar Cognito User Pool

```bash
# Listar User Pools existentes
aws cognito-idp list-user-pools --max-results 10 --region us-east-1

# Anotar o User Pool ID (ex: us-east-1_XXXXXXXXX)
```

### 1.2. Criar Grupos

Execute os comandos abaixo para criar os 4 grupos necessários:

```bash
# Definir variáveis
USER_POOL_ID="us-east-1_XXXXXXXXX"  # Substituir pelo ID real

# Criar grupo INTERNAL_ADMIN
aws cognito-idp create-group \
  --group-name INTERNAL_ADMIN \
  --user-pool-id $USER_POOL_ID \
  --description "Administradores internos da AlquimistaAI com acesso total" \
  --precedence 1 \
  --region us-east-1

# Criar grupo INTERNAL_SUPPORT
aws cognito-idp create-group \
  --group-name INTERNAL_SUPPORT \
  --user-pool-id $USER_POOL_ID \
  --description "Equipe de suporte interno da AlquimistaAI" \
  --precedence 2 \
  --region us-east-1

# Criar grupo TENANT_ADMIN
aws cognito-idp create-group \
  --group-name TENANT_ADMIN \
  --user-pool-id $USER_POOL_ID \
  --description "Administradores de tenants (clientes)" \
  --precedence 3 \
  --region us-east-1

# Criar grupo TENANT_USER
aws cognito-idp create-group \
  --group-name TENANT_USER \
  --user-pool-id $USER_POOL_ID \
  --description "Usuários regulares de tenants (clientes)" \
  --precedence 4 \
  --region us-east-1
```

### 1.3. Verificar Grupos Criados

```bash
# Listar grupos
aws cognito-idp list-groups \
  --user-pool-id $USER_POOL_ID \
  --region us-east-1
```

### 1.4. Configurar Custom Attribute (se não existir)

```bash
# Verificar se custom:tenant_id já existe
aws cognito-idp describe-user-pool \
  --user-pool-id $USER_POOL_ID \
  --region us-east-1 \
  --query 'UserPool.SchemaAttributes[?Name==`custom:tenant_id`]'

# Se não existir, adicionar (ATENÇÃO: só pode ser feito em User Pool novo)
# Para User Pool existente, usar outro método de associação tenant
```

**IMPORTANTE**: Se o User Pool já existe e não tem `custom:tenant_id`, você precisará usar a tabela `tenant_users` para fazer a associação entre Cognito sub e tenant_id.

### 1.5. Criar Usuários de Teste

```bash
# Criar usuário interno admin
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username admin@alquimistaai.com \
  --user-attributes Name=email,Value=admin@alquimistaai.com Name=email_verified,Value=true \
  --temporary-password "TempPass123!" \
  --region us-east-1

# Adicionar ao grupo INTERNAL_ADMIN
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username admin@alquimistaai.com \
  --group-name INTERNAL_ADMIN \
  --region us-east-1

# Criar usuário interno suporte
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username suporte@alquimistaai.com \
  --user-attributes Name=email,Value=suporte@alquimistaai.com Name=email_verified,Value=true \
  --temporary-password "TempPass123!" \
  --region us-east-1

# Adicionar ao grupo INTERNAL_SUPPORT
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username suporte@alquimistaai.com \
  --group-name INTERNAL_SUPPORT \
  --region us-east-1
```

---

## Fase 2: Preparar Aurora PostgreSQL

### 2.1. Conectar ao Aurora

```bash
# Obter endpoint do Aurora
aws rds describe-db-clusters \
  --db-cluster-identifier alquimista-aurora-cluster \
  --region us-east-1 \
  --query 'DBClusters[0].Endpoint' \
  --output text

# Conectar via psql
psql -h <aurora-endpoint> -U <master-user> -d alquimista_platform
```

### 2.2. Verificar Schema Existente

```sql
-- Verificar se schema alquimista_platform existe
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name = 'alquimista_platform';

-- Verificar tabelas existentes
\dt alquimista_platform.*

-- Verificar tabela tenants
\d alquimista_platform.tenants
```

### 2.3. Preparar Migration

A migration `015_create_operational_dashboard_tables.sql` será criada na Task 3.1. Por enquanto, apenas verifique que você tem acesso de escrita:

```sql
-- Testar permissões
CREATE TABLE alquimista_platform.test_permissions (id SERIAL PRIMARY KEY);
DROP TABLE alquimista_platform.test_permissions;
```

---

## Fase 3: Configurar DynamoDB

### 3.1. Criar Tabela operational_commands

Isso será feito via CDK na Task 3.2, mas você pode preparar o ambiente:

```bash
# Verificar se DynamoDB está acessível
aws dynamodb list-tables --region us-east-1

# Verificar limites de conta
aws service-quotas get-service-quota \
  --service-code dynamodb \
  --quota-code L-F98FE922 \
  --region us-east-1
```

---

## Fase 4: Configurar ElastiCache Redis (Opcional para MVP)

### 4.1. Verificar VPC e Subnets

```bash
# Listar VPCs
aws ec2 describe-vpcs --region us-east-1

# Listar subnets privadas
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=<vpc-id>" \
  --region us-east-1
```

### 4.2. Criar Security Group para Redis

```bash
# Criar security group
aws ec2 create-security-group \
  --group-name alquimista-redis-sg \
  --description "Security group for AlquimistaAI Redis cache" \
  --vpc-id <vpc-id> \
  --region us-east-1

# Adicionar regra de entrada (porta 6379 apenas de Lambda)
aws ec2 authorize-security-group-ingress \
  --group-id <sg-id> \
  --protocol tcp \
  --port 6379 \
  --source-group <lambda-sg-id> \
  --region us-east-1
```

**NOTA**: Redis pode ser adicionado depois. O MVP funciona sem cache.

---

## Fase 5: Configurar Variáveis de Ambiente

### 5.1. Criar arquivo .env para desenvolvimento local

```bash
# Criar arquivo frontend/.env.local
cat > frontend/.env.local << EOF
# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_COGNITO_REGION=us-east-1

# API Gateway
NEXT_PUBLIC_API_BASE_URL=https://api-dev.alquimistaai.com

# Feature Flags
NEXT_PUBLIC_ENABLE_OPERATIONAL_DASHBOARD=true
EOF
```

### 5.2. Configurar Secrets Manager

```bash
# Criar secret para Aurora (se não existir)
aws secretsmanager create-secret \
  --name /alquimista/dev/aurora/credentials \
  --description "Aurora PostgreSQL credentials for dev" \
  --secret-string '{"username":"admin","password":"CHANGE_ME","host":"aurora-endpoint","port":5432,"database":"alquimista_platform"}' \
  --region us-east-1
```

---

## Fase 6: Preparar Ambiente de Desenvolvimento

### 6.1. Instalar Dependências

```bash
# Instalar dependências do projeto
npm install

# Instalar dependências do frontend
cd frontend
npm install
cd ..
```

### 6.2. Compilar CDK

```bash
# Compilar TypeScript
npm run build

# Verificar stacks
cdk list --context env=dev
```

### 6.3. Preparar Scripts de Deploy

```bash
# Tornar scripts executáveis (Linux/Mac)
chmod +x scripts/*.sh

# Windows: verificar que PowerShell pode executar scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Checklist de Configuração

Antes de iniciar a implementação, verifique:

- [ ] Cognito User Pool identificado
- [ ] 4 grupos criados (INTERNAL_ADMIN, INTERNAL_SUPPORT, TENANT_ADMIN, TENANT_USER)
- [ ] Usuários de teste criados e adicionados aos grupos
- [ ] Acesso ao Aurora PostgreSQL confirmado
- [ ] Schema `alquimista_platform` existe
- [ ] Permissões de escrita no Aurora confirmadas
- [ ] DynamoDB acessível
- [ ] Variáveis de ambiente configuradas
- [ ] Dependências instaladas
- [ ] CDK compilando sem erros

---

## Próximos Passos

Após completar esta configuração:

1. Abrir `.kiro/specs/operational-dashboard-alquimistaai/tasks.md`
2. Iniciar **Task 1**: Configurar Grupos e Papéis no Cognito (já feito acima)
3. Prosseguir para **Task 2**: Implementar Middleware de Autorização
4. Seguir as tasks sequencialmente

---

## Troubleshooting

### Erro: "User pool does not exist"

```bash
# Verificar região correta
aws cognito-idp list-user-pools --max-results 10 --region us-east-1

# Verificar se User Pool ID está correto
```

### Erro: "Cannot add custom attribute to existing user pool"

**Solução**: Use a tabela `tenant_users` para associar Cognito sub com tenant_id ao invés de custom attribute.

### Erro: "Access denied to Aurora"

```bash
# Verificar security group
aws rds describe-db-clusters \
  --db-cluster-identifier alquimista-aurora-cluster \
  --region us-east-1 \
  --query 'DBClusters[0].VpcSecurityGroups'

# Adicionar seu IP ao security group se necessário
```

### Erro: "DynamoDB table already exists"

```bash
# Listar tabelas
aws dynamodb list-tables --region us-east-1

# Se operational_commands já existe, deletar ou usar outra
aws dynamodb delete-table \
  --table-name operational_commands \
  --region us-east-1
```

---

## Comandos Úteis

```bash
# Listar usuários em um grupo
aws cognito-idp list-users-in-group \
  --user-pool-id $USER_POOL_ID \
  --group-name INTERNAL_ADMIN \
  --region us-east-1

# Remover usuário de grupo
aws cognito-idp admin-remove-user-from-group \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com \
  --group-name GROUP_NAME \
  --region us-east-1

# Verificar atributos de usuário
aws cognito-idp admin-get-user \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com \
  --region us-east-1

# Testar conexão Aurora
psql "postgresql://username:password@aurora-endpoint:5432/alquimista_platform?sslmode=require"

# Verificar logs do CloudWatch
aws logs tail /aws/lambda/function-name --follow --region us-east-1
```

---

## Suporte

Se encontrar problemas durante a configuração:

1. Consulte a documentação AWS oficial
2. Verifique os logs do CloudWatch
3. Revise as permissões IAM
4. Consulte o troubleshooting acima

---

**Última atualização**: 2025-11-18

# Runbook de Deploy em Produção - Painel Operacional

## Informações do Deploy

**Sistema:** Painel Operacional AlquimistaAI  
**Ambiente:** Produção  
**Região AWS:** us-east-1  
**Tempo Estimado:** 45-60 minutos  
**Janela de Manutenção:** Recomendado fora do horário comercial  

---

## Pré-requisitos

### Validações Obrigatórias

- [ ] Deploy em DEV validado e funcionando
- [ ] Testes de integração passando (100%)
- [ ] Testes de segurança passando (OWASP)
- [ ] Testes de performance validados
- [ ] Code review aprovado
- [ ] Documentação atualizada
- [ ] Aprovação do Product Owner
- [ ] Aprovação do Tech Lead

### Preparação

- [ ] Backup do Aurora criado (< 24h)
- [ ] Rollback plan documentado
- [ ] Equipe de plantão notificada
- [ ] Monitoramento ativo
- [ ] Acesso ao AWS Console disponível
- [ ] Acesso SSH/VPN configurado (se necessário)

---

## Checklist Pré-Deploy

### 1. Verificar Estado Atual

```bash
# Verificar stacks existentes
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
  --query "StackSummaries[?contains(StackName, 'prod')].StackName" \
  --region us-east-1

# Verificar saúde do Aurora
aws rds describe-db-clusters \
  --db-cluster-identifier alquimista-aurora-prod \
  --query "DBClusters[0].Status" \
  --region us-east-1
```

**Status Esperado:** `available`

### 2. Criar Backup do Aurora

```bash
# Criar snapshot manual
SNAPSHOT_ID="operational-dashboard-pre-deploy-$(date +%Y%m%d-%H%M%S)"

aws rds create-db-cluster-snapshot \
  --db-cluster-identifier alquimista-aurora-prod \
  --db-cluster-snapshot-identifier $SNAPSHOT_ID \
  --region us-east-1

# Aguardar conclusão
aws rds wait db-cluster-snapshot-available \
  --db-cluster-snapshot-identifier $SNAPSHOT_ID \
  --region us-east-1

echo "✓ Snapshot criado: $SNAPSHOT_ID"
```

**Tempo Estimado:** 5-10 minutos

### 3. Notificar Stakeholders

```
Para: equipe-dev@alquimista.ai, ops@alquimista.ai
Assunto: [DEPLOY PROD] Painel Operacional - Início

Iniciando deploy do Painel Operacional em PRODUÇÃO.

Horário de Início: [TIMESTAMP]
Tempo Estimado: 45-60 minutos
Impacto: Nenhum (novos recursos)

Responsável: [NOME]
Backup: $SNAPSHOT_ID
```

---

## Procedimento de Deploy

### Fase 1: Migrations de Banco de Dados

**Tempo Estimado:** 5 minutos

#### 1.1. Conectar ao Aurora PROD

```bash
# Obter credenciais
aws secretsmanager get-secret-value \
  --secret-id /alquimista/prod/aurora/credentials \
  --region us-east-1 \
  --query SecretString \
  --output text | jq -r

# Exportar variáveis
export PGHOST=<aurora-endpoint>
export PGUSER=<username>
export PGPASSWORD=<password>
export PGDATABASE=alquimista_platform
```

#### 1.2. Validar Conexão

```bash
psql -c "SELECT version();"
```

**Output Esperado:** Versão do PostgreSQL

#### 1.3. Executar Migration

```bash
# Executar migration 015
psql -f database/migrations/015_create_operational_dashboard_tables.sql

# Verificar tabelas criadas
psql -c "\dt alquimista_platform.*" | grep -E "(tenant_users|tenant_agents|tenant_integrations|tenant_usage_daily|operational_events)"
```

**Validação:**
- [ ] 5 tabelas criadas
- [ ] Índices criados
- [ ] Sem erros no output

#### 1.4. Validar Integridade

```bash
# Verificar constraints
psql -c "
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  contype AS constraint_type
FROM pg_constraint
WHERE connamespace = 'alquimista_platform'::regnamespace
  AND conrelid::regclass::text LIKE '%tenant_%'
ORDER BY table_name, constraint_name;
"
```

**Checkpoint:** ✅ Migrations concluídas com sucesso

---

### Fase 2: Configuração do Cognito

**Tempo Estimado:** 5 minutos

#### 2.1. Obter User Pool ID

```bash
USER_POOL_ID=$(aws cognito-idp list-user-pools \
  --max-results 10 \
  --region us-east-1 \
  --query "UserPools[?Name=='alquimista-users-prod'].Id" \
  --output text)

echo "User Pool ID: $USER_POOL_ID"
```

#### 2.2. Criar Grupos

```bash
# INTERNAL_ADMIN
aws cognito-idp create-group \
  --user-pool-id $USER_POOL_ID \
  --group-name INTERNAL_ADMIN \
  --description "Administradores internos da AlquimistaAI" \
  --precedence 1 \
  --region us-east-1

# INTERNAL_SUPPORT
aws cognito-idp create-group \
  --user-pool-id $USER_POOL_ID \
  --group-name INTERNAL_SUPPORT \
  --description "Equipe de suporte interno" \
  --precedence 2 \
  --region us-east-1

# TENANT_ADMIN
aws cognito-idp create-group \
  --user-pool-id $USER_POOL_ID \
  --group-name TENANT_ADMIN \
  --description "Administradores de tenant" \
  --precedence 10 \
  --region us-east-1

# TENANT_USER
aws cognito-idp create-group \
  --user-pool-id $USER_POOL_ID \
  --group-name TENANT_USER \
  --description "Usuários de tenant" \
  --precedence 20 \
  --region us-east-1
```

#### 2.3. Validar Grupos

```bash
aws cognito-idp list-groups \
  --user-pool-id $USER_POOL_ID \
  --region us-east-1 \
  --query "Groups[].GroupName"
```

**Output Esperado:**
```json
[
  "INTERNAL_ADMIN",
  "INTERNAL_SUPPORT",
  "TENANT_ADMIN",
  "TENANT_USER"
]
```

**Checkpoint:** ✅ Cognito configurado

---

### Fase 3: Deploy do CDK Stack

**Tempo Estimado:** 20-30 minutos

#### 3.1. Compilar TypeScript

```bash
npm run build
```

#### 3.2. Sintetizar Stack

```bash
cdk synth OperationalDashboardStack-prod --context env=prod
```

**Validação:**
- [ ] Sem erros de compilação
- [ ] Template gerado em `cdk.out/`

#### 3.3. Revisar Mudanças

```bash
cdk diff OperationalDashboardStack-prod --context env=prod
```

**Revisar:**
- Recursos a serem criados
- Recursos a serem modificados
- Recursos a serem deletados (não deve haver)

#### 3.4. Deploy

```bash
# Deploy com aprovação manual
cdk deploy OperationalDashboardStack-prod --context env=prod

# Ou com auto-aprovação (se autorizado)
cdk deploy OperationalDashboardStack-prod --context env=prod --require-approval never
```

**Monitorar:**
- Progress no terminal
- CloudFormation Events no Console
- Erros ou rollbacks

**Tempo Estimado:** 15-25 minutos

#### 3.5. Aguardar Conclusão

Aguardar mensagem:
```
✅  OperationalDashboardStack-prod

Outputs:
OperationalDashboardStack-prod.CommandsTableName = alquimista-operational-commands-prod
OperationalDashboardStack-prod.RedisEndpoint = alquimista-redis-prod.xxxxx.cache.amazonaws.com
...
```

**Checkpoint:** ✅ Stack deployado com sucesso

---

### Fase 4: Validação Pós-Deploy

**Tempo Estimado:** 10-15 minutos

#### 4.1. Verificar Recursos Criados

```bash
# DynamoDB Table
aws dynamodb describe-table \
  --table-name alquimista-operational-commands-prod \
  --region us-east-1 \
  --query "Table.TableStatus"

# ElastiCache Redis
aws elasticache describe-cache-clusters \
  --cache-cluster-id alquimista-redis-prod \
  --region us-east-1 \
  --query "CacheClusters[0].CacheClusterStatus"

# Lambda Functions
aws lambda list-functions \
  --region us-east-1 \
  --query "Functions[?contains(FunctionName, 'operational') && contains(FunctionName, 'prod')].FunctionName"
```

**Status Esperado:** `ACTIVE` / `available`

#### 4.2. Smoke Tests

```bash
# Executar smoke tests
.\scripts\smoke-tests-operational-dashboard-prod.ps1
```

**Validações:**
- [ ] Todos os endpoints respondem
- [ ] Autenticação funciona
- [ ] Autorização funciona (403 para usuários sem permissão)
- [ ] Cache Redis funciona
- [ ] DynamoDB funciona

#### 4.3. Verificar Logs

```bash
# Logs das Lambdas (últimos 5 minutos)
aws logs tail /aws/lambda/alquimista-get-tenant-me-prod \
  --since 5m \
  --follow

# Verificar erros
aws logs filter-log-events \
  --log-group-name /aws/lambda/alquimista-get-tenant-me-prod \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '5 minutes ago' +%s)000
```

**Validação:** Sem erros críticos

#### 4.4. Verificar Métricas

Acessar CloudWatch Console:
- Lambda Invocations
- Lambda Errors
- Lambda Duration
- DynamoDB Read/Write Capacity
- ElastiCache CPU/Memory

**Checkpoint:** ✅ Validação concluída

---

### Fase 5: Configuração do Frontend

**Tempo Estimado:** 5 minutos

#### 5.1. Gerar Configuração

```powershell
.\scripts\configure-frontend-env.ps1 -Environment prod
```

#### 5.2. Validar Arquivo

```bash
cat frontend/.env.local
```

**Verificar:**
- [ ] NEXT_PUBLIC_PLATFORM_API_URL correto
- [ ] NEXT_PUBLIC_COGNITO_USER_POOL_ID correto
- [ ] NEXT_PUBLIC_COGNITO_CLIENT_ID correto
- [ ] Sem valores "CONFIGURE_ME"

#### 5.3. Build do Frontend

```bash
cd frontend
npm run build
```

#### 5.4. Deploy do Frontend

```bash
npm run deploy:prod
```

**Checkpoint:** ✅ Frontend deployado

---

## Validação Final

### Testes End-to-End

#### 1. Login como Usuário Interno

1. Acessar: `https://app.alquimista.ai/login`
2. Login com usuário INTERNAL_ADMIN
3. Verificar redirecionamento para `/app/company`
4. Verificar acesso ao painel operacional

#### 2. Login como Usuário Tenant

1. Acessar: `https://app.alquimista.ai/login`
2. Login com usuário TENANT_ADMIN
3. Verificar redirecionamento para `/app/dashboard`
4. Verificar acesso ao dashboard do cliente

#### 3. Testar Funcionalidades

- [ ] Dashboard do cliente carrega dados
- [ ] Painel operacional carrega lista de tenants
- [ ] Criação de comando operacional funciona
- [ ] Processamento de comando funciona
- [ ] Métricas são exibidas corretamente

### Monitoramento

Configurar alarmes no CloudWatch:
- Lambda Errors > 5 em 5 minutos
- API Gateway 5xx > 10 em 5 minutos
- DynamoDB Throttles > 0
- ElastiCache CPU > 80%

---

## Notificação de Conclusão

```
Para: equipe-dev@alquimista.ai, ops@alquimista.ai
Assunto: [DEPLOY PROD] Painel Operacional - Concluído ✅

Deploy do Painel Operacional em PRODUÇÃO concluído com sucesso.

Horário de Início: [TIMESTAMP_INICIO]
Horário de Conclusão: [TIMESTAMP_FIM]
Duração: [DURACAO]

Recursos Criados:
- DynamoDB Table: alquimista-operational-commands-prod
- ElastiCache Redis: alquimista-redis-prod
- 14 Lambda Functions
- 12 API Gateway Routes

Validações:
✅ Smoke tests passando
✅ Logs sem erros
✅ Métricas normais
✅ Frontend deployado

Monitoramento:
- CloudWatch Dashboard: [URL]
- Logs: [URL]

Responsável: [NOME]
```

---

## Rollback

### Quando Fazer Rollback

- Erros críticos em produção
- Falha nos smoke tests
- Métricas anormais (> 5% de erros)
- Problemas de performance
- Feedback negativo de usuários

### Procedimento de Rollback

#### 1. Rollback do Stack CDK

```bash
# Destruir stack
cdk destroy OperationalDashboardStack-prod --context env=prod --force
```

#### 2. Rollback do Banco de Dados

```bash
# Restaurar snapshot
aws rds restore-db-cluster-from-snapshot \
  --db-cluster-identifier alquimista-aurora-prod-restored \
  --snapshot-identifier $SNAPSHOT_ID \
  --region us-east-1

# Ou executar rollback SQL
psql -f database/migrations/015_rollback.sql
```

#### 3. Rollback do Cognito

```bash
# Remover grupos
aws cognito-idp delete-group --user-pool-id $USER_POOL_ID --group-name INTERNAL_ADMIN
aws cognito-idp delete-group --user-pool-id $USER_POOL_ID --group-name INTERNAL_SUPPORT
aws cognito-idp delete-group --user-pool-id $USER_POOL_ID --group-name TENANT_ADMIN
aws cognito-idp delete-group --user-pool-id $USER_POOL_ID --group-name TENANT_USER
```

#### 4. Notificar Rollback

```
Para: equipe-dev@alquimista.ai, ops@alquimista.ai
Assunto: [ROLLBACK PROD] Painel Operacional

Rollback do deploy do Painel Operacional executado.

Motivo: [DESCREVER MOTIVO]
Horário: [TIMESTAMP]

Ações Tomadas:
- Stack CDK removido
- Banco de dados restaurado
- Cognito revertido

Status: Sistema restaurado ao estado anterior

Responsável: [NOME]
```

---

## Contatos de Emergência

**Tech Lead:** [NOME] - [EMAIL] - [TELEFONE]  
**DevOps:** [NOME] - [EMAIL] - [TELEFONE]  
**AWS Support:** [CASO ID]  

---

## Lições Aprendidas

Após o deploy, documentar:
- Problemas encontrados
- Soluções aplicadas
- Melhorias para próximos deploys
- Tempo real vs estimado

---

**Última Atualização:** 2024-01-XX  
**Versão:** 1.0  
**Autor:** Kiro AI

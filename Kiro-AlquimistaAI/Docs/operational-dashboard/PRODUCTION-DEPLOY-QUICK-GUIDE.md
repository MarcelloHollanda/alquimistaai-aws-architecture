# Guia Rápido de Deploy em Produção

## 🚀 Deploy em 4 Passos

Este guia fornece instruções rápidas para deploy do Painel Operacional em produção.

---

## ⚠️ ANTES DE COMEÇAR

### Pré-requisitos

✅ **Verificar Status**
```powershell
# Ler status atual
cat OPERATIONAL-DASHBOARD-PRODUCTION-READY.md
```

🔴 **BLOQUEADORES CRÍTICOS**

O sistema **NÃO ESTÁ PRONTO** para produção até que estas 3 vulnerabilidades sejam corrigidas:

1. **Rate Limiting** - Tempo: 1 dia
2. **Headers de Segurança** - Tempo: 4 horas
3. **Auditoria SQL** - Tempo: 1 dia

**Tempo Total**: 2-3 dias

📖 **Guia de Correção**: `tests/security/VULNERABILITY-FIX-GUIDE.md`

---

## 📋 Passo 1: Corrigir Vulnerabilidades (2-3 dias)

### 1.1 Rate Limiting

```typescript
// Implementar em lambda/shared/rate-limiter.ts
import { RateLimiter } from 'lambda-rate-limiter';

export const rateLimiter = new RateLimiter({
  interval: 60000, // 1 minuto
  uniqueTokenPerInterval: 500,
});

// Aplicar em todos os handlers
export const handler = async (event: APIGatewayProxyEventV2) => {
  const identifier = event.requestContext.authorizer?.jwt?.claims?.sub;
  
  try {
    await rateLimiter.check(10, identifier); // 10 requests por minuto
  } catch {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: 'Too Many Requests' }),
    };
  }
  
  // Handler logic...
};
```

**Testar**:
```bash
npm run test:security -- --grep "rate limiting"
```

### 1.2 Headers de Segurança

```typescript
// Adicionar em lib/operational-dashboard-stack.ts
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

// Configurar response headers
const api = new apigateway.HttpApi(this, 'OperationalDashboardApi', {
  defaultIntegration: /* ... */,
  defaultCorsPreflightOptions: {
    allowOrigins: ['https://app.alquimista.ai'],
    allowMethods: [apigateway.CorsHttpMethod.GET, apigateway.CorsHttpMethod.POST],
    allowHeaders: ['Content-Type', 'Authorization'],
  },
});

// Adicionar headers de segurança em todos os handlers
export const handler = async (event: APIGatewayProxyEventV2) => {
  // Handler logic...
  
  return {
    statusCode: 200,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'",
    },
    body: JSON.stringify(result),
  };
};
```

**Testar**:
```bash
npm run test:security -- --grep "security headers"
```

### 1.3 Auditoria SQL

```typescript
// Revisar TODOS os handlers em lambda/internal/ e lambda/platform/
// Exemplo de correção:

// ❌ ERRADO (vulnerável a SQL injection)
const sql = `SELECT * FROM tenants WHERE name = '${name}'`;

// ✅ CORRETO (usando prepared statements)
const sql = `SELECT * FROM tenants WHERE name = ?`;
const result = await query(sql, [name]);
```

**Arquivos para auditar**:
- `lambda/internal/list-tenants.ts`
- `lambda/internal/get-tenant-detail.ts`
- `lambda/internal/get-usage-overview.ts`
- `lambda/internal/get-billing-overview.ts`
- `lambda/platform/get-tenant-me.ts`
- `lambda/platform/get-tenant-agents.ts`
- `lambda/platform/get-tenant-usage.ts`

**Testar**:
```bash
npm run test:security -- --grep "SQL injection"
```

### 1.4 Validar Correções

```bash
# Executar todos os testes de segurança
npm run test:security

# Executar OWASP ZAP scan
.\tests\security\owasp-zap-scan.ps1 -Target "https://api-dev.alquimista.ai" -FullScan

# Verificar relatório
cat tests/security/reports/zap-report.html
```

**Critério de Sucesso**: 100% dos testes de segurança passando

---

## 📋 Passo 2: Preparar Deploy (1 hora)

### 2.1 Backup do Banco de Dados

```powershell
# Criar snapshot do Aurora
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$snapshotId = "alquimista-aurora-prod-pre-deploy-$timestamp"

aws rds create-db-cluster-snapshot `
  --db-cluster-identifier alquimista-aurora-prod `
  --db-cluster-snapshot-identifier $snapshotId `
  --region us-east-1

# Salvar ID do snapshot
$snapshotId | Out-File -FilePath last-snapshot-id.txt

Write-Host "✅ Snapshot criado: $snapshotId"
```

### 2.2 Configurar Variáveis de Ambiente

```powershell
# Configurar variáveis para produção
$env:AWS_REGION = "us-east-1"
$env:ENVIRONMENT = "prod"
$env:AURORA_CLUSTER_ARN = "arn:aws:rds:us-east-1:ACCOUNT_ID:cluster:alquimista-aurora-prod"
$env:AURORA_SECRET_ARN = "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:alquimista-aurora-prod"
$env:COGNITO_USER_POOL_ID = "us-east-1_XXXXXXXXX"
$env:REDIS_ENDPOINT = "alquimista-redis-prod.XXXXXX.cache.amazonaws.com"
```

### 2.3 Validar Credenciais AWS

```powershell
# Verificar credenciais
aws sts get-caller-identity

# Verificar região
aws configure get region

# Verificar acesso ao Aurora
aws rds describe-db-clusters --db-cluster-identifier alquimista-aurora-prod
```

---

## 📋 Passo 3: Executar Deploy (30-45 min)

### 3.1 Executar Migrations

```powershell
# Conectar ao Aurora
$auroraEndpoint = (aws rds describe-db-clusters `
  --db-cluster-identifier alquimista-aurora-prod `
  --query 'DBClusters[0].Endpoint' `
  --output text)

# Executar migration
psql -h $auroraEndpoint `
  -U alquimista_admin `
  -d alquimista `
  -f database/migrations/015_create_operational_dashboard_tables.sql

Write-Host "✅ Migrations executadas"
```

### 3.2 Configurar Cognito

```powershell
# Executar script de configuração
.\scripts\setup-cognito-groups.ps1 -Environment prod

Write-Host "✅ Grupos do Cognito configurados"
```

### 3.3 Deploy CDK Stack

```powershell
# Compilar TypeScript
npm run build

# Deploy
cdk deploy OperationalDashboardStack-prod --context env=prod --require-approval never

Write-Host "✅ Stack deployado"
```

### 3.4 Executar Smoke Tests

```powershell
# Executar smoke tests
.\scripts\smoke-tests-operational-dashboard-prod.ps1

Write-Host "✅ Smoke tests passaram"
```

---

## 📋 Passo 4: Validar e Monitorar (1 hora)

### 4.1 Validações Funcionais

```powershell
# Testar APIs de tenant
$tenantToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." # Token de teste

# GET /tenant/me
curl -H "Authorization: Bearer $tenantToken" `
  https://api-prod.alquimista.ai/tenant/me

# GET /tenant/agents
curl -H "Authorization: Bearer $tenantToken" `
  https://api-prod.alquimista.ai/tenant/agents

# Testar APIs internas
$internalToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." # Token interno

# GET /internal/tenants
curl -H "Authorization: Bearer $internalToken" `
  https://api-prod.alquimista.ai/internal/tenants

Write-Host "✅ APIs funcionando"
```

### 4.2 Configurar Frontend

```powershell
# Gerar configuração
.\scripts\configure-frontend-env.ps1 -Environment prod

# Build
cd frontend
npm run build

# Deploy para S3
npm run deploy:prod

Write-Host "✅ Frontend deployado"
```

### 4.3 Criar Usuários de Teste

```powershell
# Usuário interno (admin)
.\scripts\create-internal-user.ps1 `
  -Email "admin@alquimista.ai" `
  -Name "Admin Produção" `
  -Group "INTERNAL_ADMIN" `
  -Environment prod

# Usuário tenant (cliente)
.\scripts\create-tenant-user.ps1 `
  -Email "cliente@empresa.com" `
  -Name "Cliente Teste" `
  -TenantId "00000000-0000-0000-0000-000000000001" `
  -Group "TENANT_ADMIN" `
  -Environment prod

Write-Host "✅ Usuários criados"
```

### 4.4 Monitorar Logs

```powershell
# Monitorar logs em tempo real
aws logs tail /aws/lambda/alquimista-get-tenant-me-prod --follow

# Verificar erros
aws logs filter-log-events `
  --log-group-name /aws/lambda/alquimista-get-tenant-me-prod `
  --filter-pattern "ERROR" `
  --start-time (Get-Date).AddHours(-1).ToUniversalTime().ToString("o")
```

### 4.5 Verificar Alarmes

```powershell
# Listar alarmes ativos
aws cloudwatch describe-alarms `
  --alarm-name-prefix "alquimista-operational-dashboard" `
  --state-value ALARM

Write-Host "✅ Nenhum alarme ativo"
```

---

## ✅ Checklist de Conclusão

### Pré-Deploy
- [ ] Vulnerabilidades críticas corrigidas
- [ ] Todos os testes de segurança passando (100%)
- [ ] OWASP ZAP scan executado sem vulnerabilidades críticas
- [ ] Backup do banco de dados criado
- [ ] Variáveis de ambiente configuradas

### Deploy
- [ ] Migrations executadas com sucesso
- [ ] Grupos do Cognito configurados
- [ ] Stack CDK deployado
- [ ] Smoke tests passando
- [ ] Logs verificados

### Pós-Deploy
- [ ] APIs validadas funcionalmente
- [ ] Frontend configurado e deployado
- [ ] Usuários de teste criados
- [ ] Monitoramento ativo
- [ ] Alarmes configurados
- [ ] Equipe notificada

---

## 🆘 Troubleshooting

### Erro: "Rate limit exceeded"

```powershell
# Verificar configuração de rate limiting
aws lambda get-function-configuration `
  --function-name alquimista-get-tenant-me-prod `
  --query 'Environment.Variables'
```

### Erro: "Database connection failed"

```powershell
# Verificar status do Aurora
aws rds describe-db-clusters `
  --db-cluster-identifier alquimista-aurora-prod `
  --query 'DBClusters[0].Status'

# Verificar security groups
aws ec2 describe-security-groups `
  --filters "Name=group-name,Values=alquimista-aurora-sg-prod"
```

### Erro: "Cognito group not found"

```powershell
# Listar grupos
aws cognito-idp list-groups `
  --user-pool-id us-east-1_XXXXXXXXX

# Recriar grupos
.\scripts\setup-cognito-groups.ps1 -Environment prod
```

**Guia Completo**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 🔄 Rollback

### Quando Fazer Rollback

- Taxa de erro > 5%
- Problemas críticos de performance
- Vulnerabilidades de segurança descobertas
- Feedback negativo de usuários

### Como Fazer Rollback

```powershell
# 1. Destruir stack
cdk destroy OperationalDashboardStack-prod --context env=prod --force

# 2. Restaurar banco de dados
$snapshotId = Get-Content last-snapshot-id.txt
aws rds restore-db-cluster-from-snapshot `
  --db-cluster-identifier alquimista-aurora-prod-restored `
  --snapshot-identifier $snapshotId `
  --region us-east-1

# 3. Remover grupos do Cognito
$userPoolId = "us-east-1_XXXXXXXXX"
aws cognito-idp delete-group --user-pool-id $userPoolId --group-name INTERNAL_ADMIN
aws cognito-idp delete-group --user-pool-id $userPoolId --group-name INTERNAL_SUPPORT
aws cognito-idp delete-group --user-pool-id $userPoolId --group-name TENANT_ADMIN
aws cognito-idp delete-group --user-pool-id $userPoolId --group-name TENANT_USER

Write-Host "✅ Rollback concluído"
```

**Tempo Estimado**: 15-20 minutos

---

## 📞 Suporte

### Equipe de Desenvolvimento
- **Email**: dev@alquimista.ai
- **Slack**: #alquimista-dev

### Plantão
- **Horário**: 24/7
- **Contato**: [DEFINIR]

### Documentação Completa
- [PRODUCTION-DEPLOY-RUNBOOK.md](./PRODUCTION-DEPLOY-RUNBOOK.md)
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- [DEPLOY-PRODUCTION-INDEX.md](./DEPLOY-PRODUCTION-INDEX.md)

---

**Gerado por**: Kiro AI  
**Versão**: 1.0  
**Última Atualização**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

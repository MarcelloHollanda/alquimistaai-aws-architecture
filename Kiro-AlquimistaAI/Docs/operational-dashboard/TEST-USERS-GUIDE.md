# Guia de Usuários de Teste

## Visão Geral

Este documento descreve como criar e gerenciar usuários de teste para validar o Painel Operacional AlquimistaAI.

## Usuários de Teste Recomendados

### Ambiente Dev

| E-mail | Grupo | Tenant ID | Senha | Uso |
|--------|-------|-----------|-------|-----|
| admin@alquimista.ai | INTERNAL_ADMIN | - | TempPass123! | Testar painel operacional completo |
| support@alquimista.ai | INTERNAL_SUPPORT | - | TempPass123! | Testar painel operacional sem billing |
| admin@tenant1.test | TENANT_ADMIN | test-tenant-001 | TempPass123! | Testar dashboard cliente (admin) |
| user@tenant1.test | TENANT_USER | test-tenant-001 | TempPass123! | Testar dashboard cliente (user) |
| admin@tenant2.test | TENANT_ADMIN | test-tenant-002 | TempPass123! | Testar isolamento entre tenants |

## Criação Rápida

### Script Automatizado

```powershell
# Executar script de setup com criação de usuários de teste
.\scripts\setup-cognito-operational-groups.ps1 -Environment dev

# Quando perguntado "Deseja criar usuários de teste?", responder "s"
```

### Criação Manual

```powershell
# 1. Usuário Admin Interno
.\scripts\create-internal-user.ps1 `
    -Email "admin@alquimista.ai" `
    -Role "admin" `
    -FullName "Admin AlquimistaAI" `
    -Environment "dev"

# 2. Usuário Support Interno
.\scripts\create-internal-user.ps1 `
    -Email "support@alquimista.ai" `
    -Role "support" `
    -FullName "Support AlquimistaAI" `
    -Environment "dev"

# 3. Admin Tenant 1
.\scripts\create-tenant-user.ps1 `
    -Email "admin@tenant1.test" `
    -TenantId "test-tenant-001" `
    -CompanyName "Tenant 1 Test" `
    -Role "admin" `
    -Environment "dev"

# 4. User Tenant 1
.\scripts\create-tenant-user.ps1 `
    -Email "user@tenant1.test" `
    -TenantId "test-tenant-001" `
    -CompanyName "Tenant 1 Test" `
    -Role "user" `
    -Environment "dev"

# 5. Admin Tenant 2
.\scripts\create-tenant-user.ps1 `
    -Email "admin@tenant2.test" `
    -TenantId "test-tenant-002" `
    -CompanyName "Tenant 2 Test" `
    -Role "admin" `
    -Environment "dev"
```

## Cenários de Teste

### 1. Teste de Acesso ao Painel Operacional

**Usuário**: admin@alquimista.ai

**Passos**:
1. Login no frontend
2. Verificar redirecionamento para `/app/company`
3. Verificar acesso a todas as seções:
   - Visão Geral
   - Tenants
   - Agentes
   - Integrações
   - Operações
   - Billing
4. Testar criação de comando operacional
5. Verificar visualização de dados de todos os tenants

**Resultado Esperado**: Acesso completo a todas as funcionalidades

### 2. Teste de Acesso Support

**Usuário**: support@alquimista.ai

**Passos**:
1. Login no frontend
2. Verificar redirecionamento para `/app/company`
3. Verificar acesso a seções (exceto Billing)
4. Tentar acessar `/app/company/billing`
5. Testar criação de comando operacional

**Resultado Esperado**: 
- Acesso a todas as seções exceto Billing
- Erro 403 ao tentar acessar Billing

### 3. Teste de Dashboard Cliente (Admin)

**Usuário**: admin@tenant1.test

**Passos**:
1. Login no frontend
2. Verificar redirecionamento para `/app/dashboard`
3. Verificar acesso a todas as seções do dashboard
4. Verificar que apenas dados do tenant-001 são exibidos
5. Testar ativação/desativação de agentes
6. Testar configuração de integrações

**Resultado Esperado**: 
- Acesso completo ao dashboard do tenant
- Apenas dados do tenant-001 visíveis

### 4. Teste de Dashboard Cliente (User)

**Usuário**: user@tenant1.test

**Passos**:
1. Login no frontend
2. Verificar redirecionamento para `/app/dashboard`
3. Verificar acesso apenas a visualização
4. Tentar modificar configurações
5. Verificar que apenas dados do tenant-001 são exibidos

**Resultado Esperado**: 
- Acesso apenas leitura ao dashboard
- Erro ao tentar modificar configurações

### 5. Teste de Isolamento entre Tenants

**Usuários**: admin@tenant1.test e admin@tenant2.test

**Passos**:
1. Login com admin@tenant1.test
2. Anotar dados exibidos
3. Logout
4. Login com admin@tenant2.test
5. Verificar que dados são diferentes
6. Tentar acessar recursos do tenant-001 via API

**Resultado Esperado**: 
- Dados completamente isolados
- Erro 403 ao tentar acessar recursos de outro tenant

## Dados de Teste no Banco

### Criar Tenants de Teste

```sql
-- Tenant 1
INSERT INTO tenants (id, name, cnpj, segment, plan, status, mrr_estimate, created_at)
VALUES (
    'test-tenant-001',
    'Tenant 1 Test',
    '12.345.678/0001-90',
    'Tecnologia',
    'professional',
    'active',
    299.90,
    NOW()
);

-- Tenant 2
INSERT INTO tenants (id, name, cnpj, segment, plan, status, mrr_estimate, created_at)
VALUES (
    'test-tenant-002',
    'Tenant 2 Test',
    '98.765.432/0001-10',
    'Saúde',
    'enterprise',
    'active',
    599.90,
    NOW()
);
```

### Criar Agentes de Teste

```sql
-- Agentes para Tenant 1
INSERT INTO tenant_agents (tenant_id, agent_id, status, activated_at)
SELECT 
    'test-tenant-001',
    id,
    'active',
    NOW()
FROM agents
LIMIT 3;

-- Agentes para Tenant 2
INSERT INTO tenant_agents (tenant_id, agent_id, status, activated_at)
SELECT 
    'test-tenant-002',
    id,
    'active',
    NOW()
FROM agents
LIMIT 5;
```

### Criar Dados de Uso

```sql
-- Uso para Tenant 1
INSERT INTO tenant_usage_daily (tenant_id, agent_id, date, total_requests, successful_requests, failed_requests, avg_response_time_ms)
SELECT 
    'test-tenant-001',
    agent_id,
    CURRENT_DATE - INTERVAL '1 day' * generate_series(0, 29),
    floor(random() * 1000 + 100)::int,
    floor(random() * 950 + 90)::int,
    floor(random() * 50 + 10)::int,
    floor(random() * 500 + 100)::int
FROM tenant_agents
WHERE tenant_id = 'test-tenant-001';
```

## Validação de Testes

### Checklist de Validação

- [ ] Usuários internos acessam painel operacional
- [ ] Usuários de tenant acessam dashboard cliente
- [ ] Isolamento de dados entre tenants funciona
- [ ] Permissões de admin vs user funcionam
- [ ] Redirecionamento após login correto
- [ ] Middleware de autorização funciona
- [ ] APIs retornam apenas dados autorizados
- [ ] Erros 403 aparecem quando apropriado

### Logs a Verificar

```bash
# Logs de autenticação
aws logs tail /aws/lambda/alquimista-platform-api-dev --follow

# Logs de autorização
aws logs filter-pattern "Forbidden" /aws/lambda/alquimista-*

# Logs de acesso
aws logs filter-pattern "tenant_id" /aws/lambda/alquimista-*
```

## Limpeza

### Remover Usuários de Teste

```powershell
# Listar usuários de teste
$testUsers = @(
    "admin@alquimista.ai",
    "support@alquimista.ai",
    "admin@tenant1.test",
    "user@tenant1.test",
    "admin@tenant2.test"
)

# Obter User Pool ID
$userPoolId = aws cognito-idp list-user-pools --max-results 10 --region us-east-1 --query "UserPools[?Name=='fibonacci-users-dev'].Id" --output text

# Deletar cada usuário
foreach ($email in $testUsers) {
    Write-Host "Deletando: $email"
    aws cognito-idp admin-delete-user `
        --user-pool-id $userPoolId `
        --username $email `
        --region us-east-1
}
```

### Remover Dados de Teste do Banco

```sql
-- Remover dados de uso
DELETE FROM tenant_usage_daily WHERE tenant_id IN ('test-tenant-001', 'test-tenant-002');

-- Remover agentes
DELETE FROM tenant_agents WHERE tenant_id IN ('test-tenant-001', 'test-tenant-002');

-- Remover tenants
DELETE FROM tenants WHERE id IN ('test-tenant-001', 'test-tenant-002');
```

## Referências

- [Cognito Groups Setup](./COGNITO-GROUPS-SETUP.md)
- [Process User Assignment](./PROCESS-USER-ASSIGNMENT.md)
- [Requirements](../../.kiro/specs/operational-dashboard-alquimistaai/requirements.md)

# Exemplos Práticos - Painel Operacional AlquimistaAI

## 🚀 Guia de Início Rápido com Exemplos

Este documento fornece exemplos práticos e prontos para uso do Painel Operacional AlquimistaAI.

---

## 📋 Índice de Exemplos

1. [Configuração Inicial](#configuração-inicial)
2. [Gerenciamento de Usuários](#gerenciamento-de-usuários)
3. [Uso de APIs](#uso-de-apis)
4. [Comandos Operacionais](#comandos-operacionais)
5. [Troubleshooting](#troubleshooting)
6. [Desenvolvimento](#desenvolvimento)

---

## Configuração Inicial

### Exemplo 1: Setup Completo do Zero

```powershell
# 1. Criar grupos no Cognito
.\scripts\setup-cognito-groups.ps1

# 2. Criar primeiro usuário admin
.\scripts\create-internal-user.ps1 `
  -Email "admin@alquimista.ai" `
  -Name "Admin Principal" `
  -Group "INTERNAL_ADMIN"

# 3. Validar configuração
.\scripts\validate-cognito-setup.ps1

# 4. Testar login
# Acesse: https://app.alquimista.ai/auth/login
# Use as credenciais criadas
```

**Resultado Esperado**:
- ✅ 4 grupos criados no Cognito
- ✅ Usuário admin criado e funcional
- ✅ Validação passa sem erros
- ✅ Login funciona e redireciona para `/app/company`

---

### Exemplo 2: Configurar Tenant de Teste

```powershell
# 1. Criar tenant no banco (via SQL ou API)
# Assumindo tenant_id = "550e8400-e29b-41d4-a716-446655440000"

# 2. Criar usuário admin do tenant
.\scripts\create-tenant-user.ps1 `
  -Email "admin@empresa-teste.com" `
  -Name "Admin Empresa Teste" `
  -TenantId "550e8400-e29b-41d4-a716-446655440000" `
  -Group "TENANT_ADMIN"

# 3. Criar usuário regular do tenant
.\scripts\create-tenant-user.ps1 `
  -Email "usuario@empresa-teste.com" `
  -Name "Usuario Empresa Teste" `
  -TenantId "550e8400-e29b-41d4-a716-446655440000" `
  -Group "TENANT_USER"

# 4. Validar
.\scripts\validate-cognito-setup.ps1
```

**Resultado Esperado**:
- ✅ 2 usuários criados para o tenant
- ✅ Admin pode acessar todas as funcionalidades
- ✅ Usuário regular tem acesso limitado
- ✅ Ambos veem apenas dados do seu tenant

---

## Gerenciamento de Usuários

### Exemplo 3: Adicionar Usuário a Grupo

```bash
# Adicionar usuário existente ao grupo INTERNAL_SUPPORT
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username suporte@alquimista.ai \
  --group-name INTERNAL_SUPPORT

# Verificar grupos do usuário
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username suporte@alquimista.ai
```

**Resultado Esperado**:
```json
{
  "Groups": [
    {
      "GroupName": "INTERNAL_SUPPORT",
      "Description": "Equipe de Suporte AlquimistaAI"
    }
  ]
}
```

---

### Exemplo 4: Atualizar Tenant ID de Usuário

```bash
# Cenário: Usuário foi criado sem tenant_id ou com ID errado

# Atualizar tenant_id
aws cognito-idp admin-update-user-attributes \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username usuario@empresa.com \
  --user-attributes Name=custom:tenant_id,Value=550e8400-e29b-41d4-a716-446655440000

# Verificar atualização
aws cognito-idp admin-get-user \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username usuario@empresa.com \
  | grep tenant_id
```

**Resultado Esperado**:
```json
{
  "Name": "custom:tenant_id",
  "Value": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### Exemplo 5: Resetar Senha de Usuário

```bash
# Resetar senha (usuário precisará mudar no primeiro login)
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username usuario@empresa.com \
  --password "SenhaTemporaria123!" \
  --temporary

# Ou definir senha permanente
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username usuario@empresa.com \
  --password "NovaSenha123!" \
  --permanent
```

---

## Uso de APIs

### Exemplo 6: Obter Dados do Tenant (Cliente)

```bash
# 1. Obter token JWT
TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-1_XXXXXXXXX \
  --client-id XXXXXXXXX \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=admin@empresa.com,PASSWORD=senha123 \
  | jq -r '.AuthenticationResult.IdToken')

# 2. Chamar API
curl -X GET https://api.alquimista.ai/tenant/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Resposta Esperada**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Empresa Teste",
  "cnpj": "12.345.678/0001-90",
  "segment": "Tecnologia",
  "plan": "Professional",
  "status": "active",
  "mrr_estimate": 2990.00,
  "created_at": "2024-01-01T00:00:00Z",
  "limits": {
    "max_agents": 10,
    "max_users": 50,
    "max_requests_per_month": 100000
  },
  "usage": {
    "active_agents": 5,
    "active_users": 12,
    "requests_this_month": 45230
  }
}
```

---

### Exemplo 7: Listar Todos os Tenants (Interno)

```bash
# 1. Obter token de usuário interno
TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-1_XXXXXXXXX \
  --client-id XXXXXXXXX \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=admin@alquimista.ai,PASSWORD=senha123 \
  | jq -r '.AuthenticationResult.IdToken')

# 2. Listar tenants com filtros
curl -X GET "https://api.alquimista.ai/internal/tenants?status=active&limit=10&sort_by=name" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Resposta Esperada**:
```json
{
  "tenants": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Empresa A",
      "cnpj": "12.345.678/0001-90",
      "segment": "Tecnologia",
      "plan": "Professional",
      "status": "active",
      "mrr_estimate": 2990.00,
      "active_agents": 5,
      "active_users": 12,
      "requests_last_30_days": 45230,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 47,
  "limit": 10,
  "offset": 0
}
```

---

### Exemplo 8: Obter Métricas de Uso (Interno)

```bash
# Obter visão global de uso dos últimos 30 dias
curl -X GET "https://api.alquimista.ai/internal/usage/overview?period=30d" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Resposta Esperada**:
```json
{
  "period": "30d",
  "global_stats": {
    "total_tenants": 47,
    "active_tenants": 42,
    "total_agents_deployed": 312,
    "total_requests": 1245000,
    "global_success_rate": 99.2,
    "avg_response_time_ms": 245
  },
  "top_tenants_by_usage": [
    {
      "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
      "tenant_name": "Empresa A",
      "total_requests": 125000,
      "success_rate": 99.5
    }
  ],
  "daily_trends": [
    {
      "date": "2024-01-15",
      "total_requests": 45230,
      "success_rate": 99.3,
      "active_tenants": 42
    }
  ]
}
```

---

## Comandos Operacionais

### Exemplo 9: Reprocessar Fila

```bash
# Criar comando para reprocessar fila de leads
curl -X POST https://api.alquimista.ai/internal/operations/commands \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "command_type": "REPROCESS_QUEUE",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "parameters": {
      "queue_name": "leads",
      "message_ids": ["msg-123", "msg-456"]
    }
  }'
```

**Resposta Esperada**:
```json
{
  "command_id": "cmd-789",
  "status": "PENDING",
  "created_at": "2024-01-15T10:30:00Z",
  "message": "Comando criado com sucesso. Processamento iniciado."
}
```

---

### Exemplo 10: Resetar Token de Integração

```bash
# Resetar token de integração do WhatsApp
curl -X POST https://api.alquimista.ai/internal/operations/commands \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "command_type": "RESET_TOKEN",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "parameters": {
      "integration_id": "int-whatsapp-123"
    }
  }'
```

---

### Exemplo 11: Reiniciar Agente

```bash
# Reiniciar agente específico
curl -X POST https://api.alquimista.ai/internal/operations/commands \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "command_type": "RESTART_AGENT",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "parameters": {
      "agent_id": "agent-sdr-001"
    }
  }'
```

---

### Exemplo 12: Health Check Global

```bash
# Executar health check de todo o sistema
curl -X POST https://api.alquimista.ai/internal/operations/commands \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "command_type": "HEALTH_CHECK",
    "parameters": {}
  }'
```

---

### Exemplo 13: Verificar Status de Comando

```bash
# Listar comandos recentes
curl -X GET "https://api.alquimista.ai/internal/operations/commands?limit=10&status=all" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Resposta Esperada**:
```json
{
  "commands": [
    {
      "command_id": "cmd-789",
      "command_type": "REPROCESS_QUEUE",
      "status": "SUCCESS",
      "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
      "tenant_name": "Empresa A",
      "created_by": "admin@alquimista.ai",
      "created_at": "2024-01-15T10:30:00Z",
      "started_at": "2024-01-15T10:30:05Z",
      "completed_at": "2024-01-15T10:30:15Z",
      "output": "Reprocessados 2 mensagens com sucesso",
      "error_message": null
    }
  ],
  "total": 1
}
```

---

## Troubleshooting

### Exemplo 14: Diagnosticar Erro 403

```bash
# 1. Verificar grupos do usuário
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username usuario@empresa.com

# 2. Verificar tenant_id
aws cognito-idp admin-get-user \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username usuario@empresa.com \
  | jq '.UserAttributes[] | select(.Name=="custom:tenant_id")'

# 3. Se tenant_id estiver errado, corrigir
aws cognito-idp admin-update-user-attributes \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username usuario@empresa.com \
  --user-attributes Name=custom:tenant_id,Value=550e8400-e29b-41d4-a716-446655440000

# 4. Usuário deve fazer logout e login novamente
```

---

### Exemplo 15: Verificar Logs de Erro

```bash
# Ver logs do Lambda em tempo real
aws logs tail /aws/lambda/get-tenant-me --follow

# Buscar erros específicos
aws logs filter-log-events \
  --log-group-name /aws/lambda/get-tenant-me \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000

# Ver logs de um tenant específico
aws logs filter-log-events \
  --log-group-name /aws/lambda/get-tenant-me \
  --filter-pattern "550e8400-e29b-41d4-a716-446655440000" \
  --start-time $(date -d '1 hour ago' +%s)000
```

---

### Exemplo 16: Invalidar Cache

```typescript
// No código do Lambda ou via console
import { invalidateCache } from '@/lambda/shared/cache-manager';

// Invalidar cache específico
await invalidateCache('tenants:list:*');

// Invalidar todo o cache
await invalidateCache('*');

// Invalidar cache de um tenant
await invalidateCache(`tenant:${tenantId}:*`);
```

---

## Desenvolvimento

### Exemplo 17: Testar API Localmente

```typescript
// frontend/src/app/test-api/page.tsx
'use client';

import { useState } from 'react';
import { getTenantMe } from '@/lib/api/tenant-client';

export default function TestApiPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      const result = await getTenantMe();
      setData(result);
      console.log('Success:', result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <button onClick={handleTest} disabled={loading}>
        {loading ? 'Testando...' : 'Testar API'}
      </button>
      {data && (
        <pre className="mt-4 p-4 bg-gray-100 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
```

---

### Exemplo 18: Adicionar Novo Tooltip

```typescript
// Em qualquer componente
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function MyComponent() {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Label>Campo Complexo</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>Explicação detalhada do campo complexo.</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
```

---

### Exemplo 19: Executar Testes

```bash
# Testes unitários
npm test

# Testes de integração
npm run test:integration

# Testes E2E
npm run test:e2e

# Testes com cobertura
npm run test:coverage

# Testar arquivo específico
npm test -- authorization-middleware.test.ts
```

---

### Exemplo 20: Deploy Local para Teste

```powershell
# 1. Compilar TypeScript
npm run build

# 2. Sintetizar template CDK
cdk synth OperationalDashboardStack --context env=dev

# 3. Deploy em dev
cdk deploy OperationalDashboardStack --context env=dev

# 4. Validar deployment
.\scripts\validate-cognito-setup.ps1

# 5. Testar APIs
# Use Postman ou curl com exemplos acima
```

---

## 💡 Dicas Práticas

### Dica 1: Salvar Token para Reutilização

```bash
# Salvar token em variável de ambiente
export TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-1_XXXXXXXXX \
  --client-id XXXXXXXXX \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=admin@alquimista.ai,PASSWORD=senha123 \
  | jq -r '.AuthenticationResult.IdToken')

# Usar em múltiplas chamadas
curl -X GET https://api.alquimista.ai/tenant/me \
  -H "Authorization: Bearer $TOKEN"

curl -X GET https://api.alquimista.ai/tenant/agents \
  -H "Authorization: Bearer $TOKEN"
```

---

### Dica 2: Criar Alias para Comandos Comuns

```bash
# Adicionar ao ~/.bashrc ou ~/.zshrc

# Alias para obter token
alias get-token='aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-1_XXXXXXXXX \
  --client-id XXXXXXXXX \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=admin@alquimista.ai,PASSWORD=senha123 \
  | jq -r ".AuthenticationResult.IdToken"'

# Alias para validar setup
alias validate-setup='.\scripts\validate-cognito-setup.ps1'

# Alias para ver logs
alias logs-tenant='aws logs tail /aws/lambda/get-tenant-me --follow'
```

---

### Dica 3: Usar jq para Filtrar Respostas

```bash
# Extrair apenas IDs de tenants
curl -X GET https://api.alquimista.ai/internal/tenants \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.tenants[].id'

# Extrair tenants com MRR > 1000
curl -X GET https://api.alquimista.ai/internal/tenants \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.tenants[] | select(.mrr_estimate > 1000)'

# Contar tenants ativos
curl -X GET https://api.alquimista.ai/internal/tenants \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.tenants[] | select(.status == "active") | .id' \
  | wc -l
```

---

## 📚 Recursos Adicionais

- [README.md](./README.md) - Documentação principal
- [PERMISSIONS-GUIDE.md](./PERMISSIONS-GUIDE.md) - Guia de permissões
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Resolução de problemas
- [API-ENDPOINTS.md](./API-ENDPOINTS.md) - Documentação de APIs
- [OPERATIONAL-COMMANDS.md](./OPERATIONAL-COMMANDS.md) - Comandos operacionais

---

**Última atualização**: Janeiro 2024  
**Versão**: 1.0.0

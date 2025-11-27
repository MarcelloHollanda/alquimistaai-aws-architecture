# Guia de Troubleshooting - Painel Operacional AlquimistaAI

## Visão Geral

Este documento fornece soluções para problemas comuns encontrados no Painel Operacional AlquimistaAI.

---

## Índice

1. [Problemas de Autenticação](#problemas-de-autenticação)
2. [Problemas de Autorização](#problemas-de-autorização)
3. [Problemas de Dados](#problemas-de-dados)
4. [Problemas de Performance](#problemas-de-performance)
5. [Problemas de Comandos Operacionais](#problemas-de-comandos-operacionais)
6. [Problemas de Cache](#problemas-de-cache)
7. [Problemas de Integração](#problemas-de-integração)
8. [Erros Comuns](#erros-comuns)

---

## Problemas de Autenticação

### 🔴 Erro: "Sessão expirada. Faça login novamente"

**Sintomas**:
- Usuário é deslogado automaticamente
- Redirecionamento para página de login
- Token JWT expirado

**Causas**:
- Token JWT expirou (padrão: 1 hora)
- Sessão do Cognito inválida
- Cookies corrompidos

**Soluções**:

1. **Fazer login novamente**:
   - Acessar `/auth/login`
   - Inserir credenciais
   - Sistema gerará novo token

2. **Limpar cookies do navegador**:
   ```javascript
   // Console do navegador
   document.cookie.split(";").forEach(c => {
     document.cookie = c.replace(/^ +/, "")
       .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
   });
   ```

3. **Verificar configuração de sessão**:
   ```typescript
   // frontend/src/lib/cognito-client.ts
   const sessionDuration = 3600; // 1 hora
   ```

4. **Aumentar duração da sessão** (se necessário):
   - Acessar Cognito Console
   - User Pool → App Clients
   - Ajustar "Refresh token expiration"

---

### 🔴 Erro: "Credenciais inválidas"

**Sintomas**:
- Login falha com mensagem de erro
- Usuário não consegue autenticar

**Causas**:
- E-mail ou senha incorretos
- Usuário não existe no Cognito
- Conta desabilitada

**Soluções**:

1. **Verificar credenciais**:
   - Confirmar e-mail está correto
   - Verificar senha (case-sensitive)
   - Tentar recuperação de senha

2. **Verificar se usuário existe**:
   ```bash
   aws cognito-idp admin-get-user \
     --user-pool-id us-east-1_XXXXXXXXX \
     --username usuario@email.com
   ```

3. **Reativar conta desabilitada**:
   ```bash
   aws cognito-idp admin-enable-user \
     --user-pool-id us-east-1_XXXXXXXXX \
     --username usuario@email.com
   ```

4. **Resetar senha**:
   ```bash
   aws cognito-idp admin-set-user-password \
     --user-pool-id us-east-1_XXXXXXXXX \
     --username usuario@email.com \
     --password NovaSenh@123 \
     --permanent
   ```

---

## Problemas de Autorização

### 🔴 Erro 403: "Você não tem permissão para acessar este recurso"

**Sintomas**:
- Erro 403 ao acessar páginas
- Redirecionamento inesperado
- Funcionalidades bloqueadas

**Causas**:
- Usuário não está no grupo correto
- `tenant_id` incorreto ou ausente
- Token JWT não contém claims necessários

**Soluções**:

1. **Verificar grupos do usuário**:
   ```bash
   aws cognito-idp admin-list-groups-for-user \
     --user-pool-id us-east-1_XXXXXXXXX \
     --username usuario@email.com
   ```

2. **Adicionar usuário ao grupo correto**:
   ```bash
   # Para acesso ao painel operacional
   aws cognito-idp admin-add-user-to-group \
     --user-pool-id us-east-1_XXXXXXXXX \
     --username usuario@email.com \
     --group-name INTERNAL_ADMIN
   ```

3. **Verificar tenant_id**:
   ```bash
   aws cognito-idp admin-get-user \
     --user-pool-id us-east-1_XXXXXXXXX \
     --username usuario@email.com \
     | grep tenant_id
   ```

4. **Atualizar tenant_id**:
   ```bash
   aws cognito-idp admin-update-user-attributes \
     --user-pool-id us-east-1_XXXXXXXXX \
     --username usuario@email.com \
     --user-attributes Name=custom:tenant_id,Value=uuid-correto
   ```

5. **Fazer logout e login novamente** para obter novo token

---

### 🔴 Usuário interno não consegue acessar `/app/company`

**Sintomas**:
- Redirecionamento para `/app/dashboard`
- Erro 403 ao acessar painel operacional

**Causas**:
- Usuário não está em grupo interno
- Middleware não reconhece grupos

**Soluções**:

1. **Validar grupos**:
   ```powershell
   .\scripts\validate-cognito-setup.ps1
   ```

2. **Adicionar a grupo interno**:
   ```bash
   aws cognito-idp admin-add-user-to-group \
     --user-pool-id us-east-1_XXXXXXXXX \
     --username usuario@email.com \
     --group-name INTERNAL_ADMIN
   ```

3. **Verificar middleware**:
   ```typescript
   // frontend/middleware.ts
   const groups = token['cognito:groups'] || [];
   const isInternal = groups.includes('INTERNAL_ADMIN') || 
                      groups.includes('INTERNAL_SUPPORT');
   console.log('Groups:', groups);
   console.log('Is Internal:', isInternal);
   ```

---

## Problemas de Dados

### 🔴 Dashboard vazio ou sem dados

**Sintomas**:
- Métricas mostram 0
- Listas vazias
- Gráficos sem dados

**Causas**:
- Tenant não tem dados
- Filtro de `tenant_id` incorreto
- Erro na query do banco

**Soluções**:

1. **Verificar se tenant existe**:
   ```sql
   SELECT * FROM tenants WHERE id = 'uuid-do-tenant';
   ```

2. **Verificar dados do tenant**:
   ```sql
   SELECT COUNT(*) FROM tenant_agents WHERE tenant_id = 'uuid-do-tenant';
   SELECT COUNT(*) FROM tenant_usage_daily WHERE tenant_id = 'uuid-do-tenant';
   ```

3. **Verificar logs do Lambda**:
   ```bash
   aws logs tail /aws/lambda/get-tenant-me --follow
   ```

4. **Executar agregação manual**:
   ```bash
   aws lambda invoke \
     --function-name aggregate-daily-metrics \
     --payload '{}' \
     response.json
   ```

---

### 🔴 Dados de outro tenant aparecem no dashboard

**Sintomas**:
- Usuário vê dados que não pertencem a ele
- Métricas incorretas
- Violação de isolamento de dados

**Causas**:
- `tenant_id` incorreto no token
- Falha na validação de autorização
- Bug no middleware

**Soluções**:

1. **URGENTE: Reportar imediatamente** - Possível violação de segurança

2. **Verificar tenant_id do usuário**:
   ```typescript
   const token = await getToken({ req });
   console.log('Tenant ID:', token['custom:tenant_id']);
   ```

3. **Validar middleware de autorização**:
   ```typescript
   // lambda/shared/authorization-middleware.ts
   export function requireTenantAccess(context: AuthContext, tenantId: string): void {
     if (!context.isInternal && context.tenantId !== tenantId) {
       throw new Error('Forbidden: Tenant access denied');
     }
   }
   ```

4. **Revisar queries do banco**:
   ```sql
   -- Todas as queries devem incluir WHERE tenant_id = $1
   SELECT * FROM tenant_agents WHERE tenant_id = $1;
   ```

5. **Fazer logout e login novamente**

---

## Problemas de Performance

### 🔴 Dashboard lento (> 2 segundos)

**Sintomas**:
- Carregamento demorado
- Timeout em requisições
- Experiência ruim do usuário

**Causas**:
- Cache não está funcionando
- Queries não otimizadas
- Volume alto de dados

**Soluções**:

1. **Verificar status do Redis**:
   ```bash
   aws elasticache describe-cache-clusters \
     --cache-cluster-id operational-dashboard-cache
   ```

2. **Verificar logs de cache**:
   ```typescript
   // Procurar por "Cache miss" nos logs
   aws logs tail /aws/lambda/get-tenant-me --follow | grep "Cache"
   ```

3. **Invalidar cache manualmente**:
   ```typescript
   import { invalidateCache } from '@/lib/cache-manager';
   await invalidateCache('tenants:list:*');
   ```

4. **Verificar índices do banco**:
   ```sql
   -- Verificar índices existentes
   SELECT * FROM pg_indexes WHERE tablename = 'tenant_usage_daily';
   
   -- Criar índice se necessário
   CREATE INDEX IF NOT EXISTS idx_tenant_usage_daily_tenant_date 
   ON tenant_usage_daily(tenant_id, date DESC);
   ```

5. **Analisar query plan**:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM tenant_usage_daily 
   WHERE tenant_id = 'uuid' 
   ORDER BY date DESC 
   LIMIT 30;
   ```

---

### 🔴 Timeout em requisições

**Sintomas**:
- Erro 504 Gateway Timeout
- Requisições não completam
- Lambda timeout

**Causas**:
- Query muito pesada
- Timeout do Lambda muito baixo
- Conexão com banco lenta

**Soluções**:

1. **Aumentar timeout do Lambda**:
   ```typescript
   // lib/operational-dashboard-stack.ts
   const lambda = new lambda.Function(this, 'Handler', {
     timeout: cdk.Duration.seconds(30), // Aumentar de 10 para 30
   });
   ```

2. **Otimizar query**:
   ```sql
   -- Usar agregação pré-calculada
   SELECT * FROM tenant_usage_daily 
   WHERE tenant_id = $1 AND date >= CURRENT_DATE - INTERVAL '30 days';
   ```

3. **Implementar paginação**:
   ```typescript
   const limit = 50;
   const offset = page * limit;
   const results = await query(
     'SELECT * FROM tenants LIMIT $1 OFFSET $2',
     [limit, offset]
   );
   ```

4. **Verificar connection pool**:
   ```typescript
   // lambda/shared/database.ts
   const pool = new Pool({
     max: 10, // Aumentar se necessário
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

---

## Problemas de Comandos Operacionais

### 🔴 Comando não executa

**Sintomas**:
- Status permanece em `PENDING`
- Comando não processa
- Sem logs de execução

**Causas**:
- DynamoDB Streams não configurado
- Lambda de processamento com erro
- Permissões insuficientes

**Soluções**:

1. **Verificar DynamoDB Streams**:
   ```bash
   aws dynamodb describe-table \
     --table-name operational_commands \
     | grep StreamEnabled
   ```

2. **Habilitar Streams se necessário**:
   ```bash
   aws dynamodb update-table \
     --table-name operational_commands \
     --stream-specification StreamEnabled=true,StreamViewType=NEW_IMAGE
   ```

3. **Verificar Lambda de processamento**:
   ```bash
   aws lambda get-function \
     --function-name process-operational-command
   ```

4. **Verificar logs do Lambda**:
   ```bash
   aws logs tail /aws/lambda/process-operational-command --follow
   ```

5. **Reprocessar comando manualmente**:
   ```bash
   aws lambda invoke \
     --function-name process-operational-command \
     --payload '{"command_id": "uuid-do-comando"}' \
     response.json
   ```

---

### 🔴 Comando falha com erro

**Sintomas**:
- Status muda para `ERROR`
- Mensagem de erro no campo `error_message`
- Comando não completa

**Causas**:
- Parâmetros inválidos
- Recurso não encontrado
- Erro de permissão

**Soluções**:

1. **Verificar mensagem de erro**:
   ```sql
   SELECT error_message FROM operational_commands 
   WHERE command_id = 'uuid';
   ```

2. **Validar parâmetros**:
   ```typescript
   // Exemplo de parâmetros corretos
   {
     "command_type": "RESTART_AGENT",
     "parameters": {
       "tenant_id": "uuid-valido",
       "agent_id": "uuid-valido"
     }
   }
   ```

3. **Verificar se recurso existe**:
   ```sql
   SELECT * FROM tenant_agents 
   WHERE tenant_id = 'uuid' AND agent_id = 'uuid';
   ```

4. **Verificar permissões do Lambda**:
   ```bash
   aws iam get-role-policy \
     --role-name process-operational-command-role \
     --policy-name default-policy
   ```

5. **Tentar novamente com parâmetros corretos**

---

## Problemas de Cache

### 🔴 Dados desatualizados no dashboard

**Sintomas**:
- Mudanças não aparecem imediatamente
- Dados antigos são exibidos
- Cache não invalida

**Causas**:
- TTL do cache muito alto
- Invalidação não está funcionando
- Redis com problema

**Soluções**:

1. **Invalidar cache manualmente**:
   ```typescript
   import { invalidateCache } from '@/lib/cache-manager';
   
   // Invalidar cache específico
   await invalidateCache('tenants:list:*');
   
   // Invalidar todo o cache
   await invalidateCache('*');
   ```

2. **Verificar TTL do cache**:
   ```typescript
   // lambda/shared/cache-manager.ts
   const TTL = {
     tenants: 300,      // 5 min
     usage: 600,        // 10 min
     billing: 900,      // 15 min
   };
   ```

3. **Reduzir TTL se necessário**:
   ```typescript
   await setCache(key, data, 60); // 1 minuto
   ```

4. **Verificar conexão com Redis**:
   ```bash
   aws elasticache describe-cache-clusters \
     --cache-cluster-id operational-dashboard-cache \
     --show-cache-node-info
   ```

5. **Forçar refresh no frontend**:
   - Ctrl + Shift + R (hard refresh)
   - Ou adicionar query param: `?refresh=true`

---

## Problemas de Integração

### 🔴 Integração aparece como "error"

**Sintomas**:
- Status da integração: `error`
- Campo `last_error` preenchido
- Sincronização não funciona

**Causas**:
- Credenciais inválidas
- API externa indisponível
- Timeout na conexão

**Soluções**:

1. **Verificar mensagem de erro**:
   ```sql
   SELECT last_error FROM tenant_integrations 
   WHERE id = 'uuid';
   ```

2. **Testar credenciais**:
   ```bash
   # Buscar credenciais no Secrets Manager
   aws secretsmanager get-secret-value \
     --secret-id /alquimista/prod/integrations/uuid
   ```

3. **Reconectar integração**:
   - Acessar `/app/dashboard/integrations`
   - Clicar em "Reconectar"
   - Inserir novas credenciais

4. **Verificar logs de integração**:
   ```bash
   aws logs tail /aws/lambda/sync-integration --follow
   ```

5. **Testar API externa manualmente**:
   ```bash
   curl -X GET https://api-externa.com/health \
     -H "Authorization: Bearer token"
   ```

---

## Erros Comuns

### Erro: "Cannot read property 'tenant_id' of undefined"

**Causa**: Token JWT não contém `custom:tenant_id`

**Solução**:
```bash
aws cognito-idp admin-update-user-attributes \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username usuario@email.com \
  --user-attributes Name=custom:tenant_id,Value=uuid-do-tenant
```

---

### Erro: "Connection pool exhausted"

**Causa**: Muitas conexões simultâneas ao banco

**Solução**:
```typescript
// lambda/shared/database.ts
const pool = new Pool({
  max: 20, // Aumentar pool
  idleTimeoutMillis: 30000,
});
```

---

### Erro: "Rate limit exceeded"

**Causa**: Muitas requisições em curto período

**Solução**:
- Aguardar alguns minutos
- Implementar retry com backoff exponencial
- Aumentar limite no API Gateway

---

### Erro: "DynamoDB ProvisionedThroughputExceededException"

**Causa**: Capacidade do DynamoDB excedida

**Solução**:
```bash
# Aumentar capacidade
aws dynamodb update-table \
  --table-name operational_commands \
  --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10
```

---

## Ferramentas de Diagnóstico

### Script de Validação Completa

```powershell
# Validar todo o sistema
.\scripts\validate-cognito-setup.ps1
```

### Verificar Logs em Tempo Real

```bash
# Logs do Lambda
aws logs tail /aws/lambda/get-tenant-me --follow

# Logs do API Gateway
aws logs tail /aws/apigateway/operational-dashboard --follow
```

### Verificar Métricas no CloudWatch

```bash
# Abrir dashboard
aws cloudwatch get-dashboard \
  --dashboard-name OperationalDashboard
```

### Testar APIs Manualmente

```bash
# Obter token
TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-1_XXXXXXXXX \
  --client-id XXXXXXXXX \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=user@email.com,PASSWORD=senha \
  | jq -r '.AuthenticationResult.IdToken')

# Testar API
curl -X GET https://api.alquimista.ai/tenant/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Quando Escalar para Suporte

Escale para a equipe de suporte se:

- ❌ Violação de segurança (dados de outro tenant)
- ❌ Perda de dados
- ❌ Sistema completamente indisponível
- ❌ Erro não documentado neste guia
- ❌ Problema persiste após todas as soluções tentadas

**Contato**:
- E-mail: alquimistafibonacci@gmail.com
- WhatsApp: +55 84 99708-4444

---

## Checklist de Diagnóstico

Antes de reportar um problema, verifique:

- [ ] Fez logout e login novamente
- [ ] Limpou cache do navegador
- [ ] Verificou grupos do usuário no Cognito
- [ ] Verificou logs do Lambda
- [ ] Testou em navegador diferente
- [ ] Verificou se problema é reproduzível
- [ ] Coletou mensagens de erro completas
- [ ] Verificou status dos serviços AWS

---

**Última atualização**: Janeiro 2024  
**Versão**: 1.0.0

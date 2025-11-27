# Resumo da Configuração de Rotas do API Gateway - Painel Operacional

## Status da Implementação

✅ **COMPLETO** - Todas as rotas foram configuradas no API Gateway HTTP

**Data de Conclusão**: Janeiro 2025  
**Stack CDK**: `lib/operational-dashboard-stack.ts`

---

## Visão Geral

O Painel Operacional AlquimistaAI possui **12 rotas** configuradas no API Gateway HTTP, divididas em dois grupos principais:

- **5 rotas de cliente** (`/tenant/*`) - Acessíveis por clientes e equipe interna
- **7 rotas internas** (`/internal/*`) - Acessíveis apenas pela equipe interna

---

## Configuração Implementada

### 1. Autenticação e Autorização

✅ **Cognito Authorizer Configurado**
- Todas as rotas requerem token JWT do Amazon Cognito
- Header: `Authorization: Bearer {token}`
- Validação automática pelo API Gateway
- Grupos extraídos do token: `cognito:groups`

### 2. CORS

✅ **CORS Configurado Automaticamente**
- O API Gateway HTTP configura CORS automaticamente
- Permite todos os métodos necessários: GET, POST, OPTIONS
- Headers permitidos: `Content-Type`, `Authorization`

### 3. Throttling

✅ **Throttling Padrão Aplicado**
- **Rate**: 10.000 requisições por segundo
- **Burst**: 5.000 requisições simultâneas
- Aplicado a todas as rotas automaticamente

**Nota**: Para throttling customizado por rota, seria necessário:
- Usar API Gateway REST API (não HTTP API)
- Ou implementar rate limiting no nível da Lambda
- Ou configurar via AWS Console/CLI

---

## Rotas Configuradas

### Rotas de Cliente (/tenant/*)

| Método | Rota | Lambda | Descrição |
|--------|------|--------|-----------|
| GET | `/tenant/me` | `get-tenant-me` | Informações da empresa |
| GET | `/tenant/agents` | `get-tenant-agents` | Agentes contratados |
| GET | `/tenant/integrations` | `get-tenant-integrations` | Integrações configuradas |
| GET | `/tenant/usage` | `get-tenant-usage` | Métricas de uso |
| GET | `/tenant/incidents` | `get-tenant-incidents` | Histórico de incidentes |

**Autorização**: TENANT_ADMIN, TENANT_USER, INTERNAL_ADMIN, INTERNAL_SUPPORT

### Rotas Internas (/internal/*)

| Método | Rota | Lambda | Descrição |
|--------|------|--------|-----------|
| GET | `/internal/tenants` | `list-tenants` | Lista todos os tenants |
| GET | `/internal/tenants/{id}` | `get-tenant-detail` | Detalhes de um tenant |
| GET | `/internal/tenants/{id}/agents` | `get-tenant-agents-internal` | Agentes do tenant |
| GET | `/internal/usage/overview` | `get-usage-overview` | Visão global de uso |
| GET | `/internal/billing/overview` | `get-billing-overview` | Visão financeira |
| POST | `/internal/operations/commands` | `create-operational-command` | Criar comando |
| GET | `/internal/operations/commands` | `list-operational-commands` | Listar comandos |

**Autorização**: INTERNAL_ADMIN, INTERNAL_SUPPORT (exceto billing que requer INTERNAL_ADMIN)

---

## Integrações Lambda

Todas as rotas utilizam **HTTP Lambda Integration** com:
- **Payload Format Version**: 2.0
- **Timeout**: 10-30 segundos (dependendo da rota)
- **Memory**: 512 MB
- **Runtime**: Node.js 20
- **Tracing**: AWS X-Ray ativo

### Lambdas com VPC (para acesso ao Redis)

As seguintes Lambdas estão dentro da VPC para acessar o ElastiCache Redis:

- `get-tenant-me`
- `get-tenant-agents`
- `get-tenant-integrations`
- `get-tenant-usage`
- `get-tenant-incidents`
- `list-tenants`
- `get-usage-overview`
- `get-billing-overview`

**Security Group**: Permite acesso ao Redis na porta 6379

---

## Estrutura no CDK

### Código de Configuração

```typescript
// Exemplo de configuração de rota
platformApi.addRoutes({
  path: '/tenant/me',
  methods: [apigatewayv2.HttpMethod.GET],
  integration: getTenantMeIntegration,
  authorizer: cognitoAuthorizer,
});
```

### Localização no Código

**Arquivo**: `lib/operational-dashboard-stack.ts`

**Linhas**:
- Rotas `/tenant/*`: Linhas 700-750
- Rotas `/internal/*`: Linhas 750-820

---

## Validação de Permissões

### Middleware de Autorização

Todas as Lambdas utilizam o middleware `authorization-middleware.ts` que:

1. **Extrai contexto do token JWT**:
   ```typescript
   {
     sub: string;
     email: string;
     tenantId?: string;
     groups: string[];
     isInternal: boolean;
   }
   ```

2. **Valida permissões**:
   - `requireInternal()` - Para rotas `/internal/*`
   - `requireTenantAccess(tenantId)` - Para rotas `/tenant/*`

3. **Retorna erro 403** se não autorizado

### Exemplo de Uso

```typescript
export async function handler(event: APIGatewayProxyEvent) {
  const context = extractAuthContext(event);
  requireInternal(context); // Valida acesso interno
  
  // Lógica da Lambda...
}
```

---

## Monitoramento e Observabilidade

### CloudWatch Logs

Cada Lambda gera logs estruturados com:
- Request ID
- User ID (Cognito sub)
- Tenant ID (quando aplicável)
- Tempo de execução
- Erros e exceções

### X-Ray Tracing

Todas as rotas têm tracing ativo para análise de:
- Latência end-to-end
- Gargalos de performance
- Erros e exceções
- Chamadas a serviços externos (Aurora, Redis, DynamoDB)

### CloudWatch Metrics

Métricas automáticas do API Gateway:
- Contagem de requisições
- Latência (p50, p90, p99)
- Taxa de erro (4xx, 5xx)
- Throttling

---

## Testes e Validação

### Testes Implementados

✅ **Testes Unitários**
- Middleware de autorização
- Handlers de Lambda
- Validação de permissões

✅ **Testes de Integração**
- Fluxos completos de APIs
- Integração com Aurora
- Integração com DynamoDB

✅ **Testes E2E**
- Fluxo de login e redirecionamento
- Navegação no dashboard
- Criação de comandos operacionais

### Scripts de Validação

```powershell
# Validar configuração do Cognito
.\scripts\validate-cognito-setup.ps1

# Validar deploy do operational dashboard
.\scripts\validate-operational-dashboard-dev.ps1

# Smoke tests em produção
.\scripts\smoke-tests-operational-dashboard-prod.ps1
```

---

## Segurança

### Camadas de Segurança Implementadas

1. **Autenticação**: JWT do Cognito obrigatório
2. **Autorização**: Validação de grupos em middleware
3. **HTTPS Only**: Todas as comunicações criptografadas
4. **Rate Limiting**: Proteção contra abuso (10k req/s)
5. **Input Validation**: Validação de parâmetros em cada Lambda
6. **SQL Injection Protection**: Uso de prepared statements
7. **Audit Log**: Registro de todas as ações operacionais

### Isolamento de Dados

- Validação de `tenant_id` em todas as queries
- Usuários clientes nunca acessam dados de outros clientes
- Usuários internos têm acesso controlado por grupo

---

## Performance

### Otimizações Implementadas

1. **Cache Redis**: Dados frequentes com TTL de 5-15 minutos
2. **Agregação em Background**: Métricas agregadas diariamente
3. **Paginação**: Listas com mais de 50 itens
4. **Índices de Banco**: Em todas as colunas filtradas
5. **Connection Pooling**: Reutilização de conexões Aurora

### Tempos de Resposta Esperados

- Rotas simples (GET /tenant/me): < 500ms
- Rotas com agregação (GET /tenant/usage): < 2s
- Rotas complexas (GET /internal/usage/overview): < 3s

---

## Próximos Passos

### Melhorias Futuras

1. **Rate Limiting Customizado**
   - Implementar rate limiting por tenant
   - Diferentes limites por plano (Starter, Professional, Enterprise)

2. **Webhooks**
   - Notificações de eventos importantes
   - Integração com sistemas externos

3. **GraphQL**
   - Alternativa ao REST para queries complexas
   - Redução de over-fetching

4. **Paginação Cursor-Based**
   - Melhor performance para grandes datasets
   - Substituir offset-based pagination

5. **API Versioning**
   - Suporte a múltiplas versões da API
   - Migração gradual de clientes

---

## Documentação Relacionada

- [Referência Completa de Rotas](./API-ROUTES-REFERENCE.md)
- [Guia de Permissões](./PERMISSIONS-GUIDE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Exemplos de Uso](./API-QUICK-REFERENCE.md)

---

## Suporte

Para dúvidas ou problemas:

1. Consulte a [documentação completa](./README.md)
2. Verifique os [logs no CloudWatch](https://console.aws.amazon.com/cloudwatch)
3. Analise traces no [X-Ray](https://console.aws.amazon.com/xray)
4. Entre em contato com a equipe de desenvolvimento

---

**Última Atualização**: Janeiro 2025  
**Versão**: 1.0.0  
**Status**: ✅ Produção

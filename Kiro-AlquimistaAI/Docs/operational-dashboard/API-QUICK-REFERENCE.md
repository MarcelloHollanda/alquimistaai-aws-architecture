# Referência Rápida - APIs do Painel Operacional

## Configuração Rápida

### Base URL
```
https://{api-id}.execute-api.us-east-1.amazonaws.com
```

### Headers Obrigatórios
```
Authorization: Bearer {cognito-jwt-token}
Content-Type: application/json
```

---

## APIs do Cliente (/tenant/*)

| Método | Endpoint | Descrição | Autorização |
|--------|----------|-----------|-------------|
| GET | `/tenant/me` | Dados da empresa | TENANT_*, INTERNAL_* |
| GET | `/tenant/agents` | Agentes contratados | TENANT_*, INTERNAL_* |
| GET | `/tenant/integrations` | Integrações ativas | TENANT_ADMIN, INTERNAL_* |
| GET | `/tenant/usage` | Métricas de uso | TENANT_*, INTERNAL_* |
| GET | `/tenant/incidents` | Histórico de incidentes | TENANT_*, INTERNAL_* |

---

## APIs Internas (/internal/*)

| Método | Endpoint | Descrição | Autorização |
|--------|----------|-----------|-------------|
| GET | `/internal/tenants` | Lista todos os tenants | INTERNAL_* |
| GET | `/internal/tenants/{id}` | Detalhes do tenant | INTERNAL_* |
| GET | `/internal/tenants/{id}/agents` | Agentes do tenant | INTERNAL_* |
| GET | `/internal/usage/overview` | Visão global de uso | INTERNAL_* |
| GET | `/internal/billing/overview` | Visão financeira | INTERNAL_ADMIN |
| POST | `/internal/operations/commands` | Criar comando | INTERNAL_* |
| GET | `/internal/operations/commands` | Listar comandos | INTERNAL_* |

---

## Exemplos de Uso

### Obter Dados do Tenant

```bash
curl -X GET \
  https://{api-id}.execute-api.us-east-1.amazonaws.com/tenant/me \
  -H 'Authorization: Bearer {token}'
```

### Listar Agentes do Tenant

```bash
curl -X GET \
  'https://{api-id}.execute-api.us-east-1.amazonaws.com/tenant/agents?status=active' \
  -H 'Authorization: Bearer {token}'
```

### Obter Métricas de Uso

```bash
curl -X GET \
  'https://{api-id}.execute-api.us-east-1.amazonaws.com/tenant/usage?period=30d' \
  -H 'Authorization: Bearer {token}'
```

### Listar Todos os Tenants (Interno)

```bash
curl -X GET \
  'https://{api-id}.execute-api.us-east-1.amazonaws.com/internal/tenants?status=active&limit=50' \
  -H 'Authorization: Bearer {token}'
```

### Criar Comando Operacional (Interno)

```bash
curl -X POST \
  https://{api-id}.execute-api.us-east-1.amazonaws.com/internal/operations/commands \
  -H 'Authorization: Bearer {token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "command_type": "HEALTH_CHECK",
    "tenant_id": "uuid-do-tenant",
    "parameters": {
      "check_type": "full"
    }
  }'
```

---

## Query Parameters Comuns

### Paginação
- `limit`: Número de itens (default: 50)
- `offset`: Offset para paginação (default: 0)

### Filtros
- `status`: Status do recurso
- `period`: Período de tempo (`7d`, `30d`, `90d`)
- `search`: Busca por texto

### Ordenação
- `sort_by`: Campo para ordenar
- `sort_order`: `asc` ou `desc`

---

## Códigos de Status

| Código | Significado |
|--------|-------------|
| 200 | Sucesso |
| 400 | Parâmetros inválidos |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 429 | Rate limit excedido |
| 500 | Erro no servidor |

---

## Grupos de Autorização

| Grupo | Acesso |
|-------|--------|
| `INTERNAL_ADMIN` | Todas as rotas |
| `INTERNAL_SUPPORT` | Todas exceto `/internal/billing/overview` |
| `TENANT_ADMIN` | Todas as rotas `/tenant/*` |
| `TENANT_USER` | Rotas `/tenant/*` (exceto `/tenant/integrations`) |

---

## CORS

Todas as rotas suportam CORS com:
- **Origins**: `*`
- **Methods**: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- **Headers**: `Content-Type`, `Authorization`

---

## Rate Limiting

- **Rate**: 10.000 req/s
- **Burst**: 5.000 req

---

## Monitoramento

- **Logs**: CloudWatch Logs
- **Tracing**: AWS X-Ray
- **Métricas**: CloudWatch Metrics

---

## Links Úteis

- [Documentação Completa](./API-ROUTES-REFERENCE.md)
- [Guia de Setup](./SETUP-GUIDE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

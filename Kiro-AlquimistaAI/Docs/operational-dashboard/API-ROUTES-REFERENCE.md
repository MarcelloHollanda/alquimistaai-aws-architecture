# Referência de Rotas da API - Painel Operacional

## Visão Geral

Este documento descreve todas as rotas configuradas no API Gateway para o Painel Operacional AlquimistaAI.

**Base URL**: `https://{api-id}.execute-api.us-east-1.amazonaws.com`

**Autenticação**: Todas as rotas requerem token JWT do Amazon Cognito no header `Authorization: Bearer {token}`

---

## Configuração de CORS

Todas as rotas estão configuradas com CORS:

- **Allow Origins**: `*` (todos os domínios)
- **Allow Methods**: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- **Allow Headers**: `Content-Type`, `Authorization`
- **Max Age**: 1 dia

---

## Rotas do Cliente (/tenant/*)

Estas rotas são acessíveis por usuários clientes (TENANT_ADMIN, TENANT_USER) e usuários internos (INTERNAL_ADMIN, INTERNAL_SUPPORT).

### GET /tenant/me

Retorna informações da empresa do tenant autenticado.

**Autorização**: TENANT_ADMIN, TENANT_USER, INTERNAL_ADMIN, INTERNAL_SUPPORT

**Query Parameters**: Nenhum

**Response**:
```json
{
  "id": "uuid",
  "name": "Nome da Empresa",
  "cnpj": "12.345.678/0001-90",
  "segment": "Saúde",
  "plan": "Professional",
  "status": "active",
  "mrr_estimate": 299.90,
  "created_at": "2024-01-15T10:00:00Z",
  "limits": {
    "max_agents": 10,
    "max_users": 5,
    "max_requests_per_month": 100000
  },
  "usage": {
    "active_agents": 8,
    "active_users": 3,
    "requests_this_month": 45230
  }
}
```

**Throttling**: Padrão (10000 req/s, burst 5000)

---

### GET /tenant/agents

Retorna agentes contratados pelo tenant.

**Autorização**: TENANT_ADMIN, TENANT_USER, INTERNAL_ADMIN, INTERNAL_SUPPORT

**Query Parameters**:
- `status` (opcional): `active` | `inactive` | `all` (default: `active`)

**Response**:
```json
{
  "agents": [
    {
      "id": "uuid",
      "name": "Agente SDR",
      "segment": "Vendas",
      "status": "active",
      "activated_at": "2024-01-15T10:00:00Z",
      "usage_last_30_days": {
        "total_requests": 12450,
        "success_rate": 98.5,
        "avg_response_time_ms": 245
      }
    }
  ]
}
```

**Throttling**: Padrão (10000 req/s, burst 5000)

---

### GET /tenant/integrations

Retorna integrações configuradas pelo tenant.

**Autorização**: TENANT_ADMIN, INTERNAL_ADMIN, INTERNAL_SUPPORT

**Query Parameters**: Nenhum

**Response**:
```json
{
  "integrations": [
    {
      "id": "uuid",
      "type": "whatsapp",
      "name": "WhatsApp Business",
      "status": "active",
      "last_sync_at": "2024-01-20T15:30:00Z",
      "last_error": null
    }
  ]
}
```

**Throttling**: Padrão (10000 req/s, burst 5000)

---

### GET /tenant/usage

Retorna métricas de uso do tenant.

**Autorização**: TENANT_ADMIN, TENANT_USER, INTERNAL_ADMIN, INTERNAL_SUPPORT

**Query Parameters**:
- `period` (opcional): `7d` | `30d` | `90d` (default: `30d`)
- `agent_id` (opcional): UUID do agente para filtrar

**Response**:
```json
{
  "period": "30d",
  "summary": {
    "total_requests": 45230,
    "successful_requests": 44560,
    "failed_requests": 670,
    "success_rate": 98.5,
    "avg_response_time_ms": 245
  },
  "daily_data": [
    {
      "date": "2024-01-20",
      "total_requests": 1520,
      "successful_requests": 1498,
      "failed_requests": 22,
      "avg_response_time_ms": 240
    }
  ],
  "by_agent": [
    {
      "agent_id": "uuid",
      "agent_name": "Agente SDR",
      "total_requests": 12450,
      "success_rate": 99.1
    }
  ]
}
```

**Throttling**: Padrão (10000 req/s, burst 5000)

---

### GET /tenant/incidents

Retorna incidentes que afetaram o tenant.

**Autorização**: TENANT_ADMIN, TENANT_USER, INTERNAL_ADMIN, INTERNAL_SUPPORT

**Query Parameters**:
- `limit` (opcional): número (default: 20)
- `offset` (opcional): número (default: 0)

**Response**:
```json
{
  "incidents": [
    {
      "id": "uuid",
      "severity": "warning",
      "title": "Alta latência detectada",
      "description": "Tempo de resposta acima do normal",
      "created_at": "2024-01-20T10:00:00Z",
      "resolved_at": "2024-01-20T10:30:00Z"
    }
  ],
  "total": 5
}
```

**Throttling**: Padrão (10000 req/s, burst 5000)

---

## Rotas Internas (/internal/*)

Estas rotas são acessíveis apenas por usuários internos (INTERNAL_ADMIN, INTERNAL_SUPPORT).

### GET /internal/tenants

Lista todos os tenants com filtros.

**Autorização**: INTERNAL_ADMIN, INTERNAL_SUPPORT

**Query Parameters**:
- `status` (opcional): `active` | `inactive` | `suspended` | `all` (default: `active`)
- `plan` (opcional): string
- `segment` (opcional): string
- `search` (opcional): string (busca por nome ou CNPJ)
- `limit` (opcional): número (default: 50)
- `offset` (opcional): número (default: 0)
- `sort_by` (opcional): `name` | `created_at` | `mrr_estimate` (default: `name`)
- `sort_order` (opcional): `asc` | `desc` (default: `asc`)

**Response**:
```json
{
  "tenants": [
    {
      "id": "uuid",
      "name": "Empresa XYZ",
      "cnpj": "12.345.678/0001-90",
      "segment": "Saúde",
      "plan": "Professional",
      "status": "active",
      "mrr_estimate": 299.90,
      "active_agents": 8,
      "active_users": 3,
      "requests_last_30_days": 45230,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 47,
  "limit": 50,
  "offset": 0
}
```

**Throttling**: Padrão (10000 req/s, burst 5000)

---

### GET /internal/tenants/{id}

Retorna detalhes completos de um tenant específico.

**Autorização**: INTERNAL_ADMIN, INTERNAL_SUPPORT

**Path Parameters**:
- `id`: UUID do tenant

**Response**:
```json
{
  "tenant": {
    "id": "uuid",
    "name": "Empresa XYZ",
    "cnpj": "12.345.678/0001-90",
    "segment": "Saúde",
    "plan": "Professional",
    "status": "active",
    "mrr_estimate": 299.90,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-20T15:00:00Z"
  },
  "users": [
    {
      "id": "uuid",
      "email": "usuario@empresa.com",
      "full_name": "João Silva",
      "role": "ADMIN",
      "last_login_at": "2024-01-20T09:00:00Z"
    }
  ],
  "agents": [
    {
      "id": "uuid",
      "name": "Agente SDR",
      "status": "active",
      "activated_at": "2024-01-15T10:00:00Z",
      "usage_last_30_days": {
        "total_requests": 12450,
        "success_rate": 99.1
      }
    }
  ],
  "integrations": [
    {
      "id": "uuid",
      "type": "whatsapp",
      "name": "WhatsApp Business",
      "status": "active",
      "last_sync_at": "2024-01-20T15:30:00Z"
    }
  ],
  "usage_summary": {
    "requests_last_7_days": 10560,
    "requests_last_30_days": 45230,
    "success_rate_last_30_days": 98.5
  },
  "recent_incidents": [
    {
      "id": "uuid",
      "severity": "warning",
      "title": "Alta latência detectada",
      "created_at": "2024-01-20T10:00:00Z"
    }
  ]
}
```

**Throttling**: Padrão (10000 req/s, burst 5000)

---

### GET /internal/tenants/{id}/agents

Retorna agentes do tenant com opções de gerenciamento.

**Autorização**: INTERNAL_ADMIN, INTERNAL_SUPPORT

**Path Parameters**:
- `id`: UUID do tenant

**Response**:
```json
{
  "agents": [
    {
      "id": "uuid",
      "name": "Agente SDR",
      "status": "active",
      "config": {
        "custom_prompt": "...",
        "temperature": 0.7
      },
      "activated_at": "2024-01-15T10:00:00Z",
      "deactivated_at": null,
      "usage_stats": {
        "total_requests": 12450,
        "success_rate": 99.1,
        "avg_response_time_ms": 245,
        "last_request_at": "2024-01-20T15:45:00Z"
      }
    }
  ]
}
```

**Throttling**: Padrão (10000 req/s, burst 5000)

---

### GET /internal/usage/overview

Retorna visão global de uso da plataforma.

**Autorização**: INTERNAL_ADMIN, INTERNAL_SUPPORT

**Query Parameters**:
- `period` (opcional): `7d` | `30d` | `90d` (default: `30d`)

**Response**:
```json
{
  "period": "30d",
  "global_stats": {
    "total_tenants": 47,
    "active_tenants": 45,
    "total_agents_deployed": 312,
    "total_requests": 2145230,
    "global_success_rate": 98.8,
    "avg_response_time_ms": 250
  },
  "top_tenants_by_usage": [
    {
      "tenant_id": "uuid",
      "tenant_name": "Empresa XYZ",
      "total_requests": 145230,
      "success_rate": 99.2
    }
  ],
  "top_agents_by_usage": [
    {
      "agent_id": "uuid",
      "agent_name": "Agente SDR",
      "total_requests": 456780,
      "deployed_count": 35
    }
  ],
  "daily_trends": [
    {
      "date": "2024-01-20",
      "total_requests": 72450,
      "success_rate": 98.9,
      "active_tenants": 45
    }
  ]
}
```

**Throttling**: Padrão (10000 req/s, burst 5000)

---

### GET /internal/billing/overview

Retorna visão financeira global.

**Autorização**: INTERNAL_ADMIN

**Query Parameters**:
- `period` (opcional): `7d` | `30d` | `90d` (default: `30d`)

**Response**:
```json
{
  "period": "30d",
  "financial_summary": {
    "total_mrr": 142500.00,
    "total_arr": 1710000.00,
    "avg_mrr_per_tenant": 3031.91,
    "new_mrr_this_period": 8200.00,
    "churned_mrr_this_period": 1500.00
  },
  "by_plan": [
    {
      "plan_name": "Professional",
      "tenant_count": 35,
      "total_mrr": 104650.00
    }
  ],
  "by_segment": [
    {
      "segment": "Saúde",
      "tenant_count": 15,
      "total_mrr": 45000.00
    }
  ],
  "revenue_trend": [
    {
      "date": "2024-01-20",
      "mrr": 142500.00,
      "new_tenants": 2,
      "churned_tenants": 0
    }
  ]
}
```

**Throttling**: Padrão (10000 req/s, burst 5000)

---

### POST /internal/operations/commands

Cria um novo comando operacional.

**Autorização**: INTERNAL_ADMIN, INTERNAL_SUPPORT

**Request Body**:
```json
{
  "command_type": "REPROCESS_QUEUE" | "RESET_TOKEN" | "RESTART_AGENT" | "HEALTH_CHECK",
  "tenant_id": "uuid (opcional)",
  "parameters": {
    "key": "value"
  }
}
```

**Response**:
```json
{
  "command_id": "uuid",
  "status": "PENDING",
  "created_at": "2024-01-20T16:00:00Z",
  "message": "Comando criado com sucesso. Processamento iniciado."
}
```

**Throttling**: Padrão (10000 req/s, burst 5000)

---

### GET /internal/operations/commands

Lista comandos operacionais executados.

**Autorização**: INTERNAL_ADMIN, INTERNAL_SUPPORT

**Query Parameters**:
- `status` (opcional): `PENDING` | `RUNNING` | `SUCCESS` | `ERROR` | `all` (default: `all`)
- `command_type` (opcional): string
- `tenant_id` (opcional): UUID
- `limit` (opcional): número (default: 50)
- `offset` (opcional): número (default: 0)

**Response**:
```json
{
  "commands": [
    {
      "command_id": "uuid",
      "command_type": "HEALTH_CHECK",
      "status": "SUCCESS",
      "tenant_id": "uuid",
      "tenant_name": "Empresa XYZ",
      "created_by": "cognito-sub",
      "created_at": "2024-01-20T16:00:00Z",
      "started_at": "2024-01-20T16:00:05Z",
      "completed_at": "2024-01-20T16:00:15Z",
      "output": "Health check completed successfully",
      "error_message": null
    }
  ],
  "total": 125
}
```

**Throttling**: Padrão (10000 req/s, burst 5000)

---

## Códigos de Status HTTP

- **200 OK**: Requisição bem-sucedida
- **400 Bad Request**: Parâmetros inválidos
- **401 Unauthorized**: Token JWT ausente ou inválido
- **403 Forbidden**: Usuário não tem permissão para acessar o recurso
- **404 Not Found**: Recurso não encontrado
- **429 Too Many Requests**: Rate limit excedido
- **500 Internal Server Error**: Erro no servidor

---

## Tratamento de Erros

Todas as rotas retornam erros no seguinte formato:

```json
{
  "error": "Mensagem de erro descritiva",
  "code": "ERROR_CODE",
  "details": {
    "field": "Informação adicional"
  }
}
```

---

## Rate Limiting

**Configuração Padrão do API Gateway HTTP**:
- **Rate**: 10.000 requisições por segundo
- **Burst**: 5.000 requisições

Para configurações customizadas por rota ou por tenant, é necessário implementar rate limiting adicional no nível da Lambda ou usar API Gateway REST API.

---

## Monitoramento

Todas as rotas são monitoradas via:
- **CloudWatch Logs**: Logs estruturados de cada requisição
- **X-Ray**: Tracing distribuído para análise de performance
- **CloudWatch Metrics**: Métricas de latência, erros e throughput

---

## Segurança

1. **Autenticação**: JWT do Amazon Cognito obrigatório
2. **Autorização**: Validação de grupos em middleware Lambda
3. **HTTPS Only**: Todas as comunicações criptografadas
4. **CORS**: Configurado para permitir acesso do frontend
5. **Rate Limiting**: Proteção contra abuso
6. **Input Validation**: Validação de todos os parâmetros de entrada

---

## Próximos Passos

1. Implementar cache Redis para rotas de leitura frequente
2. Adicionar rate limiting customizado por tenant
3. Implementar paginação cursor-based para melhor performance
4. Adicionar webhooks para notificações de eventos
5. Implementar GraphQL como alternativa ao REST

---

## Suporte

Para dúvidas ou problemas com as APIs, consulte:
- [Documentação Completa](./README.md)
- [Guia de Troubleshooting](./TROUBLESHOOTING.md)
- [Exemplos de Uso](./API-EXAMPLES.md)

# Alquimista Platform API

Este diretório contém as funções Lambda que implementam a API REST da Plataforma Alquimista.AI.

## Arquitetura

A Plataforma Alquimista é um SaaS multi-tenant que permite aos clientes:
- Visualizar catálogo de agentes de IA disponíveis
- Ativar/desativar agentes para seu tenant
- Gerenciar permissões granulares por agente
- Visualizar métricas e auditoria de ações

## Autenticação

Todas as rotas da API requerem autenticação via **AWS Cognito User Pool**.

O token JWT deve ser enviado no header `Authorization`:
```
Authorization: Bearer <jwt-token>
```

### Claims JWT Necessários

- `sub`: User ID
- `custom:tenant_id`: ID do tenant (empresa)
- `custom:user_role`: Role do usuário (admin, manager, operator, viewer)
- `custom:company_name`: Nome da empresa

## Endpoints

### 1. Listar Agentes Disponíveis

**GET** `/api/agents`

Lista todos os agentes disponíveis no marketplace.

**Query Parameters:**
- `category` (opcional): Filtrar por categoria
  - Valores: `Conteúdo`, `Social`, `Vendas`, `Pesquisa`, `Agenda`, `Finanças`

**Response:**
```json
{
  "agents": [
    {
      "id": "1",
      "name": "Agente de Recebimento",
      "description": "Higieniza, padroniza e enriquece dados de leads",
      "category": "Vendas",
      "version": "1.0.0",
      "status": "active",
      "pricing": "free"
    }
  ],
  "total": 7
}
```

**Permissões:** Todos os usuários autenticados

**Requirements:** 14.2

---

### 2. Ativar Agente

**POST** `/api/agents/{id}/activate`

Ativa um agente específico para o tenant do usuário.

**Path Parameters:**
- `id`: ID do agente a ser ativado

**Request Body (opcional):**
```json
{
  "permissions": ["read", "write", "execute"]
}
```

**Response:**
```json
{
  "success": true,
  "activationId": "activation-1234567890",
  "agentId": "1",
  "tenantId": "tenant-abc",
  "permissions": ["read", "write", "execute"],
  "activatedAt": "2024-01-15T10:30:00Z",
  "message": "Agent activated successfully"
}
```

**Permissões:** `admin`, `manager`

**Requirements:** 14.7

**Eventos Publicados:**
- `alquimista.platform` → `agent.activated`

---

### 3. Desativar Agente

**POST** `/api/agents/{id}/deactivate`

Desativa um agente específico para o tenant do usuário.

**Path Parameters:**
- `id`: ID do agente a ser desativado

**Request Body (opcional):**
```json
{
  "reason": "Não estamos mais usando este agente"
}
```

**Response:**
```json
{
  "success": true,
  "deactivationId": "deactivation-1234567890",
  "agentId": "1",
  "tenantId": "tenant-abc",
  "reason": "Não estamos mais usando este agente",
  "deactivatedAt": "2024-01-15T10:30:00Z",
  "message": "Agent deactivated successfully"
}
```

**Permissões:** `admin`, `manager`

**Requirements:** 14.7

**Eventos Publicados:**
- `alquimista.platform` → `agent.deactivated`

---

## Roles e Permissões

### admin
- Acesso total ao tenant
- Pode ativar/desativar agentes
- Pode gerenciar usuários
- Pode visualizar auditoria completa

### manager
- Pode ativar/desativar agentes
- Pode visualizar relatórios
- Pode configurar agentes

### operator
- Pode visualizar dashboards
- Pode executar ações pré-aprovadas

### viewer
- Somente leitura
- Pode visualizar dashboards e relatórios

## Eventos EventBridge

### agent.activated

Publicado quando um agente é ativado para um tenant.

```json
{
  "Source": "alquimista.platform",
  "DetailType": "agent.activated",
  "Detail": {
    "activationId": "activation-1234567890",
    "agentId": "1",
    "tenantId": "tenant-abc",
    "userId": "user-xyz",
    "permissions": ["read", "write"],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### agent.deactivated

Publicado quando um agente é desativado para um tenant.

```json
{
  "Source": "alquimista.platform",
  "DetailType": "agent.deactivated",
  "Detail": {
    "deactivationId": "deactivation-1234567890",
    "agentId": "1",
    "tenantId": "tenant-abc",
    "userId": "user-xyz",
    "reason": "User requested deactivation",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Variáveis de Ambiente

Todas as Lambdas utilizam as seguintes variáveis de ambiente:

- `POWERTOOLS_SERVICE_NAME`: Nome do serviço para logging (alquimista-platform)
- `EVENT_BUS_NAME`: Nome do EventBridge bus
- `DB_SECRET_ARN`: ARN do secret com credenciais do banco
- `USER_POOL_ID`: ID do Cognito User Pool
- `NODE_OPTIONS`: Opções do Node.js (--enable-source-maps)

## Observabilidade

### Logging

Todas as Lambdas utilizam **AWS Lambda Powertools** para logging estruturado:

```typescript
logger.info('Message', { key: 'value' });
logger.error('Error message', { error });
```

Logs são enviados para **CloudWatch Logs** em formato JSON.

### Tracing

Todas as Lambdas têm **AWS X-Ray** habilitado para tracing distribuído.

Annotations adicionadas:
- `agentId`: ID do agente
- `tenantId`: ID do tenant
- `userId`: ID do usuário

### Métricas

Métricas customizadas são enviadas para **CloudWatch Metrics**:
- Número de ativações por agente
- Número de desativações por agente
- Latência por endpoint
- Taxa de erro por endpoint

## Desenvolvimento Local

### Pré-requisitos

```bash
npm install
```

### Build

```bash
npm run build
```

### Deploy

```bash
# Deploy em dev
npm run deploy:dev

# Deploy em staging
npm run deploy:staging

# Deploy em prod
npm run deploy:prod
```

## Testes

### Testar endpoint de listagem

```bash
# Obter token JWT do Cognito
TOKEN=$(aws cognito-idp initiate-auth ...)

# Listar agentes
curl -H "Authorization: Bearer $TOKEN" \
  https://API_URL/api/agents
```

### Testar ativação de agente

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"permissions": ["read", "write"]}' \
  https://API_URL/api/agents/1/activate
```

## Próximos Passos (Tasks 20-24)

- [ ] Task 20: Implementar API do Marketplace completa
  - [ ] 20.1: Implementar consulta ao banco de dados em list-agents
  - [ ] 20.2: Implementar lógica de ativação em activate-agent
  - [ ] 20.3: Implementar lógica de desativação em deactivate-agent
  - [ ] 20.4: Adicionar rotas ao API Gateway (já implementado)

- [ ] Task 21: Implementar sistema de permissões
- [ ] Task 22: Implementar sistema de auditoria
- [ ] Task 23: Implementar métricas por agente
- [ ] Task 24: Implementar fluxo de aprovação

## Referências

- [Requirements Document](../../.kiro/specs/fibonacci-aws-setup/requirements.md) - Requirement 14
- [Design Document](../../.kiro/specs/fibonacci-aws-setup/design.md) - Alquimista Platform
- [AWS Lambda Powertools](https://docs.powertools.aws.dev/lambda/typescript/latest/)
- [AWS X-Ray](https://docs.aws.amazon.com/xray/)

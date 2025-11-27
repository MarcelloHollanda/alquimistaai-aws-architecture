# 📡 API Oficial da Plataforma AlquimistaAI

**Data**: 23 de novembro de 2025  
**Status**: ✅ Documentado

---

## 🎯 Problema Identificado

O frontend estava configurado para usar o **API Gateway do Fibonacci Orquestrador**, que não possui as rotas necessárias para o funcionamento da aplicação.

### API Gateway Fibonacci (INCORRETO para o frontend)
- **DEV**: `https://c5loeivg0k.execute-api.us-east-1.amazonaws.com`
- **PROD**: `https://ogsd1547nd.execute-api.us-east-1.amazonaws.com`
- **Rotas disponíveis**: Apenas `/` (health check do Fibonacci)
- **Uso**: Interno do sistema Fibonacci, não para o frontend

---

## ✅ API Oficial da Plataforma (CORRETO)

A API oficial da Plataforma AlquimistaAI é definida em dois stacks CDK:
1. **AlquimistaStack** (`lib/alquimista-stack.ts`) - Marketplace e gestão de agentes
2. **OperationalDashboardStack** (`lib/operational-dashboard-stack.ts`) - Dashboard operacional

### Identificação da API

A API oficial é criada no **AlquimistaStack** com o nome:
```
alquimista-platform-api-{env}
```

### Como Obter a URL da API

Execute o comando CDK para obter os outputs:

```powershell
# DEV
cdk deploy AlquimistaStack-dev --context env=dev --outputs-file backend-outputs.json

# PROD
cdk deploy AlquimistaStack-prod --context env=prod --outputs-file backend-outputs.json
```

O output conterá:
```json
{
  "AlquimistaStack-dev": {
    "PlatformApiUrl": "https://<API_ID>.execute-api.us-east-1.amazonaws.com"
  }
}
```

---

## 📋 Rotas Disponíveis na API da Plataforma

### Rotas Públicas (sem autenticação)

#### Agentes
- `GET /api/agents` - Listar agentes disponíveis no marketplace

#### Empresas
- `POST /api/companies` - Criar empresa (usado no cadastro)

### Rotas Autenticadas (requerem token Cognito)

#### Gestão de Agentes
- `POST /api/agents/{id}/activate` - Ativar agente para tenant
- `POST /api/agents/{id}/deactivate` - Desativar agente
- `GET /api/agents/{id}/metrics` - Métricas de um agente específico
- `GET /api/agents/metrics` - Métricas de todos os agentes ativos

#### Auditoria
- `GET /api/audit-logs` - Consultar logs de auditoria

#### Aprovações
- `POST /api/approvals` - Criar solicitação de aprovação
- `GET /api/approvals` - Listar aprovações
- `GET /api/approvals/{id}` - Detalhes de aprovação
- `POST /api/approvals/{id}/decide` - Processar decisão
- `DELETE /api/approvals/{id}` - Cancelar aprovação

#### Empresas e Usuários
- `GET /api/companies/{tenantId}` - Obter dados da empresa
- `PUT /api/companies/{tenantId}` - Atualizar empresa
- `POST /api/upload/logo` - Upload de logomarca
- `POST /api/users` - Criar usuário
- `PUT /api/users/{userId}` - Atualizar usuário
- `GET /api/users/{userId}` - Obter usuário

#### Integrações
- `POST /api/integrations/connect` - Conectar integração
- `POST /api/integrations/disconnect` - Desconectar integração
- `GET /api/integrations` - Listar integrações

#### Trials
- `POST /api/trials/start` - Iniciar trial
- `POST /api/trials/invoke` - Processar interação de trial

#### Comercial
- `POST /api/commercial/contact` - Contato comercial

### Rotas do Dashboard Operacional

#### Tenant (Dashboard do Cliente)
- `GET /tenant/me` - Dados da empresa do tenant
- `GET /tenant/agents` - Agentes contratados
- `GET /tenant/integrations` - Integrações configuradas
- `GET /tenant/usage` - Métricas de uso
- `GET /tenant/incidents` - Incidentes

#### Internal (Dashboard Interno)
- `GET /internal/tenants` - Listar todos os tenants
- `GET /internal/tenants/{id}` - Detalhes de tenant
- `GET /internal/tenants/{id}/agents` - Agentes do tenant
- `GET /internal/usage/overview` - Visão global de uso
- `GET /internal/billing/overview` - Visão financeira global
- `POST /internal/operations/commands` - Criar comando operacional
- `GET /internal/operations/commands` - Listar comandos

---

## 🔧 Correção Necessária

### 1. Obter a URL da API da Plataforma

Execute:
```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI

# Verificar se a stack já está deployada
aws cloudformation describe-stacks --stack-name AlquimistaStack-dev --region us-east-1 --query "Stacks[0].Outputs"

# Se não estiver deployada, fazer o deploy
cdk deploy AlquimistaStack-dev --context env=dev
```

### 2. Atualizar .env.local

Substituir:
```env
NEXT_PUBLIC_API_URL=https://c5loeivg0k.execute-api.us-east-1.amazonaws.com
```

Por:
```env
NEXT_PUBLIC_API_URL=https://<API_PLATAFORMA_ID>.execute-api.us-east-1.amazonaws.com
```

### 3. Atualizar .env.production

Substituir:
```env
NEXT_PUBLIC_API_URL=https://ogsd1547nd.execute-api.us-east-1.amazonaws.com
```

Por:
```env
NEXT_PUBLIC_API_URL=https://<API_PLATAFORMA_PROD_ID>.execute-api.us-east-1.amazonaws.com
```

### 4. Remover Fallbacks para localhost:3001

Atualizar os seguintes arquivos:

**`frontend/src/lib/nigredo-api.ts`**:
```typescript
const NIGREDO_API_BASE_URL =
  process.env.NEXT_PUBLIC_NIGREDO_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL;

if (!NIGREDO_API_BASE_URL) {
  throw new Error('[NigredoApi] Nenhuma base URL configurada');
}
```

**`frontend/src/lib/fibonacci-api.ts`**:
```typescript
const FIBONACCI_API_BASE_URL =
  process.env.NEXT_PUBLIC_FIBONACCI_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL;

if (!FIBONACCI_API_BASE_URL) {
  throw new Error('[FibonacciApi] Nenhuma base URL configurada');
}
```

---

## 📊 Validação

Após a correção, testar:

```powershell
# Testar a API da Plataforma
curl https://<API_PLATAFORMA_ID>.execute-api.us-east-1.amazonaws.com/api/agents

# Deve retornar lista de agentes, não 404
```

---

## 📝 Notas Importantes

1. **Duas APIs Diferentes**:
   - **Fibonacci API**: Para comunicação interna entre Fibonacci e Nigredo
   - **Plataforma API**: Para o frontend e marketplace de agentes

2. **Variáveis de Ambiente**:
   - `NEXT_PUBLIC_API_URL` → API da Plataforma (principal)
   - `NEXT_PUBLIC_FIBONACCI_API_BASE_URL` → API do Fibonacci (opcional, fallback para API_URL)
   - `NEXT_PUBLIC_NIGREDO_API_BASE_URL` → API do Nigredo (opcional, fallback para API_URL)

3. **Autenticação**:
   - Rotas públicas: `/api/agents`, `/api/companies` (POST)
   - Rotas autenticadas: Todas as outras (requerem token Cognito no header `Authorization`)

---

**Última atualização**: 23 de novembro de 2025  
**Mantido por**: Equipe AlquimistaAI

# Handlers Lambda - Sistema de Autenticação

## Status de Implementação

### ✅ Implementados
- `create-company.ts` - Criar empresa (tenant)
- `update-company.ts` - Atualizar empresa

### 📋 Pendentes (Templates Prontos)

Os handlers abaixo seguem o mesmo padrão dos implementados. Para criar cada um:

1. Copiar template base
2. Ajustar validações específicas
3. Implementar lógica de negócio
4. Adicionar ao API Gateway

---

## 4.3 upload-logo.ts

**Rota**: `POST /api/upload/logo`

**Funcionalidade**:
- Receber arquivo de imagem (base64 ou multipart)
- Validar tipo (PNG, JPG, SVG)
- Validar tamanho (máx 2MB)
- Upload para S3: `alquimistaai-logos/{tenantId}/logo.{ext}`
- Retornar URL pública

**Dependências**:
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
```

**Validações**:
- Content-Type: image/png, image/jpeg, image/svg+xml
- Tamanho: <= 2MB
- TenantId válido

---

## 4.4 create-user.ts

**Rota**: `POST /api/users`

**Funcionalidade**:
- Validar dados de entrada
- Inserir em `users` table
- Inserir em `user_roles` table
- Retornar userId e dados

**Body**:
```typescript
{
  cognitoSub: string;
  tenantId: string;
  email: string;
  name: string;
  phone?: string;
  role: 'MASTER' | 'ADMIN' | 'OPERATIONAL' | 'READ_ONLY';
}
```

**Validações**:
- Email único
- CognitoSub único
- TenantId existe
- Se role = MASTER, verificar se já existe MASTER no tenant

---

## 4.5 update-user.ts

**Rota**: `PUT /api/users/{userId}`

**Funcionalidade**:
- Validar permissões (próprio usuário)
- Atualizar campos permitidos
- Retornar dados atualizados

**Campos Atualizáveis**:
- name
- phone
- language
- timezone

**Não Atualizáveis**:
- email (gerenciado pelo Cognito)
- cognitoSub
- tenantId
- role (usar endpoint específico)

---

## 4.6 get-user.ts

**Rota**: `GET /api/users/{userId}` ou `GET /api/users/me`

**Funcionalidade**:
- Buscar por userId ou cognitoSub
- JOIN com companies
- JOIN com user_roles
- Retornar dados completos

**Response**:
```typescript
{
  user: {
    id: string;
    cognitoSub: string;
    email: string;
    name: string;
    phone: string;
    language: string;
    timezone: string;
  };
  company: {
    id: string;
    tenantId: string;
    name: string;
    logoUrl: string;
  };
  role: 'MASTER' | 'ADMIN' | 'OPERATIONAL' | 'READ_ONLY';
}
```

---

## 4.7 connect-integration.ts

**Rota**: `POST /api/integrations/connect`

**Funcionalidade**:
- Validar permissões (Master ou Admin)
- Armazenar credenciais no Secrets Manager
- Path: `/alquimista/{env}/{tenantId}/{integration}`
- Atualizar status em `integrations` table

**Body**:
```typescript
{
  tenantId: string;
  integration: string; // 'google', 'meta', 'twilio', etc
  credentials: {
    // Específico de cada integração
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
    // ...
  };
}
```

**Dependências**:
```typescript
import { SecretsManagerClient, CreateSecretCommand, PutSecretValueCommand } from '@aws-sdk/client-secrets-manager';
```

---

## 4.8 disconnect-integration.ts

**Rota**: `POST /api/integrations/disconnect`

**Funcionalidade**:
- Validar permissões (Master ou Admin)
- Remover credenciais do Secrets Manager
- Atualizar status para 'disconnected' em `integrations`

**Body**:
```typescript
{
  tenantId: string;
  integration: string;
}
```

---

## 4.9 list-integrations.ts

**Rota**: `GET /api/integrations?tenantId={tenantId}`

**Funcionalidade**:
- Buscar integrações do tenant
- Retornar lista com status
- NÃO retornar credenciais (apenas status)

**Response**:
```typescript
{
  integrations: [
    {
      id: string;
      name: string;
      status: 'connected' | 'disconnected' | 'error';
      lastSyncAt: string;
      errorMessage?: string;
    }
  ]
}
```

---

## Template Base para Novos Handlers

```typescript
/**
 * Handler: [Descrição]
 * Rota: [METHOD] /api/[path]
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
  max: 20,
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  try {
    // Handle OPTIONS
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    // Validate method
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Método não permitido' }),
      };
    }

    // TODO: Implementar lógica

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error: any) {
    console.error('Erro:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno do servidor', message: error.message }),
    };
  }
};
```

---

## Próximos Passos

1. Implementar handlers 4.3 a 4.9
2. Adicionar rotas no API Gateway (CDK)
3. Configurar variáveis de ambiente
4. Testar cada handler individualmente
5. Integrar com frontend

---

## Notas de Implementação

### Validação de Permissões

Todos os handlers devem validar permissões via JWT token:

```typescript
// Extrair token do header
const token = event.headers.Authorization?.replace('Bearer ', '');

// Decodificar e validar (usar biblioteca jwt)
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// Buscar papel do usuário
const userRole = await getUserRole(decoded.sub, tenantId);

// Validar permissão
if (!hasPermission(userRole, requiredRole)) {
  return { statusCode: 403, headers, body: JSON.stringify({ error: 'Sem permissão' }) };
}
```

### Logging Estruturado

Todos os handlers devem usar logging estruturado:

```typescript
console.log(JSON.stringify({
  level: 'info',
  message: 'Operação realizada',
  tenantId,
  userId,
  operation: 'create-company',
  timestamp: new Date().toISOString(),
}));
```

### Error Handling

Sempre capturar e logar erros:

```typescript
try {
  // operação
} catch (error: any) {
  console.error(JSON.stringify({
    level: 'error',
    message: error.message,
    stack: error.stack,
    operation: 'create-company',
    timestamp: new Date().toISOString(),
  }));
  
  return {
    statusCode: 500,
    headers,
    body: JSON.stringify({ error: 'Erro interno do servidor' }),
  };
}
```

---

**Última Atualização**: 2024-01-XX  
**Status**: 2 de 9 handlers implementados (22%)

# Guia de Correção de Vulnerabilidades - Painel Operacional

## Visão Geral

Este documento fornece instruções detalhadas para corrigir as vulnerabilidades identificadas nos testes de segurança.

## 1. Criar Módulo de Validação de Input

### Arquivo: `lambda/shared/input-validator.ts`

```typescript
/**
 * Módulo de Validação e Sanitização de Inputs
 * 
 * Protege contra:
 * - SQL Injection
 * - XSS (Cross-Site Scripting)
 * - Path Traversal
 * - DoS por payloads grandes
 */

// Validação de UUID
export function validateUUID(id: string): boolean {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Sanitização de strings para prevenir SQL Injection
export function sanitizeSQLInput(input: string, maxLength: number = 255): string {
  if (!input) return '';
  
  // Remover caracteres perigosos para SQL
  const dangerous = /[';\"\\]/g;
  const sanitized = input.replace(dangerous, '');
  
  // Limitar tamanho
  return sanitized.trim().substring(0, maxLength);
}

// Sanitização de HTML para prevenir XSS
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validação de query parameters
export interface ValidatedQueryParams {
  limit: number;
  offset: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function validateQueryParams(params: any): ValidatedQueryParams {
  const limit = parseInt(params?.limit);
  const offset = parseInt(params?.offset);
  
  return {
    limit: isNaN(limit) ? 50 : Math.min(Math.max(limit, 1), 100),
    offset: isNaN(offset) ? 0 : Math.max(offset, 0),
    search: params?.search ? sanitizeSQLInput(params.search, 255) : undefined,
    status: params?.status ? sanitizeSQLInput(params.status, 50) : undefined,
    sortBy: params?.sortBy ? sanitizeSQLInput(params.sortBy, 50) : undefined,
    sortOrder: params?.sortOrder === 'desc' ? 'desc' : 'asc'
  };
}

// Validação de email
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

// Validação de CNPJ
export function validateCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;
  const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
  return cnpjRegex.test(cnpj);
}

// Validação de período
export function validatePeriod(period: string): '7d' | '30d' | '90d' {
  if (period === '7d' || period === '30d' || period === '90d') {
    return period;
  }
  return '30d'; // Default
}

// Validação de status
export function validateStatus(status: string): string {
  const validStatuses = ['active', 'inactive', 'suspended', 'all'];
  return validStatuses.includes(status) ? status : 'active';
}

// Validação de command type
export function validateCommandType(type: string): boolean {
  const validTypes = ['REPROCESS_QUEUE', 'RESET_TOKEN', 'RESTART_AGENT', 'HEALTH_CHECK'];
  return validTypes.includes(type);
}

// Classe de erro de validação
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

## 2. Atualizar Authorization Middleware

### Arquivo: `lambda/shared/authorization-middleware.ts`

```typescript
// Adicionar tratamento de erro melhorado

export function extractAuthContext(event: APIGatewayProxyEvent): AuthContext {
  const claims = event.requestContext?.authorizer?.claims;
  
  if (!claims) {
    throw new AuthorizationError(
      'Token de autenticação ausente ou inválido',
      401,
      'UNAUTHORIZED'
    );
  }
  
  const groups = (claims['cognito:groups']?.split(',') || []).filter(Boolean);
  
  return {
    sub: claims.sub || '',
    email: claims.email || '',
    tenantId: claims['custom:tenant_id'],
    groups,
    isInternal: groups.includes('INTERNAL_ADMIN') || groups.includes('INTERNAL_SUPPORT')
  };
}

export function requireTenantAccess(context: AuthContext, tenantId: string): void {
  if (!context.isInternal && context.tenantId !== tenantId) {
    throw new AuthorizationError(
      'Forbidden: Acesso negado ao tenant',
      403,
      'FORBIDDEN'
    );
  }
}

export function requireInternal(context: AuthContext): void {
  if (!context.isInternal) {
    throw new AuthorizationError(
      'Forbidden: Internal access required',
      403,
      'FORBIDDEN'
    );
  }
}

// Classe de erro de autorização melhorada
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403,
    public code: string = 'FORBIDDEN'
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}
```

## 3. Criar Handler Base com Tratamento de Erros

### Arquivo: `lambda/shared/base-handler.ts`

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthorizationError } from './authorization-middleware';
import { ValidationError } from './input-validator';

export async function handleRequest(
  event: APIGatewayProxyEvent,
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
): Promise<APIGatewayProxyResult> {
  try {
    return await handler(event);
  } catch (error) {
    console.error('Error in handler:', error);
    
    // Erro de autorização
    if (error instanceof AuthorizationError) {
      return {
        statusCode: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*'
        },
        body: JSON.stringify({
          error: error.message,
          code: error.code
        })
      };
    }
    
    // Erro de validação
    if (error instanceof ValidationError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*'
        },
        body: JSON.stringify({
          error: error.message,
          field: error.field,
          code: 'VALIDATION_ERROR'
        })
      };
    }
    
    // Erro genérico
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        code: 'INTERNAL_ERROR'
      })
    };
  }
}
```

## 4. Atualizar Handlers Existentes

### Exemplo: `lambda/platform/get-tenant-me.ts`

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractAuthContext, requireTenantAccess } from '../shared/authorization-middleware';
import { validateUUID } from '../shared/input-validator';
import { handleRequest } from '../shared/base-handler';

async function getTenantMeHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Extrair contexto de autenticação
  const context = extractAuthContext(event);
  
  // Determinar tenant ID
  const tenantId = context.isInternal 
    ? event.queryStringParameters?.tenant_id || context.tenantId
    : context.tenantId;
  
  // Validar tenant ID
  if (!tenantId) {
    throw new ValidationError('Tenant ID é obrigatório');
  }
  
  if (!validateUUID(tenantId)) {
    throw new ValidationError('Tenant ID inválido', 'tenant_id');
  }
  
  // Validar acesso
  requireTenantAccess(context, tenantId);
  
  // Buscar dados (com prepared statement)
  const tenant = await query(
    'SELECT * FROM tenants WHERE id = $1',
    [tenantId]
  );
  
  if (!tenant) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Tenant não encontrado' })
    };
  }
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*'
    },
    body: JSON.stringify(tenant)
  };
}

export const handler = (event: APIGatewayProxyEvent) => 
  handleRequest(event, getTenantMeHandler);
```

### Exemplo: `lambda/internal/list-tenants.ts`

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractAuthContext, requireInternal } from '../shared/authorization-middleware';
import { validateQueryParams } from '../shared/input-validator';
import { handleRequest } from '../shared/base-handler';

async function listTenantsHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Extrair contexto e validar permissões
  const context = extractAuthContext(event);
  requireInternal(context);
  
  // Validar e sanitizar query parameters
  const params = validateQueryParams(event.queryStringParameters);
  
  // Construir query com prepared statements
  let query = 'SELECT * FROM tenants WHERE 1=1';
  const values: any[] = [];
  let paramIndex = 1;
  
  if (params.search) {
    query += ` AND (name ILIKE $${paramIndex} OR cnpj ILIKE $${paramIndex})`;
    values.push(`%${params.search}%`);
    paramIndex++;
  }
  
  if (params.status && params.status !== 'all') {
    query += ` AND status = $${paramIndex}`;
    values.push(params.status);
    paramIndex++;
  }
  
  query += ` ORDER BY ${params.sortBy || 'name'} ${params.sortOrder}`;
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  values.push(params.limit, params.offset);
  
  // Executar query
  const tenants = await queryDatabase(query, values);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*'
    },
    body: JSON.stringify({
      tenants,
      limit: params.limit,
      offset: params.offset
    })
  };
}

export const handler = (event: APIGatewayProxyEvent) => 
  handleRequest(event, listTenantsHandler);
```

## 5. Implementar Rate Limiting

### Arquivo: `lambda/shared/rate-limiter.ts`

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
});

export interface RateLimitConfig {
  limit: number;
  window: number; // segundos
}

export const RATE_LIMITS = {
  IP: { limit: 100, window: 60 }, // 100 req/min por IP
  TENANT: { limit: 1000, window: 60 }, // 1000 req/min por tenant
  USER: { limit: 200, window: 60 } // 200 req/min por usuário
};

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, config.window);
    }
    
    const allowed = current <= config.limit;
    const remaining = Math.max(0, config.limit - current);
    
    return { allowed, remaining };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Em caso de erro, permitir a requisição
    return { allowed: true, remaining: config.limit };
  }
}

export async function rateLimitMiddleware(
  event: APIGatewayProxyEvent,
  context: AuthContext
): Promise<APIGatewayProxyResult | null> {
  const ip = event.requestContext.identity?.sourceIp || 'unknown';
  
  // Check IP rate limit
  const ipKey = `rate:ip:${ip}`;
  const ipLimit = await checkRateLimit(ipKey, RATE_LIMITS.IP);
  
  if (!ipLimit.allowed) {
    return {
      statusCode: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': RATE_LIMITS.IP.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': (Date.now() + RATE_LIMITS.IP.window * 1000).toString()
      },
      body: JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.'
      })
    };
  }
  
  // Check tenant rate limit
  if (context.tenantId) {
    const tenantKey = `rate:tenant:${context.tenantId}`;
    const tenantLimit = await checkRateLimit(tenantKey, RATE_LIMITS.TENANT);
    
    if (!tenantLimit.allowed) {
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': RATE_LIMITS.TENANT.limit.toString(),
          'X-RateLimit-Remaining': '0'
        },
        body: JSON.stringify({
          error: 'Too Many Requests',
          message: 'Tenant rate limit exceeded.'
        })
      };
    }
  }
  
  // Permitir requisição
  return null;
}
```

## 6. Atualizar Base Handler com Rate Limiting

```typescript
// lambda/shared/base-handler.ts (atualizado)

import { rateLimitMiddleware } from './rate-limiter';

export async function handleRequest(
  event: APIGatewayProxyEvent,
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
): Promise<APIGatewayProxyResult> {
  try {
    // Extrair contexto (pode lançar erro se não autenticado)
    let context;
    try {
      context = extractAuthContext(event);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return {
          statusCode: error.statusCode,
          body: JSON.stringify({ error: error.message })
        };
      }
      throw error;
    }
    
    // Check rate limiting
    const rateLimitResult = await rateLimitMiddleware(event, context);
    if (rateLimitResult) {
      return rateLimitResult;
    }
    
    // Executar handler
    return await handler(event);
  } catch (error) {
    // ... tratamento de erros existente
  }
}
```

## 7. Checklist de Implementação

### Fase 1: Validação e Sanitização
- [ ] Criar `lambda/shared/input-validator.ts`
- [ ] Atualizar `lambda/shared/authorization-middleware.ts`
- [ ] Criar `lambda/shared/base-handler.ts`
- [ ] Atualizar todos os handlers para usar `handleRequest`
- [ ] Aplicar validação de UUID em todos os path parameters
- [ ] Aplicar sanitização em todos os query parameters
- [ ] Executar testes de segurança

### Fase 2: Rate Limiting
- [ ] Criar `lambda/shared/rate-limiter.ts`
- [ ] Configurar Redis no CDK
- [ ] Integrar rate limiting no base handler
- [ ] Executar testes de rate limiting

### Fase 3: Validação Final
- [ ] Executar suite completa de testes
- [ ] Verificar que todos os 38 testes passam
- [ ] Executar OWASP ZAP scan
- [ ] Documentar resultados

## 8. Comandos para Testes

```bash
# Executar testes de segurança
npm test -- tests/security/operational-dashboard-security.test.ts --run

# Executar todos os testes
npm test -- --run

# Executar com coverage
npm test -- --coverage --run
```

## 9. Próximos Passos

Após implementar todas as correções:

1. Re-executar testes de segurança
2. Verificar que todos passam (38/38)
3. Executar OWASP ZAP scan
4. Atualizar documentação
5. Aprovar para produção

---

**Tempo Estimado Total**: 15 horas de desenvolvimento + 2 horas de testes

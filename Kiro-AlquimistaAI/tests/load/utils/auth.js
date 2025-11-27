/**
 * Utilitários de Autenticação para Testes de Performance
 */

import http from 'k6/http';
import { check } from 'k6';

/**
 * Tokens de autenticação em cache
 * Em produção, usar tokens reais do Cognito
 */
const tokenCache = new Map();

/**
 * Gera token JWT mock para testes
 * Em produção, substituir por autenticação real do Cognito
 */
export function generateMockToken(userId, tenantId, groups = ['TENANT_USER']) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: userId,
    email: `user-${userId}@test.com`,
    'custom:tenant_id': tenantId,
    'cognito:groups': groups,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hora
  }));
  const signature = 'mock-signature';
  
  return `${header}.${payload}.${signature}`;
}

/**
 * Obtém token de autenticação para um tenant
 */
export function getTenantToken(tenantId) {
  const cacheKey = `tenant-${tenantId}`;
  
  if (tokenCache.has(cacheKey)) {
    return tokenCache.get(cacheKey);
  }
  
  const userId = `tenant-user-${tenantId}`;
  const token = generateMockToken(userId, tenantId, ['TENANT_USER']);
  
  tokenCache.set(cacheKey, token);
  return token;
}

/**
 * Obtém token de autenticação para usuário interno
 */
export function getInternalToken(userId, isAdmin = false) {
  const cacheKey = `internal-${userId}`;
  
  if (tokenCache.has(cacheKey)) {
    return tokenCache.get(cacheKey);
  }
  
  const groups = isAdmin ? ['INTERNAL_ADMIN'] : ['INTERNAL_SUPPORT'];
  const token = generateMockToken(userId, null, groups);
  
  tokenCache.set(cacheKey, token);
  return token;
}

/**
 * Cria headers de autenticação
 */
export function getAuthHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Autentica usuário tenant via Cognito (produção)
 * Descomente e configure para usar autenticação real
 */
export function authenticateTenant(email, password) {
  const cognitoUrl = __ENV.COGNITO_AUTH_URL;
  const clientId = __ENV.COGNITO_CLIENT_ID;
  
  if (!cognitoUrl || !clientId) {
    console.warn('Cognito não configurado, usando tokens mock');
    return generateMockToken('test-user', 'test-tenant');
  }
  
  const payload = JSON.stringify({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: clientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });
  
  const response = http.post(cognitoUrl, payload, {
    headers: { 'Content-Type': 'application/x-amz-json-1.1' },
  });
  
  check(response, {
    'autenticação bem-sucedida': (r) => r.status === 200,
  });
  
  if (response.status === 200) {
    const body = JSON.parse(response.body);
    return body.AuthenticationResult.IdToken;
  }
  
  throw new Error(`Falha na autenticação: ${response.status}`);
}

/**
 * Autentica usuário interno via Cognito (produção)
 */
export function authenticateInternal(email, password) {
  return authenticateTenant(email, password);
}

/**
 * Valida token JWT
 */
export function validateToken(token) {
  if (!token) return false;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    return payload.exp > now;
  } catch (e) {
    return false;
  }
}

/**
 * Extrai claims do token
 */
export function extractClaims(token) {
  try {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    
    return {
      sub: payload.sub,
      email: payload.email,
      tenantId: payload['custom:tenant_id'],
      groups: payload['cognito:groups'] || [],
      exp: payload.exp,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Gera múltiplos tokens para teste de escalabilidade
 */
export function generateTestTokens(count, type = 'tenant') {
  const tokens = [];
  
  for (let i = 1; i <= count; i++) {
    if (type === 'tenant') {
      tokens.push({
        tenantId: `tenant-${i}`,
        token: getTenantToken(`tenant-${i}`),
      });
    } else if (type === 'internal') {
      tokens.push({
        userId: `internal-${i}`,
        token: getInternalToken(`internal-${i}`, i % 5 === 0), // 20% admins
      });
    }
  }
  
  return tokens;
}

/**
 * Seleciona token aleatório de uma lista
 */
export function getRandomToken(tokens) {
  const index = Math.floor(Math.random() * tokens.length);
  return tokens[index];
}

/**
 * Limpa cache de tokens
 */
export function clearTokenCache() {
  tokenCache.clear();
}

/**
 * Configuração de autenticação para diferentes ambientes
 */
export const authConfig = {
  dev: {
    useMockTokens: true,
    cognitoUrl: __ENV.COGNITO_AUTH_URL_DEV,
    clientId: __ENV.COGNITO_CLIENT_ID_DEV,
  },
  
  staging: {
    useMockTokens: false,
    cognitoUrl: __ENV.COGNITO_AUTH_URL_STAGING,
    clientId: __ENV.COGNITO_CLIENT_ID_STAGING,
  },
  
  prod: {
    useMockTokens: false,
    cognitoUrl: __ENV.COGNITO_AUTH_URL_PROD,
    clientId: __ENV.COGNITO_CLIENT_ID_PROD,
  },
};

/**
 * Obtém configuração de autenticação baseada no ambiente
 */
export function getAuthConfig() {
  const env = __ENV.TEST_ENV || 'dev';
  return authConfig[env] || authConfig.dev;
}

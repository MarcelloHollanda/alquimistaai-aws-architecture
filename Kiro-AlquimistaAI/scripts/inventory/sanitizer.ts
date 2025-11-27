/**
 * Sanitizador de Segredos
 * Feature: system-inventory-documentation
 * 
 * Detecta e mascara valores sensíveis antes de incluir no inventário.
 * Valida: Requirements 5.3, 8.2
 */

import { SecretPattern, SanitizationResult } from './types';

/**
 * Padrões de segredos conhecidos
 */
export const SECRET_PATTERNS: SecretPattern[] = [
  // AWS Access Keys
  {
    name: 'AWS_ACCESS_KEY_ID',
    pattern: /AKIA[0-9A-Z]{16}/gi,
    replacement: 'AKIA****************'
  },
  {
    name: 'AWS_SECRET_ACCESS_KEY',
    pattern: /(?:aws_secret_access_key|AWS_SECRET_ACCESS_KEY)[\s:=]+([A-Za-z0-9/+=]{40})/gi,
    replacement: '$1: ****************************************'
  },
  
  // Stripe Keys
  {
    name: 'STRIPE_SECRET_KEY',
    pattern: /sk_live_[0-9a-zA-Z]{24,}/gi,
    replacement: 'sk_live_************************'
  },
  {
    name: 'STRIPE_PUBLISHABLE_KEY',
    pattern: /pk_live_[0-9a-zA-Z]{24,}/gi,
    replacement: 'pk_live_************************'
  },
  {
    name: 'STRIPE_TEST_KEY',
    pattern: /sk_test_[0-9a-zA-Z]{24,}/gi,
    replacement: 'sk_test_************************'
  },
  
  // Tokens genéricos
  {
    name: 'BEARER_TOKEN',
    pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
    replacement: 'Bearer **********************'
  },
  {
    name: 'JWT_TOKEN',
    pattern: /eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/gi,
    replacement: 'eyJ****.eyJ****.****'
  },
  
  // Senhas (mínimo 8 caracteres não-whitespace, captura qualquer caractere exceto whitespace)
  {
    name: 'PASSWORD',
    pattern: /(?:password|passwd|pwd)[\s:=]+["']?(\S{8,})["']?/gi,
    replacement: 'password: ********'
  },
  
  // Database URLs com credenciais (captura qualquer caractere exceto : e @)
  {
    name: 'DATABASE_URL',
    pattern: /postgres(?:ql)?:\/\/([^:@\s]+):([^@\s]+)@/gi,
    replacement: 'postgresql://****:****@'
  },
  {
    name: 'MYSQL_URL',
    pattern: /mysql:\/\/([^:@\s]+):([^@\s]+)@/gi,
    replacement: 'mysql://****:****@'
  },
  
  // API Keys genéricas
  {
    name: 'API_KEY',
    pattern: /(?:api[_-]?key|apikey)[\s:=]+["']?([A-Za-z0-9]{20,})["']?/gi,
    replacement: 'api_key: ********************'
  },
  
  // Cognito Client Secret
  {
    name: 'COGNITO_CLIENT_SECRET',
    pattern: /(?:client[_-]?secret|clientSecret)[\s:=]+["']?([A-Za-z0-9]{32,})["']?/gi,
    replacement: 'client_secret: ********************************'
  },
  
  // Private Keys
  {
    name: 'PRIVATE_KEY',
    pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC )?PRIVATE KEY-----/gi,
    replacement: '-----BEGIN PRIVATE KEY-----\n[REDACTED]\n-----END PRIVATE KEY-----'
  },
  
  // Certificados
  {
    name: 'CERTIFICATE',
    pattern: /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/gi,
    replacement: '-----BEGIN CERTIFICATE-----\n[REDACTED]\n-----END CERTIFICATE-----'
  },
  
  // Endereços de email (parcial - manter domínio)
  {
    name: 'EMAIL_PARTIAL',
    pattern: /([a-zA-Z0-9._%+-]{3,})@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    replacement: (match: string, user: string, domain: string) => {
      const maskedUser = user.substring(0, 2) + '***';
      return `${maskedUser}@${domain}`;
    }
  },
  
  // IPs privados (manter apenas primeiro octeto)
  {
    name: 'PRIVATE_IP',
    pattern: /\b(10|172|192)\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/gi,
    replacement: (match: string) => {
      const firstOctet = match.split('.')[0];
      return `${firstOctet}.***.***.***`;
    }
  },
  
  // Números de telefone
  {
    name: 'PHONE_NUMBER',
    pattern: /\+?[\d\s\-()]{10,}/g,
    replacement: '+** ****-****'
  }
];

/**
 * Sanitiza uma string removendo valores sensíveis
 * 
 * @param content - Conteúdo a ser sanitizado
 * @returns Resultado da sanitização com conteúdo limpo e lista de segredos encontrados
 */
export function sanitize(content: string): SanitizationResult {
  let sanitized = content;
  const foundSecrets: string[] = [];
  
  for (const pattern of SECRET_PATTERNS) {
    const matches = content.match(pattern.pattern);
    
    if (matches && matches.length > 0) {
      foundSecrets.push(`${pattern.name} (${matches.length} occurrence(s))`);
      
      // Aplicar substituição
      if (typeof pattern.replacement === 'function') {
        sanitized = sanitized.replace(pattern.pattern, pattern.replacement as any);
      } else {
        sanitized = sanitized.replace(pattern.pattern, pattern.replacement);
      }
    }
  }
  
  return {
    sanitized,
    foundSecrets
  };
}

/**
 * Valida se uma string contém valores sensíveis
 * 
 * @param content - Conteúdo a ser validado
 * @returns true se contém segredos, false caso contrário
 */
export function containsSecrets(content: string): boolean {
  for (const pattern of SECRET_PATTERNS) {
    // Reset regex lastIndex para garantir teste correto
    pattern.pattern.lastIndex = 0;
    if (pattern.pattern.test(content)) {
      return true;
    }
  }
  return false;
}

/**
 * Sanitiza um objeto recursivamente
 * 
 * @param obj - Objeto a ser sanitizado
 * @returns Objeto sanitizado
 */
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return sanitize(obj).sanitized as any;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as any;
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Valida se um objeto contém valores sensíveis
 * 
 * @param obj - Objeto a ser validado
 * @returns true se contém segredos, false caso contrário
 */
export function objectContainsSecrets(obj: any): boolean {
  if (typeof obj === 'string') {
    return containsSecrets(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.some(item => objectContainsSecrets(item));
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.values(obj).some(value => objectContainsSecrets(value));
  }
  
  return false;
}

/**
 * Mascara um valor sensível mantendo apenas os primeiros e últimos caracteres
 * 
 * @param value - Valor a ser mascarado
 * @param visibleChars - Número de caracteres visíveis no início e fim
 * @returns Valor mascarado
 */
export function maskValue(value: string, visibleChars: number = 4): string {
  if (value.length <= visibleChars * 2) {
    return '*'.repeat(value.length);
  }
  
  const start = value.substring(0, visibleChars);
  const end = value.substring(value.length - visibleChars);
  const middle = '*'.repeat(value.length - (visibleChars * 2));
  
  return `${start}${middle}${end}`;
}

/**
 * Sanitiza URLs removendo credenciais
 * 
 * @param url - URL a ser sanitizada
 * @returns URL sanitizada
 */
export function sanitizeUrl(url: string): string {
  try {
    // Primeiro, sanitiza a string para remover padrões conhecidos
    const preSanitized = sanitize(url).sanitized;
    
    // Tenta parsear como URL
    const urlObj = new URL(preSanitized);
    
    // Remove username e password completamente
    if (urlObj.username) {
      urlObj.username = '****';
    }
    if (urlObj.password) {
      urlObj.password = '****';
    }
    
    // Remove query params sensíveis completamente
    const sensitiveParams = ['token', 'key', 'secret', 'password', 'apikey', 'api_key'];
    for (const param of sensitiveParams) {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, '****');
      }
    }
    
    return urlObj.toString();
  } catch {
    // Se não for uma URL válida, retorna sanitizado como string
    return sanitize(url).sanitized;
  }
}

/**
 * Valida se o conteúdo está seguro para ser incluído no inventário
 * Lança erro se encontrar valores sensíveis
 * 
 * @param content - Conteúdo a ser validado
 * @param context - Contexto para mensagem de erro
 * @throws Error se encontrar valores sensíveis
 */
export function validateSafe(content: string, context: string): void {
  const result = sanitize(content);
  
  if (result.foundSecrets.length > 0) {
    throw new Error(
      `SECURITY VIOLATION: Found sensitive values in ${context}:\n` +
      result.foundSecrets.join('\n') +
      '\n\nContent must be sanitized before inclusion in inventory.'
    );
  }
}

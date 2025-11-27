/**
 * Testes de Propriedade para Sanitizador de Segredos
 * Feature: system-inventory-documentation, Property 2: Sanitização de Segredos
 * Valida: Requirements 5.3, 8.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  sanitize,
  containsSecrets,
  sanitizeObject,
  objectContainsSecrets,
  maskValue,
  sanitizeUrl,
  validateSafe,
  SECRET_PATTERNS
} from '../../../scripts/inventory/sanitizer';

describe('Sanitizador de Segredos - Property-Based Tests', () => {
  /**
   * Property 2: Sanitização de Segredos
   * Para qualquer string contendo padrões sensíveis conhecidos,
   * a função sanitize deve mascarar todos os valores sensíveis
   */
  describe('Property 2: Sanitização de Segredos', () => {
    it('deve mascarar AWS Access Keys em qualquer contexto', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string({ minLength: 16, maxLength: 16 }).map(s => 
            'AKIA' + s.toUpperCase().replace(/[^A-Z0-9]/g, 'A')
          ),
          fc.string(),
          (prefix, awsKey, suffix) => {
            const content = `${prefix}${awsKey}${suffix}`;
            const result = sanitize(content);
            
            // O resultado não deve conter a chave original
            expect(result.sanitized).not.toContain(awsKey);
            
            // Deve reportar que encontrou a chave
            expect(result.foundSecrets.length).toBeGreaterThan(0);
            expect(result.foundSecrets.some(s => s.includes('AWS_ACCESS_KEY_ID'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('deve mascarar Stripe Secret Keys em qualquer contexto', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string({ minLength: 24, maxLength: 32 }).map(s => 
            'sk_live_' + s.replace(/[^a-zA-Z0-9]/g, 'a')
          ),
          fc.string(),
          (prefix, stripeKey, suffix) => {
            const content = `${prefix}${stripeKey}${suffix}`;
            const result = sanitize(content);
            
            // O resultado não deve conter a chave original
            expect(result.sanitized).not.toContain(stripeKey);
            
            // Deve reportar que encontrou a chave
            expect(result.foundSecrets.length).toBeGreaterThan(0);
            expect(result.foundSecrets.some(s => s.includes('STRIPE_SECRET_KEY'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('deve mascarar Bearer tokens em qualquer contexto', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string({ minLength: 20, maxLength: 40 }).map(s => 
            'Bearer ' + s.replace(/[^a-zA-Z0-9\-._~+/]/g, 'a')
          ),
          fc.string(),
          (prefix, token, suffix) => {
            const content = `${prefix}${token}${suffix}`;
            const result = sanitize(content);
            
            // O resultado não deve conter o token original completo
            expect(result.sanitized).not.toContain(token);
            
            // Deve reportar que encontrou o token
            expect(result.foundSecrets.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('deve mascarar senhas em qualquer formato', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('password', 'passwd', 'pwd'),
          fc.constantFrom(':', '=', ' '),
          fc.string({ minLength: 8, maxLength: 20 }).filter(s => /^\S{8,}$/.test(s)),
          (keyword, separator, password) => {
            const content = `${keyword}${separator}${password}`;
            const result = sanitize(content);
            
            // O resultado não deve conter a senha original
            expect(result.sanitized).not.toContain(password);
            // Deve reportar que encontrou a senha
            expect(result.foundSecrets.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('deve mascarar credenciais em Database URLs', () => {
      fc.assert(
        fc.property(
          // Username: alfanumérico, sem caracteres especiais que quebram URLs
          fc.string({ minLength: 4, maxLength: 10 }).filter(s => /^[a-zA-Z0-9_-]{4,}$/.test(s)),
          // Password: alfanumérico com alguns caracteres especiais seguros
          fc.string({ minLength: 8, maxLength: 16 }).filter(s => /^[a-zA-Z0-9!#$%&*+=_-]{8,}$/.test(s)),
          fc.domain(),
          fc.integer({ min: 1000, max: 9999 }),
          (username, password, host, port) => {
            const dbUrl = `postgresql://${username}:${password}@${host}:${port}/database`;
            const result = sanitize(dbUrl);
            
            // O resultado não deve conter username ou password originais
            expect(result.sanitized).not.toContain(username);
            expect(result.sanitized).not.toContain(password);
            // Deve reportar que encontrou credenciais
            expect(result.foundSecrets.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('containsSecrets', () => {
    it('deve detectar qualquer padrão sensível conhecido', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'AKIAIOSFODNN7EXAMPLE',
            'sk_live_FAKE_KEY_FOR_TESTING_ONLY_123456',
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
            'password: mySecretPass123',
            'postgresql://user:pass@localhost:5432/db'
          ),
          (secretContent) => {
            expect(containsSecrets(secretContent)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('não deve detectar falsos positivos em conteúdo seguro', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'This is a normal text',
            'No secrets here',
            'Just some documentation',
            'API endpoint: /api/users',
            'Database: PostgreSQL 14'
          ),
          (safeContent) => {
            expect(containsSecrets(safeContent)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('sanitizeObject', () => {
    it('deve sanitizar strings em objetos aninhados', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string({ minLength: 16, maxLength: 16 }).map(s => 
            'AKIA' + s.toUpperCase().replace(/[^A-Z0-9]/g, 'A')
          ),
          (normalValue, awsKey) => {
            const obj = {
              safe: normalValue,
              nested: {
                secret: awsKey,
                alsoSafe: 'test'
              },
              array: [normalValue, awsKey]
            };
            
            const sanitized = sanitizeObject(obj);
            
            // Valores seguros devem permanecer
            expect(sanitized.safe).toBe(normalValue);
            expect(sanitized.nested.alsoSafe).toBe('test');
            
            // Segredos devem ser mascarados
            expect(sanitized.nested.secret).not.toBe(awsKey);
            expect(sanitized.array[1]).not.toBe(awsKey);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('maskValue', () => {
    it('deve manter apenas os caracteres especificados visíveis', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.integer({ min: 1, max: 5 }),
          (value, visibleChars) => {
            const masked = maskValue(value, visibleChars);
            
            if (value.length > visibleChars * 2) {
              // Deve começar com os primeiros caracteres
              expect(masked.startsWith(value.substring(0, visibleChars))).toBe(true);
              
              // Deve terminar com os últimos caracteres
              expect(masked.endsWith(value.substring(value.length - visibleChars))).toBe(true);
              
              // Deve ter o mesmo comprimento
              expect(masked.length).toBe(value.length);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('sanitizeUrl', () => {
    it('deve remover credenciais de URLs válidas', () => {
      // Teste com exemplos específicos de URLs válidas
      const testCases = [
        {
          input: 'https://user:pass123@example.com/path',
          expected: '****:****@'
        },
        {
          input: 'postgresql://dbuser:dbpass@localhost:5432/mydb',
          expected: '****:****@'
        },
        {
          input: 'https://admin:secret@api.example.com/v1/users',
          expected: '****:****@'
        }
      ];
      
      for (const testCase of testCases) {
        const sanitized = sanitizeUrl(testCase.input);
        expect(sanitized).toContain(testCase.expected);
      }
    });

    it('deve remover query params sensíveis de URLs', () => {
      // Teste com exemplos específicos de query params
      const testCases = [
        {
          input: 'https://api.example.com/data?token=abc123xyz',
          param: 'token'
        },
        {
          input: 'https://example.com/api?key=myapikey123&other=value',
          param: 'key'
        },
        {
          input: 'https://example.com/endpoint?secret=topsecret',
          param: 'secret'
        }
      ];
      
      for (const testCase of testCases) {
        const sanitized = sanitizeUrl(testCase.input);
        expect(sanitized).toContain(`${testCase.param}=****`);
      }
    });
  });

  describe('validateSafe', () => {
    it('deve lançar erro se encontrar valores sensíveis', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 16, maxLength: 16 }).map(s => 
            'AKIA' + s.toUpperCase().replace(/[^A-Z0-9]/g, 'A')
          ),
          (awsKey) => {
            expect(() => {
              validateSafe(awsKey, 'test context');
            }).toThrow(/SECURITY VIOLATION/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('não deve lançar erro para conteúdo seguro', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'This is safe content',
            'No secrets here',
            'Just documentation'
          ),
          (safeContent) => {
            expect(() => {
              validateSafe(safeContent, 'test context');
            }).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Testes de Integração', () => {
    it('deve sanitizar múltiplos tipos de segredos em um único texto', () => {
      const content = `
        AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
        STRIPE_KEY=sk_live_FAKE_KEY_FOR_TESTING_ONLY_123456
        password: mySecretPass123
        DATABASE_URL=postgresql://user:pass@localhost:5432/db
      `;
      
      const result = sanitize(content);
      
      // Não deve conter nenhum segredo original
      expect(result.sanitized).not.toContain('AKIAIOSFODNN7EXAMPLE');
      expect(result.sanitized).not.toContain('sk_live_FAKE_KEY_FOR_TESTING_ONLY_123456');
      expect(result.sanitized).not.toContain('mySecretPass123');
      expect(result.sanitized).not.toContain('user:pass');
      
      // Deve reportar todos os segredos encontrados
      expect(result.foundSecrets.length).toBeGreaterThan(0);
    });
  });
});

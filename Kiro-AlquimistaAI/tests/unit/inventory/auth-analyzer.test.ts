/**
 * Testes de Propriedade para Analisador de Autenticação
 * Feature: system-inventory-documentation, Property 10: Ausência de Valores Sensíveis
 * Valida: Requirements 5.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateNoPasswords } from '../../../scripts/inventory/analyzers/auth-analyzer';
import type { CognitoInfo, CognitoUserInfo } from '../../../scripts/inventory/types';

describe('Analisador de Autenticacao - Property-Based Tests', () => {
  /**
   * Property 10: Ausência de Valores Sensíveis
   * Para qualquer conjunto de usuários Cognito, nenhum deve conter
   * campos de senha ou outros valores sensíveis
   */
  describe('Property 10: Ausencia de Valores Sensiveis', () => {
    it('deve garantir que nenhum usuario contenha campo de senha', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              email: fc.emailAddress(),
              groups: fc.array(
                fc.constantFrom('INTERNAL_ADMIN', 'INTERNAL_SUPPORT', 'TENANT_ADMIN', 'TENANT_USER'),
                { minLength: 1, maxLength: 2 }
              )
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (users) => {
            const cognitoInfo: CognitoInfo = {
              userPool: {
                name: 'test-pool',
                region: 'us-east-1',
                id: 'us-east-1_TEST123',
                clientIds: ['test-client-id'],
                hostedUiDomain: 'test.auth.us-east-1.amazoncognito.com'
              },
              groups: [
                { name: 'INTERNAL_ADMIN', role: 'Admin' }
              ],
              users: users as CognitoUserInfo[]
            };
            
            // Validar que não lança exceção
            expect(() => validateNoPasswords(cognitoInfo)).not.toThrow();
            
            // Validar que nenhum usuário tem campos proibidos
            for (const user of cognitoInfo.users) {
              const userObj = user as any;
              expect(userObj).not.toHaveProperty('password');
              expect(userObj).not.toHaveProperty('passwd');
              expect(userObj).not.toHaveProperty('pwd');
              expect(userObj).not.toHaveProperty('secret');
              expect(userObj).not.toHaveProperty('token');
              expect(userObj).not.toHaveProperty('key');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('deve rejeitar dados que contenham campos de senha', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 20 }),
          fc.constantFrom('password', 'passwd', 'pwd', 'secret', 'token', 'key'),
          (email, secretValue, fieldName) => {
            const cognitoInfo: CognitoInfo = {
              userPool: {
                name: 'test-pool',
                region: 'us-east-1',
                id: 'us-east-1_TEST123',
                clientIds: ['test-client-id'],
                hostedUiDomain: 'test.auth.us-east-1.amazoncognito.com'
              },
              groups: [
                { name: 'INTERNAL_ADMIN', role: 'Admin' }
              ],
              users: [
                {
                  email,
                  groups: ['INTERNAL_ADMIN'],
                  [fieldName]: secretValue
                } as any
              ]
            };
            
            // Deve lançar exceção de violação de segurança
            expect(() => validateNoPasswords(cognitoInfo)).toThrow(/SECURITY VIOLATION/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('deve validar que apenas email e groups estão presentes', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              email: fc.emailAddress(),
              groups: fc.array(
                fc.constantFrom('INTERNAL_ADMIN', 'INTERNAL_SUPPORT', 'TENANT_ADMIN', 'TENANT_USER'),
                { minLength: 1, maxLength: 3 }
              )
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (users) => {
            const cognitoInfo: CognitoInfo = {
              userPool: {
                name: 'test-pool',
                region: 'us-east-1',
                id: 'us-east-1_TEST123',
                clientIds: ['test-client-id'],
                hostedUiDomain: 'test.auth.us-east-1.amazoncognito.com'
              },
              groups: [
                { name: 'INTERNAL_ADMIN', role: 'Admin' }
              ],
              users: users as CognitoUserInfo[]
            };
            
            // Validar que não lança exceção
            expect(() => validateNoPasswords(cognitoInfo)).not.toThrow();
            
            // Validar que cada usuário tem apenas email e groups
            for (const user of cognitoInfo.users) {
              const userKeys = Object.keys(user);
              expect(userKeys).toContain('email');
              expect(userKeys).toContain('groups');
              
              // Não deve ter outros campos além de email e groups
              const allowedKeys = ['email', 'groups'];
              for (const key of userKeys) {
                expect(allowedKeys).toContain(key);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('deve validar múltiplos usuários simultaneamente', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              email: fc.emailAddress(),
              groups: fc.array(
                fc.constantFrom('INTERNAL_ADMIN', 'INTERNAL_SUPPORT', 'TENANT_ADMIN', 'TENANT_USER'),
                { minLength: 1, maxLength: 4 }
              )
            }),
            { minLength: 2, maxLength: 20 }
          ),
          (users) => {
            const cognitoInfo: CognitoInfo = {
              userPool: {
                name: 'test-pool',
                region: 'us-east-1',
                id: 'us-east-1_TEST123',
                clientIds: ['test-client-id'],
                hostedUiDomain: 'test.auth.us-east-1.amazoncognito.com'
              },
              groups: [
                { name: 'INTERNAL_ADMIN', role: 'Admin' },
                { name: 'TENANT_USER', role: 'User' }
              ],
              users: users as CognitoUserInfo[]
            };
            
            // Validar que não lança exceção para múltiplos usuários
            expect(() => validateNoPasswords(cognitoInfo)).not.toThrow();
            
            // Validar que todos os usuários estão limpos
            expect(cognitoInfo.users.length).toBeGreaterThan(1);
            for (const user of cognitoInfo.users) {
              expect(user.email).toBeTruthy();
              expect(user.groups.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

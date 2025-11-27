/**
 * Testes unitários para authorization-middleware
 */

import { describe, it, expect } from 'vitest';
import {
  extractAuthContext,
  requireInternal,
  requireTenantAccess,
  requireTenantWrite,
  hasGroup,
  hasAnyGroup,
  UserGroup,
  AuthorizationError
} from '../../lambda/shared/authorization-middleware';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

describe('authorization-middleware', () => {
  describe('extractAuthContext', () => {
    it('deve extrair contexto de autenticação válido', () => {
      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                sub: 'user-123',
                email: 'user@example.com',
                'cognito:groups': ['TENANT_ADMIN'],
                'custom:tenant_id': 'tenant-456',
                'custom:company_name': 'Test Company',
                'custom:user_role': 'admin'
              }
            }
          }
        }
      } as any as APIGatewayProxyEventV2;

      const context = extractAuthContext(event);

      expect(context.userId).toBe('user-123');
      expect(context.email).toBe('user@example.com');
      expect(context.groups).toEqual(['TENANT_ADMIN']);
      expect(context.tenantId).toBe('tenant-456');
      expect(context.companyName).toBe('Test Company');
      expect(context.userRole).toBe('admin');
    });

    it('deve lançar erro se token ausente', () => {
      const event = {
        requestContext: {}
      } as any as APIGatewayProxyEventV2;

      expect(() => extractAuthContext(event)).toThrow(AuthorizationError);
    });

    it('deve lançar erro se sub ausente', () => {
      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                email: 'user@example.com'
              }
            }
          }
        }
      } as any as APIGatewayProxyEventV2;

      expect(() => extractAuthContext(event)).toThrow('User ID não encontrado');
    });
  });

  describe('requireInternal', () => {
    it('deve permitir INTERNAL_ADMIN', () => {
      const context = {
        userId: 'user-1',
        email: 'admin@alquimista.ai',
        groups: ['INTERNAL_ADMIN']
      };

      expect(() => requireInternal(context)).not.toThrow();
    });

    it('deve permitir INTERNAL_SUPPORT', () => {
      const context = {
        userId: 'user-2',
        email: 'support@alquimista.ai',
        groups: ['INTERNAL_SUPPORT']
      };

      expect(() => requireInternal(context)).not.toThrow();
    });

    it('deve negar acesso a TENANT_ADMIN', () => {
      const context = {
        userId: 'user-3',
        email: 'admin@tenant.com',
        groups: ['TENANT_ADMIN']
      };

      expect(() => requireInternal(context)).toThrow('usuário interno');
    });

    it('deve negar INTERNAL_SUPPORT quando requireAdmin=true', () => {
      const context = {
        userId: 'user-2',
        email: 'support@alquimista.ai',
        groups: ['INTERNAL_SUPPORT']
      };

      expect(() => requireInternal(context, true)).toThrow('administrador interno');
    });
  });

  describe('requireTenantAccess', () => {
    it('deve permitir acesso interno a qualquer tenant', () => {
      const context = {
        userId: 'user-1',
        email: 'admin@alquimista.ai',
        groups: ['INTERNAL_ADMIN']
      };

      expect(() => requireTenantAccess(context, 'any-tenant')).not.toThrow();
    });

    it('deve permitir acesso ao próprio tenant', () => {
      const context = {
        userId: 'user-3',
        email: 'admin@tenant.com',
        groups: ['TENANT_ADMIN'],
        tenantId: 'tenant-123'
      };

      expect(() => requireTenantAccess(context, 'tenant-123')).not.toThrow();
    });

    it('deve negar acesso a outro tenant', () => {
      const context = {
        userId: 'user-3',
        email: 'admin@tenant.com',
        groups: ['TENANT_ADMIN'],
        tenantId: 'tenant-123'
      };

      expect(() => requireTenantAccess(context, 'tenant-456')).toThrow('não tem permissão');
    });

    it('deve negar acesso se tenant_id ausente', () => {
      const context = {
        userId: 'user-3',
        email: 'admin@tenant.com',
        groups: ['TENANT_ADMIN']
      };

      expect(() => requireTenantAccess(context, 'tenant-123')).toThrow('tenant_id não configurado');
    });
  });

  describe('requireTenantWrite', () => {
    it('deve permitir escrita para INTERNAL_ADMIN', () => {
      const context = {
        userId: 'user-1',
        email: 'admin@alquimista.ai',
        groups: ['INTERNAL_ADMIN']
      };

      expect(() => requireTenantWrite(context)).not.toThrow();
    });

    it('deve permitir escrita para TENANT_ADMIN', () => {
      const context = {
        userId: 'user-3',
        email: 'admin@tenant.com',
        groups: ['TENANT_ADMIN']
      };

      expect(() => requireTenantWrite(context)).not.toThrow();
    });

    it('deve negar escrita para TENANT_USER', () => {
      const context = {
        userId: 'user-4',
        email: 'user@tenant.com',
        groups: ['TENANT_USER']
      };

      expect(() => requireTenantWrite(context)).toThrow('administrador do tenant');
    });
  });

  describe('hasGroup', () => {
    it('deve retornar true se usuário tem o grupo', () => {
      const context = {
        userId: 'user-1',
        email: 'admin@alquimista.ai',
        groups: ['INTERNAL_ADMIN', 'INTERNAL_SUPPORT']
      };

      expect(hasGroup(context, UserGroup.INTERNAL_ADMIN)).toBe(true);
    });

    it('deve retornar false se usuário não tem o grupo', () => {
      const context = {
        userId: 'user-1',
        email: 'admin@alquimista.ai',
        groups: ['INTERNAL_SUPPORT']
      };

      expect(hasGroup(context, UserGroup.INTERNAL_ADMIN)).toBe(false);
    });
  });

  describe('hasAnyGroup', () => {
    it('deve retornar true se usuário tem qualquer grupo', () => {
      const context = {
        userId: 'user-1',
        email: 'admin@alquimista.ai',
        groups: ['INTERNAL_SUPPORT']
      };

      expect(hasAnyGroup(context, [UserGroup.INTERNAL_ADMIN, UserGroup.INTERNAL_SUPPORT])).toBe(true);
    });

    it('deve retornar false se usuário não tem nenhum grupo', () => {
      const context = {
        userId: 'user-1',
        email: 'admin@alquimista.ai',
        groups: ['TENANT_USER']
      };

      expect(hasAnyGroup(context, [UserGroup.INTERNAL_ADMIN, UserGroup.INTERNAL_SUPPORT])).toBe(false);
    });
  });
});

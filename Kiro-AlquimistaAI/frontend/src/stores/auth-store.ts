import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as cognitoClient from '@/lib/cognito-client';

/**
 * Claims do usuário extraídos do token JWT do Cognito
 */
interface UserClaims {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  'cognito:groups': string[];
  'custom:tenant_id'?: string;
  iss: string;
  iat: number;
  exp: number;
}

/**
 * Grupos de usuários do Cognito
 */
type UserGroup = 'INTERNAL_ADMIN' | 'INTERNAL_SUPPORT' | 'TENANT_ADMIN' | 'TENANT_USER';

/**
 * Estado de autenticação
 */
interface AuthState {
  // Estado do usuário
  claims: UserClaims | null;
  groups: string[];
  role: UserGroup | null;
  isAuthenticated: boolean;
  isInternal: boolean;
  tenantId: string | null;
  loading: boolean;

  // Ações
  setAuthFromToken: (idToken: string) => void;
  logout: () => void;
  clearAuth: () => void;
}

/**
 * Extrai claims do token JWT
 */
function extractClaimsFromToken(idToken: string): UserClaims {
  try {
    // Decodifica base64 de forma compatível com o navegador
    const base64Url = idToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    console.log('[Auth Store] Claims extraídos:', {
      sub: payload.sub,
      email: payload.email,
      groups: payload['cognito:groups'],
      tenantId: payload['custom:tenant_id'],
    });
    return payload;
  } catch (error) {
    console.error('[Auth Store] Erro ao extrair claims:', error);
    throw new Error('Token inválido');
  }
}

/**
 * Mapeia grupos do Cognito para role
 */
function mapGroupsToRole(groups: string[]): UserGroup | null {
  if (groups.includes('INTERNAL_ADMIN')) return 'INTERNAL_ADMIN';
  if (groups.includes('INTERNAL_SUPPORT')) return 'INTERNAL_SUPPORT';
  if (groups.includes('TENANT_ADMIN')) return 'TENANT_ADMIN';
  if (groups.includes('TENANT_USER')) return 'TENANT_USER';
  
  console.warn('[Auth Store] Nenhum grupo válido encontrado:', groups);
  return null;
}

/**
 * Determina se o usuário é interno
 */
function isInternalUser(groups: string[]): boolean {
  return groups.includes('INTERNAL_ADMIN') || groups.includes('INTERNAL_SUPPORT');
}

/**
 * Determina rota inicial baseada nos grupos
 */
export function determineInitialRoute(groups: string[]): string {
  const isInternal = isInternalUser(groups);
  const route = isInternal ? '/app/company' : '/app/dashboard';
  
  console.log('[Auth Store] Rota determinada:', { groups, isInternal, route });
  return route;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
      // Estado inicial
      claims: null,
      groups: [],
      role: null,
      isAuthenticated: false,
      isInternal: false,
      tenantId: null,
      loading: false,

      /**
       * Define autenticação a partir do ID token
       */
      setAuthFromToken: (idToken: string) => {
        try {
          console.log('[Auth Store] Processando autenticação');
          set({ loading: true });

          // Extrair claims do token
          const claims = extractClaimsFromToken(idToken);

          // Extrair grupos
          const groups = claims['cognito:groups'] || [];
          
          // Mapear para role
          const role = mapGroupsToRole(groups);
          
          // Determinar se é interno
          const isInternal = isInternalUser(groups);
          
          // Extrair tenant ID (se houver)
          const tenantId = claims['custom:tenant_id'] || null;

          console.log('[Auth Store] Autenticação configurada:', {
            email: claims.email,
            groups,
            role,
            isInternal,
            tenantId,
          });

          set({
            claims,
            groups,
            role,
            isAuthenticated: true,
            isInternal,
            tenantId,
            loading: false,
          });
        } catch (error) {
          console.error('[Auth Store] Erro ao configurar autenticação:', error);
          set({
            claims: null,
            groups: [],
            role: null,
            isAuthenticated: false,
            isInternal: false,
            tenantId: null,
            loading: false,
          });
          throw error;
        }
      },

      /**
       * Logout - limpa estado e cookies
       */
      logout: () => {
        console.log('[Auth Store] Fazendo logout');
        
        // Limpar cookies
        cognitoClient.clearTokensFromCookies();
        
        // Limpar estado
        set({
          claims: null,
          groups: [],
          role: null,
          isAuthenticated: false,
          isInternal: false,
          tenantId: null,
          loading: false,
        });

        // Redirecionar para logout do Cognito
        cognitoClient.initLogoutFlow();
      },

      /**
       * Limpa autenticação sem redirecionar
       */
      clearAuth: () => {
        console.log('[Auth Store] Limpando autenticação');
        
        set({
          claims: null,
          groups: [],
          role: null,
          isAuthenticated: false,
          isInternal: false,
          tenantId: null,
          loading: false,
        });
      },
    })
);

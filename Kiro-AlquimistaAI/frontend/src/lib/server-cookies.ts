/**
 * Funções server-side para gerenciar cookies HTTP-only
 * Estas funções devem ser usadas apenas em API Routes ou Server Components
 */

import { cookies } from 'next/headers';
import type { TokenSet } from './cognito-client';

/**
 * Armazena tokens em cookies HTTP-only seguros
 * Deve ser chamado apenas no servidor (API Routes)
 */
export function setTokenCookies(tokens: TokenSet): void {
  const cookieStore = cookies();
  
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: tokens.expiresIn || 3600,
    path: '/',
  };

  cookieStore.set('idToken', tokens.idToken, cookieOptions);
  cookieStore.set('accessToken', tokens.accessToken, cookieOptions);
  
  if (tokens.refreshToken) {
    cookieStore.set('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60, // 30 dias para refresh token
    });
  }

  console.log('[Server] Tokens armazenados em cookies HTTP-only');
}

/**
 * Recupera tokens dos cookies HTTP-only
 * Deve ser chamado apenas no servidor (API Routes, Middleware)
 */
export function getTokenCookies(): TokenSet | null {
  const cookieStore = cookies();
  
  const idToken = cookieStore.get('idToken')?.value;
  const accessToken = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (!idToken || !accessToken) {
    return null;
  }

  return {
    idToken,
    accessToken,
    refreshToken: refreshToken || '',
    expiresIn: 3600,
  };
}

/**
 * Limpa todos os cookies de autenticação
 * Deve ser chamado apenas no servidor (API Routes)
 */
export function clearTokenCookies(): void {
  const cookieStore = cookies();
  
  cookieStore.delete('idToken');
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');

  console.log('[Server] Cookies de autenticação limpos');
}

/**
 * Verifica se os tokens existem nos cookies
 */
export function hasTokenCookies(): boolean {
  const cookieStore = cookies();
  return !!(cookieStore.get('idToken') && cookieStore.get('accessToken'));
}

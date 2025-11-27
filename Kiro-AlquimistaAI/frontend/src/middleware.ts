import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Flag de Bypass para Testes E2E
 * 
 * IMPORTANTE: Esta flag permite desabilitar autenticação para testes E2E focados em UI.
 * 
 * ⚠️ SEGURANÇA:
 * - NUNCA setar em produção
 * - Usar apenas em ambiente de desenvolvimento/teste local
 * - Playwright E2E pode setar via .env.test ou variável de ambiente
 * 
 * Uso:
 * - NEXT_PUBLIC_E2E_BYPASS_AUTH=true (acessível no cliente)
 * - E2E_BYPASS_AUTH=true (apenas servidor)
 */

// Debug: Log das variáveis de ambiente na inicialização
console.log('[Middleware Init] E2E_BYPASS_AUTH:', process.env.E2E_BYPASS_AUTH);
console.log('[Middleware Init] NEXT_PUBLIC_E2E_BYPASS_AUTH:', process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH);
console.log('[Middleware Init] NODE_ENV:', process.env.NODE_ENV);

const isE2ETestBypassEnabled =
  process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === 'true' ||
  process.env.E2E_BYPASS_AUTH === 'true';

console.log('[Middleware Init] isE2ETestBypassEnabled:', isE2ETestBypassEnabled);

/**
 * Middleware Consolidado - Autenticação + Segurança
 * 
 * Combina:
 * 1. Proteção de rotas com validação de tokens JWT do Cognito
 * 2. Headers de segurança (CSP, X-Frame-Options, etc.)
 * 
 * Fluxo:
 * - Rotas públicas (/, /login, /auth/*): acesso livre
 * - Rotas protegidas (/app/*): requer autenticação
 * - Validação de tokens e grupos do Cognito
 * - Redirecionamento baseado em perfil (interno vs tenant)
 * 
 * Bypass E2E:
 * - Se E2E_BYPASS_AUTH=true, permite acesso a todas as rotas sem autenticação
 * - Usado apenas para testes Playwright focados em UI/fluxo
 * - NUNCA usar em produção
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================================================
  // BYPASS PARA TESTES E2E (DESENVOLVIMENTO APENAS)
  // ============================================================================
  if (isE2ETestBypassEnabled) {
    console.log('[Middleware] ⚠️ E2E Bypass ativado - autenticação desabilitada');
    console.log('[Middleware] Permitindo acesso direto a:', pathname);
    
    // Retornar resposta sem validação de autenticação
    // Headers de segurança ainda são aplicados abaixo
    const response = NextResponse.next();
    
    // Adicionar headers de segurança mesmo em bypass
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://www.gstatic.com;
      style-src 'self' 'unsafe-inline' https://www.gstatic.com;
      img-src 'self' data: https: blob:;
      font-src 'self' data: https://www.gstatic.com;
      connect-src 'self' https://api.alquimista.ai https://*.execute-api.us-east-1.amazonaws.com https://*.amazoncognito.com wss://;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s{2,}/g, ' ').trim();

    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    return response;
  }

  console.log('[Middleware] Processando:', pathname);

  // ============================================================================
  // 1. ROTAS PÚBLICAS - Não requerem autenticação
  // ============================================================================
  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/confirm',
    '/auth/callback',
    '/auth/logout',
    '/auth/logout-callback',
    '/api/auth/session',
  ];

  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );

  // Criar resposta base
  let response = NextResponse.next();

  // ============================================================================
  // 2. ADICIONAR HEADERS DE SEGURANÇA
  // ============================================================================
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://www.gstatic.com;
    style-src 'self' 'unsafe-inline' https://www.gstatic.com;
    img-src 'self' data: https: blob:;
    font-src 'self' data: https://www.gstatic.com;
    connect-src 'self' https://api.alquimista.ai https://*.execute-api.us-east-1.amazonaws.com https://*.amazoncognito.com wss://;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Se for rota pública, retornar com headers de segurança
  if (isPublicPath) {
    console.log('[Middleware] Rota pública, permitindo acesso');
    return response;
  }

  // ============================================================================
  // 3. ROTAS PROTEGIDAS - Requerem autenticação
  // ============================================================================
  const isProtectedPath = pathname.startsWith('/app') || 
                          pathname.startsWith('/dashboard') ||
                          pathname.startsWith('/agents') ||
                          pathname.startsWith('/analytics') ||
                          pathname.startsWith('/settings') ||
                          pathname.startsWith('/onboarding') ||
                          pathname.startsWith('/company');

  if (isProtectedPath) {
    // Validar presença de tokens
    const accessToken = request.cookies.get('accessToken');
    const idToken = request.cookies.get('idToken');

    if (!accessToken || !idToken) {
      console.log('[Middleware] Tokens ausentes, redirecionando para login');
      
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      
      response = NextResponse.redirect(loginUrl);
      
      // Adicionar headers de segurança à resposta de redirect
      response.headers.set('Content-Security-Policy', cspHeader);
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      
      return response;
    }

    // Em desenvolvimento, permitir tokens mock para testes E2E
    if (process.env.NODE_ENV === 'development') {
      // Verificar se é um token mock (contém 'mock-signature' ou tem formato mock)
      const isMockToken = idToken.value.includes('mock-signature') || 
                          idToken.value.startsWith('eyJ') && idToken.value.includes('mock');
      
      if (isMockToken) {
        console.log('[Middleware] Token mock detectado em DEV, permitindo acesso');
        return response;
      }
    }

    // Validar token e extrair grupos
    try {
      const payload = JSON.parse(
        Buffer.from(idToken.value.split('.')[1], 'base64').toString()
      );

      const now = Math.floor(Date.now() / 1000);
      
      // Validar expiração
      if (payload.exp && payload.exp < now) {
        console.log('[Middleware] Token expirado, limpando cookies');
        
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        loginUrl.searchParams.set('expired', 'true');
        
        response = NextResponse.redirect(loginUrl);
        response.cookies.delete('accessToken');
        response.cookies.delete('idToken');
        response.cookies.delete('refreshToken');
        
        // Adicionar headers de segurança
        response.headers.set('Content-Security-Policy', cspHeader);
        response.headers.set('X-Frame-Options', 'DENY');
        
        return response;
      }

      // Extrair grupos
      const groups: string[] = payload['cognito:groups'] || [];
      const isInternal = groups.includes('INTERNAL_ADMIN') || groups.includes('INTERNAL_SUPPORT');
      const isTenant = groups.includes('TENANT_ADMIN') || groups.includes('TENANT_USER');

      console.log('[Middleware] Validação:', { pathname, groups, isInternal, isTenant });

      // Redirecionar /app para dashboard apropriado
      if (pathname === '/app' || pathname === '/app/') {
        const targetUrl = isInternal ? '/app/company' : '/app/dashboard';
        console.log('[Middleware] Redirecionando /app para:', targetUrl);
        
        response = NextResponse.redirect(new URL(targetUrl, request.url));
        response.headers.set('Content-Security-Policy', cspHeader);
        return response;
      }

      // Proteger rotas internas
      if (pathname.startsWith('/app/company')) {
        if (!isInternal) {
          console.warn('[Middleware] Acesso negado: tenant tentando acessar área interna');
          
          const dashboardUrl = new URL('/app/dashboard', request.url);
          dashboardUrl.searchParams.set('error', 'forbidden');
          
          response = NextResponse.redirect(dashboardUrl);
          response.headers.set('Content-Security-Policy', cspHeader);
          return response;
        }
      }

      // Redirecionar usuários internos de /app/dashboard para /app/company
      if (pathname.startsWith('/app/dashboard')) {
        if (isInternal) {
          console.log('[Middleware] Redirecionando interno de dashboard para company');
          
          response = NextResponse.redirect(new URL('/app/company', request.url));
          response.headers.set('Content-Security-Policy', cspHeader);
          return response;
        }
        
        if (!isTenant) {
          console.warn('[Middleware] Acesso negado: sem grupo válido');
          
          const loginUrl = new URL('/login', request.url);
          loginUrl.searchParams.set('error', 'unauthorized');
          
          response = NextResponse.redirect(loginUrl);
          response.headers.set('Content-Security-Policy', cspHeader);
          return response;
        }
      }

    } catch (error) {
      console.error('[Middleware] Erro ao validar token:', error);
      
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('error', 'invalid_token');
      
      response = NextResponse.redirect(loginUrl);
      response.cookies.delete('accessToken');
      response.cookies.delete('idToken');
      response.cookies.delete('refreshToken');
      
      response.headers.set('Content-Security-Policy', cspHeader);
      return response;
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

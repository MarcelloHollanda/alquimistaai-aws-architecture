/**
 * Flags de Bypass para Testes E2E
 * 
 * Centraliza a lógica de verificação de modo E2E para evitar duplicação
 * e garantir consistência entre middleware, layouts e componentes.
 * 
 * ⚠️ SEGURANÇA:
 * - NUNCA usar em produção
 * - Apenas para desenvolvimento/testes locais
 * - Playwright E2E seta essas variáveis automaticamente
 */

/**
 * Verifica se o bypass de autenticação E2E está ativado
 * 
 * Funciona tanto em Server Components quanto Client Components:
 * - NEXT_PUBLIC_E2E_BYPASS_AUTH: exposta no bundle do cliente
 * - E2E_BYPASS_AUTH: apenas no servidor
 * 
 * @returns true se o bypass E2E estiver ativado
 */
export const isE2ETestBypassEnabled =
  process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === 'true' ||
  process.env.E2E_BYPASS_AUTH === 'true';

/**
 * Verifica se o bypass E2E está ativado no cliente (browser)
 * 
 * Usa apenas variáveis NEXT_PUBLIC_* que são expostas no bundle.
 * Útil para componentes client-side que precisam verificar o modo E2E.
 * 
 * @returns true se o bypass E2E estiver ativado no cliente
 */
export const isE2ETestBypassEnabledClient = 
  typeof window !== 'undefined' && 
  process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === 'true';

/**
 * Log de debug para modo E2E
 * 
 * Imprime informações sobre o estado do bypass E2E.
 * Útil para diagnóstico de problemas em testes.
 * 
 * @param context - Contexto onde o log está sendo chamado (ex: 'DashboardLayout', 'ProtectedRoute')
 */
export function logE2EBypassStatus(context: string): void {
  if (typeof window !== 'undefined') {
    console.log(`[${context}] E2E Bypass Status:`, {
      NEXT_PUBLIC_E2E_BYPASS_AUTH: process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH,
      isE2ETestBypassEnabled: isE2ETestBypassEnabledClient,
    });
  } else {
    console.log(`[${context}] E2E Bypass Status (Server):`, {
      E2E_BYPASS_AUTH: process.env.E2E_BYPASS_AUTH,
      NEXT_PUBLIC_E2E_BYPASS_AUTH: process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH,
      isE2ETestBypassEnabled,
    });
  }
}

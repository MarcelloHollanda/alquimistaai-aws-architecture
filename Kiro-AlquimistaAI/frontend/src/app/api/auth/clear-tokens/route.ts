/**
 * API Route para limpar cookies de autenticação
 * Chamada durante o processo de logout
 */

import { NextResponse } from 'next/server';
import { clearTokenCookies } from '@/lib/server-cookies';

export async function POST() {
  try {
    // Limpar cookies HTTP-only
    clearTokenCookies();

    console.log('[API] Cookies limpos com sucesso');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Erro ao limpar cookies:', error);
    return NextResponse.json(
      { error: 'Erro ao limpar cookies' },
      { status: 500 }
    );
  }
}

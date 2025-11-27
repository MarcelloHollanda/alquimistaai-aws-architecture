/**
 * API Route para armazenar tokens em cookies HTTP-only
 * Chamada pela página de callback após trocar código por tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { setTokenCookies } from '@/lib/server-cookies';
import type { TokenSet } from '@/lib/cognito-client';

export async function POST(request: NextRequest) {
  try {
    const tokens: TokenSet = await request.json();

    // Validar que os tokens foram fornecidos
    if (!tokens.idToken || !tokens.accessToken) {
      return NextResponse.json(
        { error: 'Tokens inválidos' },
        { status: 400 }
      );
    }

    // Armazenar tokens em cookies HTTP-only
    setTokenCookies(tokens);

    console.log('[API] Tokens armazenados com sucesso');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Erro ao armazenar tokens:', error);
    return NextResponse.json(
      { error: 'Erro ao armazenar tokens' },
      { status: 500 }
    );
  }
}

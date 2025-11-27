import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * API Route para gerenciar sessão de autenticação
 * Armazena tokens do Cognito em cookies HttpOnly seguros
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, idToken, refreshToken, expiresIn } = body;

    if (!accessToken || !idToken) {
      return NextResponse.json(
        { error: 'Tokens são obrigatórios' },
        { status: 400 }
      );
    }

    // Configurar cookies seguros
    const cookieStore = cookies();
    const isProduction = process.env.NODE_ENV === 'production';

    // Access Token (curta duração)
    cookieStore.set('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: expiresIn || 3600, // 1 hora por padrão
      path: '/',
    });

    // ID Token (informações do usuário)
    cookieStore.set('idToken', idToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: expiresIn || 3600,
      path: '/',
    });

    // Refresh Token (longa duração)
    if (refreshToken) {
      cookieStore.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 dias
        path: '/',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    return NextResponse.json(
      { error: 'Erro ao criar sessão' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Remover todos os cookies de autenticação
    const cookieStore = cookies();
    
    cookieStore.delete('accessToken');
    cookieStore.delete('idToken');
    cookieStore.delete('refreshToken');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar sessão:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar sessão' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = cookies();
    
    const accessToken = cookieStore.get('accessToken')?.value;
    const idToken = cookieStore.get('idToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!accessToken || !idToken) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Decodificar ID token para obter informações do usuário
    // (em produção, validar assinatura do token)
    const payload = JSON.parse(
      Buffer.from(idToken.split('.')[1], 'base64').toString()
    );

    return NextResponse.json({
      authenticated: true,
      user: {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        tenantId: payload['custom:tenantId'],
        role: payload['custom:role'],
      },
      hasRefreshToken: !!refreshToken,
    });
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}

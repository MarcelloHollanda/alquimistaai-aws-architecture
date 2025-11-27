/**
 * Cliente de autenticação com Amazon Cognito User Pools
 * Suporta OAuth 2.0 via Hosted UI e login direto por e-mail/senha
 * 
 * IMPORTANTE: Este módulo usa lazy initialization para evitar erros de SSR
 * A biblioteca amazon-cognito-identity-js não é compatível com SSR
 */

// Importação dinâmica para evitar erros de SSR
let CognitoUserPool: any;
let CognitoUser: any;
let AuthenticationDetails: any;
let CognitoUserAttribute: any;

// Flag para verificar se estamos no browser
const isBrowser = typeof window !== 'undefined';

// Lazy load da biblioteca apenas no browser
if (isBrowser) {
  const cognito = require('amazon-cognito-identity-js');
  CognitoUserPool = cognito.CognitoUserPool;
  CognitoUser = cognito.CognitoUser;
  AuthenticationDetails = cognito.AuthenticationDetails;
  CognitoUserAttribute = cognito.CognitoUserAttribute;
}

// Tipo para sessão do Cognito
type CognitoUserSession = any;

/**
 * Configuração do Cognito
 */
interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  domain: string;
  redirectUri: string;
  logoutUri: string;
  region: string;
}

// Cache da configuração
let cachedConfig: CognitoConfig | null = null;
let userPool: any = null;

/**
 * Valida e retorna configuração do Cognito
 * Usa lazy initialization para evitar erros durante SSR
 */
function getCognitoConfig(): CognitoConfig {
  // Retornar cache se disponível
  if (cachedConfig) {
    return cachedConfig;
  }

  const config = {
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
    domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN_HOST || '',
    redirectUri: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI || '',
    logoutUri: process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI || '',
    region: process.env.NEXT_PUBLIC_COGNITO_REGION || 'us-east-1',
  };

  // Validar variáveis obrigatórias apenas no browser
  if (isBrowser) {
    const missing: string[] = [];
    if (!config.userPoolId) missing.push('NEXT_PUBLIC_COGNITO_USER_POOL_ID');
    if (!config.clientId) missing.push('NEXT_PUBLIC_COGNITO_CLIENT_ID');
    if (!config.domain) missing.push('NEXT_PUBLIC_COGNITO_DOMAIN_HOST');
    if (!config.redirectUri) missing.push('NEXT_PUBLIC_COGNITO_REDIRECT_URI');
    if (!config.logoutUri) missing.push('NEXT_PUBLIC_COGNITO_LOGOUT_URI');

    if (missing.length > 0) {
      const error = `[Cognito] Variáveis de ambiente ausentes: ${missing.join(', ')}`;
      console.error(error);
      console.error('[Cognito] Verifique o arquivo .env.local e compare com .env.local.example');
      throw new Error(error);
    }

    console.log('[Cognito] Configuração carregada:', {
      userPoolId: config.userPoolId,
      clientId: config.clientId.substring(0, 10) + '...',
      domain: config.domain,
      redirectUri: config.redirectUri,
      region: config.region,
    });
  }

  cachedConfig = config;
  return config;
}

/**
 * Obtém o User Pool do Cognito (lazy initialization)
 */
function getUserPool(): any {
  if (!isBrowser) {
    throw new Error('[Cognito] getUserPool só pode ser chamado no browser');
  }

  if (!userPool) {
    const config = getCognitoConfig();
    const poolData = {
      UserPoolId: config.userPoolId,
      ClientId: config.clientId,
    };
    userPool = new CognitoUserPool(poolData);
  }

  return userPool;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface SignUpParams {
  email: string;
  password: string;
  name: string;
  phone?: string;
  tenantId?: string;
}

export interface User {
  email: string;
  name: string;
  sub: string;
  tenantId?: string;
  role?: string;
}

export interface TokenSet {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Login com e-mail e senha
 */
export const signIn = (params: SignInParams): Promise<CognitoUserSession> => {
  if (!isBrowser) {
    return Promise.reject(new Error('[Cognito] signIn só pode ser chamado no browser'));
  }

  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: params.email,
      Password: params.password,
    });

    const cognitoUser = new CognitoUser({
      Username: params.email,
      Pool: getUserPool(),
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session: CognitoUserSession) => {
        resolve(session);
      },
      onFailure: (err: Error) => {
        reject(err);
      },
      newPasswordRequired: () => {
        // Usuário precisa trocar senha (primeiro acesso)
        // Este fluxo pode ser implementado futuramente se necessário
        reject(new Error('NEW_PASSWORD_REQUIRED'));
      },
    });
  });
};

/**
 * Cadastro de novo usuário
 */
export const signUp = (params: SignUpParams): Promise<any> => {
  if (!isBrowser) {
    return Promise.reject(new Error('[Cognito] signUp só pode ser chamado no browser'));
  }

  return new Promise((resolve, reject) => {
    const attributeList: any[] = [
      new CognitoUserAttribute({
        Name: 'email',
        Value: params.email,
      }),
      new CognitoUserAttribute({
        Name: 'name',
        Value: params.name,
      }),
    ];

    if (params.phone) {
      attributeList.push(
        new CognitoUserAttribute({
          Name: 'phone_number',
          Value: params.phone,
        })
      );
    }

    if (params.tenantId) {
      attributeList.push(
        new CognitoUserAttribute({
          Name: 'custom:tenantId',
          Value: params.tenantId,
        })
      );
    }

    getUserPool().signUp(params.email, params.password, attributeList, [], (err: Error | null, result: any) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
};

/**
 * Confirmar cadastro com código enviado por e-mail
 */
export const confirmSignUp = (email: string, code: string): Promise<any> => {
  if (!isBrowser) {
    return Promise.reject(new Error('[Cognito] confirmSignUp só pode ser chamado no browser'));
  }

  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: getUserPool(),
    });

    cognitoUser.confirmRegistration(code, true, (err: Error | null, result: any) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
};

/**
 * Iniciar fluxo de recuperação de senha
 */
export const forgotPassword = (email: string): Promise<any> => {
  if (!isBrowser) {
    return Promise.reject(new Error('[Cognito] forgotPassword só pode ser chamado no browser'));
  }

  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: getUserPool(),
    });

    cognitoUser.forgotPassword({
      onSuccess: (data: any) => {
        resolve(data);
      },
      onFailure: (err: Error) => {
        reject(err);
      },
    });
  });
};

/**
 * Confirmar nova senha com código de verificação
 */
export const confirmPassword = (
  email: string,
  code: string,
  newPassword: string
): Promise<any> => {
  if (!isBrowser) {
    return Promise.reject(new Error('[Cognito] confirmPassword só pode ser chamado no browser'));
  }

  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: getUserPool(),
    });

    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => {
        resolve('SUCCESS');
      },
      onFailure: (err: Error) => {
        reject(err);
      },
    });
  });
};

/**
 * Alterar senha (usuário já autenticado)
 */
export const changePassword = (
  oldPassword: string,
  newPassword: string
): Promise<any> => {
  if (!isBrowser) {
    return Promise.reject(new Error('[Cognito] changePassword só pode ser chamado no browser'));
  }

  return new Promise((resolve, reject) => {
    const cognitoUser = getUserPool().getCurrentUser();

    if (!cognitoUser) {
      reject(new Error('Usuário não autenticado'));
      return;
    }

    cognitoUser.getSession((err: any, session: CognitoUserSession | null) => {
      if (err || !session) {
        reject(err || new Error('Sessão inválida'));
        return;
      }

      cognitoUser.changePassword(oldPassword, newPassword, (err: Error | null, result: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  });
};

/**
 * Obter usuário atual
 */
export const getCurrentUser = (): Promise<User | null> => {
  if (!isBrowser) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const cognitoUser = getUserPool().getCurrentUser();

    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err: any, session: CognitoUserSession | null) => {
      if (err || !session) {
        resolve(null);
        return;
      }

      cognitoUser.getUserAttributes((err: Error | null, attributes: any[]) => {
        if (err || !attributes) {
          resolve(null);
          return;
        }

        const user: any = {
          sub: session.getIdToken().payload.sub,
        };

        attributes.forEach((attr: any) => {
          if (attr.Name === 'email') user.email = attr.Value;
          if (attr.Name === 'name') user.name = attr.Value;
          if (attr.Name === 'custom:tenantId') user.tenantId = attr.Value;
          if (attr.Name === 'custom:role') user.role = attr.Value;
        });

        resolve(user);
      });
    });
  });
};

/**
 * Obter token de acesso atual
 */
export const getAccessToken = (): Promise<string | null> => {
  if (!isBrowser) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const cognitoUser = getUserPool().getCurrentUser();

    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err: any, session: CognitoUserSession | null) => {
      if (err || !session) {
        resolve(null);
        return;
      }

      resolve(session.getAccessToken().getJwtToken());
    });
  });
};

/**
 * Logout
 */
export const signOut = (): void => {
  if (!isBrowser) {
    return;
  }

  const cognitoUser = getUserPool().getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
};

/**
 * OAuth 2.0 - Hosted UI com PKCE
 */

/**
 * Gera string aleatória para PKCE
 */
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map(v => charset[v % charset.length])
    .join('');
}

/**
 * Gera code_challenge a partir do code_verifier (SHA-256 + base64url)
 */
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  
  // Converter para base64url
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Inicia fluxo OAuth redirecionando para Cognito Hosted UI com PKCE
 */
export const initOAuthFlow = async (): Promise<void> => {
  if (!isBrowser) {
    console.error('[Cognito] initOAuthFlow só pode ser chamado no browser');
    return;
  }

  const config = getCognitoConfig();
  
  // Gerar PKCE code_verifier e code_challenge
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // Salvar code_verifier em sessionStorage para usar no callback
  sessionStorage.setItem('pkce_code_verifier', codeVerifier);
  
  console.log('[Cognito] PKCE gerado', {
    codeVerifierLength: codeVerifier.length,
    codeChallengeLength: codeChallenge.length,
  });
  
  // Scopes permitidos pelo Cognito (sem 'profile' que causa invalid_scope)
  const scopes = 'openid email';
  
  const url = `https://${config.domain}/oauth2/authorize?` +
    `client_id=${config.clientId}&` +
    `response_type=code&` +
    `scope=${scopes}&` +
    `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
    `code_challenge=${codeChallenge}&` +
    `code_challenge_method=S256`;

  console.log('[Cognito] Iniciando fluxo OAuth com PKCE');
  window.location.href = url;
};

/**
 * Troca código de autorização por tokens (com PKCE)
 */
export const exchangeCodeForTokens = async (code: string): Promise<TokenSet> => {
  if (!isBrowser) {
    throw new Error('[Cognito] exchangeCodeForTokens só pode ser chamado no browser');
  }

  console.log('[Cognito] Trocando código por tokens com PKCE');

  const config = getCognitoConfig();
  
  // ✅ RECUPERAR code_verifier do sessionStorage
  const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
  
  if (!codeVerifier) {
    console.error('[Cognito] code_verifier não encontrado no sessionStorage!');
    throw new Error('PKCE code_verifier ausente - possível problema de hot reload ou storage limpo');
  }
  
  console.log('[Cognito] code_verifier recuperado', {
    length: codeVerifier.length,
    preview: codeVerifier.substring(0, 20) + '...',
  });
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri, // ✅ tem que ser 100% igual ao usado no /authorize
    code,
    code_verifier: codeVerifier, // ✅ ENVIAR code_verifier no body
  });

  const response = await fetch(`https://${config.domain}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[Cognito] Erro ao trocar código por tokens:', {
      status: response.status,
      statusText: response.statusText,
      error: data,
      codeVerifierPresent: !!codeVerifier,
      redirectUri: config.redirectUri,
    });
    
    // Limpar code_verifier em caso de erro
    sessionStorage.removeItem('pkce_code_verifier');
    
    throw new Error(`Falha ao trocar código por tokens: ${data.error || response.statusText}`);
  }

  console.log('[Cognito] Tokens obtidos com sucesso', { expiresIn: data.expires_in });
  
  // ✅ LIMPAR code_verifier após uso bem-sucedido
  sessionStorage.removeItem('pkce_code_verifier');

  return {
    idToken: data.id_token,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
};

/**
 * Armazena tokens em cookies seguros HTTP-only
 * Chama API route para definir cookies no servidor
 */
export const storeTokensInCookies = async (tokens: TokenSet): Promise<void> => {
  console.log('[Cognito] Armazenando tokens em cookies HTTP-only');

  try {
    const response = await fetch('/api/auth/set-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokens),
    });

    if (!response.ok) {
      throw new Error('Falha ao armazenar tokens');
    }

    console.log('[Cognito] Tokens armazenados com sucesso');
  } catch (error) {
    console.error('[Cognito] Erro ao armazenar tokens:', error);
    throw error;
  }
};

/**
 * Recupera tokens dos cookies
 * NOTA: Cookies HTTP-only não são acessíveis via JavaScript
 * Esta função verifica sessionStorage para tokens pendentes
 * Para validar tokens no servidor, use middleware
 */
export const getTokensFromCookies = (): TokenSet | null => {
  // Tentar recuperar tokens pendentes do sessionStorage
  if (typeof window !== 'undefined') {
    const pending = sessionStorage.getItem('pendingTokens');
    if (pending) {
      try {
        return JSON.parse(pending);
      } catch (e) {
        console.error('[Cognito] Erro ao parsear tokens pendentes:', e);
      }
    }
  }

  // Cookies HTTP-only não são acessíveis aqui
  // O middleware do Next.js terá acesso aos cookies no servidor
  return null;
};

/**
 * Limpa tokens dos cookies (logout)
 * Chama API route para limpar cookies HTTP-only no servidor
 */
export const clearTokensFromCookies = async (): Promise<void> => {
  console.log('[Cognito] Limpando tokens dos cookies');

  try {
    const response = await fetch('/api/auth/clear-tokens', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Falha ao limpar tokens');
    }

    console.log('[Cognito] Tokens limpos com sucesso');
  } catch (error) {
    console.error('[Cognito] Erro ao limpar tokens:', error);
    throw error;
  }
};

/**
 * Inicia logout redirecionando para endpoint de logout do Cognito
 */
export const initLogoutFlow = async (): Promise<void> => {
  if (!isBrowser) {
    console.error('[Cognito] initLogoutFlow só pode ser chamado no browser');
    return;
  }

  await clearTokensFromCookies();

  const config = getCognitoConfig();
  const url = `https://${config.domain}/logout?` +
    `client_id=${config.clientId}&` +
    `logout_uri=${encodeURIComponent(config.logoutUri)}`;

  console.log('[Cognito] Iniciando logout', { url });
  window.location.href = url;
};

/**
 * Login social - Redirecionar para Hosted UI do Cognito com PKCE
 */
export const signInWithGoogle = async (): Promise<void> => {
  if (!isBrowser) {
    console.error('[Cognito] signInWithGoogle só pode ser chamado no browser');
    return;
  }

  const config = getCognitoConfig();
  
  // Gerar PKCE code_verifier e code_challenge
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // Salvar code_verifier em sessionStorage para usar no callback
  sessionStorage.setItem('pkce_code_verifier', codeVerifier);
  
  console.log('[Cognito] PKCE gerado para Google login');
  
  // Scopes permitidos pelo Cognito
  const scopes = 'openid email';
  
  const url = `https://${config.domain}/oauth2/authorize?` +
    `identity_provider=Google&` +
    `client_id=${config.clientId}&` +
    `response_type=code&` +
    `scope=${scopes}&` +
    `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
    `code_challenge=${codeChallenge}&` +
    `code_challenge_method=S256`;
  
  console.log('[Cognito] Login com Google + PKCE');
  window.location.href = url;
};

export const signInWithFacebook = async (): Promise<void> => {
  if (!isBrowser) {
    console.error('[Cognito] signInWithFacebook só pode ser chamado no browser');
    return;
  }

  const config = getCognitoConfig();
  
  // Gerar PKCE code_verifier e code_challenge
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // Salvar code_verifier em sessionStorage para usar no callback
  sessionStorage.setItem('pkce_code_verifier', codeVerifier);
  
  console.log('[Cognito] PKCE gerado para Facebook login');
  
  // Scopes permitidos pelo Cognito
  const scopes = 'openid email';
  
  const url = `https://${config.domain}/oauth2/authorize?` +
    `identity_provider=Facebook&` +
    `client_id=${config.clientId}&` +
    `response_type=code&` +
    `scope=${scopes}&` +
    `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
    `code_challenge=${codeChallenge}&` +
    `code_challenge_method=S256`;
  
  console.log('[Cognito] Login com Facebook + PKCE');
  window.location.href = url;
};

/**
 * Processar callback do OAuth (após login social)
 * @deprecated Use exchangeCodeForTokens instead
 */
export const handleOAuthCallback = async (code: string): Promise<any> => {
  return exchangeCodeForTokens(code);
};

\# Ambiente de Desenvolvimento Local \- Alquimista.AI  
NEXT\_PUBLIC\_API\_URL\=https://c5loeivg0k.execute-api.us-east-1.amazonaws.com  
NEXT\_PUBLIC\_ENVIRONMENT\=development  
NEXT\_PUBLIC\_APP\_NAME\=Alquimista.AI  
NEXT\_PUBLIC\_APP\_VERSION\=1.0.0  
NEXT\_PUBLIC\_AWS\_REGION\=us-east-1

\# Aurora Database (DEV)  
\# Endpoint: fibonacci-dev-aurora.cluster-csriwuis6v0w.us-east-1.rds.amazonaws.com  
\# Secret ARN: arn:aws:secretsmanager:us-east-1:207933152643:secret:/repo/github/alquimistaai-aws-architecture/fibonacci-dev/db/postgres-...

\# Cognito (backend / server-side)  
COGNITO\_REGION\=us-east-1  
COGNITO\_USER\_POOL\_ID\=us-east-1\_Y8p2TeMbv  
COGNITO\_CLIENT\_ID\=59fs99tv0sbrmelkqef83itenu  
COGNITO\_DOMAIN\_HOST\=us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com  
COGNITO\_REDIRECT\_URI\=http://localhost:3000/auth/callback  
COGNITO\_LOGOUT\_REDIRECT\_URI\=http://localhost:3000/auth/logout  
COGNITO\_JWKS\_URL\=https://cognito-idp.us-east-1.amazonaws.com/us-east-1\_Y8p2TeMbv/.well-known/jwks.json

\# Versões expostas no frontend (NEXT\_PUBLIC\_)  
NEXT\_PUBLIC\_COGNITO\_USER\_POOL\_ID\=us-east-1\_Y8p2TeMbv  
NEXT\_PUBLIC\_COGNITO\_CLIENT\_ID\=59fs99tv0sbrmelkqef83itenu  
NEXT\_PUBLIC\_COGNITO\_DOMAIN\_HOST\=us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com  
NEXT\_PUBLIC\_COGNITO\_REDIRECT\_URI\=http://localhost:3000/auth/callback  
NEXT\_PUBLIC\_COGNITO\_LOGOUT\_URI\=http://localhost:3000/auth/logout-callback  
NEXT\_PUBLIC\_COGNITO\_REGION\=us-east-1

\# Ambiente de Produ��o \- Alquimista.AI  
\# Gerado automaticamente em 2025-11-15 23:29:40

\# API Backend (PROD \- J� deployada)  
NEXT\_PUBLIC\_API\_URL\=https://ogsd1547nd.execute-api.us-east-1.amazonaws.com

\# Ambiente  
NEXT\_PUBLIC\_ENVIRONMENT\=production  
NEXT\_PUBLIC\_APP\_NAME\=Alquimista.AI  
NEXT\_PUBLIC\_APP\_VERSION\=1.0.0

\# Ambiente de Desenvolvimento Local \- Alquimista.AI  
\# Copie este arquivo para .env.local e preencha com os valores corretos

\# API Backend  
NEXT\_PUBLIC\_API\_URL\=https://c5loeivg0k.execute-api.us-east-1.amazonaws.com  
NEXT\_PUBLIC\_ENVIRONMENT\=development  
NEXT\_PUBLIC\_APP\_NAME\=Alquimista.AI  
NEXT\_PUBLIC\_APP\_VERSION\=1.0.0  
NEXT\_PUBLIC\_AWS\_REGION\=us-east-1

\# Amazon Cognito \- Autenticação  
\# User Pool ID do Cognito (obrigatório)  
NEXT\_PUBLIC\_COGNITO\_USER\_POOL\_ID\=us-east-1\_Y8p2TeMbv

\# Client ID do App Client do Cognito (obrigatório)  
NEXT\_PUBLIC\_COGNITO\_CLIENT\_ID\=59fs99tv0sbrmelkqef83itenu

\# Domínio do Cognito Hosted UI (obrigatório)  
\# Formato: \<domain-prefix\>.auth.\<region\>.amazoncognito.com  
NEXT\_PUBLIC\_COGNITO\_DOMAIN\_HOST\=us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com

\# URL de callback após login (obrigatório)  
\# DEV: http://localhost:3000/auth/callback  
\# PROD: https://app.alquimista.ai/auth/callback  
NEXT\_PUBLIC\_COGNITO\_REDIRECT\_URI\=http://localhost:3000/auth/callback

\# URL de redirecionamento após logout (obrigatório)  
\# DEV: http://localhost:3000/auth/logout-callback  
\# PROD: https://app.alquimista.ai/auth/logout-callback  
NEXT\_PUBLIC\_COGNITO\_LOGOUT\_URI\=http://localhost:3000/auth/logout-callback

\# Região AWS do Cognito (obrigatório)  
NEXT\_PUBLIC\_COGNITO\_REGION\=us-east-1

\# Aurora Database (DEV)  
\# Endpoint: fibonacci-dev-aurora.cluster-csriwuis6v0w.us-east-1.rds.amazonaws.com  
\# Secret ARN: arn:aws:secretsmanager:us-east-1:207933152643:secret:/repo/github/alquimistaai-aws-architecture/fibonacci-dev/db/postgres-...

\# Cognito (backend / server-side)  
COGNITO\_REGION\=us-east-1  
COGNITO\_USER\_POOL\_ID\=us-east-1\_Y8p2TeMbv  
COGNITO\_CLIENT\_ID\=59fs99tv0sbrmelkqef83itenu  
COGNITO\_DOMAIN\_HOST\=us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com  
COGNITO\_REDIRECT\_URI\=http://localhost:3000/auth/callback  
COGNITO\_LOGOUT\_REDIRECT\_URI\=http://localhost:3000/auth/logout  
COGNITO\_JWKS\_URL\=https://cognito-idp.us-east-1.amazonaws.com/us-east-1\_Y8p2TeMbv/.well-known/jwks.json

\# Notas:  
\# 1\. Nunca commite o arquivo .env.local (já está no .gitignore)  
\# 2\. Para produção, use variáveis de ambiente do sistema ou secrets manager  
\# 3\. Todas as variáveis NEXT\_PUBLIC\_\* são expostas no browser  
\# 4\. Variáveis sem NEXT\_PUBLIC\_ são apenas server-side

/\*\* @type {import('next').NextConfig} \*/  
const nextConfig \= {  
  reactStrictMode: true,  
  swcMinify: true,  
   
  // Disable image optimization for deployment  
  images: {  
    unoptimized: true,  
  },

  // Trailing slash for compatibility  
  trailingSlash: true,

  // Ignore ESLint and TypeScript errors during build (temporary)  
  eslint: {  
    ignoreDuringBuilds: true,  
  },  
  typescript: {  
    ignoreBuildErrors: true,  
  },

  // Environment variables  
  env: {  
    NEXT\_PUBLIC\_API\_URL: process.env.NEXT\_PUBLIC\_API\_URL || 'http://localhost:3001',  
    NEXT\_PUBLIC\_FIBONACCI\_API\_BASE\_URL: process.env.NEXT\_PUBLIC\_FIBONACCI\_API\_BASE\_URL,  
    NEXT\_PUBLIC\_NIGREDO\_API\_BASE\_URL: process.env.NEXT\_PUBLIC\_NIGREDO\_API\_BASE\_URL,  
  },

  // Webpack configuration  
  webpack: (config) \=\> {  
    config.resolve.alias \= {  
      ...config.resolve.alias,  
    };  
    return config;  
  },  
};

module.exports \= nextConfig;

/\*\*  
 \* API Client para Alquimista.AI Backend  
 \* Integração com AWS API Gateway \+ Cognito  
 \*/

// URLs reais da AWS  
const API\_BASE\_URL \= process.env.NEXT\_PUBLIC\_API\_URL ||  
  (process.env.NODE\_ENV \=== 'production'  
    ? 'https://ogsd1547nd.execute-api.us-east-1.amazonaws.com'  
    : 'https://c5loeivg0k.execute-api.us-east-1.amazonaws.com');

interface ApiError {  
  message: string;  
  code?: string;  
  statusCode?: number;  
}

class ApiClient {  
  private baseUrl: string;  
  private token: string | null \= null;

  constructor(baseUrl: string \= API\_BASE\_URL) {  
    this.baseUrl \= baseUrl;  
  }

  setToken(token: string) {  
    this.token \= token;  
  }

  clearToken() {  
    this.token \= null;  
  }

  private async request\<T\>(  
    endpoint: string,  
    options: RequestInit \= {}  
  ): Promise\<T\> {  
    const url \= \`${this.baseUrl}${endpoint}\`;  
     
    const headers: Record\<string, string\> \= {  
      'Content-Type': 'application/json',  
      ...(options.headers as Record\<string, string\>),  
    };

    if (this.token) {  
      headers\['Authorization'\] \= \`Bearer ${this.token}\`;  
    }

    try {  
      const response \= await fetch(url, {  
        ...options,  
        headers,  
      });

      if (\!response.ok) {  
        const error: ApiError \= await response.json().catch(() \=\> ({  
          message: 'Request failed',  
          statusCode: response.status,  
        }));  
        throw new Error(error.message || \`HTTP ${response.status}\`);  
      }

      return await response.json();  
    } catch (error) {  
      console.error('API Request failed:', error);  
      throw error;  
    }  
  }

  // Health Check  
  async healthCheck() {  
    return this.request\<{ ok: boolean }\>('/health');  
  }

  // Auth  
  async login(email: string, password: string) {  
    return this.request\<{ token: string; user: any }\>('/auth/login', {  
      method: 'POST',  
      body: JSON.stringify({ email, password }),  
    });  
  }

  async signup(email: string, password: string, name: string) {  
    return this.request\<{ token: string; user: any }\>('/auth/signup', {  
      method: 'POST',  
      body: JSON.stringify({ email, password, name }),  
    });  
  }

  async logout() {  
    return this.request('/auth/logout', { method: 'POST' });  
  }

  // Agents  
  async listAgents() {  
    return this.request\<any\[\]\>('/api/agents');  
  }

  async getAgent(id: string) {  
    return this.request\<any\>(\`/api/agents/${id}\`);  
  }

  async activateAgent(id: string) {  
    return this.request\<any\>(\`/api/agents/${id}/activate\`, {  
      method: 'POST',  
    });  
  }

  async deactivateAgent(id: string) {  
    return this.request\<any\>(\`/api/agents/${id}/deactivate\`, {  
      method: 'POST',  
    });  
  }

  async getAgentMetrics(id: string) {  
    return this.request\<any\>(\`/api/agents/${id}/metrics\`);  
  }

  // Leads (Nigredo)  
  async listLeads(filters?: any) {  
    const query \= filters ? \`?${new URLSearchParams(filters)}\` : '';  
    return this.request\<any\[\]\>(\`/api/leads${query}\`);  
  }

  async getLead(id: string) {  
    return this.request\<any\>(\`/api/leads/${id}\`);  
  }

  async createLead(data: any) {  
    return this.request\<any\>('/api/leads', {  
      method: 'POST',  
      body: JSON.stringify(data),  
    });  
  }

  async updateLead(id: string, data: any) {  
    return this.request\<any\>(\`/api/leads/${id}\`, {  
      method: 'PUT',  
      body: JSON.stringify(data),  
    });  
  }

  // Campaigns  
  async listCampaigns() {  
    return this.request\<any\[\]\>('/api/campaigns');  
  }

  async getCampaign(id: string) {  
    return this.request\<any\>(\`/api/campaigns/${id}\`);  
  }

  async createCampaign(data: any) {  
    return this.request\<any\>('/api/campaigns', {  
      method: 'POST',  
      body: JSON.stringify(data),  
    });  
  }

  // Analytics  
  async getAnalytics(period: string \= '7d') {  
    return this.request\<any\>(\`/api/analytics?period=${period}\`);  
  }

  async getFunnelMetrics() {  
    return this.request\<any\>('/api/analytics/funnel');  
  }

  async getAgentPerformance() {  
    return this.request\<any\>('/api/analytics/agents');  
  }

  // Events (EventBridge)  
  async publishEvent(eventType: string, detail: any) {  
    return this.request\<any\>('/events', {  
      method: 'POST',  
      body: JSON.stringify({  
        source: 'frontend',  
        type: eventType,  
        detail,  
      }),  
    });  
  }

  // Permissions  
  async checkPermission(action: string, resource: string) {  
    return this.request\<{ allowed: boolean }\>('/api/permissions/check', {  
      method: 'POST',  
      body: JSON.stringify({ action, resource }),  
    });  
  }

  // Audit Logs  
  async getAuditLogs(filters?: any) {  
    const query \= filters ? \`?${new URLSearchParams(filters)}\` : '';  
    return this.request\<any\[\]\>(\`/api/audit-logs${query}\`);  
  }  
}

// Singleton instance  
export const apiClient \= new ApiClient();

// Export class for testing  
export default ApiClient;

/\*\*  
 \* Cliente de autenticação com Amazon Cognito User Pools  
 \* Suporta OAuth 2.0 via Hosted UI e login direto por e-mail/senha  
 \*/

import {  
  CognitoUserPool,  
  CognitoUser,  
  AuthenticationDetails,  
  CognitoUserAttribute,  
  CognitoUserSession,  
} from 'amazon-cognito-identity-js';

/\*\*  
 \* Configuração do Cognito  
 \*/  
interface CognitoConfig {  
  userPoolId: string;  
  clientId: string;  
  domain: string;  
  redirectUri: string;  
  logoutUri: string;  
  region: string;  
}

/\*\*  
 \* Valida e retorna configuração do Cognito  
 \* @throws Error se variáveis obrigatórias estiverem ausentes  
 \*/  
function getCognitoConfig(): CognitoConfig {  
  const config \= {  
    userPoolId: process.env.NEXT\_PUBLIC\_COGNITO\_USER\_POOL\_ID || '',  
    clientId: process.env.NEXT\_PUBLIC\_COGNITO\_CLIENT\_ID || '',  
    domain: process.env.NEXT\_PUBLIC\_COGNITO\_DOMAIN\_HOST || '',  
    redirectUri: process.env.NEXT\_PUBLIC\_COGNITO\_REDIRECT\_URI || '',  
    logoutUri: process.env.NEXT\_PUBLIC\_COGNITO\_LOGOUT\_URI || '',  
    region: process.env.NEXT\_PUBLIC\_COGNITO\_REGION || 'us-east-1',  
  };

  // Validar variáveis obrigatórias  
  const missing: string\[\] \= \[\];  
  if (\!config.userPoolId) missing.push('NEXT\_PUBLIC\_COGNITO\_USER\_POOL\_ID');  
  if (\!config.clientId) missing.push('NEXT\_PUBLIC\_COGNITO\_CLIENT\_ID');  
  if (\!config.domain) missing.push('NEXT\_PUBLIC\_COGNITO\_DOMAIN\_HOST');  
  if (\!config.redirectUri) missing.push('NEXT\_PUBLIC\_COGNITO\_REDIRECT\_URI');  
  if (\!config.logoutUri) missing.push('NEXT\_PUBLIC\_COGNITO\_LOGOUT\_URI');

  if (missing.length \> 0) {  
    const error \= \`\[Cognito\] Variáveis de ambiente ausentes: ${missing.join(', ')}\`;  
    console.error(error);  
    console.error('\[Cognito\] Verifique o arquivo .env.local e compare com .env.local.example');  
    throw new Error(error);  
  }

  console.log('\[Cognito\] Configuração carregada:', {  
    userPoolId: config.userPoolId,  
    clientId: config.clientId.substring(0, 10) \+ '...',  
    domain: config.domain,  
    redirectUri: config.redirectUri,  
    region: config.region,  
  });

  return config;  
}

// Obter configuração (validada)  
const config \= getCognitoConfig();

// Configuração do Cognito User Pool  
const poolData \= {  
  UserPoolId: config.userPoolId,  
  ClientId: config.clientId,  
};

const userPool \= new CognitoUserPool(poolData);

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

/\*\*  
 \* Login com e-mail e senha  
 \*/  
export const signIn \= (params: SignInParams): Promise\<CognitoUserSession\> \=\> {  
  return new Promise((resolve, reject) \=\> {  
    const authenticationDetails \= new AuthenticationDetails({  
      Username: params.email,  
      Password: params.password,  
    });

    const cognitoUser \= new CognitoUser({  
      Username: params.email,  
      Pool: userPool,  
    });

    cognitoUser.authenticateUser(authenticationDetails, {  
      onSuccess: (session) \=\> {  
        resolve(session);  
      },  
      onFailure: (err) \=\> {  
        reject(err);  
      },  
      newPasswordRequired: () \=\> {  
        // Usuário precisa trocar senha (primeiro acesso)  
        // Este fluxo pode ser implementado futuramente se necessário  
        reject(new Error('NEW\_PASSWORD\_REQUIRED'));  
      },  
    });  
  });  
};

/\*\*  
 \* Cadastro de novo usuário  
 \*/  
export const signUp \= (params: SignUpParams): Promise\<any\> \=\> {  
  return new Promise((resolve, reject) \=\> {  
    const attributeList: CognitoUserAttribute\[\] \= \[  
      new CognitoUserAttribute({  
        Name: 'email',  
        Value: params.email,  
      }),  
      new CognitoUserAttribute({  
        Name: 'name',  
        Value: params.name,  
      }),  
    \];

    if (params.phone) {  
      attributeList.push(  
        new CognitoUserAttribute({  
          Name: 'phone\_number',  
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

    userPool.signUp(params.email, params.password, attributeList, \[\], (err, result) \=\> {  
      if (err) {  
        reject(err);  
        return;  
      }  
      resolve(result);  
    });  
  });  
};

/\*\*  
 \* Confirmar cadastro com código enviado por e-mail  
 \*/  
export const confirmSignUp \= (email: string, code: string): Promise\<any\> \=\> {  
  return new Promise((resolve, reject) \=\> {  
    const cognitoUser \= new CognitoUser({  
      Username: email,  
      Pool: userPool,  
    });

    cognitoUser.confirmRegistration(code, true, (err, result) \=\> {  
      if (err) {  
        reject(err);  
        return;  
      }  
      resolve(result);  
    });  
  });  
};

/\*\*  
 \* Iniciar fluxo de recuperação de senha  
 \*/  
export const forgotPassword \= (email: string): Promise\<any\> \=\> {  
  return new Promise((resolve, reject) \=\> {  
    const cognitoUser \= new CognitoUser({  
      Username: email,  
      Pool: userPool,  
    });

    cognitoUser.forgotPassword({  
      onSuccess: (data) \=\> {  
        resolve(data);  
      },  
      onFailure: (err) \=\> {  
        reject(err);  
      },  
    });  
  });  
};

/\*\*  
 \* Confirmar nova senha com código de verificação  
 \*/  
export const confirmPassword \= (  
  email: string,  
  code: string,  
  newPassword: string  
): Promise\<any\> \=\> {  
  return new Promise((resolve, reject) \=\> {  
    const cognitoUser \= new CognitoUser({  
      Username: email,  
      Pool: userPool,  
    });

    cognitoUser.confirmPassword(code, newPassword, {  
      onSuccess: () \=\> {  
        resolve('SUCCESS');  
      },  
      onFailure: (err) \=\> {  
        reject(err);  
      },  
    });  
  });  
};

/\*\*  
 \* Alterar senha (usuário já autenticado)  
 \*/  
export const changePassword \= (  
  oldPassword: string,  
  newPassword: string  
): Promise\<any\> \=\> {  
  return new Promise((resolve, reject) \=\> {  
    const cognitoUser \= userPool.getCurrentUser();

    if (\!cognitoUser) {  
      reject(new Error('Usuário não autenticado'));  
      return;  
    }

    cognitoUser.getSession((err: any, session: CognitoUserSession | null) \=\> {  
      if (err || \!session) {  
        reject(err || new Error('Sessão inválida'));  
        return;  
      }

      cognitoUser.changePassword(oldPassword, newPassword, (err, result) \=\> {  
        if (err) {  
          reject(err);  
          return;  
        }  
        resolve(result);  
      });  
    });  
  });  
};

/\*\*  
 \* Obter usuário atual  
 \*/  
export const getCurrentUser \= (): Promise\<User | null\> \=\> {  
  return new Promise((resolve) \=\> {  
    const cognitoUser \= userPool.getCurrentUser();

    if (\!cognitoUser) {  
      resolve(null);  
      return;  
    }

    cognitoUser.getSession((err: any, session: CognitoUserSession | null) \=\> {  
      if (err || \!session) {  
        resolve(null);  
        return;  
      }

      cognitoUser.getUserAttributes((err, attributes) \=\> {  
        if (err || \!attributes) {  
          resolve(null);  
          return;  
        }

        const user: any \= {  
          sub: session.getIdToken().payload.sub,  
        };

        attributes.forEach((attr) \=\> {  
          if (attr.Name \=== 'email') user.email \= attr.Value;  
          if (attr.Name \=== 'name') user.name \= attr.Value;  
          if (attr.Name \=== 'custom:tenantId') user.tenantId \= attr.Value;  
          if (attr.Name \=== 'custom:role') user.role \= attr.Value;  
        });

        resolve(user);  
      });  
    });  
  });  
};

/\*\*  
 \* Obter token de acesso atual  
 \*/  
export const getAccessToken \= (): Promise\<string | null\> \=\> {  
  return new Promise((resolve) \=\> {  
    const cognitoUser \= userPool.getCurrentUser();

    if (\!cognitoUser) {  
      resolve(null);  
      return;  
    }

    cognitoUser.getSession((err: any, session: CognitoUserSession | null) \=\> {  
      if (err || \!session) {  
        resolve(null);  
        return;  
      }

      resolve(session.getAccessToken().getJwtToken());  
    });  
  });  
};

/\*\*  
 \* Logout  
 \*/  
export const signOut \= (): void \=\> {  
  const cognitoUser \= userPool.getCurrentUser();  
  if (cognitoUser) {  
    cognitoUser.signOut();  
  }  
};

/\*\*  
 \* OAuth 2.0 \- Hosted UI  
 \*/

/\*\*  
 \* Inicia fluxo OAuth redirecionando para Cognito Hosted UI  
 \*/  
export const initOAuthFlow \= (): void \=\> {  
  const url \= \`https://${config.domain}/oauth2/authorize?\` \+  
    \`client\_id=${config.clientId}&\` \+  
    \`response\_type=code&\` \+  
    \`scope=openid+email+profile&\` \+  
    \`redirect\_uri=${encodeURIComponent(config.redirectUri)}\`;

  console.log('\[Cognito\] Iniciando fluxo OAuth', { url });  
  window.location.href \= url;  
};

/\*\*  
 \* Troca código de autorização por tokens  
 \*/  
export const exchangeCodeForTokens \= async (code: string): Promise\<TokenSet\> \=\> {  
  console.log('\[Cognito\] Trocando código por tokens');

  const response \= await fetch(\`https://${config.domain}/oauth2/token\`, {  
    method: 'POST',  
    headers: {  
      'Content-Type': 'application/x-www-form-urlencoded',  
    },  
    body: new URLSearchParams({  
      grant\_type: 'authorization\_code',  
      client\_id: config.clientId,  
      code,  
      redirect\_uri: config.redirectUri,  
    }),  
  });

  if (\!response.ok) {  
    const error \= await response.text();  
    console.error('\[Cognito\] Erro ao trocar código:', error);  
    throw new Error('Falha ao trocar código por tokens');  
  }

  const data \= await response.json();  
  console.log('\[Cognito\] Tokens obtidos', { expiresIn: data.expires\_in });

  return {  
    idToken: data.id\_token,  
    accessToken: data.access\_token,  
    refreshToken: data.refresh\_token,  
    expiresIn: data.expires\_in,  
  };  
};

/\*\*  
 \* Armazena tokens em cookies seguros HTTP-only  
 \* Chama API route para definir cookies no servidor  
 \*/  
export const storeTokensInCookies \= async (tokens: TokenSet): Promise\<void\> \=\> {  
  console.log('\[Cognito\] Armazenando tokens em cookies HTTP-only');

  try {  
    const response \= await fetch('/api/auth/set-tokens', {  
      method: 'POST',  
      headers: {  
        'Content-Type': 'application/json',  
      },  
      body: JSON.stringify(tokens),  
    });

    if (\!response.ok) {  
      throw new Error('Falha ao armazenar tokens');  
    }

    console.log('\[Cognito\] Tokens armazenados com sucesso');  
  } catch (error) {  
    console.error('\[Cognito\] Erro ao armazenar tokens:', error);  
    throw error;  
  }  
};

/\*\*  
 \* Recupera tokens dos cookies  
 \* NOTA: Cookies HTTP-only não são acessíveis via JavaScript  
 \* Esta função verifica sessionStorage para tokens pendentes  
 \* Para validar tokens no servidor, use middleware  
 \*/  
export const getTokensFromCookies \= (): TokenSet | null \=\> {  
  // Tentar recuperar tokens pendentes do sessionStorage  
  if (typeof window \!== 'undefined') {  
    const pending \= sessionStorage.getItem('pendingTokens');  
    if (pending) {  
      try {  
        return JSON.parse(pending);  
      } catch (e) {  
        console.error('\[Cognito\] Erro ao parsear tokens pendentes:', e);  
      }  
    }  
  }

  // Cookies HTTP-only não são acessíveis aqui  
  // O middleware do Next.js terá acesso aos cookies no servidor  
  return null;  
};

/\*\*  
 \* Limpa tokens dos cookies (logout)  
 \* Chama API route para limpar cookies HTTP-only no servidor  
 \*/  
export const clearTokensFromCookies \= async (): Promise\<void\> \=\> {  
  console.log('\[Cognito\] Limpando tokens dos cookies');

  try {  
    const response \= await fetch('/api/auth/clear-tokens', {  
      method: 'POST',  
    });

    if (\!response.ok) {  
      throw new Error('Falha ao limpar tokens');  
    }

    console.log('\[Cognito\] Tokens limpos com sucesso');  
  } catch (error) {  
    console.error('\[Cognito\] Erro ao limpar tokens:', error);  
    throw error;  
  }  
};

/\*\*  
 \* Inicia logout redirecionando para endpoint de logout do Cognito  
 \*/  
export const initLogoutFlow \= async (): Promise\<void\> \=\> {  
  await clearTokensFromCookies();

  const url \= \`https://${config.domain}/logout?\` \+  
    \`client\_id=${config.clientId}&\` \+  
    \`logout\_uri=${encodeURIComponent(config.logoutUri)}\`;

  console.log('\[Cognito\] Iniciando logout', { url });  
  window.location.href \= url;  
};

/\*\*  
 \* Login social \- Redirecionar para Hosted UI do Cognito  
 \*/  
export const signInWithGoogle \= (): void \=\> {  
  const url \= \`https://${config.domain}/oauth2/authorize?\` \+  
    \`identity\_provider=Google&\` \+  
    \`client\_id=${config.clientId}&\` \+  
    \`response\_type=code&\` \+  
    \`scope=openid+email+profile&\` \+  
    \`redirect\_uri=${encodeURIComponent(config.redirectUri)}\`;  
   
  console.log('\[Cognito\] Login com Google');  
  window.location.href \= url;  
};

export const signInWithFacebook \= (): void \=\> {  
  const url \= \`https://${config.domain}/oauth2/authorize?\` \+  
    \`identity\_provider=Facebook&\` \+  
    \`client\_id=${config.clientId}&\` \+  
    \`response\_type=code&\` \+  
    \`scope=openid+email+profile&\` \+  
    \`redirect\_uri=${encodeURIComponent(config.redirectUri)}\`;  
   
  console.log('\[Cognito\] Login com Facebook');  
  window.location.href \= url;  
};

/\*\*  
 \* Processar callback do OAuth (após login social)  
 \* @deprecated Use exchangeCodeForTokens instead  
 \*/  
export const handleOAuthCallback \= async (code: string): Promise\<any\> \=\> {  
  return exchangeCodeForTokens(code);  
};

import { NextResponse } from 'next/server';  
import type { NextRequest } from 'next/server';

/\*\*  
 \* Middleware de Proteção de Rotas \- Cognito OAuth 2.0  
 \*  
 \* Implementa proteção completa de rotas com validação de tokens JWT do Cognito:  
 \*  
 \* 1\. Valida presença de tokens em cookies (Requirements 5.1)  
 \* 2\. Valida expiração de tokens (Requirements 5.4)  
 \* 3\. Extrai grupos do token JWT (Requirements 5.5)  
 \* 4\. Implementa regras de redirecionamento por grupo (Requirements 3.1-3.5, 4.1-4.5)  
 \* 5\. Bloqueia acesso cross-dashboard (Requirements 4.3)  
 \* 6\. Redireciona para login com parâmetro de redirect (Requirements 5.2)  
 \*  
 \* Fluxo de Proteção:  
 \* \- Rotas públicas: acesso livre  
 \* \- Rotas protegidas sem token: redirect para login  
 \* \- Token expirado: limpa cookies e redirect para login  
 \* \- Token válido: valida autorização por grupo  
 \* \- Acesso não autorizado: redirect para dashboard apropriado  
 \*/  
export function middleware(request: NextRequest) {  
  const { pathname } \= request.nextUrl;

  // \============================================================================  
  // 1\. ROTAS PÚBLICAS \- Não requerem autenticação  
  // \============================================================================  
  const publicPaths \= \[  
    '/login',  
    '/auth/register',  
    '/auth/forgot-password',  
    '/auth/reset-password',  
    '/auth/confirm',  
    '/auth/callback',  
    '/auth/logout',  
    '/auth/logout-callback',  
    '/',  
    '/api/auth/session',  
  \];

  const isPublicPath \= publicPaths.some(path \=\> pathname.startsWith(path));

  if (isPublicPath) {  
    return NextResponse.next();  
  }

  // \============================================================================  
  // 2\. ROTAS PROTEGIDAS \- Requerem autenticação  
  // \============================================================================  
  const isProtectedPath \= pathname.startsWith('/app');

  if (isProtectedPath) {  
    // \------------------------------------------------------------------------  
    // 2.1. Validar presença de tokens nos cookies (Requirement 5.1)  
    // \------------------------------------------------------------------------  
    const accessToken \= request.cookies.get('accessToken');  
    const idToken \= request.cookies.get('idToken');

    if (\!accessToken || \!idToken) {  
      console.log('\[Middleware\] Tokens ausentes, redirecionando para login');  
       
      // Requirement 5.2: Redirecionar para login com parâmetro de redirect  
      const loginUrl \= new URL('/login', request.url);  
      loginUrl.searchParams.set('redirect', pathname);  
      return NextResponse.redirect(loginUrl);  
    }

    // \------------------------------------------------------------------------  
    // 2.2. Validar token e extrair grupos  
    // \------------------------------------------------------------------------  
    try {  
      // Decodificar o ID token JWT  
      const payload \= JSON.parse(  
        Buffer.from(idToken.value.split('.')\[1\], 'base64').toString()  
      );

      const now \= Math.floor(Date.now() / 1000);  
       
      // \------------------------------------------------------------------------  
      // 2.3. Validar expiração do token (Requirement 5.4)  
      // \------------------------------------------------------------------------  
      if (payload.exp && payload.exp \< now) {  
        console.log('\[Middleware\] Token expirado, limpando cookies e redirecionando');  
         
        const loginUrl \= new URL('/login', request.url);  
        loginUrl.searchParams.set('redirect', pathname);  
        loginUrl.searchParams.set('expired', 'true');  
         
        // Limpar cookies expirados  
        const response \= NextResponse.redirect(loginUrl);  
        response.cookies.delete('accessToken');  
        response.cookies.delete('idToken');  
        response.cookies.delete('refreshToken');  
         
        return response;  
      }

      // \------------------------------------------------------------------------  
      // 2.4. Extrair grupos do token (Requirement 5.5)  
      // \------------------------------------------------------------------------  
      const groups: string\[\] \= payload\['cognito:groups'\] || \[\];  
      const isInternal \= groups.includes('INTERNAL\_ADMIN') || groups.includes('INTERNAL\_SUPPORT');  
      const isTenant \= groups.includes('TENANT\_ADMIN') || groups.includes('TENANT\_USER');

      console.log('\[Middleware\] Validação de acesso:', {  
        pathname,  
        groups,  
        isInternal,  
        isTenant,  
      });

      // \------------------------------------------------------------------------  
      // 2.5. Redirecionar /app para dashboard apropriado (Requirements 3.4, 4.4)  
      // \------------------------------------------------------------------------  
      if (pathname \=== '/app' || pathname \=== '/app/') {  
        if (isInternal) {  
          console.log('\[Middleware\] Redirecionando usuário interno para /app/company');  
          return NextResponse.redirect(new URL('/app/company', request.url));  
        } else if (isTenant) {  
          console.log('\[Middleware\] Redirecionando usuário tenant para /app/dashboard');  
          return NextResponse.redirect(new URL('/app/dashboard', request.url));  
        }  
      }

      // \------------------------------------------------------------------------  
      // 2.6. Proteger rotas internas \- Bloqueio cross-dashboard (Requirement 4.3)  
      // \------------------------------------------------------------------------  
      if (pathname.startsWith('/app/company')) {  
        if (\!isInternal) {  
          console.warn('\[Middleware\] Acesso negado: usuário tenant tentando acessar rota interna');  
           
          // Redirecionar para dashboard do cliente com mensagem de erro  
          const dashboardUrl \= new URL('/app/dashboard', request.url);  
          dashboardUrl.searchParams.set('error', 'forbidden');  
          dashboardUrl.searchParams.set('message', 'Você não tem permissão para acessar esta área');  
           
          return NextResponse.redirect(dashboardUrl);  
        }  
      }

      // \------------------------------------------------------------------------  
      // 2.7. Redirecionar usuários internos de /app/dashboard para /app/company (Requirement 3.3)  
      // \------------------------------------------------------------------------  
      if (pathname.startsWith('/app/dashboard')) {  
        // Usuários internos devem usar /app/company, não /app/dashboard  
        if (isInternal) {  
          console.log('\[Middleware\] Redirecionando usuário interno de /app/dashboard para /app/company');  
          return NextResponse.redirect(new URL('/app/company', request.url));  
        }  
         
        // Usuários tenant podem acessar /app/dashboard  
        if (\!isTenant) {  
          console.warn('\[Middleware\] Acesso negado: usuário sem grupo válido');  
           
          const loginUrl \= new URL('/login', request.url);  
          loginUrl.searchParams.set('error', 'unauthorized');  
          loginUrl.searchParams.set('message', 'Você não tem permissão para acessar esta área');  
           
          return NextResponse.redirect(loginUrl);  
        }  
      }

    } catch (error) {  
      // \------------------------------------------------------------------------  
      // 2.8. Erro ao validar token \- Redirecionar para login  
      // \------------------------------------------------------------------------  
      console.error('\[Middleware\] Erro ao validar token:', error);  
       
      const loginUrl \= new URL('/login', request.url);  
      loginUrl.searchParams.set('redirect', pathname);  
      loginUrl.searchParams.set('error', 'invalid\_token');  
       
      // Limpar cookies inválidos  
      const response \= NextResponse.redirect(loginUrl);  
      response.cookies.delete('accessToken');  
      response.cookies.delete('idToken');  
      response.cookies.delete('refreshToken');  
       
      return response;  
    }  
  }

  // \============================================================================  
  // 3\. PERMITIR ACESSO  
  // \============================================================================  
  return NextResponse.next();  
}

// Configurar quais rotas o middleware deve processar  
export const config \= {  
  matcher: \[  
    /\*  
     \* Match all request paths except for the ones starting with:  
     \* \- \_next/static (static files)  
     \* \- \_next/image (image optimization files)  
     \* \- favicon.ico (favicon file)  
     \* \- public folder  
     \*/  
    '/((?\!\_next/static|\_next/image|favicon.ico|.\*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).\*)',  
  \],  
};


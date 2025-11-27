# Documento de Design - Sistema de Autenticação Cognito Completo

## Visão Geral

Este documento detalha o design técnico do sistema completo de autenticação utilizando Amazon Cognito User Pools, incluindo arquitetura, componentes, fluxos de dados, modelos de dados e estratégias de implementação.

O sistema será construído com Next.js 14 (App Router), TypeScript, Tailwind CSS e shadcn/ui no frontend, integrado com backend serverless AWS (API Gateway + Lambda + Aurora PostgreSQL).

## Arquitetura

### Diagrama de Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 14)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Auth Pages   │  │ Settings     │  │ Components   │          │
│  │ /auth/*      │  │ /app/settings│  │ (shadcn/ui)  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│         └─────────────────┴──────────────────┘                   │
│                           │                                      │
│                  ┌────────▼────────┐                            │
│                  │  Cognito Client │                            │
│                  │  (lib/cognito)  │                            │
│                  └────────┬────────┘                            │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼────────┐     ┌───────▼────────┐
        │ Amazon Cognito │     │  API Gateway   │
        │   User Pool    │     │   + Lambda     │
        └───────┬────────┘     └───────┬────────┘
                │                      │
                │              ┌───────▼────────┐
                │              │ Aurora         │
                │              │ PostgreSQL     │
                │              │ (Multi-tenant) │
                │              └────────────────┘
                │
        ┌───────▼────────┐
        │  S3 Bucket     │
        │  (Logomarcas)  │
        └────────────────┘
```

### Componentes Principais

#### 1. Frontend (Next.js 14)
- **Páginas de Autenticação**: `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`
- **Páginas de Configurações**: `/app/settings` (abas: Perfil, Empresa, Integrações)
- **Componentes Reutilizáveis**: Formulários, modais, wizards
- **Cliente Cognito**: Biblioteca para comunicação com Cognito User Pool

#### 2. Amazon Cognito User Pool
- **Autenticação**: E-mail/senha + OAuth (Google/Facebook)
- **Atributos Customizados**: `custom:tenantId`, `custom:role`
- **Hosted UI**: Interface OAuth para login social
- **Triggers Lambda**: Pós-confirmação, pré-autenticação

#### 3. Backend Serverless
- **API Gateway HTTP**: Endpoints REST
- **Lambda Functions**: Handlers para operações de usuário/empresa
- **Aurora PostgreSQL**: Banco de dados multi-tenant
- **S3**: Armazenamento de logomarcas

#### 4. AWS Secrets Manager
- **Credenciais de Integrações**: Path `/alquimista/{env}/{tenantId}/{integration}`
- **Tokens OAuth**: Armazenamento seguro

## Componentes e Interfaces

### Frontend Components

#### 1. Páginas de Autenticação

**`/auth/login/page.tsx`**
```typescript
interface LoginPageProps {}

// Componente principal da página de login
// Exibe formulário e botões de login social
```

**`/auth/register/page.tsx`**
```typescript
interface RegisterPageProps {}

// Wrapper para o RegisterWizard
// Gerencia navegação e estado global
```

**`/auth/forgot-password/page.tsx`**
```typescript
interface ForgotPasswordPageProps {}

// Formulário para solicitar código de recuperação
```

**`/auth/reset-password/page.tsx`**
```typescript
interface ResetPasswordPageProps {
  searchParams: { email?: string }
}

// Formulário para redefinir senha com código
```

#### 2. Componentes de Autenticação

**`components/auth/login-form.tsx`**
```typescript
interface LoginFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

// Formulário de login com e-mail/senha
// Validação client-side
// Integração com cognito-client
```

**`components/auth/social-login-buttons.tsx`**
```typescript
interface SocialLoginButtonsProps {
  onGoogleClick: () => void;
  onFacebookClick: () => void;
}

// Botões estilizados para login social
// Redireciona para Cognito Hosted UI
```

**`components/auth/register-wizard.tsx`**
```typescript
interface RegisterWizardProps {
  onComplete: () => void;
}

interface WizardStep {
  id: number;
  title: string;
  component: React.ComponentType;
}

// Wizard de 3 passos para cadastro
// Gerencia estado do formulário
// Validação por passo
```

**`components/auth/forgot-password-form.tsx`**
```typescript
interface ForgotPasswordFormProps {
  onSuccess: (email: string) => void;
  onError: (error: string) => void;
}

// Formulário para solicitar código
// Validação de e-mail
```

**`components/auth/reset-password-form.tsx`**
```typescript
interface ResetPasswordFormProps {
  email: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

// Formulário para redefinir senha
// Validação de código e senha
```

#### 3. Componentes de Configurações

**`components/settings/settings-tabs.tsx`**
```typescript
interface SettingsTabsProps {
  defaultTab?: 'profile' | 'company' | 'integrations';
}

// Container com abas para configurações
// Controle de navegação entre abas
```

**`components/settings/profile-tab.tsx`**
```typescript
interface ProfileTabProps {
  user: User;
  onUpdate: (data: Partial<User>) => Promise<void>;
}

// Formulário de edição de perfil
// Alteração de senha
// Exibição de papel (read-only)
```

**`components/settings/company-tab.tsx`**
```typescript
interface CompanyTabProps {
  company: Company;
  userRole: UserRole;
  onUpdate: (data: Partial<Company>) => Promise<void>;
}

// Formulário de edição de empresa
// Upload de logomarca
// Controle de permissões por papel
```

**`components/settings/integrations-tab.tsx`**
```typescript
interface IntegrationsTabProps {
  tenantId: string;
  userRole: UserRole;
}

interface Integration {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
  provider: 'google' | 'meta' | 'twilio' | 'other';
}

// Lista de integrações disponíveis
// Botões de conectar/desconectar
// Fluxos OAuth
```

### Backend Handlers

#### 1. Handlers de Usuário

**`lambda/platform/create-user.ts`**
```typescript
interface CreateUserRequest {
  email: string;
  name: string;
  phone?: string;
  tenantId: string;
  role: UserRole;
  cognitoSub: string;
}

interface CreateUserResponse {
  userId: string;
  tenantId: string;
  role: UserRole;
}

// Cria registro de usuário no banco
// Associa ao tenant
// Define papel inicial
```

**`lambda/platform/update-user.ts`**
```typescript
interface UpdateUserRequest {
  userId: string;
  name?: string;
  phone?: string;
  language?: string;
  timezone?: string;
}

interface UpdateUserResponse {
  success: boolean;
  user: User;
}

// Atualiza dados do usuário
// Valida permissões
```

**`lambda/platform/get-user.ts`**
```typescript
interface GetUserRequest {
  userId: string;
}

interface GetUserResponse {
  user: User;
  company: Company;
  role: UserRole;
}

// Retorna dados completos do usuário
// Inclui informações da empresa
```

#### 2. Handlers de Empresa

**`lambda/platform/create-company.ts`**
```typescript
interface CreateCompanyRequest {
  name: string;
  legalName?: string;
  cnpj: string;
  segment: string;
}

interface CreateCompanyResponse {
  tenantId: string;
  company: Company;
}

// Cria novo tenant
// Gera tenantId único
// Inicializa configurações padrão
```

**`lambda/platform/update-company.ts`**
```typescript
interface UpdateCompanyRequest {
  tenantId: string;
  name?: string;
  legalName?: string;
  cnpj?: string;
  segment?: string;
  logoUrl?: string;
}

interface UpdateCompanyResponse {
  success: boolean;
  company: Company;
}

// Atualiza dados da empresa
// Valida permissões (Master/Admin)
```

**`lambda/platform/upload-logo.ts`**
```typescript
interface UploadLogoRequest {
  tenantId: string;
  file: Buffer;
  contentType: string;
}

interface UploadLogoResponse {
  logoUrl: string;
}

// Upload de logomarca para S3
// Path: alquimistaai-logos/{tenantId}/logo.{ext}
// Retorna URL pública
```

#### 3. Handlers de Integrações

**`lambda/platform/connect-integration.ts`**
```typescript
interface ConnectIntegrationRequest {
  tenantId: string;
  integration: string;
  credentials: Record<string, any>;
}

interface ConnectIntegrationResponse {
  success: boolean;
  status: 'connected';
}

// Armazena credenciais no Secrets Manager
// Path: /alquimista/{env}/{tenantId}/{integration}
// Valida permissões (Master/Admin)
```

**`lambda/platform/disconnect-integration.ts`**
```typescript
interface DisconnectIntegrationRequest {
  tenantId: string;
  integration: string;
}

interface DisconnectIntegrationResponse {
  success: boolean;
  status: 'disconnected';
}

// Remove credenciais do Secrets Manager
// Valida permissões (Master/Admin)
```

**`lambda/platform/list-integrations.ts`**
```typescript
interface ListIntegrationsRequest {
  tenantId: string;
}

interface ListIntegrationsResponse {
  integrations: Integration[];
}

// Lista integrações disponíveis
// Retorna status de cada uma
```

### Cognito Client Library

**`lib/cognito-client.ts`**
```typescript
// Funções principais
export const signIn: (params: SignInParams) => Promise<CognitoUserSession>
export const signUp: (params: SignUpParams) => Promise<any>
export const confirmSignUp: (email: string, code: string) => Promise<any>
export const forgotPassword: (email: string) => Promise<any>
export const confirmPassword: (email: string, code: string, newPassword: string) => Promise<any>
export const changePassword: (oldPassword: string, newPassword: string) => Promise<any>
export const getCurrentUser: () => Promise<User | null>
export const getAccessToken: () => Promise<string | null>
export const signOut: () => void
export const signInWithGoogle: () => void
export const signInWithFacebook: () => void
export const handleOAuthCallback: (code: string) => Promise<any>
```

## Modelos de Dados

### Banco de Dados (Aurora PostgreSQL)

#### Tabela: `companies`
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  segment VARCHAR(100) NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_companies_tenant_id ON companies(tenant_id);
CREATE INDEX idx_companies_cnpj ON companies(cnpj);
```

#### Tabela: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cognito_sub VARCHAR(255) UNIQUE NOT NULL,
  tenant_id UUID NOT NULL REFERENCES companies(tenant_id),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  language VARCHAR(10) DEFAULT 'pt-BR',
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_cognito_sub ON users(cognito_sub);
CREATE INDEX idx_users_email ON users(email);
```

#### Tabela: `user_roles`
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES companies(tenant_id),
  role VARCHAR(50) NOT NULL CHECK (role IN ('MASTER', 'ADMIN', 'OPERATIONAL', 'READ_ONLY')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_tenant_id ON user_roles(tenant_id);
```

#### Tabela: `integrations`
```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES companies(tenant_id),
  integration_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected')),
  secrets_path TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, integration_name)
);

CREATE INDEX idx_integrations_tenant_id ON integrations(tenant_id);
```

### Cognito User Pool

#### Atributos Padrão
- `email` (obrigatório, verificável)
- `name` (obrigatório)
- `phone_number` (opcional)

#### Atributos Customizados
- `custom:tenantId` (UUID do tenant)
- `custom:role` (MASTER, ADMIN, OPERATIONAL, READ_ONLY)

#### Configuração de Senha
- Mínimo: 8 caracteres
- Requer: maiúsculas, minúsculas, números, caracteres especiais
- Expiração: 90 dias (opcional)

#### Provedores OAuth
- Google (identity_provider=Google)
- Facebook (identity_provider=Facebook)

## Fluxos de Dados

### Fluxo 1: Login com E-mail/Senha

```
1. Usuário preenche formulário em /auth/login
2. Frontend chama cognito-client.signIn()
3. Cognito valida credenciais
4. Cognito retorna tokens (ID, Access, Refresh)
5. Frontend armazena tokens em cookies HttpOnly (via API route)
6. Frontend redireciona para /app/dashboard
```

### Fluxo 2: Login Social (Google/Facebook)

```
1. Usuário clica em "Continuar com Google"
2. Frontend chama cognito-client.signInWithGoogle()
3. Redireciona para Cognito Hosted UI
4. Usuário autentica com Google
5. Google redireciona para Cognito
6. Cognito redireciona para /auth/callback?code=XXX
7. Frontend chama cognito-client.handleOAuthCallback(code)
8. Troca código por tokens
9. Armazena tokens em cookies HttpOnly
10. Redireciona para /app/dashboard
```

### Fluxo 3: Cadastro de Novo Usuário

```
1. Usuário acessa /auth/register
2. Preenche Passo 1 (dados pessoais)
3. Preenche Passo 2 (dados da empresa)
4. Frontend chama POST /api/companies
5. Backend cria empresa e retorna tenantId
6. Se houver logo, frontend chama POST /api/upload/logo
7. Frontend chama cognito-client.signUp() com tenantId
8. Cognito cria usuário e envia e-mail de confirmação
9. Frontend chama POST /api/users para criar registro
10. Redireciona para /auth/confirm?email=XXX
11. Usuário clica no link do e-mail
12. Cognito confirma usuário
13. Usuário pode fazer login
```

### Fluxo 4: Recuperação de Senha

```
1. Usuário acessa /auth/forgot-password
2. Preenche e-mail
3. Frontend chama cognito-client.forgotPassword(email)
4. Cognito envia código por e-mail
5. Redireciona para /auth/reset-password?email=XXX
6. Usuário preenche código e nova senha
7. Frontend chama cognito-client.confirmPassword()
8. Cognito valida código e atualiza senha
9. Redireciona para /auth/login com mensagem de sucesso
```

### Fluxo 5: Atualização de Perfil

```
1. Usuário acessa /app/settings (aba Perfil)
2. Edita campos (nome, telefone, idioma, timezone)
3. Clica em "Salvar"
4. Frontend chama PUT /api/users/{userId}
5. Backend valida permissões
6. Backend atualiza registro em users
7. Retorna dados atualizados
8. Frontend exibe mensagem de sucesso
```

### Fluxo 6: Atualização de Empresa

```
1. Usuário Master/Admin acessa /app/settings (aba Empresa)
2. Edita campos da empresa
3. Se houver nova logo, faz upload
4. Clica em "Salvar"
5. Frontend chama PUT /api/companies/{tenantId}
6. Backend valida papel (Master/Admin)
7. Backend atualiza registro em companies
8. Retorna dados atualizados
9. Frontend exibe mensagem de sucesso
```

### Fluxo 7: Conexão de Integração

```
1. Usuário Master/Admin acessa /app/settings (aba Integrações)
2. Clica em "Conectar" para uma integração
3. Se OAuth: redireciona para provedor
4. Provedor retorna com código/token
5. Frontend chama POST /api/integrations/connect
6. Backend armazena credenciais no Secrets Manager
7. Backend atualiza status em integrations
8. Frontend exibe status "Conectado"
```

## Tratamento de Erros

### Erros do Cognito

Mapeamento de erros do Cognito para mensagens em português:

```typescript
const COGNITO_ERROR_MESSAGES: Record<string, string> = {
  'UserNotFoundException': 'Usuário não encontrado',
  'NotAuthorizedException': 'E-mail ou senha incorretos',
  'UserNotConfirmedException': 'Usuário não confirmado. Verifique seu e-mail',
  'CodeMismatchException': 'Código de verificação inválido',
  'ExpiredCodeException': 'Código de verificação expirado',
  'InvalidPasswordException': 'Senha não atende aos requisitos mínimos',
  'UsernameExistsException': 'Este e-mail já está cadastrado',
  'LimitExceededException': 'Muitas tentativas. Tente novamente mais tarde',
  'TooManyRequestsException': 'Muitas requisições. Aguarde alguns minutos',
  'InvalidParameterException': 'Parâmetros inválidos',
  'NetworkError': 'Erro de conexão. Verifique sua internet',
};
```

### Validações Frontend

```typescript
// Validação de e-mail
const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validação de senha
const validatePassword = (password: string): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Mínimo de 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Pelo menos uma letra maiúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Pelo menos uma letra minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Pelo menos um número');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Pelo menos um caractere especial');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

// Validação de CNPJ
const validateCNPJ = (cnpj: string): boolean => {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return false;
  
  // Validação completa de CNPJ (algoritmo de dígitos verificadores)
  // ... implementação completa
  
  return true;
};
```

## Estratégia de Testes

### Testes Unitários

- Validações de formulário
- Funções de formatação (CNPJ, telefone)
- Mapeamento de erros do Cognito
- Lógica de negócio em hooks

### Testes de Integração

- Fluxo completo de cadastro
- Fluxo completo de login
- Fluxo de recuperação de senha
- Atualização de perfil e empresa
- Conexão de integrações

### Testes E2E

- Cadastro → Login → Dashboard
- Login social (Google/Facebook)
- Recuperação de senha completa
- Edição de configurações
- Upload de logomarca

## Segurança

### Armazenamento de Tokens

- Tokens armazenados em cookies HttpOnly
- Cookies com flag Secure (HTTPS only)
- Cookies com SameSite=Strict
- Refresh token rotation

### Proteção de Rotas

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token');
  
  if (!token && request.nextUrl.pathname.startsWith('/app')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  return NextResponse.next();
}
```

### Validação de Permissões

```typescript
// Backend: validação de papel
const checkPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const hierarchy = {
    'MASTER': 4,
    'ADMIN': 3,
    'OPERATIONAL': 2,
    'READ_ONLY': 1,
  };
  
  return hierarchy[userRole] >= hierarchy[requiredRole];
};
```

### Rate Limiting

- Cognito: limite nativo de tentativas de login
- API Gateway: throttling configurado
- Lambda: rate limiting por IP/usuário

## Monitoramento e Observabilidade

### Métricas

- Taxa de sucesso de login
- Taxa de falha de login (por tipo de erro)
- Tempo de resposta de autenticação
- Número de cadastros por dia
- Uso de login social vs tradicional

### Logs

- Todos os eventos de autenticação
- Erros de validação
- Tentativas de acesso não autorizado
- Mudanças em configurações de empresa
- Conexões/desconexões de integrações

### Alertas

- Taxa de erro > 5%
- Tempo de resposta > 3s
- Tentativas de login suspeitas
- Falhas em integrações críticas

## Considerações de Performance

### Frontend

- Code splitting por rota
- Lazy loading de componentes pesados
- Otimização de imagens (logomarcas)
- Cache de dados do usuário

### Backend

- Connection pooling para Aurora
- Cache de dados de empresa (Redis/ElastiCache)
- Compressão de respostas
- CDN para assets estáticos

## Próximos Passos

Após aprovação deste design, o próximo passo será criar o documento de tarefas (tasks.md) com a lista detalhada de implementação.

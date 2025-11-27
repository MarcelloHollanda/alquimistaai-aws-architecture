# Guia de Integração Backend - Sistema de Autenticação Avançado

## 📋 Visão Geral

Este documento descreve como integrar o sistema de autenticação avançado do frontend com o backend AWS.

## 🔐 Endpoints Necessários

### 1. Autenticação Básica

#### POST /auth/login
```typescript
Request:
{
  "email": "user@example.com",
  "password": "senha123"
}

Response (Sucesso):
{
  "success": true,
  "requiresMFA": false,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Nome do Usuário",
    "role": "user",
    "plan": "professional"
  },
  "token": "jwt-token"
}

Response (MFA Necessário):
{
  "success": false,
  "requiresMFA": true,
  "sessionId": "temp-session-id"
}

Response (Conta Bloqueada):
{
  "success": false,
  "code": "ACCOUNT_LOCKED",
  "message": "Conta bloqueada por segurança",
  "lockoutTime": 1800
}
```

#### POST /auth/verify-mfa
```typescript
Request:
{
  "sessionId": "temp-session-id",
  "code": "123456"
}

Response:
{
  "success": true,
  "user": { /* user object */ },
  "token": "jwt-token"
}
```

### 2. Login Social (OAuth)

#### GET /auth/oauth/{provider}
Providers: google, facebook, microsoft

```typescript
Query Params:
- redirect_uri: URL de callback
- state: Estado para CSRF protection

Response:
Redirect para URL do provider OAuth
```

#### GET /auth/oauth/{provider}/callback
```typescript
Query Params:
- code: Authorization code
- state: Estado para validação

Response:
{
  "success": true,
  "user": { /* user object */ },
  "token": "jwt-token"
}
```

### 3. Magic Link

#### POST /auth/magic-link
```typescript
Request:
{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "Magic link enviado para o email"
}

Rate Limit: 1 request por minuto por email
```

#### GET /auth/magic-link/verify
```typescript
Query Params:
- token: Token do magic link

Response:
{
  "success": true,
  "user": { /* user object */ },
  "token": "jwt-token"
}
```

### 4. MFA Management

#### POST /auth/mfa/enable
```typescript
Request:
{
  "userId": "uuid"
}

Response:
{
  "success": true,
  "qrCode": "data:image/png;base64,...",
  "secret": "base32-secret",
  "backupCodes": [
    "ABC123",
    "DEF456",
    // ... 10 códigos
  ]
}
```

#### POST /auth/mfa/disable
```typescript
Request:
{
  "userId": "uuid",
  "code": "123456"
}

Response:
{
  "success": true,
  "message": "MFA desabilitado"
}
```

### 5. Dispositivos Confiáveis

#### GET /auth/devices
```typescript
Response:
{
  "devices": [
    {
      "id": "uuid",
      "name": "Meu Computador",
      "type": "Desktop",
      "browser": "Chrome",
      "os": "Windows 11",
      "lastUsed": "2024-11-16T10:00:00Z",
      "trusted": true
    }
  ]
}
```

#### DELETE /auth/devices/{deviceId}
```typescript
Response:
{
  "success": true,
  "message": "Dispositivo removido"
}
```

### 6. Histórico de Login

#### GET /auth/login-history
```typescript
Query Params:
- limit: Número de registros (default: 50)
- offset: Paginação

Response:
{
  "history": [
    {
      "id": "uuid",
      "timestamp": "2024-11-16T10:00:00Z",
      "ip": "192.168.1.100",
      "location": "São Paulo, BR",
      "device": "Chrome on Windows",
      "status": "success" | "failed" | "suspicious"
    }
  ],
  "total": 150
}
```

## 🔧 Implementação Lambda

### Estrutura de Diretórios
```
lambda/
├── auth/
│   ├── login.ts
│   ├── verify-mfa.ts
│   ├── oauth-google.ts
│   ├── oauth-facebook.ts
│   ├── oauth-microsoft.ts
│   ├── magic-link.ts
│   ├── mfa-enable.ts
│   ├── mfa-disable.ts
│   ├── devices.ts
│   └── login-history.ts
└── shared/
    ├── auth-utils.ts
    ├── mfa-utils.ts
    └── device-detection.ts
```

### Exemplo: Lambda de Login

```typescript
// lambda/auth/login.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { logger } from '../shared/logger';
import { detectDevice } from '../shared/device-detection';

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const JWT_SECRET = process.env.JWT_SECRET!;
const USERS_TABLE = process.env.USERS_TABLE!;
const LOGIN_ATTEMPTS_TABLE = process.env.LOGIN_ATTEMPTS_TABLE!;

interface LoginRequest {
  email: string;
  password: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body: LoginRequest = JSON.parse(event.body || '{}');
    const { email, password } = body;

    // Validação
    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Email e senha são obrigatórios'
        })
      };
    }

    // Buscar usuário
    const userResult = await dynamoDb.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { email }
      })
    );

    const user = userResult.Item;

    if (!user) {
      await logLoginAttempt(email, 'failed', event);
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: 'Credenciais inválidas'
        })
      };
    }

    // Verificar se conta está bloqueada
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          success: false,
          code: 'ACCOUNT_LOCKED',
          message: 'Conta bloqueada por segurança',
          lockoutTime: Math.floor(
            (new Date(user.lockedUntil).getTime() - Date.now()) / 1000
          )
        })
      };
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      await incrementFailedAttempts(email);
      await logLoginAttempt(email, 'failed', event);
      
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: 'Credenciais inválidas'
        })
      };
    }

    // Resetar tentativas falhadas
    await resetFailedAttempts(email);

    // Verificar se MFA está habilitado
    if (user.mfaEnabled) {
      const sessionId = generateSessionId();
      await createMFASession(sessionId, user.id);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: false,
          requiresMFA: true,
          sessionId
        })
      };
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Registrar dispositivo
    const deviceInfo = detectDevice(event);
    await registerDevice(user.id, deviceInfo);

    // Log de sucesso
    await logLoginAttempt(email, 'success', event);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan: user.plan
        },
        token
      })
    };
  } catch (error) {
    logger.error('Login error', { error });
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Erro interno do servidor'
      })
    };
  }
};

async function incrementFailedAttempts(email: string): Promise<void> {
  const result = await dynamoDb.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { email },
      UpdateExpression: 'SET failedAttempts = if_not_exists(failedAttempts, :zero) + :inc',
      ExpressionAttributeValues: {
        ':zero': 0,
        ':inc': 1,
        ':max': 5
      },
      ReturnValues: 'ALL_NEW'
    })
  );

  // Bloquear conta após 5 tentativas
  if (result.Attributes && result.Attributes.failedAttempts >= 5) {
    const lockoutTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
    
    await dynamoDb.send(
      new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { email },
        UpdateExpression: 'SET lockedUntil = :lockoutTime',
        ExpressionAttributeValues: {
          ':lockoutTime': lockoutTime.toISOString()
        }
      })
    );
  }
}

async function resetFailedAttempts(email: string): Promise<void> {
  await dynamoDb.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { email },
      UpdateExpression: 'SET failedAttempts = :zero REMOVE lockedUntil',
      ExpressionAttributeValues: {
        ':zero': 0
      }
    })
  );
}

async function logLoginAttempt(
  email: string,
  status: 'success' | 'failed' | 'suspicious',
  event: APIGatewayProxyEvent
): Promise<void> {
  const deviceInfo = detectDevice(event);
  
  await dynamoDb.send(
    new UpdateCommand({
      TableName: LOGIN_ATTEMPTS_TABLE,
      Key: {
        email,
        timestamp: new Date().toISOString()
      },
      UpdateExpression: 'SET #status = :status, ip = :ip, device = :device, location = :location',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':ip': event.requestContext.identity.sourceIp,
        ':device': deviceInfo.userAgent,
        ':location': 'Unknown' // Implementar geolocalização
      }
    })
  );
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

async function createMFASession(sessionId: string, userId: string): Promise<void> {
  // Implementar criação de sessão temporária para MFA
}

async function registerDevice(userId: string, deviceInfo: any): Promise<void> {
  // Implementar registro de dispositivo
}
```

## 🔑 Configuração OAuth Providers

### Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione existente
3. Ative a API "Google+ API"
4. Vá em "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
5. Configure:
   - Application type: Web application
   - Authorized redirect URIs: `https://api.alquimista.ai/auth/oauth/google/callback`

```typescript
// lambda/auth/oauth-google.ts
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

export const handler = async (event: APIGatewayProxyEvent) => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${REDIRECT_URI}&` +
    `response_type=code&` +
    `scope=email profile&` +
    `state=${generateState()}`;

  return {
    statusCode: 302,
    headers: {
      Location: authUrl
    },
    body: ''
  };
};
```

### Facebook OAuth

1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Crie um novo app
3. Adicione "Facebook Login" ao app
4. Configure:
   - Valid OAuth Redirect URIs: `https://api.alquimista.ai/auth/oauth/facebook/callback`

### Microsoft OAuth

1. Acesse [Azure Portal](https://portal.azure.com/)
2. Vá em "Azure Active Directory" > "App registrations"
3. Registre um novo aplicativo
4. Configure:
   - Redirect URI: `https://api.alquimista.ai/auth/oauth/microsoft/callback`

## 📊 Tabelas DynamoDB

### users
```typescript
{
  email: string (PK),
  id: string (GSI),
  passwordHash: string,
  name: string,
  role: 'admin' | 'user' | 'agent',
  plan: string,
  mfaEnabled: boolean,
  mfaSecret?: string,
  backupCodes?: string[],
  failedAttempts: number,
  lockedUntil?: string,
  createdAt: string,
  updatedAt: string
}
```

### login_attempts
```typescript
{
  email: string (PK),
  timestamp: string (SK),
  status: 'success' | 'failed' | 'suspicious',
  ip: string,
  location: string,
  device: string
}
```

### trusted_devices
```typescript
{
  userId: string (PK),
  deviceId: string (SK),
  name: string,
  type: string,
  browser: string,
  os: string,
  lastUsed: string,
  trusted: boolean
}
```

### mfa_sessions
```typescript
{
  sessionId: string (PK),
  userId: string,
  createdAt: string,
  expiresAt: string
}
```

## 🚀 Deploy

### 1. Adicionar ao CDK Stack

```typescript
// lib/auth-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class AuthStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Tabelas DynamoDB
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    // Lambda de Login
    const loginFunction = new lambda.Function(this, 'LoginFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'login.handler',
      code: lambda.Code.fromAsset('lambda/auth'),
      environment: {
        USERS_TABLE: usersTable.tableName,
        JWT_SECRET: process.env.JWT_SECRET!
      }
    });

    usersTable.grantReadWriteData(loginFunction);

    // API Gateway
    const api = new apigateway.RestApi(this, 'AuthApi', {
      restApiName: 'Alquimista Auth API'
    });

    const auth = api.root.addResource('auth');
    const login = auth.addResource('login');
    login.addMethod('POST', new apigateway.LambdaIntegration(loginFunction));
  }
}
```

### 2. Variáveis de Ambiente

```bash
# .env
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

### 3. Deploy

```bash
cdk deploy AuthStack
```

## ✅ Checklist de Implementação

- [ ] Criar tabelas DynamoDB
- [ ] Implementar Lambda de login básico
- [ ] Implementar Lambda de MFA
- [ ] Configurar OAuth Google
- [ ] Configurar OAuth Facebook
- [ ] Configurar OAuth Microsoft
- [ ] Implementar Magic Link
- [ ] Implementar gerenciamento de dispositivos
- [ ] Implementar histórico de login
- [ ] Configurar rate limiting
- [ ] Implementar detecção de fraude
- [ ] Adicionar logs estruturados
- [ ] Configurar alarmes CloudWatch
- [ ] Testar todos os fluxos
- [ ] Documentar APIs

## 📝 Notas de Segurança

1. **Senhas**: Sempre usar bcrypt com salt rounds >= 10
2. **JWT**: Usar chaves fortes e rotacionar regularmente
3. **MFA**: Usar TOTP (Time-based One-Time Password)
4. **Rate Limiting**: Implementar em todos os endpoints
5. **HTTPS**: Obrigatório em produção
6. **CORS**: Configurar adequadamente
7. **Logs**: Nunca logar senhas ou tokens
8. **Backup Codes**: Criptografar antes de armazenar

## 🔗 Recursos Úteis

- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [TOTP RFC](https://tools.ietf.org/html/rfc6238)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

# Configuração de Infraestrutura - Autenticação Cognito

## Visão Geral

Este documento descreve a configuração necessária da infraestrutura AWS para o sistema de autenticação com Cognito.

## 1. Amazon Cognito User Pool

### Configuração Básica

1. **Criar User Pool**:
   - Nome: `alquimistaai-users-{env}` (dev/prod)
   - Região: `us-east-1`

2. **Atributos do Usuário**:
   - **Padrão (obrigatórios)**:
     - email (verificável)
     - name
   - **Padrão (opcionais)**:
     - phone_number
   - **Customizados**:
     - `custom:tenantId` (String, mutável)
     - `custom:role` (String, mutável)

3. **Políticas de Senha**:
   - Comprimento mínimo: 8 caracteres
   - Requer maiúsculas: Sim
   - Requer minúsculas: Sim
   - Requer números: Sim
   - Requer caracteres especiais: Sim

4. **Verificação de E-mail**:
   - Método: Link de verificação
   - Template customizado (português)

5. **MFA (Multi-Factor Authentication)**:
   - Opcional (usuário pode habilitar)
   - Métodos: SMS, TOTP

### Configuração de App Client

1. **Criar App Client**:
   - Nome: `alquimistaai-web-client`
   - Tipo: Public client
   - Auth flows habilitados:
     - ALLOW_USER_PASSWORD_AUTH
     - ALLOW_REFRESH_TOKEN_AUTH
     - ALLOW_USER_SRP_AUTH

2. **OAuth 2.0**:
   - Callback URLs:
     - Dev: `http://localhost:3000/auth/callback`
     - Prod: `https://app.alquimistaai.com/auth/callback`
   - Sign out URLs:
     - Dev: `http://localhost:3000/auth/login`
     - Prod: `https://app.alquimistaai.com/auth/login`
   - OAuth Scopes:
     - openid
     - email
     - profile
   - OAuth Flows:
     - Authorization code grant
     - Implicit grant

### Provedores de Identidade (OAuth)

#### Google

1. **Criar projeto no Google Cloud Console**
2. **Configurar OAuth consent screen**
3. **Criar credenciais OAuth 2.0**:
   - Tipo: Web application
   - Authorized redirect URIs:
     - `https://{cognito-domain}.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`
4. **Anotar**:
   - Client ID
   - Client Secret
5. **Configurar no Cognito**:
   - Identity provider: Google
   - Client ID: (do Google)
   - Client Secret: (do Google)
   - Authorize scopes: `profile email openid`
   - Attribute mapping:
     - email → email
     - name → name
     - sub → username

#### Facebook

1. **Criar app no Facebook Developers**
2. **Adicionar produto Facebook Login**
3. **Configurar OAuth Redirect URIs**:
   - `https://{cognito-domain}.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`
4. **Anotar**:
   - App ID
   - App Secret
5. **Configurar no Cognito**:
   - Identity provider: Facebook
   - App ID: (do Facebook)
   - App Secret: (do Facebook)
   - Authorize scopes: `public_profile,email`
   - Attribute mapping:
     - email → email
     - name → name
     - id → username

### Hosted UI

1. **Configurar domínio**:
   - Domínio: `alquimistaai-auth-{env}` (Cognito domain)
   - Ou domínio customizado: `auth.alquimistaai.com`

2. **Customizar UI** (opcional):
   - Logo da empresa
   - Cores do tema
   - CSS customizado

## 2. Amazon S3 - Bucket de Logomarcas

### Criar Bucket

```bash
aws s3 mb s3://alquimistaai-logos --region us-east-1
```

### Configurar Políticas

1. **Bucket Policy** (acesso público para leitura):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::alquimistaai-logos/*"
    }
  ]
}
```

2. **CORS Configuration**:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://app.alquimistaai.com"
    ],
    "ExposeHeaders": ["ETag"]
  }
]
```

3. **Lifecycle Policy** (opcional - limpar uploads incompletos):

```json
{
  "Rules": [
    {
      "Id": "DeleteIncompleteMultipartUpload",
      "Status": "Enabled",
      "Prefix": "",
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 7
      }
    }
  ]
}
```

### Estrutura de Pastas

```
alquimistaai-logos/
├── {tenantId-1}/
│   └── logo.png
├── {tenantId-2}/
│   └── logo.jpg
└── {tenantId-3}/
    └── logo.svg
```

## 3. IAM Roles e Políticas

### Role para Lambda (Upload de Logos)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::alquimistaai-logos/*"
    }
  ]
}
```

### Role para Lambda (Secrets Manager - Integrações)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:CreateSecret",
        "secretsmanager:GetSecretValue",
        "secretsmanager:PutSecretValue",
        "secretsmanager:DeleteSecret",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:/alquimista/*"
    }
  ]
}
```

## 4. Variáveis de Ambiente

### Frontend (.env.local)

```bash
# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_COGNITO_DOMAIN=alquimistaai-auth-dev.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_DOMAIN_HOST=alquimistaai-auth-dev.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=https://api-dev.alquimistaai.com
```

### Backend (Lambda Environment Variables)

```bash
# AWS
AWS_REGION=us-east-1
S3_LOGOS_BUCKET=alquimistaai-logos

# Database
DATABASE_HOST=alquimistaai-aurora-dev.cluster-xxxxx.us-east-1.rds.amazonaws.com
DATABASE_NAME=alquimistaai
DATABASE_USER=admin
DATABASE_PASSWORD_SECRET_ARN=arn:aws:secretsmanager:us-east-1:xxx:secret:db-password

# Cognito
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 5. Checklist de Configuração

### Cognito User Pool
- [ ] User Pool criado
- [ ] Atributos customizados configurados (tenantId, role)
- [ ] Políticas de senha configuradas
- [ ] App Client criado
- [ ] OAuth configurado (callback URLs)
- [ ] Provedor Google configurado
- [ ] Provedor Facebook configurado
- [ ] Hosted UI configurado
- [ ] Domínio configurado

### S3
- [ ] Bucket criado
- [ ] Bucket policy configurada (acesso público leitura)
- [ ] CORS configurado
- [ ] Lifecycle policy configurada (opcional)

### IAM
- [ ] Role Lambda com acesso S3 criada
- [ ] Role Lambda com acesso Secrets Manager criada
- [ ] Políticas anexadas às roles

### Variáveis de Ambiente
- [ ] Frontend .env.local configurado
- [ ] Backend environment variables configuradas
- [ ] Secrets Manager configurado para DB password

## 6. Comandos Úteis

### Listar User Pools

```bash
aws cognito-idp list-user-pools --max-results 10 --region us-east-1
```

### Descrever User Pool

```bash
aws cognito-idp describe-user-pool \
  --user-pool-id us-east-1_XXXXXXXXX \
  --region us-east-1
```

### Criar Usuário de Teste

```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username test@example.com \
  --user-attributes Name=email,Value=test@example.com Name=name,Value="Test User" \
  --temporary-password "TempPass123!" \
  --region us-east-1
```

### Listar Buckets S3

```bash
aws s3 ls
```

### Upload de Teste para S3

```bash
aws s3 cp logo.png s3://alquimistaai-logos/test-tenant/logo.png
```

## 7. Troubleshooting

### Erro: "User pool client does not exist"
- Verificar se o Client ID está correto
- Verificar se o User Pool ID está correto
- Verificar região (us-east-1)

### Erro: "Invalid redirect URI"
- Verificar se a URL de callback está registrada no App Client
- Verificar protocolo (http vs https)
- Verificar porta (3000 para dev)

### Erro: "Access Denied" no S3
- Verificar bucket policy
- Verificar IAM role da Lambda
- Verificar CORS configuration

### Erro: OAuth não funciona
- Verificar configuração do provedor (Google/Facebook)
- Verificar redirect URIs no provedor
- Verificar attribute mapping no Cognito
- Verificar scopes configurados

## 8. Próximos Passos

Após completar esta configuração:
1. Testar login com e-mail/senha
2. Testar login social (Google/Facebook)
3. Testar upload de logomarca
4. Testar criação de usuário
5. Validar tokens e sessões

## Referências

- [Amazon Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Cognito OAuth 2.0](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html)
- [S3 Bucket Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html)

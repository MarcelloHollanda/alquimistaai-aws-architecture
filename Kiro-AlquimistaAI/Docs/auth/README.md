# Sistema de Autenticação Cognito - AlquimistaAI

## Visão Geral

Sistema completo de autenticação multi-tenant com Amazon Cognito, incluindo login tradicional, OAuth social (Google/Facebook), recuperação de senha, cadastro de empresas e gerenciamento de permissões.

## Índice

- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Configuração](#configuração)
- [Fluxos de Autenticação](#fluxos-de-autenticação)
- [Permissões e Papéis](#permissões-e-papéis)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Arquitetura

### Componentes Principais

1. **Amazon Cognito User Pool**: Gerenciamento de usuários e autenticação
2. **Backend Lambda**: 9 handlers para operações de usuários, empresas e integrações
3. **Frontend Next.js**: Componentes React e páginas de autenticação
4. **Aurora PostgreSQL**: Armazenamento de dados de empresas, usuários e permissões
5. **AWS Secrets Manager**: Armazenamento seguro de credenciais de integrações
6. **S3**: Armazenamento de logomarcas de empresas

### Fluxo de Dados

```
Usuário → Frontend → Cognito → Backend Lambda → Aurora/S3/Secrets Manager
```

---

## Funcionalidades

### Autenticação

- ✅ Login com e-mail e senha
- ✅ Login social (Google e Facebook)
- ✅ Recuperação de senha
- ✅ Confirmação de e-mail
- ✅ Logout
- ✅ Sessão segura com cookies HttpOnly

### Gestão de Usuários

- ✅ Cadastro de usuário
- ✅ Atualização de perfil (nome, telefone, idioma, timezone)
- ✅ Alteração de senha
- ✅ Sistema de papéis (MASTER, ADMIN, OPERATIONAL, READ_ONLY)

### Gestão de Empresas

- ✅ Cadastro de empresa (multi-tenant)
- ✅ Atualização de dados da empresa
- ✅ Upload de logomarca
- ✅ Controle de permissões

### Integrações

- ✅ 8 integrações disponíveis (Google Calendar, WhatsApp, SendGrid, etc.)
- ✅ Conexão/desconexão de integrações
- ✅ Armazenamento seguro de credenciais

---

## Configuração

### 1. Variáveis de Ambiente

Copie `.env.example` para `.env.local` e configure:

```bash
# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_COGNITO_DOMAIN=alquimistaai-auth
NEXT_PUBLIC_COGNITO_REGION=us-east-1

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=https://api.alquimistaai.com

# AWS
AWS_REGION=us-east-1
S3_LOGOS_BUCKET=alquimistaai-logos
```

### 2. Configurar Cognito User Pool

```bash
# Via AWS Console ou CDK
1. Criar User Pool
2. Adicionar atributos customizados: custom:tenantId, custom:role
3. Configurar OAuth providers (Google, Facebook)
4. Configurar Hosted UI
5. Adicionar callback URLs
```

### 3. Executar Migrations

```bash
# Aplicar migrations no Aurora
psql -h <host> -U <user> -d <database> -f database/migrations/011_create_auth_companies.sql
psql -h <host> -U <user> -d <database> -f database/migrations/012_create_auth_users.sql
psql -h <host> -U <user> -d <database> -f database/migrations/013_create_auth_user_roles.sql
psql -h <host> -U <user> -d <database> -f database/migrations/014_create_auth_integrations.sql
```

### 4. Deploy Backend

```bash
# Deploy handlers Lambda via CDK
cdk deploy CognitoAuthStack --context env=dev
```

---

## Fluxos de Autenticação

### Login com E-mail/Senha

```
1. Usuário acessa /auth/login
2. Preenche e-mail e senha
3. Frontend chama signIn() do cognito-client
4. Cognito valida credenciais
5. Retorna tokens (access, id, refresh)
6. Frontend armazena em cookies HttpOnly via /api/auth/session
7. Redireciona para /app/dashboard
```

### Login Social (OAuth)

```
1. Usuário clica "Continuar com Google/Facebook"
2. Frontend chama signInWithGoogle/Facebook()
3. Redireciona para Cognito Hosted UI
4. Usuário autentica no provedor
5. Provedor redireciona para Cognito
6. Cognito redireciona para /auth/callback?code=xxx
7. Frontend processa callback com handleOAuthCallback()
8. Armazena tokens em cookies
9. Redireciona para /app/dashboard
```

### Recuperação de Senha

```
1. Usuário acessa /auth/forgot-password
2. Informa e-mail
3. Frontend chama forgotPassword()
4. Cognito envia código por e-mail
5. Usuário acessa /auth/reset-password
6. Informa código e nova senha
7. Frontend chama confirmPassword()
8. Senha é redefinida
9. Redireciona para /auth/login
```

### Cadastro

```
1. Usuário acessa /auth/register
2. Preenche dados pessoais (passo 1)
3. Preenche dados da empresa (passo 2)
4. Frontend chama signUp() do Cognito
5. Frontend chama create-company e create-user handlers
6. Cognito envia código de confirmação
7. Usuário confirma e-mail em /auth/confirm
8. Redireciona para /auth/login
```

---

## Permissões e Papéis

### Hierarquia de Papéis

```
MASTER (nível 4)
  └─ Acesso total ao sistema
  └─ Pode gerenciar todos os usuários
  └─ Pode editar dados da empresa
  └─ Pode conectar/desconectar integrações

ADMIN (nível 3)
  └─ Pode gerenciar usuários (exceto MASTER)
  └─ Pode editar dados da empresa
  └─ Pode conectar/desconectar integrações

OPERATIONAL (nível 2)
  └─ Pode usar funcionalidades operacionais
  └─ Não pode gerenciar usuários
  └─ Não pode editar empresa

READ_ONLY (nível 1)
  └─ Apenas visualização
  └─ Não pode editar nada
```

### Controle de Acesso

Todos os handlers Lambda verificam permissões:

```typescript
// Exemplo: update-company.ts
const roleCheck = await client.query(
  `SELECT ur.role FROM users u
   INNER JOIN user_roles ur ON u.id = ur.user_id
   WHERE u.cognito_sub = $1 AND u.tenant_id = $2`,
  [cognitoSub, tenantId]
);

if (userRole !== 'MASTER' && userRole !== 'ADMIN') {
  return { statusCode: 403, body: 'Sem permissão' };
}
```

---

## API Reference

### Handlers Lambda

| Handler | Método | Rota | Descrição |
|---------|--------|------|-----------|
| create-company | POST | /api/companies | Criar empresa |
| update-company | PUT | /api/companies/{id} | Atualizar empresa |
| upload-logo | POST | /api/upload/logo | Upload de logomarca |
| create-user | POST | /api/users | Criar usuário |
| update-user | PUT | /api/users/{id} | Atualizar usuário |
| get-user | GET | /api/users/{id} | Buscar usuário |
| connect-integration | POST | /api/integrations/connect | Conectar integração |
| disconnect-integration | POST | /api/integrations/disconnect | Desconectar integração |
| list-integrations | GET | /api/integrations | Listar integrações |

### Biblioteca Cliente (Frontend)

```typescript
import { 
  signIn, 
  signUp, 
  signOut, 
  forgotPassword, 
  confirmPassword,
  changePassword,
  signInWithGoogle,
  signInWithFacebook
} from '@/lib/cognito-client';

// Login
await signIn('email@example.com', 'password');

// Cadastro
await signUp('email@example.com', 'password', 'Nome');

// Recuperar senha
await forgotPassword('email@example.com');
await confirmPassword('email@example.com', '123456', 'newPassword');

// OAuth
signInWithGoogle(); // Redireciona
signInWithFacebook(); // Redireciona
```

---

## Troubleshooting

### Erro: "User does not exist"

**Causa**: Usuário não cadastrado no Cognito  
**Solução**: Verificar se o cadastro foi concluído e e-mail confirmado

### Erro: "Invalid session"

**Causa**: Token expirado ou inválido  
**Solução**: Fazer logout e login novamente

### Erro: "Tenant not found"

**Causa**: Empresa não existe no banco de dados  
**Solução**: Verificar se a migration foi executada e empresa foi criada

### Erro: "Permission denied"

**Causa**: Usuário não tem permissão para a operação  
**Solução**: Verificar papel do usuário (deve ser MASTER ou ADMIN)

### Erro: "CNPJ já cadastrado"

**Causa**: CNPJ já existe no banco  
**Solução**: Usar outro CNPJ ou recuperar acesso à empresa existente

### OAuth não funciona

**Causa**: Configuração incorreta no Cognito  
**Solução**: 
1. Verificar se OAuth providers estão configurados
2. Verificar callback URLs
3. Verificar client ID e secret dos provedores

---

## Documentos Relacionados

- [COGNITO-INFRASTRUCTURE-SETUP.md](./COGNITO-INFRASTRUCTURE-SETUP.md) - Setup de infraestrutura
- [COGNITO-AUTH-SUMMARY.md](./COGNITO-AUTH-SUMMARY.md) - Resumo técnico
- [IMPLEMENTATION-PROGRESS.md](./IMPLEMENTATION-PROGRESS.md) - Progresso de implementação
- [FINAL-IMPLEMENTATION-REPORT.md](./FINAL-IMPLEMENTATION-REPORT.md) - Relatório final

---

## Suporte

Para dúvidas ou problemas:
1. Consulte a documentação completa em `docs/auth/`
2. Verifique os logs do CloudWatch
3. Revise as migrations do banco de dados
4. Entre em contato com a equipe de desenvolvimento

---

**Última atualização**: 18 de Novembro de 2025  
**Versão**: 1.0

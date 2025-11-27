# Spec: Acesso Real ao Painel com Cognito

## Visão Geral

Esta spec implementa o fluxo completo de autenticação real com Amazon Cognito no Painel Operacional AlquimistaAI, permitindo que usuários façam login via Cognito Hosted UI e sejam automaticamente redirecionados para o dashboard apropriado baseado em seus grupos.

## Contexto

Atualmente, o sistema possui:
- ✅ User Pool Cognito configurado (`fibonacci-users-dev`)
- ✅ 4 grupos criados (INTERNAL_ADMIN, INTERNAL_SUPPORT, TENANT_ADMIN, TENANT_USER)
- ✅ 4 usuários de teste criados e atribuídos aos grupos
- ✅ 38 testes de segurança passando
- ✅ Middleware básico de proteção de rotas
- ❌ **Falta**: Integração real com Cognito OAuth
- ❌ **Falta**: Redirecionamento automático por grupo
- ❌ **Falta**: Fluxo de login/logout funcional

## Objetivos

1. Implementar login real via Cognito Hosted UI (OAuth 2.0)
2. Extrair grupos do token JWT e mapear para perfis internos
3. Redirecionar automaticamente:
   - Usuários internos (INTERNAL_*) → `/app/company`
   - Clientes (TENANT_*) → `/app/dashboard`
4. Bloquear acesso cross-dashboard
5. Implementar logout completo
6. Validar com os 4 usuários DEV existentes

## Usuários de Teste (DEV)

| Email | Grupo | Rota Esperada | Acesso a /app/company |
|-------|-------|---------------|----------------------|
| jmrhollanda@gmail.com | INTERNAL_ADMIN | /app/company | ✅ Permitido |
| alquimistafibonacci@gmail.com | INTERNAL_SUPPORT | /app/company | ✅ Permitido |
| marcello@c3comercial.com.br | TENANT_ADMIN | /app/dashboard | ❌ Bloqueado |
| leylany@c3comercial.com.br | TENANT_USER | /app/dashboard | ❌ Bloqueado |

## Arquitetura

```
┌─────────┐      ┌──────────────┐      ┌─────────────┐
│ Usuário │─────▶│ /auth/login  │─────▶│   Cognito   │
└─────────┘      └──────────────┘      │  Hosted UI  │
                                        └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Callback   │
                                        │  /auth/     │
                                        │  callback   │
                                        └─────────────┘
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        ▼                                              ▼
                ┌───────────────┐                              ┌──────────────┐
                │ INTERNAL_*    │                              │  TENANT_*    │
                │ /app/company  │                              │ /app/dashboard│
                └───────────────┘                              └──────────────┘
```

## Componentes Principais

1. **Cognito Client** (`frontend/src/lib/cognito-client.ts`)
   - Funções OAuth (iniciar fluxo, trocar código, gerenciar tokens)

2. **Auth Store** (`frontend/src/stores/auth-store.ts`)
   - Estado global de autenticação
   - Mapeamento de grupos para perfis

3. **Middleware** (`frontend/middleware.ts`)
   - Proteção de rotas
   - Validação de tokens
   - Redirecionamento por grupo

4. **Callback Page** (`frontend/src/app/auth/callback/page.tsx`)
   - Processar retorno do Cognito
   - Armazenar tokens
   - Redirecionar para dashboard

5. **Login Page** (`frontend/src/app/(auth)/login/page.tsx`)
   - Botão OAuth
   - Mensagem explicativa

## Variáveis de Ambiente

```bash
# .env.local (Development)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_Y8p2TeMbv
NEXT_PUBLIC_COGNITO_CLIENT_ID=59fs99tv0sbrmelkqef83itenu
NEXT_PUBLIC_COGNITO_DOMAIN_HOST=us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=http://localhost:3000/auth/login
NEXT_PUBLIC_AWS_REGION=us-east-1
```

## Fluxo de Implementação

1. ✅ Configurar variáveis de ambiente
2. ✅ Implementar funções OAuth no Cognito Client
3. ✅ Atualizar Auth Store com mapeamento de grupos
4. ✅ Implementar página de callback
5. ✅ Atualizar página de login
6. ✅ Implementar middleware de proteção
7. ✅ Implementar redirecionamento pós-login
8. ✅ Implementar logout completo
9. ✅ Testar com 4 usuários DEV
10. ✅ Documentar processo

## Critérios de Aceite

- [ ] Login via Cognito Hosted UI funciona
- [ ] Tokens são armazenados em cookies seguros
- [ ] Grupos são extraídos corretamente do token
- [ ] INTERNAL_* são redirecionados para /app/company
- [ ] TENANT_* são redirecionados para /app/dashboard
- [ ] TENANT_* são bloqueados de acessar /app/company
- [ ] Logout limpa cookies e redireciona corretamente
- [ ] Todos os 4 usuários DEV conseguem fazer login
- [ ] 38 testes de segurança continuam passando
- [ ] Documentação completa criada

## Segurança

- Tokens armazenados em cookies HTTP-only
- Flags secure e sameSite=strict
- Validação de expiração no middleware
- Bloqueio de acesso cross-dashboard
- Logs de tentativas de acesso não autorizado

## Testes

### Manual (DEV)

1. Testar login com cada um dos 4 usuários
2. Verificar redirecionamento correto
3. Verificar bloqueio de acesso cross-dashboard
4. Testar logout

### Automatizados

- Testes de segurança existentes (38/38)
- Unit tests para funções OAuth
- Integration tests para fluxo completo

## Documentação

Após implementação, criar:
- `docs/operational-dashboard/ACCESS-QUICK-REFERENCE.md`
- Diagrama de fluxo de autenticação
- Guia de troubleshooting
- Lista de arquivos modificados

## Próximos Passos

Após completar esta spec:
1. Validar em DEV com 4 usuários
2. Preparar para deploy em produção
3. Criar usuários de produção
4. Habilitar MFA para usuários internos (prod)

## Referências

- [Cognito Hosted UI](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html)
- [OAuth 2.0 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)
- [JWT Claims](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html)
- [Documentação Interna](../../docs/security/ONBOARDING-USERS-COGNITO-ALQUIMISTAAI.md)

## Status

- **Criado**: 2025-11-19
- **Status**: 📝 Aguardando aprovação
- **Próximo passo**: Revisar requirements e design

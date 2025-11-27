# Página de Login - OAuth Cognito

## ⚠️ IMPORTANTE: Rota Atualizada

**ROTA OFICIAL:** `/login`

**Localização do arquivo:** `frontend/src/app/(auth)/login/page.tsx`

**Nota:** O diretório `(auth)` é um route group do Next.js e não aparece na URL.

---

## Visão Geral

A página de login usa exclusivamente o fluxo OAuth 2.0 do Amazon Cognito via Hosted UI.

## Mudanças Implementadas

### ✅ Removido
- Formulário de email/senha (LoginForm)
- Botões de login social (SocialLoginButtons)
- Link para criar nova conta
- Link para recuperação de senha

### ✅ Adicionado
- Botão único "Entrar com Cognito" que chama `initOAuthFlow()`
- Mensagem explicativa sobre login único
- Tratamento de parâmetros de erro na URL
- Mensagem de erro amigável quando há falha no login
- Informações sobre acesso restrito

## Fluxo de Autenticação

1. **Usuário acessa `/login`**
   - Vê mensagem explicativa sobre login único
   - Vê botão "Entrar com Cognito"

2. **Usuário clica em "Entrar"**
   - Função `initOAuthFlow()` é chamada
   - Usuário é redirecionado para Cognito Hosted UI
   - URL: `https://{domain}/oauth2/authorize?client_id=...&response_type=code&...`

3. **Usuário faz login no Cognito**
   - Insere credenciais na interface do Cognito
   - Cognito valida e retorna código de autorização

4. **Cognito redireciona para callback**
   - URL: `/auth/callback?code=...`
   - Página de callback processa o código (Task 4 - já implementada)

5. **Redirecionamento final**
   - Usuário é redirecionado para dashboard apropriado
   - INTERNAL_* → `/app/company`
   - TENANT_* → `/app/dashboard`

## Tratamento de Erros

A página verifica parâmetros de erro na URL:

```typescript
// Parâmetros de erro possíveis
?error=access_denied
?error_description=User cancelled login
```

Quando há erro:
- Mensagem amigável é exibida em um alerta vermelho
- Usuário pode tentar novamente clicando no botão

## Variáveis de Ambiente Necessárias

```bash
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_Y8p2TeMbv
NEXT_PUBLIC_COGNITO_CLIENT_ID=59fs99tv0sbrmelkqef83itenu
NEXT_PUBLIC_COGNITO_DOMAIN_HOST=us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=http://localhost:3000/auth/login
NEXT_PUBLIC_AWS_REGION=us-east-1
```

## Componentes Utilizados

- `Button` (shadcn/ui) - Botão principal de login
- `AlertCircle` (lucide-react) - Ícone de erro
- `useSearchParams` (next/navigation) - Leitura de parâmetros da URL
- `initOAuthFlow` (cognito-client) - Inicia fluxo OAuth

## Testes Manuais

### Teste 1: Login Bem-Sucedido
1. Acesse `http://localhost:3000/login`
2. Clique em "Entrar com Cognito"
3. Faça login no Cognito Hosted UI
4. Verifique redirecionamento para dashboard correto

### Teste 2: Erro de Login
1. Acesse `http://localhost:3000/login?error=access_denied&error_description=User%20cancelled`
2. Verifique que mensagem de erro é exibida
3. Clique em "Entrar" novamente
4. Verifique que erro desaparece e fluxo reinicia

### Teste 3: Configuração Ausente
1. Remova uma variável de ambiente (ex: NEXT_PUBLIC_COGNITO_CLIENT_ID)
2. Acesse a página de login
3. Clique em "Entrar"
4. Verifique erro no console sobre variável ausente

## Requisitos Validados

- ✅ **1.2**: Redireciona para login quando não autenticado
- ✅ **1.3**: Botão "Entrar" inicia fluxo OAuth

## Próximos Passos

Após esta implementação:
- Task 6: Implementar middleware de proteção de rotas
- Task 7: Implementar lógica de redirecionamento pós-login
- Task 8: Implementar logout completo

## Observações

- A página é um Client Component (`'use client'`) para usar hooks do React
- Não há mais formulários de email/senha - tudo via OAuth
- Mensagens são em português brasileiro
- Design minimalista e focado na experiência do usuário

# Checklist de Validação PKCE + Cognito - 25/11/2024

## ✅ Correções Implementadas

### 1. PKCE Implementado
- ✅ Função `generateRandomString()` criada
- ✅ Função `generateCodeChallenge()` criada
- ✅ `code_verifier` gerado e salvo em `sessionStorage`
- ✅ `code_challenge` enviado para `/oauth2/authorize`
- ✅ `code_verifier` recuperado e enviado para `/oauth2/token`
- ✅ `code_verifier` limpo após uso

### 2. Redirect URI Centralizado
- ✅ Variável `NEXT_PUBLIC_COGNITO_REDIRECT_URI` no `.env.local`
- ✅ Mesma constante usada em `/authorize` e `/token`
- ✅ Sem URLs hardcoded no código

### 3. Domínio Correto
- ✅ `NEXT_PUBLIC_COGNITO_DOMAIN_HOST=us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com`
- ✅ Sem `https://` duplicado
- ✅ Sem caminho extra

### 4. App Client Configurado
- ✅ Callback URL: `http://localhost:3000/auth/callback`
- ✅ Logout URL: `http://localhost:3000/auth/logout-callback`
- ✅ OAuth Flows: `Authorization code grant`
- ✅ OAuth Scopes: `openid`, `email`

## 🧪 Como Testar

### Teste 1: Validação Automática

```powershell
cd frontend/scripts
.\validate-redirect-uri.ps1
```

**Resultado esperado:**
- ✅ Variáveis de ambiente configuradas
- ✅ Constante centralizada sendo usada
- ✅ Callback/Logout URLs configuradas no App Client
- ✅ Nenhuma URL hardcoded encontrada

### Teste 2: Teste Manual com Código Real

```powershell
cd frontend/scripts
.\test-cognito-token-manual.ps1
```

**Passos:**
1. Abrir `http://localhost:3000`
2. Clicar em "Login com Google"
3. Após login, copiar o `code` da URL de callback
4. Colar no script quando solicitado

**Resultado esperado:**
- ✅ Status 200
- ✅ Tokens retornados (id_token, access_token, refresh_token)
- ✅ Sem erro `invalid_grant`

**Se der erro `invalid_grant`:**
- ❌ Problema é configuração do Cognito
- Verificar App Client no console AWS
- Verificar se PKCE está habilitado (se necessário)

**Se funcionar:**
- ✅ Problema NÃO é configuração do Cognito
- ✅ Problema está no código do frontend
- Verificar logs do console do navegador

### Teste 3: Teste no Navegador

```powershell
cd frontend
npm run dev
```

1. Abrir `http://localhost:3000`
2. Abrir DevTools (F12) → Console
3. Clicar em "Login com Google"
4. Verificar logs:

**Logs esperados:**
```
[Cognito] PKCE gerado { codeVerifierLength: 128, codeChallengeLength: 43 }
[Cognito] Iniciando fluxo OAuth com PKCE
```

5. Após callback:

**Logs esperados:**
```
[Cognito] code_verifier recuperado { length: 128, preview: 'abc...' }
[Cognito] Trocando código por tokens com PKCE
[Cognito] Tokens obtidos com sucesso { expiresIn: 3600 }
```

**Se der erro:**
```
[Cognito] Erro ao trocar código por tokens: {
  status: 400,
  error: 'invalid_grant',
  codeVerifierPresent: true/false,
  redirectUri: '...'
}
```

## 🔍 Diagnóstico de Problemas

### Erro: `code_verifier não encontrado no sessionStorage`

**Causa:** sessionStorage foi limpo ou hot reload

**Solução:**
1. Limpar cache do navegador
2. Fechar todas as abas do localhost:3000
3. Tentar novamente

### Erro: `invalid_grant` no teste manual

**Causa:** Configuração do Cognito

**Verificar:**
1. App Client tem as URLs corretas?
2. Código já foi usado? (códigos são de uso único)
3. Código expirou? (válido por ~10 minutos)

**Comando para verificar App Client:**
```powershell
aws cognito-idp describe-user-pool-client `
  --region us-east-1 `
  --user-pool-id us-east-1_Y8p2TeMbv `
  --client-id 59fs99tv0sbrmelkqef83itenu `
  --query 'UserPoolClient.{CallbackURLs:CallbackURLs,LogoutURLs:LogoutURLs}'
```

### Erro: `invalid_grant` no navegador (mas teste manual funciona)

**Causa:** Problema no código do frontend

**Verificar:**
1. `code_verifier` está sendo salvo?
   ```javascript
   sessionStorage.getItem('pkce_code_verifier')
   ```

2. `code_verifier` está sendo enviado?
   - Abrir DevTools → Network
   - Filtrar por `/oauth2/token`
   - Ver payload da requisição
   - Verificar se `code_verifier` está presente

3. `redirect_uri` é o mesmo?
   - Comparar o usado em `/authorize` com o usado em `/token`

## 📊 Variáveis de Ambiente

### Arquivo: `frontend/.env.local`

```env
# Cognito Frontend (NEXT_PUBLIC_*)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_Y8p2TeMbv
NEXT_PUBLIC_COGNITO_CLIENT_ID=59fs99tv0sbrmelkqef83itenu
NEXT_PUBLIC_COGNITO_DOMAIN_HOST=us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=http://localhost:3000/auth/logout-callback
NEXT_PUBLIC_COGNITO_REGION=us-east-1
```

### Validação

```powershell
# Verificar se as variáveis estão definidas
cd frontend
npm run dev

# No navegador, abrir console e digitar:
console.log({
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN_HOST,
  redirectUri: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI,
})
```

## 🎯 Próximos Passos

### Se tudo funcionar:
1. ✅ Adicionar usuário ao grupo `INTERNAL_ADMIN`
   ```powershell
   cd frontend/scripts
   .\add-user-to-group.ps1 -Username 'google_117588024107060027634' -GroupName 'INTERNAL_ADMIN'
   ```

2. ✅ Testar acesso ao dashboard
3. ✅ Verificar permissões

### Se ainda houver erro:
1. Executar teste manual para isolar o problema
2. Verificar logs do console do navegador
3. Verificar Network tab no DevTools
4. Comparar `redirect_uri` entre `/authorize` e `/token`

## 📝 Arquivos Modificados

- `frontend/src/lib/cognito-client.ts` - PKCE implementado
- `frontend/.env.local` - Variáveis centralizadas
- `frontend/scripts/validate-redirect-uri.ps1` - Script de validação
- `frontend/scripts/test-cognito-token-manual.ps1` - Teste manual
- `frontend/docs/LOG-IMPLEMENTACAO-PKCE-25-11-2024.md` - Log detalhado

## 🔒 Segurança

### PKCE (RFC 7636)
- ✅ `code_verifier`: 128 caracteres aleatórios
- ✅ `code_challenge`: SHA-256 + base64url
- ✅ `code_challenge_method`: S256
- ✅ Armazenamento: sessionStorage (limpo após uso)

### Redirect URI
- ✅ Centralizado em variável de ambiente
- ✅ Validado pelo Cognito
- ✅ Registrado no App Client

---

**Data**: 25/11/2024  
**Status**: ✅ Implementado e Pronto para Teste  
**Próximo Passo**: Executar testes de validação

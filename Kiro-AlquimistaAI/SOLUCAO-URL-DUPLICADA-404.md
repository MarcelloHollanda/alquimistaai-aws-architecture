# 🚨 SOLUÇÃO: URL Duplicada `http://localhost:3001/http://localhost:3001/` - Erro 404

## 🎯 PROBLEMA IDENTIFICADO

**URL Incorreta:** `http://localhost:3001/http://localhost:3001/`  
**Erro:** 404 Not Found  
**Causa:** Duplicação da base URL ao fazer requisições HTTP

---

## 📁 ARQUIVOS ENVOLVIDOS

### 1. **Configuração de Ambiente**

#### `frontend/.env.local`
**Problema:** Configuração incorreta da URL da API
```env
# ❌ INCORRETO - Pode estar causando duplicação
NEXT_PUBLIC_API_URL=https://c5loeivg0k.execute-api.us-east-1.amazonaws.com

# ✅ CORRETO - Para desenvolvimento local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### `frontend/.env.production`
```env
NEXT_PUBLIC_API_URL=https://ogsd1547nd.execute-api.us-east-1.amazonaws.com
```

#### `frontend/.env.local.example`
```env
NEXT_PUBLIC_API_URL=https://c5loeivg0k.execute-api.us-east-1.amazonaws.com
```

---

### 2. **Configuração do Next.js**

#### `frontend/next.config.js`
**Linha 21-24:** Define fallback da API URL
```javascript
env: {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  // ...
},
```

---

### 3. **Cliente de API**

#### `frontend/src/lib/api-client.ts`
**Linhas 6-10:** Configuração da base URL
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://ogsd1547nd.execute-api.us-east-1.amazonaws.com'
    : 'https://c5loeivg0k.execute-api.us-east-1.amazonaws.com');
```

**Linhas 27-29:** Construção da URL de requisição
```typescript
private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${this.baseUrl}${endpoint}`;  // ⚠️ AQUI PODE ESTAR O PROBLEMA
  // ...
}
```

**PROBLEMA POTENCIAL:**
- Se `this.baseUrl` já contém uma URL completa
- E `endpoint` também contém uma URL completa
- Resultado: `http://localhost:3001/http://localhost:3001/`

---

### 4. **Cliente Cognito**

#### `frontend/src/lib/cognito-client.ts`
**Linhas 18-42:** Configuração do Cognito
```typescript
function getCognitoConfig(): CognitoConfig {
  const config = {
    redirectUri: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI || '',
    logoutUri: process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI || '',
    // ...
  };
}
```

**Linhas 337-349:** Armazenamento de tokens
```typescript
export const storeTokensInCookies = async (tokens: TokenSet): Promise<void> => {
  const response = await fetch('/api/auth/set-tokens', {  // ⚠️ URL relativa
    method: 'POST',
    // ...
  });
}
```

---

### 5. **Middleware**

#### `frontend/middleware.ts`
**Não causa o problema diretamente**, mas pode redirecionar incorretamente se as URLs estiverem mal configuradas.

---

## 🔍 CAUSAS POSSÍVEIS

### Causa 1: Endpoint com URL Completa
```typescript
// ❌ INCORRETO
apiClient.request('http://localhost:3001/api/users');

// Resultado: http://localhost:3001/http://localhost:3001/api/users
```

### Causa 2: Base URL Duplicada
```typescript
// ❌ INCORRETO
const baseUrl = 'http://localhost:3001/http://localhost:3001';
apiClient.request('/api/users');

// Resultado: http://localhost:3001/http://localhost:3001/api/users
```

### Causa 3: Variável de Ambiente Incorreta
```env
# ❌ INCORRETO
NEXT_PUBLIC_API_URL=http://localhost:3001/http://localhost:3001
```

---

## ✅ SOLUÇÕES

### Solução 1: Verificar Variáveis de Ambiente

**Arquivo:** `frontend/.env.local`

```env
# ✅ CORRETO - Para desenvolvimento local
NEXT_PUBLIC_API_URL=http://localhost:3001

# ✅ CORRETO - Para desenvolvimento com AWS
NEXT_PUBLIC_API_URL=https://c5loeivg0k.execute-api.us-east-1.amazonaws.com

# ❌ NUNCA FAÇA ISSO
NEXT_PUBLIC_API_URL=http://localhost:3001/http://localhost:3001
```

**Comando para verificar:**
```powershell
# No diretório frontend/
Get-Content .env.local | Select-String "NEXT_PUBLIC_API_URL"
```

---

### Solução 2: Corrigir Chamadas de API

**Arquivo:** `frontend/src/lib/api-client.ts`

**Verificar que endpoints sempre começam com `/`:**
```typescript
// ✅ CORRETO
async healthCheck() {
  return this.request<{ ok: boolean }>('/health');
}

// ❌ INCORRETO
async healthCheck() {
  return this.request<{ ok: boolean }>('http://localhost:3001/health');
}
```

---

### Solução 3: Adicionar Validação na Construção de URL

**Arquivo:** `frontend/src/lib/api-client.ts`

**Adicionar validação antes de construir URL:**
```typescript
private async request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // ✅ Validar que endpoint não é uma URL completa
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    console.error('[API Client] Endpoint não deve ser uma URL completa:', endpoint);
    throw new Error('Endpoint deve ser um caminho relativo, não uma URL completa');
  }

  // ✅ Garantir que endpoint começa com /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const url = `${this.baseUrl}${normalizedEndpoint}`;
  
  console.log('[API Client] Requisição:', { baseUrl: this.baseUrl, endpoint: normalizedEndpoint, url });
  
  // ... resto do código
}
```

---

### Solução 4: Verificar Todas as Chamadas de API

**Buscar por padrões incorretos:**
```powershell
# No diretório frontend/
# Buscar por chamadas com URL completa
Select-String -Path "src/**/*.ts","src/**/*.tsx" -Pattern "apiClient.*http://" -CaseSensitive
Select-String -Path "src/**/*.ts","src/**/*.tsx" -Pattern "fetch\('http://localhost:3001/http" -CaseSensitive
```

---

## 🛠️ CHECKLIST DE DIAGNÓSTICO

### Passo 1: Verificar Variáveis de Ambiente
```powershell
cd frontend
Get-Content .env.local
```

- [ ] `NEXT_PUBLIC_API_URL` está correto?
- [ ] Não há URLs duplicadas?
- [ ] Não há barras extras no final?

### Passo 2: Verificar Console do Navegador
```javascript
// No console do navegador (F12)
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

- [ ] URL está correta no browser?
- [ ] Não há duplicação?

### Passo 3: Verificar Network Tab
1. Abrir DevTools (F12)
2. Ir para aba Network
3. Fazer uma requisição
4. Verificar a URL completa da requisição

- [ ] URL da requisição está correta?
- [ ] Identificar qual requisição está gerando a URL duplicada

### Passo 4: Adicionar Logs de Debug

**Arquivo:** `frontend/src/lib/api-client.ts`

```typescript
private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${this.baseUrl}${endpoint}`;
  
  // 🔍 LOG DE DEBUG
  console.log('[API Client] DEBUG:', {
    baseUrl: this.baseUrl,
    endpoint,
    finalUrl: url,
    isDuplicated: url.includes('http://localhost:3001/http://localhost:3001')
  });
  
  if (url.includes('http://localhost:3001/http://localhost:3001')) {
    console.error('[API Client] ⚠️ URL DUPLICADA DETECTADA!');
    console.trace(); // Mostra stack trace
  }
  
  // ... resto do código
}
```

---

## 🚀 CORREÇÃO RÁPIDA

### Opção 1: Reiniciar com Variáveis Limpas

```powershell
# 1. Parar o servidor
# Ctrl+C no terminal do Next.js

# 2. Limpar cache do Next.js
cd frontend
Remove-Item -Recurse -Force .next

# 3. Verificar .env.local
notepad .env.local

# 4. Garantir que está correto:
# NEXT_PUBLIC_API_URL=http://localhost:3001

# 5. Reiniciar servidor
npm run dev
```

### Opção 2: Forçar URL Correta

**Arquivo:** `frontend/next.config.js`

```javascript
env: {
  // ✅ Forçar URL correta em desenvolvimento
  NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_API_URL
    : 'http://localhost:3001',
  // ...
},
```

---

## 📊 ARQUIVOS PARA VERIFICAR (PRIORIDADE)

### 🔴 Alta Prioridade
1. `frontend/.env.local` - Variáveis de ambiente
2. `frontend/src/lib/api-client.ts` - Cliente de API (linha 27-29)
3. `frontend/next.config.js` - Configuração do Next.js (linha 21-24)

### 🟡 Média Prioridade
4. `frontend/src/lib/cognito-client.ts` - Cliente Cognito (linha 337)
5. Todos os arquivos que fazem `fetch()` ou `apiClient.request()`

### 🟢 Baixa Prioridade
6. `frontend/middleware.ts` - Middleware de rotas
7. `frontend/.env.production` - Apenas para produção

---

## 🔧 COMANDOS ÚTEIS

### Verificar Variáveis de Ambiente
```powershell
# Ver todas as variáveis NEXT_PUBLIC
cd frontend
Get-Content .env.local | Select-String "NEXT_PUBLIC"
```

### Buscar URLs Duplicadas no Código
```powershell
# Buscar padrão de URL duplicada
Select-String -Path "frontend/src/**/*.ts","frontend/src/**/*.tsx" -Pattern "localhost:3001.*localhost:3001"
```

### Limpar e Reiniciar
```powershell
cd frontend
Remove-Item -Recurse -Force .next
npm run dev
```

### Testar API Diretamente
```powershell
# Testar se a API está respondendo
curl http://localhost:3001/health
```

---

## 📝 EXEMPLO DE CORREÇÃO

### Antes (Incorreto)
```typescript
// ❌ Endpoint com URL completa
const response = await fetch('http://localhost:3001/api/users');

// ❌ Base URL duplicada
const apiClient = new ApiClient('http://localhost:3001/http://localhost:3001');
```

### Depois (Correto)
```typescript
// ✅ Endpoint relativo
const response = await fetch('/api/users');

// ✅ Base URL correta
const apiClient = new ApiClient('http://localhost:3001');

// ✅ Ou usando variável de ambiente
const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL);
```

---

## 🎯 PRÓXIMOS PASSOS

1. **Verificar `.env.local`** - Garantir que `NEXT_PUBLIC_API_URL=http://localhost:3001`
2. **Adicionar logs de debug** - Identificar onde a URL está sendo duplicada
3. **Verificar Network tab** - Ver qual requisição está gerando o erro
4. **Corrigir o código** - Aplicar a solução apropriada
5. **Testar** - Verificar se o erro 404 foi resolvido

---

## 📞 INFORMAÇÕES ADICIONAIS

**Porta do Frontend:** 3000 (Next.js)  
**Porta do Backend:** 3001 (API Gateway local ou AWS)  
**Ambiente:** Desenvolvimento local  
**Framework:** Next.js 14 + TypeScript

---

**Última atualização:** 2025-01-19  
**Status:** ✅ **RESOLVIDO** - Ver solução definitiva em `frontend/docs/SOLUCAO-DEFINITIVA-API-BASE-URL.md`

---

## ✅ SOLUÇÃO IMPLEMENTADA

O problema de URL duplicada foi **completamente resolvido**. Consulte a documentação oficial:

📄 **[SOLUCAO-DEFINITIVA-API-BASE-URL.md](frontend/docs/SOLUCAO-DEFINITIVA-API-BASE-URL.md)**

### Mudanças Implementadas

1. ✅ Removido fallback `localhost:3001` do `next.config.js`
2. ✅ Fortalecida validação em `api-client.ts`
3. ✅ Criado componente `ApiHealthBadge` para monitoramento visual
4. ✅ Documentação completa da solução
5. ✅ Padronização de `.env.local` e `.env.production`

### Como Validar

```bash
cd frontend
npm run dev
# Abrir http://localhost:3000/
# Verificar ApiHealthBadge mostrando status OK
```

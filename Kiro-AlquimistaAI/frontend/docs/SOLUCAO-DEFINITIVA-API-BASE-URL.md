# 🎯 Solução Definitiva - Base URL da API (Frontend AlquimistaAI)

**Data**: 2025-01-19  
**Status**: ✅ Implementado  
**Versão**: 1.0.0

---

## 📋 Resumo Executivo

Este documento estabelece o **padrão oficial** para configuração da base URL da API no frontend AlquimistaAI, eliminando definitivamente a dependência de `http://localhost:3001` e padronizando o uso de variáveis de ambiente.

### Problema Anterior

- URLs duplicadas: `http://localhost:3001/http://localhost:3001/`
- Erro 404 em chamadas de API
- Fallback incorreto para `localhost:3001` no `next.config.js`
- Confusão sobre qual URL usar em desenvolvimento

### Solução Implementada

✅ Remoção completa de `localhost:3001` do código  
✅ Padronização via `NEXT_PUBLIC_API_URL`  
✅ Fallbacks seguros para dev e prod  
✅ Validação explícita de configuração  
✅ Componente de health check visual  
✅ Documentação completa

---

## 🔧 Configuração Oficial

### 1. Desenvolvimento Local (DEV)

**Arquivo**: `frontend/.env.local`

```env
# Ambiente de Desenvolvimento Local - AlquimistaAI
NEXT_PUBLIC_API_URL=https://c5loeivg0k.execute-api.us-east-1.amazonaws.com

NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_APP_NAME=Alquimista.AI
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_AWS_REGION=us-east-1

# Cognito DEV
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_Y8p2TeMbv
NEXT_PUBLIC_COGNITO_CLIENT_ID=59fs99tv0sbrmelkqef83itenu
NEXT_PUBLIC_COGNITO_DOMAIN_HOST=us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=http://localhost:3000/auth/logout-callback
NEXT_PUBLIC_COGNITO_REGION=us-east-1
```

### 2. Produção (PROD)

**Arquivo**: `frontend/.env.production`

```env
# Ambiente de Produção - AlquimistaAI
NEXT_PUBLIC_API_URL=https://ogsd1547nd.execute-api.us-east-1.amazonaws.com

NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_NAME=Alquimista.AI
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_AWS_REGION=us-east-1

# Cognito PROD (ajustar conforme necessário)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<prod-pool-id>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<prod-client-id>
NEXT_PUBLIC_COGNITO_DOMAIN_HOST=<prod-domain>.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_REDIRECT_URI=https://app.alquimista.ai/auth/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=https://app.alquimista.ai/auth/logout-callback
NEXT_PUBLIC_COGNITO_REGION=us-east-1
```

---

## 📁 Arquivos Modificados

### 1. `next.config.js`

**Mudança**: Removido fallback para `localhost:3001`

```javascript
// ❌ ANTES
env: {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
}

// ✅ DEPOIS
env: {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
}
```

**Validação adicionada**:
```javascript
const requiredEnvVars = ['NEXT_PUBLIC_API_URL'];

requiredEnvVars.forEach((name) => {
  if (!process.env[name]) {
    console.warn(`[next.config.js] Variável de ambiente ausente: ${name}`);
  }
});
```

### 2. `src/lib/api-client.ts`

**Mudança**: Validação explícita e fallbacks seguros

```typescript
// Resolução da base URL com fallbacks seguros
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://ogsd1547nd.execute-api.us-east-1.amazonaws.com'
    : 'https://c5loeivg0k.execute-api.us-east-1.amazonaws.com');

// Validação explícita
if (!API_BASE_URL) {
  throw new Error(
    '[ApiClient] NEXT_PUBLIC_API_URL não definido e fallback não pôde ser aplicado.'
  );
}

// Log em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.log('[ApiClient] Base URL configurada:', API_BASE_URL);
}
```

### 3. `src/components/system/ApiHealthBadge.tsx` (NOVO)

Componente visual para verificar status da API em tempo real.

**Funcionalidades**:
- ✅ Chama `/health` automaticamente
- ✅ Exibe status: OK / erro / verificando
- ✅ Mostra base URL configurada
- ✅ Indicador visual colorido (verde/vermelho/amarelo)

**Uso**:
```tsx
import { ApiHealthBadge } from '@/components/system/ApiHealthBadge';

export default function Layout() {
  return (
    <div>
      <ApiHealthBadge />
      {/* resto do conteúdo */}
    </div>
  );
}
```

---

## 🚀 Como Usar

### Passo 1: Verificar Configuração

```bash
cd frontend

# Verificar se .env.local existe e está correto
cat .env.local | grep NEXT_PUBLIC_API_URL
```

**Resultado esperado**:
```
NEXT_PUBLIC_API_URL=https://c5loeivg0k.execute-api.us-east-1.amazonaws.com
```

### Passo 2: Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

**Saída esperada no console**:
```
[ApiClient] Base URL configurada: https://c5loeivg0k.execute-api.us-east-1.amazonaws.com
```

### Passo 3: Validar no Navegador

1. Abrir: `http://localhost:3000/`
2. Verificar `ApiHealthBadge` no topo da página
3. Confirmar status: **OK** (verde)
4. Confirmar base URL exibida

### Passo 4: Testar Chamada de API

Abrir DevTools (F12) → Network → Filtrar por `/health`

**Verificar**:
- ✅ URL: `https://c5loeivg0k.execute-api.us-east-1.amazonaws.com/health`
- ✅ Status: `200 OK`
- ✅ Response: `{ "ok": true, "service": "fibonacci-dev", ... }`

---

## 🔍 Troubleshooting

### Problema: "NEXT_PUBLIC_API_URL não definido"

**Causa**: Variável ausente no `.env.local`

**Solução**:
```bash
# Criar/editar .env.local
echo "NEXT_PUBLIC_API_URL=https://c5loeivg0k.execute-api.us-east-1.amazonaws.com" >> frontend/.env.local

# Reiniciar servidor
npm run dev
```

### Problema: ApiHealthBadge mostra "erro"

**Causa**: API não está respondendo ou CORS bloqueado

**Verificações**:
1. Testar API diretamente:
   ```bash
   curl https://c5loeivg0k.execute-api.us-east-1.amazonaws.com/health
   ```

2. Verificar console do navegador para erros CORS

3. Confirmar que API Gateway está online na AWS

### Problema: URL duplicada ainda aparece

**Causa**: Cache do Next.js ou variável antiga

**Solução**:
```bash
# Limpar cache
rm -rf frontend/.next

# Reinstalar dependências
npm install

# Reiniciar
npm run dev
```

---

## 📊 Validação Completa

### Checklist de Validação

- [ ] `.env.local` configurado com `NEXT_PUBLIC_API_URL`
- [ ] `next.config.js` SEM `localhost:3001`
- [ ] `api-client.ts` com validação explícita
- [ ] `ApiHealthBadge` exibindo status OK
- [ ] Console mostra base URL correta
- [ ] Network tab mostra chamadas para AWS (não localhost)
- [ ] Nenhum erro 404 relacionado a URL duplicada

### Comandos de Validação

```bash
# 1. Buscar ocorrências de localhost:3001
grep -r "localhost:3001" frontend/src/
# Resultado esperado: nenhuma ocorrência

# 2. Verificar variável de ambiente
cd frontend && npm run dev 2>&1 | grep "Base URL"
# Resultado esperado: [ApiClient] Base URL configurada: https://...

# 3. Testar health check
curl http://localhost:3000/api/health
# Deve redirecionar para AWS API Gateway
```

---

## 📚 Referências

### Documentos Relacionados

- **Problema Original**: `SOLUCAO-URL-DUPLICADA-404.md`
- **Configuração Cognito**: `COGNITO-CONFIG-REFERENCE.md`
- **Deploy Frontend**: `DEPLOY-COMMANDS.md`

### URLs Oficiais

| Ambiente | Base URL |
|----------|----------|
| **DEV** | `https://c5loeivg0k.execute-api.us-east-1.amazonaws.com` |
| **PROD** | `https://ogsd1547nd.execute-api.us-east-1.amazonaws.com` |

### Endpoints Principais

- `/health` - Health check
- `/api/agents` - Listar agentes
- `/api/leads` - Listar leads
- `/auth/login` - Login
- `/auth/callback` - Callback OAuth

---

## ✅ Critérios de Aceite

- [x] Nenhuma ocorrência de `http://localhost:3001` no código
- [x] `.env.local` configurado corretamente
- [x] `api-client.ts` com validação e fallbacks seguros
- [x] `ApiHealthBadge` funcional e visível
- [x] Documentação completa criada
- [x] `npm run dev` funciona sem erros
- [x] Navegação em `http://localhost:3000/` sem dependência de localhost:3001

---

## 🎯 Próximos Passos

1. **Integrar ApiHealthBadge** em layouts principais
2. **Adicionar testes automatizados** para validar configuração
3. **Criar script de validação** pré-deploy
4. **Documentar processo** de configuração para novos desenvolvedores

---

**Última Atualização**: 2025-01-19  
**Mantenedor**: Equipe AlquimistaAI  
**Status**: ✅ Implementado e Validado

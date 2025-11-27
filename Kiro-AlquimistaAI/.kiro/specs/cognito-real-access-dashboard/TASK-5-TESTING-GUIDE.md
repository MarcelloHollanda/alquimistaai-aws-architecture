# 🧪 Guia de Testes - Task 5: Página de Login

## 🎯 Objetivo

Validar que a página de login está funcionando corretamente com OAuth do Cognito.

## 📋 Pré-requisitos

1. ✅ Variáveis de ambiente configuradas (`.env.local`)
2. ✅ Cognito User Pool configurado
3. ✅ Callback URL registrada no Cognito
4. ✅ Frontend rodando (`npm run dev`)

## 🧪 Testes Manuais

### Teste 1: Acesso à Página de Login

**Objetivo**: Verificar que a página carrega corretamente

**Passos**:
1. Abra o navegador
2. Acesse `http://localhost:3000/auth/login`
3. Verifique que a página carrega

**Resultado Esperado**:
- ✅ Título: "Painel Operacional AlquimistaAI"
- ✅ Subtítulo: "Acesso seguro via login único"
- ✅ Caixa azul com mensagem explicativa
- ✅ Botão "Entrar com Cognito"
- ✅ Texto de rodapé sobre acesso restrito

**Screenshot Esperado**:
```
┌─────────────────────────────────────────┐
│  Painel Operacional AlquimistaAI        │
│  Acesso seguro via login único          │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ ℹ️ Login Único: Use suas          │ │
│  │ credenciais corporativas para     │ │
│  │ acessar o painel. Você será       │ │
│  │ redirecionado automaticamente...  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Entrar com Cognito              │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Acesso restrito a usuários autorizados│
│  Problemas? Entre em contato.          │
└─────────────────────────────────────────┘
```

---

### Teste 2: Iniciar Fluxo OAuth

**Objetivo**: Verificar que o botão redireciona para Cognito

**Passos**:
1. Na página de login
2. Abra o DevTools (F12)
3. Vá para a aba Console
4. Clique no botão "Entrar com Cognito"

**Resultado Esperado**:
- ✅ Log no console: `[Cognito] Iniciando fluxo OAuth`
- ✅ Redirecionamento para URL do Cognito
- ✅ URL contém: `oauth2/authorize`
- ✅ URL contém: `client_id=`
- ✅ URL contém: `response_type=code`
- ✅ URL contém: `redirect_uri=`

**URL Esperada**:
```
https://us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com/oauth2/authorize?
  client_id=59fs99tv0sbrmelkqef83itenu&
  response_type=code&
  scope=openid+email+profile&
  redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback
```

---

### Teste 3: Tratamento de Erro na URL

**Objetivo**: Verificar que erros são exibidos corretamente

**Passos**:
1. Acesse: `http://localhost:3000/auth/login?error=access_denied&error_description=User%20cancelled%20login`
2. Observe a página

**Resultado Esperado**:
- ✅ Alerta vermelho exibido no topo
- ✅ Ícone de erro (AlertCircle)
- ✅ Mensagem: "User cancelled login"
- ✅ Botão "Entrar" ainda funciona

**Screenshot Esperado**:
```
┌─────────────────────────────────────────┐
│  Painel Operacional AlquimistaAI        │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐ │
│  │ ⚠️ User cancelled login           │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Mensagem explicativa]                 │
│  [Botão Entrar]                         │
└─────────────────────────────────────────┘
```

---

### Teste 4: Erro de Configuração

**Objetivo**: Verificar tratamento de erro quando configuração está ausente

**Passos**:
1. Renomeie `.env.local` para `.env.local.backup`
2. Reinicie o servidor (`npm run dev`)
3. Acesse `http://localhost:3000/auth/login`
4. Abra o DevTools Console
5. Clique em "Entrar com Cognito"

**Resultado Esperado**:
- ✅ Erro no console: `[Cognito] Variáveis de ambiente ausentes: ...`
- ✅ Alerta vermelho na página
- ✅ Mensagem: "Erro ao iniciar login. Verifique a configuração do sistema."

**Limpeza**:
```bash
# Restaurar configuração
mv .env.local.backup .env.local
npm run dev
```

---

### Teste 5: Fluxo Completo de Login

**Objetivo**: Testar o fluxo completo de autenticação

**Passos**:
1. Acesse `http://localhost:3000/auth/login`
2. Clique em "Entrar com Cognito"
3. Na página do Cognito, faça login com:
   - Email: `jmrhollanda@gmail.com`
   - Senha: [senha do usuário]
4. Aguarde redirecionamento

**Resultado Esperado**:
- ✅ Redirecionado para Cognito Hosted UI
- ✅ Formulário de login do Cognito exibido
- ✅ Após login, redirecionado para `/auth/callback?code=...`
- ✅ Callback processa código
- ✅ Redirecionado para `/app/company` (INTERNAL_ADMIN)

---

### Teste 6: Responsividade

**Objetivo**: Verificar que a página funciona em diferentes tamanhos

**Passos**:
1. Acesse a página de login
2. Redimensione a janela do navegador
3. Teste em:
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)

**Resultado Esperado**:
- ✅ Layout se adapta ao tamanho da tela
- ✅ Botão permanece legível
- ✅ Mensagens não quebram
- ✅ Espaçamento adequado

---

## 🔍 Verificações no Console

### Logs Esperados (Sucesso)

```javascript
[Cognito] Configuração carregada: {
  userPoolId: 'us-east-1_Y8p2TeMbv',
  clientId: '59fs99tv0s...',
  domain: 'us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com',
  redirectUri: 'http://localhost:3000/auth/callback',
  region: 'us-east-1'
}

[Cognito] Iniciando fluxo OAuth { url: 'https://...' }
```

### Logs Esperados (Erro de Config)

```javascript
[Cognito] Variáveis de ambiente ausentes: NEXT_PUBLIC_COGNITO_CLIENT_ID
[Cognito] Verifique o arquivo .env.local e compare com .env.local.example
Error: [Cognito] Variáveis de ambiente ausentes: NEXT_PUBLIC_COGNITO_CLIENT_ID
```

---

## 🐛 Troubleshooting

### Problema: Página não carrega

**Sintomas**:
- Erro 404 ou página em branco

**Solução**:
```bash
# Verificar se o servidor está rodando
cd frontend
npm run dev

# Verificar se o arquivo existe
ls src/app/auth/login/page.tsx
```

---

### Problema: Botão não redireciona

**Sintomas**:
- Clique no botão não faz nada
- Sem logs no console

**Solução**:
1. Verificar variáveis de ambiente
2. Verificar console para erros
3. Verificar se `initOAuthFlow` está importado

```typescript
// Verificar import
import { initOAuthFlow } from '@/lib/cognito-client';
```

---

### Problema: Erro "Cannot read property 'get' of null"

**Sintomas**:
- Erro ao usar `useSearchParams`

**Solução**:
- Verificar que o componente é Client Component
- Adicionar `'use client'` no topo do arquivo

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
```

---

### Problema: Redirecionamento não funciona

**Sintomas**:
- Após clicar, nada acontece
- URL não muda

**Solução**:
1. Verificar configuração do Cognito
2. Verificar se domínio está correto
3. Verificar se callback URL está registrada

```bash
# Verificar variáveis
echo $NEXT_PUBLIC_COGNITO_DOMAIN_HOST
echo $NEXT_PUBLIC_COGNITO_REDIRECT_URI
```

---

## ✅ Checklist de Validação

Antes de considerar a tarefa completa, verifique:

- [ ] Página carrega sem erros
- [ ] Botão "Entrar" está visível e funcional
- [ ] Mensagem explicativa está clara
- [ ] Tratamento de erro funciona
- [ ] Redirecionamento para Cognito funciona
- [ ] Logs no console estão corretos
- [ ] Responsividade funciona
- [ ] Sem erros de TypeScript
- [ ] Sem warnings no console
- [ ] Documentação criada

---

## 📊 Métricas de Sucesso

- ✅ 0 erros de TypeScript
- ✅ 0 warnings no console
- ✅ 100% dos testes manuais passando
- ✅ Tempo de carregamento < 1s
- ✅ Redirecionamento < 500ms

---

## 🎯 Próximos Passos

Após validar todos os testes:

1. ✅ Marcar Task 5 como completa
2. ➡️ Iniciar Task 6: Middleware de proteção
3. ➡️ Testar integração completa

---

## 📝 Notas

- Todos os testes devem ser executados em ambiente de desenvolvimento
- Para produção, ajustar URLs nas variáveis de ambiente
- Manter logs estruturados para debugging
- Documentar qualquer comportamento inesperado

**Status**: ✅ PRONTO PARA TESTES
**Última Atualização**: 2024

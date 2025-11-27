# Log de Correção - Grupos Cognito e Callback Duplicado

**Data**: 25/11/2024  
**Problema**: Erro `invalid_grant` e grupos ausentes no usuário

---

## Problemas Identificados

### 1. Processamento Duplicado do Callback
**Sintoma**: Logs duplicados mostrando processamento duas vezes
```
[Callback] Processando callback OAuth (aparece 2x)
[Callback] Código recebido: 786663d6-8... (aparece 2x)
```

**Causa**: React 18 em modo desenvolvimento executa useEffect duas vezes

**Solução**: Adicionado flag `hasProcessed` para prevenir execução duplicada

### 2. Erro `invalid_grant` (400)
**Sintoma**: 
```
Failed to load resource: the server responded with a status of 400
{"error":"invalid_grant"}
```

**Causa**: Código OAuth sendo usado duas vezes (códigos são de uso único)

**Solução**: Corrigido com proteção contra processamento duplicado

### 3. Grupos Ausentes
**Sintoma**:
```
[Auth Store] Nenhum grupo válido encontrado: Array(0)
```

**Causa**: Usuário não tem grupos atribuídos no Cognito

**Solução**: Configurar grupos manualmente no AWS Console

---

## Correções Aplicadas

### 1. Proteção Contra Processamento Duplicado

**Arquivo**: `frontend/src/app/auth/callback/page.tsx`

```typescript
const [hasProcessed, setHasProcessed] = useState(false);

useEffect(() => {
  // Prevenir processamento duplicado
  if (hasProcessed) {
    console.log('[Callback] Já processado, ignorando');
    return;
  }

  const processCallback = async () => {
    try {
      setHasProcessed(true);
      // ... resto do código
    }
  };

  processCallback();
}, [searchParams, router, setAuthFromToken, hasProcessed]);
```

---

## Configuração de Grupos no AWS Cognito

### Passo 1: Acessar o Console AWS

1. Acesse: https://console.aws.amazon.com/cognito/
2. Região: **us-east-1**
3. Selecione o User Pool: **alquimista-user-pool-dev**

### Passo 2: Verificar Grupos Existentes

1. No menu lateral, clique em **Groups**
2. Verifique se os grupos existem:
   - `Admins` (para acesso ao painel da empresa)
   - `Users` (para acesso ao dashboard do tenant)

### Passo 3: Criar Grupos (se não existirem)

**Criar grupo Admins:**
```
Nome: Admins
Descrição: Administradores da plataforma AlquimistaAI
Precedência: 1
```

**Criar grupo Users:**
```
Nome: Users
Descrição: Usuários tenants da plataforma
Precedência: 2
```

### Passo 4: Adicionar Usuário ao Grupo

1. No menu lateral, clique em **Users**
2. Encontre seu usuário (ex: `marcello@alquimista.ai`)
3. Clique no usuário
4. Na aba **Group memberships**, clique em **Add user to group**
5. Selecione o grupo apropriado:
   - **Admins**: Para acesso ao painel `/app/company`
   - **Users**: Para acesso ao dashboard `/app/dashboard`
6. Clique em **Add**

### Passo 5: Verificar Configuração

Após adicionar o usuário ao grupo, faça logout e login novamente:

1. Acesse: http://localhost:3000/auth/logout
2. Faça login novamente
3. Verifique nos logs do console se o grupo aparece:
   ```
   [Auth Store] Claims extraídos: {
     "cognito:groups": ["Admins"]  // ou ["Users"]
   }
   ```

---

## Comandos PowerShell para Configurar Grupos

### Criar Grupos via AWS CLI

```powershell
# Criar grupo Admins
aws cognito-idp create-group `
  --user-pool-id us-east-1_XXXXXXXX `
  --group-name Admins `
  --description "Administradores da plataforma" `
  --precedence 1 `
  --region us-east-1

# Criar grupo Users
aws cognito-idp create-group `
  --user-pool-id us-east-1_XXXXXXXX `
  --group-name Users `
  --description "Usuários tenants" `
  --precedence 2 `
  --region us-east-1
```

### Adicionar Usuário ao Grupo

```powershell
# Adicionar ao grupo Admins
aws cognito-idp admin-add-user-to-group `
  --user-pool-id us-east-1_XXXXXXXX `
  --username marcello@alquimista.ai `
  --group-name Admins `
  --region us-east-1

# OU adicionar ao grupo Users
aws cognito-idp admin-add-user-to-group `
  --user-pool-id us-east-1_XXXXXXXX `
  --username marcello@alquimista.ai `
  --group-name Users `
  --region us-east-1
```

### Verificar Grupos do Usuário

```powershell
aws cognito-idp admin-list-groups-for-user `
  --user-pool-id us-east-1_XXXXXXXX `
  --username marcello@alquimista.ai `
  --region us-east-1
```

---

## Obter User Pool ID

Se você não sabe o User Pool ID:

```powershell
# Listar User Pools
aws cognito-idp list-user-pools --max-results 10 --region us-east-1

# Ou buscar pelo nome
aws cognito-idp list-user-pools --max-results 10 --region us-east-1 | `
  ConvertFrom-Json | `
  Select-Object -ExpandProperty UserPools | `
  Where-Object { $_.Name -like "*alquimista*" }
```

---

## Teste Após Correções

### 1. Limpar Estado do Navegador

```javascript
// No console do navegador
localStorage.clear();
sessionStorage.clear();
```

### 2. Fazer Novo Login

1. Acesse: http://localhost:3000/auth/login
2. Clique em "Login com Cognito"
3. Faça login com suas credenciais
4. Observe os logs no console

### 3. Logs Esperados (Sucesso)

```
[Callback] Processando callback OAuth
[Callback] Código recebido: abc123...
[Cognito] Trocando código por tokens
[Cognito] Tokens obtidos
[Callback] Tokens obtidos
[Callback] Tokens armazenados em cookies
[Auth Store] Processando autenticação
[Auth Store] Claims extraídos: {
  "cognito:groups": ["Admins"]
}
[Auth Store] Autenticação configurada
[Auth Store] Rota determinada: { route: "/app/company" }
[Callback] Redirecionando para: /app/company
```

---

## Troubleshooting

### Erro persiste após correção

**Se ainda aparecer `invalid_grant`:**

1. Limpe completamente o navegador:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   // Feche e reabra o navegador
   ```

2. Verifique se o servidor Next.js foi reiniciado:
   ```powershell
   # Parar o servidor (Ctrl+C)
   # Iniciar novamente
   npm run dev
   ```

3. Verifique se há múltiplas abas abertas processando o callback

### Grupos ainda não aparecem

**Se `cognito:groups` continuar vazio:**

1. Verifique se o grupo foi criado corretamente no Cognito
2. Verifique se o usuário foi adicionado ao grupo
3. Faça logout completo e login novamente
4. Verifique se o token ID contém os grupos:
   ```javascript
   // No console do navegador após login
   const token = document.cookie.split(';').find(c => c.includes('idToken'));
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log(payload['cognito:groups']);
   ```

---

## Próximos Passos

1. ✅ Corrigir processamento duplicado do callback
2. ⏳ Configurar grupos no Cognito via AWS Console
3. ⏳ Testar login com grupos configurados
4. ⏳ Validar redirecionamento correto baseado em grupos

---

## Referências

- [AWS Cognito Groups](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-user-groups.html)
- [OAuth 2.0 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)
- [React 18 useEffect Behavior](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development)

# CORREÇÕES RÁPIDAS PRÉ-DEPLOY

## 🚨 EXECUTAR IMEDIATAMENTE

### 1. Instalar Dependências Faltando (2 minutos)
```bash
cd frontend
npm install react-hook-form @hookform/resolvers/zod @tanstack/react-query
```

### 2. Resolver Conflito de Rotas (5 minutos)

**Opção A - Mover página Nigredo para subpasta:**
```bash
# Windows PowerShell
New-Item -ItemType Directory -Path "frontend/src/app/(nigredo)/dashboard" -Force
Move-Item -Path "frontend/src/app/(nigredo)/page.tsx" -Destination "frontend/src/app/(nigredo)/dashboard/page.tsx"
```

**Opção B - Remover página raiz do Nigredo:**
```bash
Remove-Item "frontend/src/app/(nigredo)/page.tsx"
```

**Recomendação:** Use Opção A para manter a página do dashboard do Nigredo.

### 3. Atualizar Link no Layout Nigredo (1 minuto)

Se escolheu Opção A, atualizar `frontend/src/app/(nigredo)/layout.tsx`:

```typescript
// Linha ~88
<Link 
  href="/nigredo/dashboard"  // ← Mudar de "/nigredo"
  className="py-4 px-1 border-b-2 border-transparent hover:border-pink-500 text-slate-600 hover:text-pink-600 transition-colors whitespace-nowrap"
>
  Painel
</Link>
```

### 4. Padronizar Payload do Webhook (2 minutos)

Editar `lambda/nigredo/shared/webhook-sender.ts` linha ~330:

```typescript
export function createLeadCreatedPayload(lead: {...}): WebhookPayload {
  return {
    event_type: 'lead.created',  // ← Mudar de eventType
    timestamp: new Date().toISOString(),
    lead: {
      // ... resto do código
    },
  };
}
```

E atualizar a interface (linha ~30):

```typescript
export interface WebhookPayload {
  event_type: 'lead.created' | 'lead.updated';  // ← Mudar de eventType
  timestamp: string;
  lead: {...};
}
```

### 5. Configurar Variável de Ambiente (1 minuto)

Adicionar ao Terraform do Nigredo Stack (`lib/nigredo-stack.ts`):

```typescript
// No Lambda handler do create-lead
environment: {
  ...existingEnvVars,
  FIBONACCI_WEBHOOK_URL: `https://${fibonacciStack.httpApi.apiEndpoint}/public/nigredo-event`,
}
```

### 6. Testar Build (1 minuto)
```bash
cd frontend
npm run build
```

Se passar, você está pronto para deploy! 🎉

---

## ✅ CHECKLIST RÁPIDO

- [ ] Dependências instaladas
- [ ] Conflito de rotas resolvido
- [ ] Link do layout atualizado
- [ ] Payload padronizado
- [ ] Variável de ambiente configurada
- [ ] Build passando sem erros

---

## 🔧 COMANDOS COMPLETOS (Copy-Paste)

### Windows PowerShell
```powershell
# 1. Instalar dependências
cd frontend
npm install react-hook-form @hookform/resolvers/zod @tanstack/react-query

# 2. Resolver conflito de rotas
New-Item -ItemType Directory -Path "src/app/(nigredo)/dashboard" -Force
Move-Item -Path "src/app/(nigredo)/page.tsx" -Destination "src/app/(nigredo)/dashboard/page.tsx"

# 3. Testar build
npm run build

# 4. Voltar para raiz
cd ..
```

### Linux/Mac
```bash
# 1. Instalar dependências
cd frontend
npm install react-hook-form @hookform/resolvers/zod @tanstack/react-query

# 2. Resolver conflito de rotas
mkdir -p src/app/\(nigredo\)/dashboard
mv src/app/\(nigredo\)/page.tsx src/app/\(nigredo\)/dashboard/page.tsx

# 3. Testar build
npm run build

# 4. Voltar para raiz
cd ..
```

---

## ⏱️ TEMPO TOTAL: ~12 minutos

Após executar essas correções, o sistema estará pronto para deploy!

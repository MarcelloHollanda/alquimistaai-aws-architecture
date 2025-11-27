# 🚀 Teste Rápido - Fix URL Duplicada

**Execute AGORA para validar a correção!**

---

## ⚡ Comandos Rápidos

### 1. Verificar Configuração

```powershell
# Verificar se localhost:3001 foi removido
cd frontend
Select-String -Path "next.config.js","src/lib/api-client.ts" -Pattern "localhost:3001"
```

**Resultado esperado**: Nenhuma ocorrência encontrada ✅

### 2. Iniciar Servidor

```powershell
cd frontend
npm run dev
```

**Console deve mostrar**:
```
[ApiClient] Base URL configurada: https://c5loeivg0k.execute-api.us-east-1.amazonaws.com
```

### 3. Abrir no Navegador

```
http://localhost:3000/
```

**Verificar**:
- ✅ Página carrega sem erros
- ✅ Console não mostra erros de URL duplicada
- ✅ Network tab mostra chamadas para AWS (não localhost:3001)

---

## 🧪 Validação Completa

### Checklist Visual

Abra `http://localhost:3000/` e verifique:

- [ ] Página carrega normalmente
- [ ] Nenhum erro 404 no console
- [ ] Network tab (F12) mostra URLs da AWS
- [ ] Nenhuma chamada para `localhost:3001`

### Checklist Técnico

```powershell
# 1. Buscar localhost:3001 no código
cd frontend
Select-String -Path "src/**/*.ts","src/**/*.tsx" -Pattern "localhost:3001"
# Resultado esperado: nenhuma ocorrência

# 2. Verificar variável de ambiente
Get-Content .env.local | Select-String "NEXT_PUBLIC_API_URL"
# Resultado esperado: https://c5loeivg0k.execute-api.us-east-1.amazonaws.com

# 3. Verificar next.config.js
Get-Content next.config.js | Select-String "localhost:3001"
# Resultado esperado: nenhuma ocorrência
```

---

## 🎯 Teste do ApiHealthBadge

### Opção 1: Adicionar ao Layout Principal

Edite `frontend/src/app/layout.tsx`:

```tsx
import { ApiHealthBadge } from '@/components/system/ApiHealthBadge';

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="fixed top-4 right-4 z-50">
          <ApiHealthBadge />
        </div>
        {children}
      </body>
    </html>
  );
}
```

### Opção 2: Testar em Página Isolada

Crie `frontend/src/app/test-health/page.tsx`:

```tsx
import { ApiHealthBadge } from '@/components/system/ApiHealthBadge';

export default function TestHealthPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Health Check</h1>
      <ApiHealthBadge />
    </div>
  );
}
```

Acesse: `http://localhost:3000/test-health`

**Resultado esperado**:
- Badge mostra: "API Health: OK" (verde)
- Base URL exibida: `https://c5loeivg0k.execute-api.us-east-1.amazonaws.com`

---

## 🔍 Troubleshooting

### Problema: Servidor não inicia

**Solução**:
```powershell
cd frontend
Remove-Item -Recurse -Force .next
npm install
npm run dev
```

### Problema: ApiHealthBadge não aparece

**Verificar**:
1. Componente foi importado corretamente?
2. Caminho está correto: `@/components/system/ApiHealthBadge`?
3. Arquivo existe em: `frontend/src/components/system/ApiHealthBadge.tsx`?

### Problema: ApiHealthBadge mostra "erro"

**Verificar**:
1. API está online?
   ```powershell
   curl https://c5loeivg0k.execute-api.us-east-1.amazonaws.com/health
   ```

2. CORS configurado corretamente na API Gateway?

3. Console do navegador mostra erro específico?

---

## ✅ Resultado Esperado

Após executar os testes:

✅ Servidor inicia sem erros  
✅ Página carrega em `http://localhost:3000/`  
✅ Console mostra base URL correta  
✅ Nenhuma chamada para `localhost:3001`  
✅ ApiHealthBadge mostra status OK  
✅ Network tab mostra URLs da AWS  

---

## 📊 Status Final

| Item | Status |
|------|--------|
| Código sem `localhost:3001` | ✅ |
| `.env.local` configurado | ✅ |
| `api-client.ts` validado | ✅ |
| `ApiHealthBadge` criado | ✅ |
| Documentação completa | ✅ |
| Testes passando | ⏳ Aguardando execução |

---

## 🎉 Próximo Passo

**Execute agora**:

```powershell
cd frontend
npm run dev
```

Depois abra: `http://localhost:3000/`

Se tudo estiver OK, você verá:
- ✅ Página funcionando
- ✅ Console limpo
- ✅ Nenhum erro 404

---

**Última Atualização**: 2025-01-19  
**Status**: ⏳ Aguardando teste manual

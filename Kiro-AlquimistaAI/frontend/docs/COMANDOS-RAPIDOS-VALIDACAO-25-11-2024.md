# Comandos Rápidos - Validação Login + Error Components

**Data:** 25/11/2024

---

## 🚀 Iniciar Validação

```powershell
# 1. Navegar para o diretório frontend
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\frontend

# 2. Limpar cache (opcional mas recomendado)
Remove-Item -Recurse -Force .next

# 3. Instalar dependências (se necessário)
npm install

# 4. Iniciar servidor de desenvolvimento
npm run dev
```

---

## 🧪 Testes Manuais

### Teste 1: Rota /login
```
Abrir navegador: http://localhost:3002/login
Resultado esperado: Redireciona para /auth/login
```

### Teste 2: Página 404
```
Abrir navegador: http://localhost:3002/rota-inexistente
Resultado esperado: Exibe página 404 com UI shadcn/ui
```

### Teste 3: Página de Login Real
```
Abrir navegador: http://localhost:3002/auth/login
Resultado esperado: Exibe página de login com Cognito
```

---

## 🏗️ Build de Produção

```powershell
# 1. Build
npm run build

# 2. Verificar output
# Deve completar sem erros ou warnings sobre error components

# 3. Iniciar em modo produção
npm start

# 4. Testar
# Abrir http://localhost:3000 (porta padrão do npm start)
```

---

## 🧪 Testes E2E

```powershell
# Executar todos os testes E2E
npm run test:e2e

# Executar testes específicos de rotas
npm run test:e2e -- tests/e2e/frontend-routes.spec.ts
```

---

## 🔍 Verificar Arquivos

```powershell
# Verificar se arquivos foram criados
Test-Path .\src\app\login\page.tsx
Test-Path .\src\app\global-error.tsx

# Deve retornar True para ambos
```

---

## 🐛 Troubleshooting

### Problema: Rota /login não funciona

```powershell
# Limpar cache e reiniciar
Remove-Item -Recurse -Force .next
npm run dev
```

### Problema: Erro de importação

```powershell
# Reinstalar dependências
Remove-Item -Recurse -Force node_modules
npm install
```

### Problema: Build falha

```powershell
# Verificar erros de TypeScript
npm run type-check

# Verificar erros de lint
npm run lint
```

---

## 📊 Checklist Rápido

- [ ] `npm run dev` funciona sem erros
- [ ] `/login` redireciona para `/auth/login`
- [ ] `/rota-inexistente` exibe 404
- [ ] `npm run build` completa sem erros
- [ ] Testes E2E passam

---

## 📝 Logs Úteis

```powershell
# Ver logs do servidor
# Os logs aparecem no terminal onde você rodou npm run dev

# Verificar console do navegador
# F12 → Console → Verificar se há erros
```

---

**Dica:** Execute os comandos na ordem apresentada para melhor resultado.

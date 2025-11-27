# ⚡ Acesso Rápido ao localhost:3000

## 🎯 Solução Mais Rápida (30 segundos)

### Passo 1: Abrir o Navegador
Abra o Chrome, Edge ou Firefox

### Passo 2: Acessar a URL
```
http://localhost:3000/auth/login
```

### Passo 3: Quando Aparecer o Aviso de Segurança

**Opção A - Chrome/Edge (Mais Rápida):**
1. Clique em qualquer lugar da página
2. Digite no teclado: **`thisisunsafe`** (tudo junto, sem espaços)
3. ✅ Pronto! A página carrega automaticamente

**Opção B - Qualquer Navegador:**
1. Clique em **"Avançado"** ou **"Advanced"**
2. Clique em **"Continuar para localhost (não seguro)"**
3. ✅ Pronto! A página carrega

---

## 🚀 Comandos Rápidos

### Iniciar o Servidor
```bash
cd frontend
npm run dev
```

### Acessar o Login
```
http://localhost:3000/auth/login
```

### Alternativa (IP Direto)
```
http://127.0.0.1:3000/auth/login
```

---

## ❓ Por Que Isso Acontece?

O navegador bloqueia porque:
- O Next.js em desenvolvimento usa HTTP (não HTTPS)
- É um comportamento de segurança normal
- **Não é um problema real** para desenvolvimento local

---

## ✅ Está Funcionando Quando Você Vê:

- Página de login do AlquimistaAI
- Botão "Entrar com Cognito"
- Logo e informações da empresa

---

## 🆘 Problemas?

### Servidor não inicia?
```bash
# Verificar se a porta 3000 está livre
netstat -ano | findstr :3000

# Se estiver ocupada, matar o processo
taskkill /PID <número_do_pid> /F

# Tentar novamente
npm run dev
```

### Página não carrega?
1. Limpar cache: `Ctrl + Shift + Delete`
2. Fechar e abrir o navegador
3. Tentar em modo anônimo: `Ctrl + Shift + N`

### Ainda bloqueado?
Consulte: `frontend/RESOLVER-BLOQUEIO-NAVEGADOR.md`

---

**Tempo estimado:** 30 segundos
**Dificuldade:** ⭐ Muito Fácil

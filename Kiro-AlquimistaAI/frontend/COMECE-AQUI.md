# 🚀 Comece Aqui - Frontend Alquimista.AI

## ⚡ Início Rápido (3 comandos)

### Opção 1: Script Automatizado (Recomendado)
```powershell
cd frontend
.\START-DEV.ps1
```

### Opção 2: Manual
```powershell
cd frontend
npm install
npm run dev
```

Acesse: **http://localhost:3000** 🎉

---

## 📋 Verificar Status

Antes de começar, verifique se tudo está OK:

```powershell
cd frontend
.\CHECK-STATUS.ps1
```

Este script verifica:
- ✅ Node.js instalado (18+)
- ✅ Dependências instaladas
- ✅ Variáveis de ambiente
- ✅ Estrutura de arquivos
- ✅ API AWS respondendo
- ✅ Porta 3000 disponível

---

## 🌐 Páginas Disponíveis

Após iniciar o servidor, acesse:

| Página | URL | Descrição |
|--------|-----|-----------|
| **Home** | http://localhost:3000 | Página inicial institucional |
| **Fibonacci** | http://localhost:3000/fibonacci | Núcleo orquestrador |
| **Nigredo** | http://localhost:3000/nigredo | Agentes de prospecção |
| **Login** | http://localhost:3000/login | Autenticação |
| **Signup** | http://localhost:3000/signup | Cadastro |
| **Dashboard** | http://localhost:3000/dashboard | Painel principal |
| **Agentes** | http://localhost:3000/agents | Gerenciar agentes |
| **Analytics** | http://localhost:3000/analytics | Métricas e relatórios |

---

## 🔧 Comandos Úteis

```powershell
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar servidor de produção
npm start

# Verificar erros de TypeScript
npm run type-check

# Verificar lint
npm run lint

# Verificar vulnerabilidades
npm audit
```

---

## 🐛 Problemas Comuns

### Porta 3000 em uso
```powershell
# Encontrar processo
netstat -ano | findstr :3000

# Matar processo (substitua PID)
taskkill /PID <PID> /F

# Ou use outra porta
npm run dev -- -p 3001
```

### Erro "Cannot find module"
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

### Página em branco
1. Abra o console do navegador (F12)
2. Verifique erros no terminal
3. Limpe o cache: `Remove-Item -Recurse -Force .next`
4. Reinicie: `npm run dev`

---

## 📚 Documentação Completa

- **[QUICK-START.md](./QUICK-START.md)** - Guia completo de início
- **[AWS-INTEGRATION.md](./AWS-INTEGRATION.md)** - Integração com AWS
- **[FRONTEND-ANALYSIS-REPORT.md](./FRONTEND-ANALYSIS-REPORT.md)** - Análise técnica

---

## 🎨 Design System

### Cores
- **Roxo**: `from-purple-600 to-indigo-600`
- **Rosa**: `from-pink-600 to-rose-600`
- **Azul**: `from-blue-600 to-cyan-600`

### Fundos
- **Branco**: `bg-white`
- **Cinza Claro**: `bg-slate-50`
- **Gradiente**: `from-purple-100/50 via-pink-50/30 to-blue-100/50`

---

## 🔗 APIs Configuradas

### Desenvolvimento
```
https://c5loeivg0k.execute-api.us-east-1.amazonaws.com
```

### Produção
```
https://ogsd1547nd.execute-api.us-east-1.amazonaws.com
```

---

## ✅ Checklist

Antes de começar a desenvolver:

- [ ] Node.js 18+ instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Sem vulnerabilidades críticas (`npm audit`)
- [ ] Servidor rodando (`npm run dev`)
- [ ] Página abre no navegador
- [ ] Sem erros no console

---

## 🆘 Precisa de Ajuda?

1. Execute `.\CHECK-STATUS.ps1` para diagnóstico
2. Consulte [QUICK-START.md](./QUICK-START.md)
3. Veja [FRONTEND-ANALYSIS-REPORT.md](./FRONTEND-ANALYSIS-REPORT.md)

---

**Pronto para começar!** 🚀

Execute `.\START-DEV.ps1` e comece a desenvolver!

# 🚀 Quick Start - Alquimista.AI Frontend

## ✅ Problemas Resolvidos

1. ✅ **Conflito de rotas** - Removida pasta `(marketing)` duplicada
2. ✅ **Integração AWS** - Configurado para usar APIs de produção
3. ✅ **Vulnerabilidades** - Next.js atualizado para v14.2.33
4. ✅ **Variáveis de ambiente** - Configuradas para DEV e PROD

---

## 📦 Instalação

```powershell
# 1. Entre na pasta frontend
cd frontend

# 2. Remova instalações antigas (se necessário)
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# 3. Instale as dependências
npm install

# 4. Verifique se não há vulnerabilidades
npm audit
```

---

## 🏃 Executando Localmente

### Modo Desenvolvimento (usa API DEV)
```powershell
npm run dev
```

Acesse: http://localhost:3000

### Modo Produção (usa API PROD)
```powershell
npm run build
npm start
```

---

## 🌐 Páginas Disponíveis

### Páginas Institucionais (Marketing)
- **Home**: http://localhost:3000
- **Fibonacci**: http://localhost:3000/fibonacci
- **Nigredo**: http://localhost:3000/nigredo

### Autenticação
- **Login**: http://localhost:3000/login
- **Cadastro**: http://localhost:3000/signup

### Dashboard (requer login)
- **Dashboard**: http://localhost:3000/dashboard
- **Agentes**: http://localhost:3000/agents
- **Analytics**: http://localhost:3000/analytics
- **Configurações**: http://localhost:3000/settings
- **Onboarding**: http://localhost:3000/onboarding

---

## 🔧 Configuração de Ambiente

### Desenvolvimento (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://c5loeivg0k.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_AWS_REGION=us-east-1
```

### Produção (.env.production)
```bash
NEXT_PUBLIC_API_URL=https://ogsd1547nd.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_AWS_REGION=us-east-1
```

---

## 🧪 Testando a API

### Via Browser Console
```javascript
// Abra o console (F12) e execute:
fetch('https://ogsd1547nd.execute-api.us-east-1.amazonaws.com/')
  .then(r => r.json())
  .then(console.log);
```

**Resposta Esperada:**
```json
{
  "ok": true,
  "service": "Fibonacci Orquestrador",
  "environment": "prod",
  "db_status": "connected"
}
```

### Via PowerShell
```powershell
Invoke-RestMethod -Uri "https://ogsd1547nd.execute-api.us-east-1.amazonaws.com/"
```

---

## 📁 Estrutura de Pastas

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, Signup
│   │   ├── (dashboard)/     # Dashboard, Agents, Analytics
│   │   ├── (institutional)/ # Home, Fibonacci, Nigredo
│   │   ├── layout.tsx       # Layout raiz
│   │   └── globals.css      # Estilos globais
│   ├── components/
│   │   ├── ui/              # Componentes base (Button, Input, etc)
│   │   ├── layout/          # Header, Footer, Sidebar
│   │   ├── dashboard/       # Componentes do dashboard
│   │   ├── agents/          # Componentes de agentes
│   │   └── analytics/       # Componentes de analytics
│   ├── stores/              # Zustand stores
│   ├── hooks/               # Custom hooks
│   └── lib/                 # Utilitários e API client
├── public/                  # Assets estáticos
├── .env.local              # Variáveis de desenvolvimento
├── .env.production         # Variáveis de produção
└── package.json
```

---

## 🎨 Design System

### Cores Principais
- **Roxo**: `from-purple-600 to-indigo-600`
- **Rosa**: `from-pink-600 to-rose-600`
- **Azul**: `from-blue-600 to-cyan-600`

### Fundos
- **Branco**: `bg-white`
- **Cinza Claro**: `bg-slate-50`
- **Gradiente Suave**: `from-purple-100/50 via-pink-50/30 to-blue-100/50`

### Componentes
- Todos os componentes usam Tailwind CSS
- Animações com Framer Motion
- Ícones com Lucide React
- UI components com Radix UI

---

## 🚀 Deploy

### Vercel (Recomendado)
```powershell
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### AWS Amplify
1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Build Manual
```powershell
npm run build
# Arquivos gerados em: .next/
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

### Erro: "Port 3000 already in use"
```powershell
# Encontrar processo na porta 3000
netstat -ano | findstr :3000

# Matar processo (substitua PID)
taskkill /PID <PID> /F

# Ou use outra porta
npm run dev -- -p 3001
```

### Erro de CORS
Verifique se a API está configurada corretamente no API Gateway AWS.

### Página em branco
1. Verifique o console do browser (F12)
2. Verifique se as variáveis de ambiente estão corretas
3. Limpe o cache: `Remove-Item -Recurse -Force .next`

---

## 📚 Documentação Adicional

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [AWS Integration](./AWS-INTEGRATION.md)

---

## ✅ Checklist de Verificação

Antes de começar, certifique-se de que:

- [ ] Node.js 18+ instalado
- [ ] npm ou yarn instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Sem vulnerabilidades críticas (`npm audit`)
- [ ] Variáveis de ambiente configuradas
- [ ] API AWS respondendo corretamente
- [ ] Porta 3000 disponível

---

## 🎯 Próximos Passos

1. ✅ Rodar localmente
2. ✅ Testar todas as páginas
3. ✅ Verificar integração com API
4. 🔄 Implementar autenticação Cognito
5. 🔄 Deploy em produção
6. 🔄 Configurar domínio customizado
7. 🔄 Adicionar analytics (Google Analytics, Hotjar)

---

**Pronto para começar!** 🚀

Execute `npm run dev` e acesse http://localhost:3000

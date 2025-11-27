# 📚 Documentação de Deploy - Alquimista.AI

Documentação centralizada para deploy do ecossistema Alquimista.AI.

---

## 🚀 Início Rápido

**Novo no projeto?** Comece aqui:

1. **[Deploy Completo](./DEPLOY-COMPLETO.md)** - Backend + Frontend em 1 comando ⭐
2. **[Guia de Deploy Rápido](./QUICK-START.md)** - Deploy em 3 comandos
3. **[Troubleshooting](./TROUBLESHOOTING.md)** - Soluções para problemas comuns

---

## 📖 Documentação Completa

### Deploy Backend (AWS CDK)
- **[Deploy Backend Completo](./BACKEND-DEPLOY.md)** - Guia completo de deploy do backend
- **[Ambientes](./ENVIRONMENTS.md)** - Configuração de dev/staging/prod
- **[Validação Pós-Deploy](./VALIDATION.md)** - Como validar o deploy

### Deploy Frontend (Vercel)
- **[Deploy Frontend](./FRONTEND-DEPLOY.md)** - Deploy do Next.js no Vercel
- **[Configuração de Variáveis](./ENV-VARS.md)** - Variáveis de ambiente

### Troubleshooting
- **[Problemas Comuns](./TROUBLESHOOTING.md)** - Soluções para erros frequentes
- **[Rollback](./ROLLBACK.md)** - Como fazer rollback de deploys
- **[Logs e Monitoramento](./MONITORING.md)** - Como acessar logs

---

## 🛠️ Scripts Disponíveis

### Deploy Completo
```powershell
# Deploy backend + frontend (RECOMENDADO)
.\deploy-alquimista.ps1

# Deploy apenas backend
.\deploy-alquimista.ps1 -SkipFrontend

# Deploy apenas frontend
.\deploy-alquimista.ps1 -SkipBackend
```

### Backend
```powershell
# Deploy limpo (recomendado após falhas)
.\deploy-limpo.ps1

# Deploy backend apenas
.\deploy-backend.ps1

# Validar deploy
.\VALIDAR-DEPLOY.ps1
```

### Comandos NPM
```powershell
# Deploy desenvolvimento
npm run deploy:dev

# Deploy staging
npm run deploy:staging

# Deploy produção
npm run deploy:prod
```

---

## 📊 Status Atual

Para verificar o status atual do deploy:

```powershell
# Status da stack
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].StackStatus"

# Últimos eventos
aws cloudformation describe-stack-events --stack-name FibonacciStack-dev --max-items 10
```

---

## 🆘 Precisa de Ajuda?

1. Verifique [Troubleshooting](./TROUBLESHOOTING.md)
2. Consulte [Problemas Comuns](./COMMON-ISSUES.md)
3. Veja os logs no CloudWatch

---

## 📁 Estrutura de Arquivos

```
docs/deploy/
├── README.md                 # Este arquivo - índice principal
├── QUICK-START.md           # Guia rápido de deploy
├── BACKEND-DEPLOY.md        # Deploy completo do backend
├── FRONTEND-DEPLOY.md       # Deploy do frontend
├── TROUBLESHOOTING.md       # Soluções para problemas
├── ROLLBACK.md              # Guia de rollback
├── VALIDATION.md            # Validação pós-deploy
├── ENVIRONMENTS.md          # Configuração de ambientes
├── ENV-VARS.md              # Variáveis de ambiente
├── MONITORING.md            # Logs e monitoramento
├── SCRIPTS.md               # Documentação dos scripts
└── COMMON-ISSUES.md         # Problemas comuns e soluções
```

---

**Última atualização**: 13 de novembro de 2025

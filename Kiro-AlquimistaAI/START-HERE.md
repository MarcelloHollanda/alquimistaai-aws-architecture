# 🎯 COMECE AQUI - Deploy Alquimista.AI

**Você está pronto para fazer o deploy completo do sistema na AWS!**

---

## ⚡ Deploy em 1 Comando

```powershell
.\DEPLOY-FULL-SYSTEM.ps1
```

**Isso vai fazer**:
- ✅ Deploy do backend na AWS (Lambda, API Gateway, Aurora, Cognito)
- ✅ Configurar variáveis de ambiente automaticamente
- ✅ Deploy do frontend no Vercel
- ✅ Validar tudo

**Tempo**: 35-50 minutos

---

## 📋 Antes de Começar

### 1. Verificar Pré-requisitos (2 min)

```powershell
# AWS configurado?
aws sts get-caller-identity

# Node.js instalado?
node --version  # Precisa ser 18+

# Vercel instalado?
vercel --version
```

Se algo falhar:
```powershell
# Instalar Vercel
npm install -g vercel
vercel login
```

### 2. Instalar Dependências (3 min)

```powershell
# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

---

## 🚀 Opções de Deploy

### Opção 1: Deploy Completo (Recomendado)

```powershell
.\DEPLOY-FULL-SYSTEM.ps1
```

### Opção 2: Backend Primeiro, Frontend Depois

```powershell
# 1. Deploy backend
.\DEPLOY-FULL-SYSTEM.ps1 -SkipFrontend

# 2. Deploy frontend
.\DEPLOY-FULL-SYSTEM.ps1 -SkipBackend
```

### Opção 3: Apenas Testar Backend

```powershell
# Deploy só backend
.\DEPLOY-FULL-SYSTEM.ps1 -SkipFrontend

# Testar
curl https://c5loeivg0k.execute-api.us-east-1.amazonaws.com/health
```

---

## ✅ Após o Deploy

### 1. Validar (2 min)

```powershell
.\VALIDATE-INTEGRATION.ps1
```

### 2. Testar API (1 min)

```powershell
# Pegar URL
$API_URL = (aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text)

# Testar
curl "$API_URL/health"
```

### 3. Abrir Frontend (1 min)

```powershell
# URL será exibida no final do deploy
# Exemplo: https://seu-app.vercel.app

# Testar:
# - Login
# - Dashboard
# - Agents
```

---

## 📚 Documentação

### Guias Rápidos
- **[QUICK-START-DEPLOY.md](./QUICK-START-DEPLOY.md)** - Guia rápido (5 min)
- **[COMANDOS-RAPIDOS.md](./COMANDOS-RAPIDOS.md)** - Referência de comandos

### Guias Completos
- **[DEPLOY-INTEGRATION-GUIDE.md](./DEPLOY-INTEGRATION-GUIDE.md)** - Guia detalhado (15 min)
- **[DEPLOY-READY-SUMMARY.md](./DEPLOY-READY-SUMMARY.md)** - Resumo executivo

### Troubleshooting
- **[docs/deploy/TROUBLESHOOTING.md](./docs/deploy/TROUBLESHOOTING.md)** - Soluções para problemas

---

## 🎯 Fluxo Recomendado

```
1. Ler este arquivo (5 min)
   ↓
2. Verificar pré-requisitos (2 min)
   ↓
3. Executar deploy (35-50 min)
   .\DEPLOY-FULL-SYSTEM.ps1
   ↓
4. Validar (2 min)
   .\VALIDATE-INTEGRATION.ps1
   ↓
5. Testar no navegador (5 min)
   ↓
6. ✅ Sistema funcionando!
```

**Tempo Total**: ~50-65 minutos

---

## 💡 Dicas Importantes

### Durante o Deploy
- ☕ Pegue um café - vai demorar ~40 min
- 📊 Acompanhe o progresso no terminal
- 🚫 Não interrompa o processo
- 📝 Anote a URL do frontend no final

### Após o Deploy
- ✅ Sempre valide: `.\VALIDATE-INTEGRATION.ps1`
- 📊 Monitore logs: `aws logs tail /aws/lambda/FibonacciStack-dev-ApiHandler --follow`
- 🔍 Verifique CloudWatch Dashboards
- 💰 Monitore custos no AWS Cost Explorer

---

## 🐛 Problemas Comuns

### "Stack in ROLLBACK_COMPLETE"
```powershell
aws cloudformation delete-stack --stack-name FibonacciStack-dev
aws cloudformation wait stack-delete-complete --stack-name FibonacciStack-dev
.\DEPLOY-FULL-SYSTEM.ps1
```

### "Vercel not found"
```powershell
npm install -g vercel
vercel login
```

### "Build failed"
```powershell
Remove-Item -Recurse -Force node_modules
npm install
npm run build
```

### Mais problemas?
Consulte: [docs/deploy/TROUBLESHOOTING.md](./docs/deploy/TROUBLESHOOTING.md)

---

## 📊 O Que Será Criado

### Backend (AWS)
- 3 CloudFormation Stacks
- 15+ Lambda Functions
- 1 Aurora Serverless v2 Database
- 2 API Gateways
- 1 Cognito User Pool
- 1 EventBridge Bus
- CloudWatch Dashboards
- S3 + CloudFront

### Frontend
- Next.js 14 deployado no Vercel
- Integrado com backend AWS
- Autenticação Cognito
- Dashboard funcional

### Custo Estimado
- **Dev**: ~$42-78/mês
- **Prod**: ~$160-350/mês

---

## 🎉 Pronto para Começar?

### Execute Agora

```powershell
.\DEPLOY-FULL-SYSTEM.ps1
```

### Ou Leia Mais

```powershell
# Guia rápido
Get-Content QUICK-START-DEPLOY.md

# Guia completo
Get-Content DEPLOY-INTEGRATION-GUIDE.md

# Comandos úteis
Get-Content COMANDOS-RAPIDOS.md
```

---

## 📞 Precisa de Ajuda?

1. **Validação**: `.\VALIDATE-INTEGRATION.ps1`
2. **Logs**: `aws logs tail /aws/lambda/FibonacciStack-dev-ApiHandler --follow`
3. **Troubleshooting**: [docs/deploy/TROUBLESHOOTING.md](./docs/deploy/TROUBLESHOOTING.md)
4. **AWS Console**: https://console.aws.amazon.com/

---

## ✅ Checklist Rápido

Antes de executar o deploy:

- [ ] AWS CLI configurado
- [ ] Node.js 18+ instalado
- [ ] Vercel CLI instalado e logado
- [ ] Dependências instaladas (`npm install`)
- [ ] Tem ~50 minutos disponíveis
- [ ] Leu este arquivo

**Tudo OK? Execute**: `.\DEPLOY-FULL-SYSTEM.ps1`

---

**Boa sorte! 🚀**

O sistema está 100% pronto para deploy. Qualquer dúvida, consulte a documentação.

---

**Última atualização**: 15 de Novembro de 2025  
**Status**: ✅ PRONTO PARA DEPLOY  
**Confiança**: 95%+


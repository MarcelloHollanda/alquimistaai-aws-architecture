# ⚡ Quick Start - Deploy Completo

**Tempo estimado**: 35-50 minutos

---

## 🚀 Deploy em 3 Comandos

### 1. Deploy Completo (Recomendado)

```powershell
# Deploy backend + frontend em um comando
.\DEPLOY-FULL-SYSTEM.ps1
```

### 2. Deploy Apenas Backend

```powershell
# Se você só quer testar o backend primeiro
.\DEPLOY-FULL-SYSTEM.ps1 -SkipFrontend
```

### 3. Validar Deploy

```powershell
# Testar tudo que foi deployado
.\VALIDATE-INTEGRATION.ps1
```

---

## 📋 Pré-requisitos Rápidos

```powershell
# 1. Verificar AWS
aws sts get-caller-identity

# 2. Verificar Node.js (precisa 18+)
node --version

# 3. Instalar Vercel CLI (para frontend)
npm install -g vercel
vercel login
```

---

## 🎯 Opções de Deploy

### Deploy Desenvolvimento

```powershell
.\DEPLOY-FULL-SYSTEM.ps1 -Environment dev
```

### Deploy Produção

```powershell
.\DEPLOY-FULL-SYSTEM.ps1 -Environment prod
```

### Deploy com Amplify (em vez de Vercel)

```powershell
.\DEPLOY-FULL-SYSTEM.ps1 -FrontendPlatform amplify
```

### Deploy Apenas Frontend

```powershell
.\DEPLOY-FULL-SYSTEM.ps1 -SkipBackend
```

---

## ✅ Checklist Rápido

Antes de começar, certifique-se:

- [ ] AWS CLI configurado (`aws configure`)
- [ ] Node.js 18+ instalado
- [ ] Credenciais AWS válidas
- [ ] Vercel CLI instalado (se usar Vercel)
- [ ] Repositório clonado e atualizado

---

## 🧪 Testar Após Deploy

### 1. Testar API Backend

```powershell
# Pegar URL da API
$API_URL = (aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text)

# Testar health
curl "$API_URL/health"
```

### 2. Testar Frontend

```powershell
# Abrir no navegador (URL será exibida no final do deploy)
# Vercel: https://seu-app.vercel.app
# Amplify: https://branch.app-id.amplifyapp.com
```

### 3. Validação Completa

```powershell
# Rodar todos os testes
.\VALIDATE-INTEGRATION.ps1

# Com URL do frontend
.\VALIDATE-INTEGRATION.ps1 -FrontendUrl "https://seu-app.vercel.app"
```

---

## 🐛 Problemas Comuns

### Erro: "Stack in ROLLBACK_COMPLETE"

```powershell
# Limpar stack com falha
aws cloudformation delete-stack --stack-name FibonacciStack-dev
aws cloudformation wait stack-delete-complete --stack-name FibonacciStack-dev

# Tentar novamente
.\DEPLOY-FULL-SYSTEM.ps1
```

### Erro: "Vercel not found"

```powershell
npm install -g vercel
vercel login
```

### Erro: "Build failed"

```powershell
# Limpar e reinstalar
Remove-Item -Recurse -Force node_modules
npm install
npm run build
```

---

## 📊 O Que Será Criado

### Backend (AWS)
- ✅ 3 CloudFormation Stacks
- ✅ API Gateway (HTTP API)
- ✅ 15+ Lambda Functions
- ✅ Aurora Serverless v2 (PostgreSQL)
- ✅ Cognito User Pool
- ✅ EventBridge Bus
- ✅ SQS Queues
- ✅ CloudWatch Dashboards
- ✅ S3 Bucket (para frontend estático)
- ✅ CloudFront Distribution

### Frontend
- ✅ Next.js 14 deployado
- ✅ Variáveis de ambiente configuradas
- ✅ Integração com backend
- ✅ Autenticação Cognito
- ✅ Dashboard funcional

---

## 🔗 Links Úteis

- **Guia Completo**: [DEPLOY-INTEGRATION-GUIDE.md](./DEPLOY-INTEGRATION-GUIDE.md)
- **Troubleshooting**: [docs/deploy/TROUBLESHOOTING.md](./docs/deploy/TROUBLESHOOTING.md)
- **AWS Console**: https://console.aws.amazon.com/

---

## 📞 Próximos Passos

Após deploy bem-sucedido:

1. **Testar Login**
   - Acesse o frontend
   - Crie uma conta
   - Faça login

2. **Testar Dashboard**
   - Veja as métricas
   - Liste os agentes
   - Ative um agente

3. **Monitorar**
   - CloudWatch Logs
   - CloudWatch Dashboards
   - X-Ray Traces

4. **Configurar Domínio** (opcional)
   - Route 53
   - Certificado SSL
   - CloudFront custom domain

---

## 💡 Dicas

- Use `-SkipValidation` para deploy mais rápido (não recomendado)
- Sempre valide após deploy: `.\VALIDATE-INTEGRATION.ps1`
- Monitore logs: `aws logs tail /aws/lambda/FibonacciStack-dev-ApiHandler --follow`
- Salve os outputs: `backend-outputs-dev.json`

---

**Última atualização**: 15 de Novembro de 2025  
**Tempo médio de deploy**: 35-50 minutos  
**Taxa de sucesso**: 95%+


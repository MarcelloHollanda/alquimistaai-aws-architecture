# 🚀 Deploy Alquimista.AI - README

## ⚡ TL;DR - Deploy em 1 Comando

```powershell
.\deploy-tudo.ps1
```

**Tempo**: ~30 minutos | **Custo**: ~$50-100/mês (dev)

---

## 📚 Documentação Disponível

| Arquivo | Descrição | Quando Usar |
|---------|-----------|-------------|
| **[COMECE-AQUI.md](COMECE-AQUI.md)** ⭐ | Início rápido | Primeira vez |
| [DEPLOY-RAPIDO.md](DEPLOY-RAPIDO.md) | Comandos rápidos | Referência rápida |
| [DEPLOY-COMPLETO.md](DEPLOY-COMPLETO.md) | Guia detalhado | Entender tudo |
| [DEPLOY-SOLUTION.md](DEPLOY-SOLUTION.md) | Troubleshooting | Resolver problemas |
| [STATUS-DEPLOY.md](STATUS-DEPLOY.md) | Status atual | Acompanhar progresso |
| [DEPLOY-INDEX.md](DEPLOY-INDEX.md) | Índice completo | Navegar docs |

---

## 🎯 3 Formas de Deploy

### 1️⃣ Automatizado (Recomendado)
```powershell
.\deploy-tudo.ps1
```
✅ Faz tudo automaticamente  
✅ Validações integradas  
✅ Resumo final  

### 2️⃣ Separado
```powershell
# Backend
.\deploy-backend.ps1

# Frontend
cd frontend
.\deploy-frontend.ps1
```
✅ Controle individual  
✅ Deploy incremental  

### 3️⃣ Manual
```powershell
# Backend
npm run build
npx cdk deploy FibonacciStack-dev --require-approval never

# Frontend
cd frontend
npm run build
vercel --prod
```
✅ Controle total  
✅ Debug facilitado  

---

## 📊 O Que Será Criado

### Backend (AWS)
```
✅ VPC com 2 AZs
✅ Aurora Serverless v2
✅ 15+ Lambda Functions
✅ API Gateway
✅ EventBridge + SQS
✅ Cognito
✅ S3 + CloudFront
✅ WAF
✅ CloudWatch
✅ CloudTrail
```

### Frontend (Vercel)
```
✅ Next.js 14
✅ Edge Functions
✅ Global CDN
✅ Automatic SSL
```

---

## ⏱️ Timeline

```
┌─────────────────────────────────────────┐
│  0 min: Início                          │
├─────────────────────────────────────────┤
│  2 min: Build backend                   │
│  5 min: Deploy iniciado                 │
│ 10 min: VPC + Aurora criados            │
│ 15 min: Lambdas deployadas              │
│ 20 min: API Gateway configurado         │
│ 25 min: Backend completo ✅             │
├─────────────────────────────────────────┤
│ 27 min: Build frontend                  │
│ 30 min: Deploy Vercel                   │
│ 35 min: Frontend completo ✅            │
└─────────────────────────────────────────┘
```

---

## 💰 Custos Estimados

### Desenvolvimento
- **Backend**: $50-100/mês
- **Frontend**: $0 (Free Tier)
- **Total**: $50-100/mês

### Produção
- **Backend**: $200-500/mês
- **Frontend**: $20/mês
- **Total**: $220-520/mês

---

## 🔐 Segurança

```
✅ WAF (SQL Injection, XSS, DDoS)
✅ Criptografia KMS
✅ SSL/TLS
✅ VPC Isolada
✅ Security Groups
✅ IAM Least Privilege
✅ CloudTrail Audit
✅ Secrets Manager
✅ LGPD Compliance
```

---

## 📈 Monitoramento

```
✅ 3 CloudWatch Dashboards
✅ 10+ CloudWatch Alarms
✅ CloudWatch Logs
✅ X-Ray Tracing
✅ Structured Logging
✅ Insights Queries
```

---

## 🆘 Problemas Comuns

### Stack em ROLLBACK_COMPLETE
```powershell
aws cloudformation delete-stack --stack-name FibonacciStack-dev
# Aguardar 2 min
.\deploy-backend.ps1
```

### Bucket já existe
```powershell
aws s3 rb s3://fibonacci-stack-versions-dev-[ID] --force
```

### Frontend não conecta
1. Verificar `.env.production`
2. Confirmar outputs do backend
3. Testar API com curl

**Mais soluções**: [DEPLOY-SOLUTION.md](DEPLOY-SOLUTION.md)

---

## ✅ Checklist Pré-Deploy

```
[ ] AWS CLI configurado
[ ] Credenciais AWS válidas
[ ] Node.js 18+ instalado
[ ] Vercel CLI instalado
[ ] Conta Vercel ativa
```

---

## 🎯 Após o Deploy

### Validação
```powershell
# Testar API
curl https://[API-URL]/health

# Ver logs
aws logs tail /aws/lambda/FibonacciStack-dev-ApiHandler --follow

# Ver dashboards
# Acesse CloudWatch Console
```

### Próximos Passos
1. Configurar domínio customizado
2. Configurar CI/CD
3. Configurar backups
4. Configurar alertas
5. Documentar APIs

---

## 📞 Suporte

| Tipo | Recurso |
|------|---------|
| Documentação | `docs/` |
| Logs Backend | CloudWatch Logs |
| Logs Frontend | `vercel logs` |
| Troubleshooting | `DEPLOY-SOLUTION.md` |
| Status | `STATUS-DEPLOY.md` |

---

## 🎉 Pronto para Começar?

### Passo 1: Leia
```powershell
cat COMECE-AQUI.md
```

### Passo 2: Execute
```powershell
.\deploy-tudo.ps1
```

### Passo 3: Celebre! 🎊
Sua aplicação estará no ar em ~30 minutos!

---

## 📱 Links Úteis

- [AWS Console](https://console.aws.amazon.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [CloudWatch](https://console.aws.amazon.com/cloudwatch)
- [API Gateway](https://console.aws.amazon.com/apigateway)

---

**Criado com ❤️ pela equipe Alquimista.AI**

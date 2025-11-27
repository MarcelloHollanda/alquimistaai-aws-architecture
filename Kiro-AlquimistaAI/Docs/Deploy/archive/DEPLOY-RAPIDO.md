# 🚀 Deploy Rápido - 3 Comandos

## Opção 1: Deploy Completo Automatizado

```powershell
# Executa tudo de uma vez (Backend + Frontend)
.\deploy-tudo.ps1
```

## Opção 2: Deploy Separado

### Backend (AWS)
```powershell
.\deploy-backend.ps1
```

### Frontend (Vercel)
```powershell
cd frontend
.\deploy-frontend.ps1
```

## Opção 3: Deploy Manual

### Backend
```powershell
npm run build
npx cdk deploy FibonacciStack-dev --require-approval never --context env=dev
```

### Frontend
```powershell
cd frontend
npm install
npm run build
vercel --prod
```

---

## ⚡ Comandos Úteis

```powershell
# Ver outputs do backend
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs" --output table

# Ver logs do backend
aws logs tail /aws/lambda/FibonacciStack-dev-ApiHandler --follow

# Ver logs do frontend
vercel logs --follow

# Rollback frontend
vercel rollback
```

---

## 📋 Checklist Pré-Deploy

- [ ] AWS CLI configurado (`aws configure`)
- [ ] Node.js 18+ instalado
- [ ] Vercel CLI instalado (`npm i -g vercel`)
- [ ] Credenciais AWS válidas
- [ ] Conta Vercel ativa

---

## 🆘 Problemas Comuns

### "Stack in ROLLBACK_COMPLETE"
```powershell
aws cloudformation delete-stack --stack-name FibonacciStack-dev
# Aguardar 2 minutos
npm run deploy:dev
```

### "Bucket already exists"
```powershell
aws s3 rb s3://fibonacci-stack-versions-dev-[ACCOUNT-ID] --force
```

### Frontend não conecta
1. Verifique `.env.production`
2. Confirme outputs do backend
3. Teste API com curl

---

## 📚 Documentação Completa

Ver `DEPLOY-COMPLETO.md` para guia detalhado.

# 🚀 COMECE AQUI - Deploy Alquimista.AI

## ⚡ Deploy em 1 Comando

```powershell
.\deploy-tudo.ps1
```

Isso é tudo! O script vai:
1. ✅ Compilar o backend
2. ✅ Fazer deploy na AWS (15-25 min)
3. ✅ Capturar outputs
4. ✅ Compilar o frontend
5. ✅ Fazer deploy no Vercel (5-10 min)

---

## 📋 Antes de Começar

Certifique-se de ter:

```powershell
# 1. AWS CLI configurado
aws configure
# Insira: Access Key, Secret Key, Region (us-east-1)

# 2. Verificar credenciais
aws sts get-caller-identity

# 3. Vercel CLI (para frontend)
npm i -g vercel
vercel login
```

---

## 🎯 Opções de Deploy

### Opção 1: Tudo Automatizado (Recomendado)
```powershell
.\deploy-tudo.ps1
```

### Opção 2: Apenas Backend
```powershell
.\deploy-backend.ps1
```

### Opção 3: Apenas Frontend
```powershell
cd frontend
.\deploy-frontend.ps1
```

---

## ⏱️ Tempo Total

- Backend: 15-25 minutos
- Frontend: 5-10 minutos
- **Total: ~30 minutos**

---

## 📊 O Que Será Criado

### AWS
- API Gateway + 15 Lambdas
- Aurora Serverless v2
- CloudFront + S3
- Cognito User Pool
- EventBridge + SQS
- CloudWatch Dashboards
- WAF + Security

### Vercel
- Next.js App
- Edge Functions
- Global CDN

---

## 🆘 Problemas?

### Stack em ROLLBACK_COMPLETE
```powershell
aws cloudformation delete-stack --stack-name FibonacciStack-dev
# Aguardar 2 minutos
.\deploy-backend.ps1
```

### Bucket já existe
```powershell
aws s3 rb s3://fibonacci-stack-versions-dev-[ACCOUNT-ID] --force
```

### Mais ajuda
- Ver `DEPLOY-SOLUTION.md`
- Ver `DEPLOY-COMPLETO.md`

---

## 📚 Documentação

- `DEPLOY-RAPIDO.md` - Comandos rápidos
- `DEPLOY-COMPLETO.md` - Guia detalhado
- `DEPLOY-SUMMARY.md` - Resumo completo
- `STATUS-DEPLOY.md` - Status do projeto

---

## ✅ Após o Deploy

1. Acesse a URL do Vercel fornecida
2. Faça login na aplicação
3. Teste criação de agentes
4. Verifique dashboards no CloudWatch

---

## 🎉 Pronto!

Execute agora:

```powershell
.\deploy-tudo.ps1
```

E em ~30 minutos sua aplicação estará no ar! 🚀

# 🚀 Deploy Completo - Alquimista.AI

Deploy automatizado de todo o sistema: Backend (AWS) + Frontend (Vercel).

---

## ⚡ Deploy em 1 Comando

```powershell
.\deploy-alquimista.ps1
```

Este script faz deploy completo de:
- ✅ Backend (AWS CDK - Lambda, API Gateway, Aurora, Cognito, etc)
- ✅ Frontend (Vercel - Next.js)
- ✅ Validação automática

**Tempo estimado**: 25-40 minutos

---

## 📋 Pré-requisitos

### Backend
- AWS CLI configurado
- Node.js 18+ instalado
- Credenciais AWS válidas

### Frontend
- Vercel CLI instalado: `npm i -g vercel`
- Conta Vercel configurada: `vercel login`

---

## 🎯 Uso Básico

### Deploy Completo (Dev)

```powershell
# Deploy backend + frontend em desenvolvimento
.\deploy-alquimista.ps1
```

### Deploy Completo (Produção)

```powershell
# Deploy backend + frontend em produção
.\deploy-alquimista.ps1 -Environment prod
```

---

## 🔧 Opções Avançadas

### Deploy Apenas Backend

```powershell
# Pular frontend
.\deploy-alquimista.ps1 -SkipFrontend
```

### Deploy Apenas Frontend

```powershell
# Pular backend
.\deploy-alquimista.ps1 -SkipBackend
```

### Deploy Sem Validação

```powershell
# Pular validação pós-deploy
.\deploy-alquimista.ps1 -SkipValidation
```

### Combinações

```powershell
# Deploy staging sem validação
.\deploy-alquimista.ps1 -Environment staging -SkipValidation

# Deploy prod apenas backend
.\deploy-alquimista.ps1 -Environment prod -SkipFrontend
```

---

## 📊 O Que o Script Faz

### Parte 1: Backend (15-25 min)

1. ✅ Verifica credenciais AWS
2. ✅ Limpa cache CDK
3. ✅ Instala dependências
4. ✅ Compila TypeScript
5. ✅ Valida sintaxe CDK
6. ✅ Faz deploy no AWS
7. ✅ Captura outputs

### Parte 2: Frontend (5-10 min)

1. ✅ Verifica Vercel CLI
2. ✅ Instala dependências
3. ✅ Verifica variáveis de ambiente
4. ✅ Faz build do Next.js
5. ✅ Deploy no Vercel

### Parte 3: Validação (1-2 min)

1. ✅ Verifica status da stack
2. ✅ Testa API (/health)
3. ✅ Lista Lambdas criadas

---

## 📝 Configuração do Frontend

### Primeira Vez

Antes do primeiro deploy do frontend, configure as variáveis:

1. **Faça deploy do backend primeiro**:
```powershell
.\deploy-alquimista.ps1 -SkipFrontend
```

2. **Capture os outputs**:
```powershell
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs" --output table
```

3. **Crie `frontend/.env.production`**:
```bash
NEXT_PUBLIC_API_URL=https://[SEU-API-GATEWAY-URL]
NEXT_PUBLIC_COGNITO_USER_POOL_ID=[SEU-USER-POOL-ID]
NEXT_PUBLIC_COGNITO_CLIENT_ID=[SEU-CLIENT-ID]
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_ENV=production
```

4. **Deploy do frontend**:
```powershell
.\deploy-alquimista.ps1 -SkipBackend
```

---

## 📤 Outputs

### Backend

Outputs salvos em: `backend-outputs-{env}.json`

Principais outputs:
- `ApiEndpoint` - URL da API Gateway
- `UserPoolId` - ID do Cognito User Pool
- `UserPoolClientId` - ID do Client
- `DatabaseEndpoint` - Endpoint do Aurora
- `CloudFrontUrl` - URL do CloudFront

### Frontend

URL do deploy exibida no final do processo Vercel.

---

## ✅ Validação Pós-Deploy

### Testar Backend

```powershell
# Testar API
curl https://[API-URL]/health

# Verificar Lambdas
aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'FibonacciStack')].FunctionName"

# Ver logs
aws logs tail /aws/lambda/FibonacciStack-dev-ApiHandler --follow
```

### Testar Frontend

```powershell
# Abrir no navegador
start https://[SEU-APP].vercel.app

# Ver logs do Vercel
vercel logs --follow
```

### Testar Integração

1. Acesse o frontend
2. Faça login
3. Teste criação de agentes
4. Verifique dados no Aurora

---

## 🐛 Troubleshooting

### Erro: "Stack in ROLLBACK_IN_PROGRESS"

```powershell
# Aguardar rollback e limpar
aws cloudformation wait stack-rollback-complete --stack-name FibonacciStack-dev
aws cloudformation delete-stack --stack-name FibonacciStack-dev
aws cloudformation wait stack-delete-complete --stack-name FibonacciStack-dev

# Tentar novamente
.\deploy-alquimista.ps1
```

### Erro: "Vercel CLI not found"

```powershell
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Tentar novamente
.\deploy-alquimista.ps1
```

### Erro: "Build failed"

```powershell
# Limpar e reinstalar
Remove-Item -Recurse -Force node_modules
npm install
npm run build

# Tentar novamente
.\deploy-alquimista.ps1
```

### Frontend não conecta ao Backend

1. Verifique `.env.production`
2. Confirme que API está acessível
3. Verifique CORS na API Gateway
4. Teste API diretamente: `curl https://[API-URL]/health`

---

## ⏱️ Timeline Esperado

```
Início
  │
  ├─ Backend (15-25 min)
  │  ├─ Preparação (2 min)
  │  ├─ Deploy CDK (15-20 min)
  │  └─ Captura outputs (1 min)
  │
  ├─ Frontend (5-10 min)
  │  ├─ Build (3-5 min)
  │  └─ Deploy Vercel (2-5 min)
  │
  └─ Validação (1-2 min)

Total: 21-37 minutos
```

---

## 📚 Mais Informações

- [Guia Rápido](./QUICK-START.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Índice Principal](./README.md)

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique [Troubleshooting](./TROUBLESHOOTING.md)
2. Veja os logs: `aws cloudformation describe-stack-events --stack-name FibonacciStack-dev`
3. Use validação: `.\VALIDAR-DEPLOY.ps1`

---

**Última atualização**: 13 de novembro de 2025

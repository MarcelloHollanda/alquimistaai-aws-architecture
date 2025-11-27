# ⚡ Guia Rápido de Deploy

Deploy do Alquimista.AI em 3 passos simples.

---

## 🎯 Pré-requisitos

- AWS CLI configurado
- Node.js 18+ instalado
- Credenciais AWS válidas

---

## 🚀 Deploy em 3 Comandos

### Opção A: Script Automatizado (RECOMENDADO)

```powershell
# 1. Execute o script de deploy limpo
.\deploy-limpo.ps1

# 2. Aguarde 25-40 minutos (automático)

# 3. Valide o deploy
.\VALIDAR-DEPLOY.ps1
```

### Opção B: Comandos Manuais

```powershell
# 1. Preparar ambiente
npm install
npm run build

# 2. Deploy backend
npx cdk deploy FibonacciStack-dev --require-approval never --context env=dev

# 3. Validar
.\VALIDAR-DEPLOY.ps1
```

---

## 📋 Após o Deploy do Backend

### 1. Capturar Outputs

```powershell
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs" --output table
```

### 2. Configurar Frontend

Crie `frontend/.env.production`:

```bash
NEXT_PUBLIC_API_URL=https://[SEU-API-GATEWAY-URL]
NEXT_PUBLIC_COGNITO_USER_POOL_ID=[SEU-USER-POOL-ID]
NEXT_PUBLIC_COGNITO_CLIENT_ID=[SEU-CLIENT-ID]
NEXT_PUBLIC_AWS_REGION=us-east-1
```

### 3. Deploy Frontend

```powershell
cd frontend
npm install
npm run build
vercel --prod
```

---

## ✅ Validação

```powershell
# Testar API
curl https://[API-URL]/health

# Validar todos os componentes
.\VALIDAR-DEPLOY.ps1
```

---

## 🐛 Problemas?

Se algo der errado:

1. Verifique [Troubleshooting](./TROUBLESHOOTING.md)
2. Veja os logs: `aws cloudformation describe-stack-events --stack-name FibonacciStack-dev`
3. Use o script de limpeza: `.\deploy-limpo.ps1`

---

## ⏱️ Tempo Estimado

- **Backend**: 15-25 minutos
- **Frontend**: 5-10 minutos
- **Total**: 20-35 minutos

---

## 📚 Mais Informações

- [Deploy Backend Completo](./BACKEND-DEPLOY.md)
- [Deploy Frontend](./FRONTEND-DEPLOY.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

---

**Voltar para**: [Índice Principal](./README.md)

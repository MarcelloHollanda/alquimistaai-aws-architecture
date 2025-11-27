# ⚡ EXECUTAR DEPLOY AGORA

## 🎯 Situação Atual
- Stack em **ROLLBACK_IN_PROGRESS**
- Precisa limpar e fazer deploy limpo

---

## 🚀 Opção 1: Script Automatizado (RECOMENDADO)

Execute este comando único:

```powershell
.\deploy-limpo.ps1
```

O script vai:
1. ✅ Aguardar rollback completar automaticamente
2. ✅ Deletar a stack com falha
3. ✅ Limpar cache e preparar ambiente
4. ✅ Fazer deploy completo do backend
5. ✅ Capturar outputs para o frontend

**Tempo total**: ~25-40 minutos (automático)

---

## 🔧 Opção 2: Passo a Passo Manual

### Passo 1: Aguardar Rollback (5-15 min)

```powershell
# Verificar status
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].StackStatus"

# Aguardar completar
aws cloudformation wait stack-rollback-complete --stack-name FibonacciStack-dev
```

### Passo 2: Deletar Stack (2-5 min)

```powershell
# Deletar
aws cloudformation delete-stack --stack-name FibonacciStack-dev

# Aguardar deleção
aws cloudformation wait stack-delete-complete --stack-name FibonacciStack-dev
```

### Passo 3: Deploy Limpo (15-25 min)

```powershell
# Limpar cache
Remove-Item -Recurse -Force cdk.out

# Preparar
npm install
npm run build

# Deploy
npx cdk deploy FibonacciStack-dev --require-approval never --context env=dev
```

### Passo 4: Capturar Outputs

```powershell
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs" --output table
```

---

## 📱 Depois do Backend: Deploy do Frontend

### 1. Configurar Variáveis

Crie `frontend/.env.production`:

```bash
NEXT_PUBLIC_API_URL=https://[SEU-API-GATEWAY-URL]
NEXT_PUBLIC_COGNITO_USER_POOL_ID=[SEU-USER-POOL-ID]
NEXT_PUBLIC_COGNITO_CLIENT_ID=[SEU-CLIENT-ID]
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_ENV=production
```

### 2. Build e Deploy

```powershell
cd frontend
npm install
npm run build
vercel --prod
```

---

## ⚡ Comando Único (Mais Rápido)

Se você quer executar tudo de uma vez:

```powershell
# Execute o script automatizado
.\deploy-limpo.ps1

# Depois configure e deploy o frontend
cd frontend
# [Configure .env.production com os outputs]
npm run build
vercel --prod
```

---

## 🐛 Se Algo Der Errado

### Rollback não completa
```powershell
# Verificar eventos
aws cloudformation describe-stack-events --stack-name FibonacciStack-dev --max-items 20
```

### Não consegue deletar stack
```powershell
# Forçar deleção (cuidado!)
aws cloudformation delete-stack --stack-name FibonacciStack-dev --retain-resources [RESOURCE-ID]
```

### Deploy falha novamente
```powershell
# Ver logs detalhados
npx cdk deploy FibonacciStack-dev --context env=dev --verbose

# Verificar sintaxe
npx cdk synth --context env=dev
```

---

## ✅ Checklist Rápido

- [ ] Executar `.\deploy-limpo.ps1` OU seguir passos manuais
- [ ] Aguardar deploy completar (~25 min)
- [ ] Capturar outputs do backend
- [ ] Configurar `frontend/.env.production`
- [ ] Deploy do frontend no Vercel
- [ ] Testar API: `curl https://[API-URL]/health`
- [ ] Testar frontend: abrir no navegador
- [ ] Validar integração: fazer login

---

## 🎯 Próximo Comando a Executar

```powershell
.\deploy-limpo.ps1
```

**OU** se preferir manual:

```powershell
aws cloudformation wait stack-rollback-complete --stack-name FibonacciStack-dev
```

---

**Tempo Total Estimado**: 35-50 minutos para deploy completo (backend + frontend)

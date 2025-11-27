# 🚀 Guia de Deploy e Integração Completa - Alquimista.AI

**Objetivo**: Deploy completo do sistema na AWS com backend e frontend integrados e funcionando.

---

## 📋 Status Atual

### ✅ O Que Já Temos
- **Backend AWS**: APIs deployadas e funcionando
  - API DEV: https://c5loeivg0k.execute-api.us-east-1.amazonaws.com/
  - API PROD: https://ogsd1547nd.execute-api.us-east-1.amazonaws.com/
- **Database**: Aurora Serverless v2 conectado
- **Frontend Local**: Next.js rodando em localhost:3000
- **Credenciais AWS**: Configuradas e válidas

### ⏭️ O Que Vamos Fazer
1. Verificar e atualizar backend (CDK)
2. Configurar variáveis de ambiente do frontend
3. Deploy do frontend na AWS (S3 + CloudFront)
4. Testar integração completa
5. Validar todos os endpoints

---

## 🎯 Plano de Execução

### Fase 1: Preparação (5 min)

#### 1.1 Verificar AWS CLI e Credenciais
```powershell
# Verificar identidade AWS
aws sts get-caller-identity

# Verificar stacks existentes
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE
```

#### 1.2 Verificar Node.js e Dependências
```powershell
# Verificar versões
node --version  # Deve ser 18+
npm --version

# Instalar dependências do backend
npm install

# Instalar dependências do frontend
cd frontend
npm install
cd ..
```

---

### Fase 2: Deploy do Backend (15-20 min)

#### 2.1 Preparar Backend
```powershell
# Limpar cache
Remove-Item -Recurse -Force cdk.out -ErrorAction SilentlyContinue

# Compilar TypeScript
npm run build

# Validar CDK
npx cdk synth
```

#### 2.2 Deploy Backend (Desenvolvimento)
```powershell
# Deploy da stack Fibonacci (core)
npx cdk deploy FibonacciStack-dev --require-approval never

# Deploy da stack Nigredo (agentes)
npx cdk deploy NigredoStack-dev --require-approval never

# Deploy da stack Alquimista (plataforma)
npx cdk deploy AlquimistaStack-dev --require-approval never
```

#### 2.3 Capturar Outputs do Backend
```powershell
# Salvar outputs em arquivo
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs" > backend-outputs-dev.json

# Ver outputs importantes
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint' || OutputKey=='UserPoolId' || OutputKey=='UserPoolClientId'].{Key:OutputKey,Value:OutputValue}" --output table
```

---

### Fase 3: Configurar Frontend (5 min)

#### 3.1 Criar Arquivo de Variáveis de Ambiente

Baseado nos outputs do backend, crie/atualize `frontend/.env.production`:

```bash
# API Backend
NEXT_PUBLIC_API_URL=https://[SEU-API-GATEWAY-URL]

# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=[SEU-USER-POOL-ID]
NEXT_PUBLIC_COGNITO_CLIENT_ID=[SEU-CLIENT-ID]
NEXT_PUBLIC_AWS_REGION=us-east-1

# Ambiente
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_NAME=Alquimista.AI
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### 3.2 Atualizar API Client

Verifique se `frontend/src/lib/api-client.ts` está usando as variáveis corretas:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
```

---

### Fase 4: Deploy do Frontend (10-15 min)

#### Opção A: Deploy com Vercel (Recomendado)

```powershell
# Entrar no diretório do frontend
cd frontend

# Login no Vercel (primeira vez)
vercel login

# Deploy de produção
vercel --prod

# Voltar para raiz
cd ..
```

#### Opção B: Deploy com AWS Amplify

```powershell
# Instalar Amplify CLI
npm install -g @aws-amplify/cli

# Configurar Amplify
cd frontend
amplify init

# Deploy
amplify publish

cd ..
```

#### Opção C: Deploy Manual S3 + CloudFront

```powershell
cd frontend

# Build do Next.js
npm run build

# Deploy para S3 (será criado via CDK)
# O CloudFront já está configurado na FibonacciStack

cd ..
```

---

### Fase 5: Validação e Testes (5-10 min)

#### 5.1 Testar Backend

```powershell
# Testar endpoint de health
$API_URL = "https://c5loeivg0k.execute-api.us-east-1.amazonaws.com"
curl "$API_URL/health"

# Deve retornar: {"ok":true,"service":"Fibonacci Orquestrador",...}
```

#### 5.2 Testar Frontend

```powershell
# Abrir frontend no navegador
# Vercel: https://[seu-app].vercel.app
# Amplify: https://[branch].[app-id].amplifyapp.com
# CloudFront: https://[distribution-id].cloudfront.net

# Testar páginas:
# - Home: /
# - Login: /login
# - Dashboard: /dashboard
# - Agents: /agents
```

#### 5.3 Testar Integração

1. **Login**:
   - Acesse `/login`
   - Crie uma conta ou faça login
   - Verifique se o token é salvo

2. **Dashboard**:
   - Acesse `/dashboard`
   - Verifique se as métricas carregam
   - Verifique se os agentes aparecem

3. **Agents**:
   - Acesse `/agents`
   - Tente ativar um agente
   - Verifique se a configuração funciona

4. **API Calls**:
   - Abra DevTools (F12)
   - Vá para Network
   - Verifique se as chamadas para API estão funcionando
   - Verifique se não há erros CORS

---

## 🔧 Scripts Automatizados

### Script de Deploy Completo

Crie `DEPLOY-FULL-SYSTEM.ps1`:

```powershell
#!/usr/bin/env pwsh

Write-Host "🚀 Deploy Completo - Alquimista.AI" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Fase 1: Backend
Write-Host "📦 Fase 1: Deploy do Backend..." -ForegroundColor Yellow
npm run build
npx cdk deploy FibonacciStack-dev --require-approval never
npx cdk deploy NigredoStack-dev --require-approval never
npx cdk deploy AlquimistaStack-dev --require-approval never

# Capturar outputs
Write-Host "📋 Capturando outputs..." -ForegroundColor Yellow
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs" > backend-outputs-dev.json

# Fase 2: Frontend
Write-Host "🎨 Fase 2: Deploy do Frontend..." -ForegroundColor Yellow
cd frontend
npm run build
vercel --prod
cd ..

# Fase 3: Validação
Write-Host "✅ Fase 3: Validação..." -ForegroundColor Yellow
.\VALIDAR-DEPLOY.ps1

Write-Host ""
Write-Host "✅ Deploy Completo!" -ForegroundColor Green
Write-Host ""
```

---

## 📊 Checklist de Validação

### Backend
- [ ] Stack FibonacciStack-dev deployada
- [ ] Stack NigredoStack-dev deployada
- [ ] Stack AlquimistaStack-dev deployada
- [ ] API Gateway respondendo
- [ ] Lambda functions criadas
- [ ] Aurora conectado
- [ ] Cognito configurado

### Frontend
- [ ] Build sem erros
- [ ] Deploy concluído
- [ ] Variáveis de ambiente configuradas
- [ ] Páginas carregando
- [ ] Assets (CSS, JS) carregando

### Integração
- [ ] Login funcionando
- [ ] API calls sem erro CORS
- [ ] Tokens sendo salvos
- [ ] Dashboard carregando dados
- [ ] Agentes listando
- [ ] Configurações salvando

---

## 🐛 Troubleshooting

### Erro: "Stack in ROLLBACK_COMPLETE"

```powershell
# Deletar stack com falha
aws cloudformation delete-stack --stack-name FibonacciStack-dev
aws cloudformation wait stack-delete-complete --stack-name FibonacciStack-dev

# Tentar novamente
npx cdk deploy FibonacciStack-dev
```

### Erro: "CORS blocked"

Verifique se o API Gateway tem CORS configurado:

```typescript
// Em lib/fibonacci-stack.ts
const api = new apigateway.HttpApi(this, 'FibonacciApi', {
  corsPreflight: {
    allowOrigins: ['*'], // ou ['https://seu-dominio.com']
    allowMethods: [apigateway.CorsHttpMethod.ANY],
    allowHeaders: ['*'],
  },
});
```

### Erro: "Environment variables not found"

Verifique se `frontend/.env.production` existe e tem as variáveis corretas.

### Frontend não conecta ao backend

1. Verifique a URL da API em `.env.production`
2. Teste a API diretamente: `curl https://[API-URL]/health`
3. Verifique CORS no API Gateway
4. Verifique logs do CloudWatch

---

## 📈 Monitoramento

### CloudWatch Logs

```powershell
# Ver logs da Lambda principal
aws logs tail /aws/lambda/FibonacciStack-dev-ApiHandler --follow

# Ver logs de um agente específico
aws logs tail /aws/lambda/NigredoStack-dev-RecebimentoAgent --follow
```

### CloudWatch Dashboards

Acesse: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:

- Fibonacci-Core-Dashboard
- Nigredo-Agents-Dashboard
- Business-Metrics-Dashboard

---

## 🎉 Próximos Passos

Após deploy completo:

1. **Configurar Domínio Customizado**
   - Registrar domínio
   - Configurar Route 53
   - Adicionar certificado SSL

2. **Configurar CI/CD**
   - GitHub Actions para deploy automático
   - Testes automatizados
   - Deploy em staging antes de prod

3. **Melhorias de Segurança**
   - WAF no CloudFront
   - Rate limiting
   - Secrets rotation

4. **Observabilidade**
   - Alarmes do CloudWatch
   - Notificações SNS
   - Dashboards customizados

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique [TROUBLESHOOTING.md](./docs/deploy/TROUBLESHOOTING.md)
2. Veja os logs: `aws logs tail /aws/lambda/[FUNCTION-NAME] --follow`
3. Use validação: `.\VALIDAR-DEPLOY.ps1`

---

**Última atualização**: 15 de Novembro de 2025  
**Status**: Pronto para deploy  
**Tempo estimado**: 35-50 minutos


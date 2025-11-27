# 🚀 Deploy Completo - Frontend + Backend

## Guia Passo a Passo para Deploy Completo do Ecossistema Alquimista.AI

---

## 📋 Pré-requisitos

- [x] AWS CLI configurado com credenciais válidas
- [x] Node.js 18+ instalado
- [x] Conta AWS com permissões adequadas
- [x] Código compilado sem erros

---

## 🔧 Parte 1: Deploy do Backend (AWS CDK)

### Passo 1: Preparar o Ambiente

```powershell
# Verificar credenciais AWS
aws sts get-caller-identity

# Instalar dependências (se necessário)
npm install
```

### Passo 2: Build e Validação

```powershell
# Compilar TypeScript
npm run build

# Validar sintaxe CDK
npx cdk synth --context env=dev
```

### Passo 3: Deploy do Backend

```powershell
# Deploy com aprovação automática
npx cdk deploy FibonacciStack-dev --require-approval never --context env=dev

# OU com aprovação manual (mais seguro)
npm run deploy:dev
# Quando aparecer "Do you wish to deploy these changes (y/n)?", digite: y
```

**Tempo estimado**: 15-25 minutos

### Passo 4: Capturar Outputs do Backend

Após o deploy, salve os outputs importantes:

```powershell
# Listar todos os outputs
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs" --output table

# Salvar em arquivo
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs" > backend-outputs.json
```

**Outputs importantes**:
- `ApiEndpoint` - URL da API Gateway
- `UserPoolId` - ID do Cognito User Pool
- `UserPoolClientId` - ID do Client do Cognito
- `DatabaseEndpoint` - Endpoint do Aurora
- `CloudFrontUrl` - URL do CloudFront

---

## 🎨 Parte 2: Deploy do Frontend (Vercel)

### Passo 1: Configurar Variáveis de Ambiente

Crie o arquivo `frontend/.env.production`:

```bash
# API Backend
NEXT_PUBLIC_API_URL=https://[SEU-API-GATEWAY-URL]

# AWS Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=[SEU-USER-POOL-ID]
NEXT_PUBLIC_COGNITO_CLIENT_ID=[SEU-CLIENT-ID]
NEXT_PUBLIC_AWS_REGION=us-east-1

# CloudFront (opcional)
NEXT_PUBLIC_CDN_URL=https://[SEU-CLOUDFRONT-URL]

# Ambiente
NEXT_PUBLIC_ENV=production
```

### Passo 2: Build Local (Teste)

```powershell
cd frontend

# Instalar dependências
npm install

# Build de produção
npm run build

# Testar localmente
npm start
```

### Passo 3: Deploy no Vercel

#### Opção A: Via CLI

```powershell
# Instalar Vercel CLI (se necessário)
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### Opção B: Via GitHub + Vercel

1. **Push para GitHub**:
```powershell
git add .
git commit -m "feat: deploy production ready"
git push origin main
```

2. **Conectar no Vercel**:
   - Acesse https://vercel.com
   - Clique em "Import Project"
   - Selecione seu repositório
   - Configure as variáveis de ambiente
   - Clique em "Deploy"

### Passo 4: Configurar Variáveis no Vercel

No dashboard do Vercel:
1. Vá em **Settings** > **Environment Variables**
2. Adicione todas as variáveis do `.env.production`
3. Clique em **Save**
4. Faça um novo deploy

---

## ✅ Parte 3: Validação Pós-Deploy

### Backend

```powershell
# Testar API Gateway
curl https://[SEU-API-GATEWAY-URL]/health

# Verificar Lambdas
aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'FibonacciStack')].FunctionName"

# Verificar Aurora
aws rds describe-db-clusters --query "DBClusters[?DBClusterIdentifier=='fibonacci-cluster-dev']"
```

### Frontend

```powershell
# Testar URL do Vercel
curl https://[SEU-APP].vercel.app

# Verificar build
vercel logs [deployment-url]
```

### Integração

1. Acesse o frontend: `https://[SEU-APP].vercel.app`
2. Tente fazer login
3. Verifique se as chamadas à API funcionam
4. Teste criação de agentes

---

## 🔄 Comandos Rápidos

### Backend

```powershell
# Deploy rápido dev
npm run deploy:dev

# Ver diferenças antes do deploy
npm run diff

# Destruir stack (cuidado!)
npm run destroy
```

### Frontend

```powershell
# Deploy rápido Vercel
cd frontend && vercel --prod

# Ver logs
vercel logs --follow

# Rollback
vercel rollback
```

---

## 🐛 Troubleshooting

### Erro: "Stack in UPDATE_ROLLBACK_COMPLETE"

```powershell
# Deletar stack e recriar
aws cloudformation delete-stack --stack-name FibonacciStack-dev
# Aguardar 2-3 minutos
npm run deploy:dev
```

### Erro: "Bucket already exists"

```powershell
# Deletar bucket manualmente
aws s3 rb s3://fibonacci-stack-versions-dev-[ACCOUNT-ID] --force
```

### Frontend não conecta ao Backend

1. Verifique as variáveis de ambiente no Vercel
2. Confirme que a API está acessível publicamente
3. Verifique CORS na API Gateway
4. Teste a API diretamente com curl

---

## 📊 Monitoramento

### CloudWatch Dashboards

```powershell
# Abrir dashboard
aws cloudwatch get-dashboard --dashboard-name FibonacciCoreDashboard-dev
```

### Logs

```powershell
# Ver logs das Lambdas
aws logs tail /aws/lambda/FibonacciStack-dev-ApiHandler --follow

# Ver logs do CloudTrail
aws logs tail /aws/cloudtrail/fibonacci-dev --follow
```

### Alarmes

```powershell
# Listar alarmes ativos
npm run alarms:list

# Configurar notificações
npm run alarms:configure:dev
```

---

## 🎯 Checklist Final

### Backend ✅
- [ ] Stack deployado com sucesso
- [ ] API Gateway respondendo
- [ ] Lambdas funcionando
- [ ] Aurora acessível
- [ ] CloudWatch configurado
- [ ] Alarmes ativos

### Frontend ✅
- [ ] Build sem erros
- [ ] Deploy no Vercel concluído
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio customizado (opcional)
- [ ] SSL ativo

### Integração ✅
- [ ] Login funcionando
- [ ] API respondendo
- [ ] Dados sendo salvos
- [ ] Agentes criados com sucesso

---

## 📞 Próximos Passos

1. **Configurar Domínio Customizado** (opcional)
2. **Configurar CI/CD** com GitHub Actions
3. **Adicionar Monitoramento** com Sentry/DataDog
4. **Configurar Backups** automáticos
5. **Documentar APIs** com Swagger

---

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs no CloudWatch
2. Consulte `DEPLOY-SOLUTION.md` para problemas comuns
3. Revise a documentação em `docs/`

**Tempo total estimado**: 30-40 minutos

# 🚀 DEPLOY IMEDIATO - SISTEMA ALQUIMISTA.AI

**Status:** Sistema pronto para deploy  
**Tempo estimado:** 30-45 minutos

---

## ✅ SISTEMA VALIDADO

O sistema está completo com:
- ✅ 32 Agentes IA catalogados
- ✅ 7 SubNúcleos Fibonacci estruturados
- ✅ 4 Planos de assinatura configurados
- ✅ Acessos CEO e Master criados
- ✅ Backend completo (50+ handlers)
- ✅ Frontend completo (30+ páginas)
- ✅ Documentação completa

---

## 📋 PRÉ-REQUISITOS

Antes de começar, certifique-se de ter:

1. **AWS CLI configurado**
   ```powershell
   aws configure
   # Insira suas credenciais AWS
   ```

2. **Node.js 20+ instalado**
   ```powershell
   node --version
   # Deve mostrar v20.x.x ou superior
   ```

3. **PostgreSQL client instalado**
   ```powershell
   psql --version
   ```

4. **CDK instalado globalmente**
   ```powershell
   npm install -g aws-cdk
   cdk --version
   ```

---

## 🚀 PASSO 1: PREPARAR AMBIENTE (5 min)

### 1.1 Configurar Variáveis de Ambiente

```powershell
# Definir região AWS
$env:AWS_REGION = "us-east-1"
$env:AWS_PROFILE = "default"

# Verificar
Write-Host "AWS Region: $env:AWS_REGION"
Write-Host "AWS Profile: $env:AWS_PROFILE"
```

### 1.2 Instalar Dependências

```powershell
# Instalar dependências do projeto
npm install

# Verificar instalação
npm list --depth=0
```

---

## 🗄️ PASSO 2: DEPLOY BANCO DE DADOS (10 min)

### 2.1 Obter Endpoint do RDS

Se você já tem um RDS criado:
```powershell
# Listar instâncias RDS
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,Endpoint.Address]' --output table
```

Se não tem, o CDK criará um para você no próximo passo.

### 2.2 Executar Migrations (após RDS estar disponível)

```powershell
# Definir variáveis
$RDS_ENDPOINT = "<seu-rds-endpoint>.us-east-1.rds.amazonaws.com"
$RDS_USER = "postgres"
$RDS_DATABASE = "alquimista"

# Executar migrations em ordem
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -f database/migrations/001_create_schemas.sql
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -f database/migrations/002_create_leads_tables.sql
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -f database/migrations/003_create_platform_tables.sql
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -f database/migrations/004_create_core_tables.sql
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -f database/migrations/005_create_approval_tables.sql
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -f database/migrations/006_add_lgpd_consent.sql
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -f database/migrations/007_create_nigredo_schema.sql
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -f database/migrations/008_create_billing_tables.sql
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -f database/migrations/009_create_subscription_tables.sql
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -f database/migrations/010_create_plans_structure.sql
```

### 2.3 Executar Seeds

```powershell
# Executar seeds em ordem
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -f database/seeds/001_production_data.template.sql
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -f database/seeds/002_default_permissions.sql
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -f database/seeds/003_internal_account.sql
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -f database/seeds/004_subscription_test_data.sql
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -f database/seeds/005_agents_32_complete.sql
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -f database/seeds/006_subnucleos_and_plans.sql
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -f database/seeds/007_ceo_admin_access.sql
```

### 2.4 Verificar Dados

```powershell
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -c "
SELECT 
  (SELECT COUNT(*) FROM alquimista_platform.agents) as agents,
  (SELECT COUNT(*) FROM subnucleos) as subnucleos,
  (SELECT COUNT(*) FROM subscription_plans) as plans,
  (SELECT COUNT(*) FROM alquimista_platform.users) as users;
"
```

**Resultado esperado:**
```
 agents | subnucleos | plans | users 
--------+------------+-------+-------
     32 |          7 |     4 |     2
```

---

## ☁️ PASSO 3: DEPLOY BACKEND CDK (15 min)

### 3.1 Compilar TypeScript

```powershell
# Compilar código
npm run build

# Se houver erros, tente:
npm run build -- --force
```

### 3.2 Bootstrap CDK (primeira vez apenas)

```powershell
# Bootstrap CDK na região
cdk bootstrap aws://ACCOUNT-ID/us-east-1 --context env=prod

# Ou deixar o CDK detectar automaticamente
cdk bootstrap --context env=prod
```

### 3.3 Listar Stacks

```powershell
# Ver stacks disponíveis
cdk list --context env=prod
```

### 3.4 Deploy dos Stacks

**Opção A: Deploy de todos os stacks de uma vez**
```powershell
cdk deploy --all --context env=prod --require-approval never --outputs-file cdk-outputs.json
```

**Opção B: Deploy individual (recomendado)**
```powershell
# Nota: Cognito User Pool está integrado ao FibonacciStack

# 1. Fibonacci (orquestrador + Cognito)
cdk deploy FibonacciStack --context env=prod --outputs-file cdk-outputs-fibonacci.json

# 2. Alquimista (plataforma principal)
cdk deploy AlquimistaStack --context env=prod --outputs-file cdk-outputs-alquimista.json

# 3. Nigredo (prospecção)
cdk deploy NigredoStack --context env=prod --outputs-file cdk-outputs-nigredo.json

# 4. Nigredo Frontend
cdk deploy NigredoFrontendStack --context env=prod --outputs-file cdk-outputs-nigredo-frontend.json
```

### 3.5 Anotar Outputs Importantes

```powershell
# Ver todos os outputs
Get-Content cdk-outputs.json | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Anotar:
# - API Gateway URL
# - Cognito User Pool ID
# - Cognito Client ID
# - Cognito Domain
# - CloudFront Distribution ID
```

---

## 🎨 PASSO 4: DEPLOY FRONTEND (10 min)

### 4.1 Configurar Variáveis de Ambiente

```powershell
cd frontend

# Criar arquivo .env.production
@"
NEXT_PUBLIC_API_BASE_URL=https://<api-gateway-id>.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<user-pool-id>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<client-id>
NEXT_PUBLIC_COGNITO_DOMAIN=<cognito-domain>.auth.us-east-1.amazoncognito.com
"@ | Out-File -FilePath .env.production -Encoding UTF8
```

### 4.2 Instalar Dependências

```powershell
npm install
```

### 4.3 Build de Produção

```powershell
npm run build
```

### 4.4 Deploy para S3

```powershell
# Se você tem um script de deploy
npm run deploy

# Ou manualmente
aws s3 sync out/ s3://<bucket-name>/ --delete
```

---

## 👥 PASSO 5: CRIAR USUÁRIOS NO COGNITO (5 min)

### 5.1 Obter User Pool ID

```powershell
# Cognito User Pool está no FibonacciStack
$USER_POOL_ID = (Get-Content cdk-outputs-fibonacci.json | ConvertFrom-Json).'FibonacciStack-prod'.UserPoolId
Write-Host "User Pool ID: $USER_POOL_ID"
```

### 5.2 Criar Usuário CEO

```powershell
# Criar usuário
aws cognito-idp admin-create-user `
  --user-pool-id $USER_POOL_ID `
  --username jmrhollanda@gmail.com `
  --user-attributes `
    Name=email,Value=jmrhollanda@gmail.com `
    Name=name,Value="José Marcello Rocha Hollanda" `
    Name=phone_number,Value="+5584997084444" `
    Name=custom:role,Value="CEO_ADMIN" `
    Name=custom:tenant_id,Value="00000000-0000-0000-0000-000000000001" `
  --temporary-password "TempPass123!" `
  --message-action SUPPRESS

# Definir senha permanente
$SENHA_CEO = Read-Host "Digite a senha permanente para o CEO" -AsSecureString
$SENHA_CEO_TEXT = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SENHA_CEO))

aws cognito-idp admin-set-user-password `
  --user-pool-id $USER_POOL_ID `
  --username jmrhollanda@gmail.com `
  --password $SENHA_CEO_TEXT `
  --permanent
```

### 5.3 Criar Usuário Master

```powershell
# Criar usuário
aws cognito-idp admin-create-user `
  --user-pool-id $USER_POOL_ID `
  --username alquimistafibonacci@gmail.com `
  --user-attributes `
    Name=email,Value=alquimistafibonacci@gmail.com `
    Name=name,Value="AlquimistaAI Master" `
    Name=phone_number,Value="+5584997084444" `
    Name=custom:role,Value="MASTER" `
    Name=custom:tenant_id,Value="00000000-0000-0000-0000-000000000001" `
  --temporary-password "TempPass123!" `
  --message-action SUPPRESS

# Definir senha permanente
$SENHA_MASTER = Read-Host "Digite a senha permanente para o Master" -AsSecureString
$SENHA_MASTER_TEXT = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SENHA_MASTER))

aws cognito-idp admin-set-user-password `
  --user-pool-id $USER_POOL_ID `
  --username alquimistafibonacci@gmail.com `
  --password $SENHA_MASTER_TEXT `
  --permanent
```

---

## ✅ PASSO 6: VALIDAR DEPLOY (5 min)

### 6.1 Testar API

```powershell
$API_URL = (Get-Content cdk-outputs-alquimista.json | ConvertFrom-Json).AlquimistaStack.ApiUrl

# Testar health
Invoke-WebRequest -Uri "$API_URL/health"

# Testar endpoints
Invoke-WebRequest -Uri "$API_URL/api/agents"
Invoke-WebRequest -Uri "$API_URL/api/billing/plans"
Invoke-WebRequest -Uri "$API_URL/api/billing/subnucleos"
```

### 6.2 Testar Frontend

```powershell
$FRONTEND_URL = (Get-Content cdk-outputs-nigredo-frontend.json | ConvertFrom-Json).NigredoFrontendStack.CloudFrontUrl

# Abrir no navegador
Start-Process $FRONTEND_URL
```

### 6.3 Testar Login

1. Acesse `$FRONTEND_URL/auth/login`
2. Faça login com:
   - Email: `jmrhollanda@gmail.com`
   - Senha: `<senha-que-você-definiu>`
3. Verifique se o dashboard carrega

### 6.4 Testar Fluxo de Assinatura

1. Acesse `/billing/plans`
2. Selecione plano "Profissional"
3. Selecione 2 SubNúcleos
4. Confirme seleção
5. Verifique se a assinatura foi criada

---

## 🎉 DEPLOY CONCLUÍDO!

Se todos os passos foram executados com sucesso, seu sistema está no ar!

### Próximos Passos

1. **Configurar Domínio Customizado**
   - Registrar domínio no Route 53
   - Configurar certificado SSL
   - Apontar DNS para CloudFront

2. **Configurar Backup Automático**
   - Habilitar snapshots automáticos do RDS
   - Configurar retenção de backups

3. **Configurar Alertas**
   - Criar alarmes CloudWatch
   - Configurar notificações SNS
   - Integrar com Slack/Email

4. **Monitorar Sistema**
   - Acessar CloudWatch Dashboards
   - Verificar logs das Lambdas
   - Monitorar métricas de negócio

---

## 🆘 PROBLEMAS COMUNS

### Erro: "Stack already exists"
```powershell
# Atualizar stack existente
cdk deploy <StackName> --context env=prod
```

### Erro: "Insufficient permissions"
```powershell
# Verificar permissões IAM
aws sts get-caller-identity
```

### Erro: "Database connection failed"
```powershell
# Verificar security groups
aws ec2 describe-security-groups --group-ids <security-group-id>
```

### Erro: "Frontend não carrega"
```powershell
# Invalidar cache CloudFront
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

---

## 📞 SUPORTE

### Contatos
- **CEO:** jmrhollanda@gmail.com | +55 84 99708-4444
- **Master:** alquimistafibonacci@gmail.com | +55 84 99708-4444

### Documentação
- [SISTEMA-PRONTO-DEPLOY.md](./SISTEMA-PRONTO-DEPLOY.md) - Documentação completa
- [GUIA-DEPLOY-RAPIDO.md](./GUIA-DEPLOY-RAPIDO.md) - Guia detalhado
- [COMANDOS-DEPLOY.md](./COMANDOS-DEPLOY.md) - Comandos de referência

---

**Sistema AlquimistaAI - Pronto para Produção**  
**Data:** 17 de Janeiro de 2025

# 🚀 COMANDOS DE DEPLOY - COPIAR E COLAR

**Sistema:** AlquimistaAI  
**Ambiente:** Produção  
**Data:** 17 de Janeiro de 2025

---

## ⚡ DEPLOY RÁPIDO (Copiar e Colar)

### 1. Validar Sistema

```powershell
# Windows PowerShell
.\scripts\validate-system-complete.ps1
```

```bash
# Linux/Mac
chmod +x scripts/validate-system-complete.ps1
./scripts/validate-system-complete.ps1
```

---

### 2. Configurar Variáveis de Ambiente

```bash
# Configurar AWS
export AWS_REGION=us-east-1
export AWS_PROFILE=default

# Configurar RDS
export RDS_ENDPOINT="<seu-rds-endpoint>.us-east-1.rds.amazonaws.com"
export RDS_DATABASE="alquimista"
export RDS_USER="postgres"
export RDS_PASSWORD="<sua-senha-segura>"

# Verificar
echo "AWS Region: $AWS_REGION"
echo "RDS Endpoint: $RDS_ENDPOINT"
```

---

### 3. Deploy Banco de Dados

```bash
# Executar todas as migrations em ordem
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE << 'EOF'
\i database/migrations/001_initial_schema.sql
\i database/migrations/002_tenants_users.sql
\i database/migrations/003_agents_platform.sql
\i database/migrations/004_fibonacci_core.sql
\i database/migrations/005_create_approval_tables.sql
\i database/migrations/006_add_lgpd_consent.sql
\i database/migrations/007_create_nigredo_schema.sql
\i database/migrations/008_create_billing_tables.sql
\i database/migrations/009_create_subscription_tables.sql
\i database/migrations/010_create_plans_structure.sql
EOF

# Executar todos os seeds em ordem
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE << 'EOF'
\i database/seeds/001_production_data.template.sql
\i database/seeds/002_default_permissions.sql
\i database/seeds/003_internal_account.sql
\i database/seeds/004_subscription_test_data.sql
\i database/seeds/005_agents_32_complete.sql
\i database/seeds/006_subnucleos_and_plans.sql
\i database/seeds/007_ceo_admin_access.sql
EOF

# Verificar dados
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

### 4. Deploy Backend (CDK)

```bash
# Instalar dependências
npm install

# Compilar TypeScript
npm run build

# Verificar stacks
cdk list --context env=prod

# Deploy de todos os stacks
cdk deploy --all \
  --context env=prod \
  --require-approval never \
  --outputs-file cdk-outputs.json

# Ou deploy individual (recomendado)
# Nota: Cognito User Pool está integrado ao FibonacciStack
cdk deploy FibonacciStack --context env=prod --outputs-file cdk-outputs-fibonacci.json
cdk deploy AlquimistaStack --context env=prod --outputs-file cdk-outputs-alquimista.json
cdk deploy NigredoStack --context env=prod --outputs-file cdk-outputs-nigredo.json
cdk deploy NigredoFrontendStack --context env=prod --outputs-file cdk-outputs-nigredo-frontend.json

# Ver outputs
cat cdk-outputs.json | jq '.'
```

**Anotar outputs importantes:**
- API Gateway URL
- Cognito User Pool ID
- Cognito Client ID
- Cognito Domain
- CloudFront Distribution ID

---

### 5. Configurar Frontend

```bash
cd frontend

# Criar arquivo .env.production
cat > .env.production << 'EOF'
NEXT_PUBLIC_API_BASE_URL=https://<api-gateway-id>.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<user-pool-id>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<client-id>
NEXT_PUBLIC_COGNITO_DOMAIN=<cognito-domain>.auth.us-east-1.amazoncognito.com
EOF

# Instalar dependências
npm install

# Build de produção
npm run build

# Deploy para S3 + CloudFront
npm run deploy

# Ou usar script
.\deploy-frontend.ps1
```

---

### 6. Criar Usuários no Cognito

```bash
# Obter User Pool ID dos outputs (Cognito está no FibonacciStack)
USER_POOL_ID=$(cat ../cdk-outputs-fibonacci.json | jq -r '.FibonacciStack-prod.UserPoolId')

# Criar usuário CEO
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username jmrhollanda@gmail.com \
  --user-attributes \
    Name=email,Value=jmrhollanda@gmail.com \
    Name=name,Value="José Marcello Rocha Hollanda" \
    Name=phone_number,Value="+5584997084444" \
    Name=custom:role,Value="CEO_ADMIN" \
    Name=custom:tenant_id,Value="00000000-0000-0000-0000-000000000001" \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS

# Definir senha permanente CEO
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username jmrhollanda@gmail.com \
  --password "<SENHA-SEGURA-CEO>" \
  --permanent

# Criar usuário Master
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username alquimistafibonacci@gmail.com \
  --user-attributes \
    Name=email,Value=alquimistafibonacci@gmail.com \
    Name=name,Value="AlquimistaAI Master" \
    Name=phone_number,Value="+5584997084444" \
    Name=custom:role,Value="MASTER" \
    Name=custom:tenant_id,Value="00000000-0000-0000-0000-000000000001" \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS

# Definir senha permanente Master
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username alquimistafibonacci@gmail.com \
  --password "<SENHA-SEGURA-MASTER>" \
  --permanent

# Verificar usuários criados
aws cognito-idp list-users --user-pool-id $USER_POOL_ID
```

---

### 7. Validar Deploy

```bash
# Obter URLs dos outputs
API_URL=$(cat cdk-outputs-alquimista.json | jq -r '.AlquimistaStack.ApiUrl')
FRONTEND_URL=$(cat cdk-outputs-nigredo-frontend.json | jq -r '.NigredoFrontendStack.CloudFrontUrl')

# Testar API
curl $API_URL/health
curl $API_URL/api/agents
curl $API_URL/api/billing/plans
curl $API_URL/api/billing/subnucleos

# Testar Frontend
curl $FRONTEND_URL

# Executar validação completa
cd ..
.\VALIDAR-DEPLOY.ps1
```

---

## 🧪 TESTES PÓS-DEPLOY

### Teste 1: Login CEO

```bash
# Acessar frontend
echo "Acesse: $FRONTEND_URL/auth/login"
echo "Email: jmrhollanda@gmail.com"
echo "Senha: <SENHA-SEGURA-CEO>"
```

### Teste 2: Verificar Dados

```bash
# Verificar agentes
curl $API_URL/api/agents | jq '.agents | length'
# Esperado: 32

# Verificar planos
curl $API_URL/api/billing/plans | jq '.plans | length'
# Esperado: 4

# Verificar SubNúcleos
curl $API_URL/api/billing/subnucleos | jq '.subnucleos | length'
# Esperado: 7
```

### Teste 3: Fluxo de Assinatura

1. Login como CEO
2. Acessar `/billing/plans`
3. Selecionar plano "Profissional"
4. Selecionar 2 SubNúcleos
5. Confirmar seleção
6. Verificar dashboard

---

## 🔧 COMANDOS ÚTEIS

### Ver Logs Lambda

```bash
# Listar funções
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `alquimista`)].FunctionName'

# Ver logs de uma função
aws logs tail /aws/lambda/<function-name> --follow

# Ver logs com filtro
aws logs tail /aws/lambda/<function-name> --filter-pattern "ERROR" --follow
```

### Invalidar Cache CloudFront

```bash
# Obter Distribution ID
DISTRIBUTION_ID=$(cat cdk-outputs-nigredo-frontend.json | jq -r '.NigredoFrontendStack.DistributionId')

# Invalidar cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

### Verificar RDS

```bash
# Testar conexão
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -c "SELECT version();"

# Ver tabelas
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -c "\dt alquimista_platform.*"

# Ver dados
psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -c "
SELECT 
  'Agents' as table_name, COUNT(*) as count FROM alquimista_platform.agents
UNION ALL
SELECT 'SubNúcleos', COUNT(*) FROM subnucleos
UNION ALL
SELECT 'Plans', COUNT(*) FROM subscription_plans
UNION ALL
SELECT 'Users', COUNT(*) FROM alquimista_platform.users;
"
```

### Monitorar Recursos

```bash
# Ver uso de Lambda
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=<function-name> \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# Ver uso de RDS
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=<instance-id> \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

---

## 🆘 TROUBLESHOOTING RÁPIDO

### Problema: API não responde

```bash
# Verificar Lambda
aws lambda get-function --function-name <function-name>

# Testar Lambda diretamente
aws lambda invoke \
  --function-name <function-name> \
  --payload '{}' \
  response.json

cat response.json
```

### Problema: Frontend não carrega

```bash
# Verificar S3
aws s3 ls s3://<bucket-name>/

# Verificar CloudFront
aws cloudfront get-distribution --id $DISTRIBUTION_ID

# Invalidar cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

### Problema: Banco não conecta

```bash
# Verificar security groups
aws ec2 describe-security-groups --group-ids <security-group-id>

# Testar conexão
telnet $RDS_ENDPOINT 5432

# Ver logs RDS
aws rds describe-db-log-files --db-instance-identifier <instance-id>
```

---

## 📞 CONTATOS

### Emergência
- **CEO:** José Marcello Rocha Hollanda
  - Email: jmrhollanda@gmail.com
  - WhatsApp: +55 84 99708-4444

- **Master:** AlquimistaAI
  - Email: alquimistafibonacci@gmail.com
  - WhatsApp: +55 84 99708-4444

---

## ✅ CHECKLIST FINAL

Antes de considerar o deploy completo:

- [ ] Banco de dados com 32 agentes
- [ ] Banco de dados com 7 SubNúcleos
- [ ] Banco de dados com 4 planos
- [ ] Banco de dados com 2 usuários admin
- [ ] Backend deployado (todos os stacks)
- [ ] Frontend deployado (S3 + CloudFront)
- [ ] Cognito configurado com usuários
- [ ] API respondendo corretamente
- [ ] Frontend carregando
- [ ] Login funcionando
- [ ] Fluxo de assinatura testado
- [ ] Monitoramento ativo
- [ ] Alarmes configurados

---

**Sistema AlquimistaAI - Pronto para Produção**  
**Data:** 17 de Janeiro de 2025

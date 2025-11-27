# 🚀 GUIA DE DEPLOY RÁPIDO - ALQUIMISTA.AI

**Tempo estimado:** 30-45 minutos  
**Pré-requisitos:** AWS CLI configurado, Node.js 20+, PostgreSQL client

---

## ⚡ DEPLOY EM 5 PASSOS

### PASSO 1: Validar Sistema (2 min)

```powershell
# Executar validação completa
.\scripts\validate-system-complete.ps1
```

**Resultado esperado:** ✅ SISTEMA 100% COMPLETO

---

### PASSO 2: Configurar Banco de Dados (10 min)

```bash
# 1. Conectar ao RDS
export RDS_ENDPOINT="<seu-rds-endpoint>"
export RDS_PASSWORD="<sua-senha>"

# 2. Executar migrations (em ordem)
for i in {001..010}; do
  psql -h $RDS_ENDPOINT -U postgres -d alquimista \
    -f database/migrations/${i}_*.sql
done

# 3. Executar seeds (em ordem)
for i in {001..007}; do
  psql -h $RDS_ENDPOINT -U postgres -d alquimista \
    -f database/seeds/${i}_*.sql
done

# 4. Verificar
psql -h $RDS_ENDPOINT -U postgres -d alquimista -c "
  SELECT COUNT(*) as agents FROM alquimista_platform.agents;
  SELECT COUNT(*) as subnucleos FROM subnucleos;
  SELECT COUNT(*) as plans FROM subscription_plans;
  SELECT COUNT(*) as users FROM alquimista_platform.users;
"
```

**Resultado esperado:**
- 32 agentes
- 7 SubNúcleos
- 4 planos
- 2 usuários (CEO + Master)

---

### PASSO 3: Deploy Backend CDK (15 min)

```bash
# 1. Instalar dependências
npm install

# 2. Compilar TypeScript
npm run build

# 3. Configurar contexto
export AWS_REGION=us-east-1
export ENVIRONMENT=prod

# 4. Deploy de todos os stacks
cdk deploy --all \
  --context env=prod \
  --require-approval never

# Ou deploy individual (recomendado para primeira vez)
# Nota: Cognito User Pool está integrado ao FibonacciStack
cdk deploy FibonacciStack --context env=prod  # Inclui Cognito
cdk deploy AlquimistaStack --context env=prod
cdk deploy NigredoStack --context env=prod
cdk deploy NigredoFrontendStack --context env=prod
```

**Anotar outputs:**
- API Gateway URL
- Cognito User Pool ID
- Cognito Client ID
- CloudFront Distribution ID

---

### PASSO 4: Deploy Frontend (10 min)

```bash
# 1. Navegar para frontend
cd frontend

# 2. Configurar variáveis de ambiente
cat > .env.production << EOF
NEXT_PUBLIC_API_BASE_URL=https://<api-gateway-url>
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<user-pool-id>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<client-id>
NEXT_PUBLIC_COGNITO_DOMAIN=<cognito-domain>
EOF

# 3. Instalar dependências
npm install

# 4. Build de produção
npm run build

# 5. Deploy para S3 + CloudFront
npm run deploy

# Ou usar script PowerShell
.\deploy-frontend.ps1
```

---

### PASSO 5: Validar Deploy (5 min)

```bash
# 1. Testar API
curl https://<api-gateway-url>/health
curl https://<api-gateway-url>/api/agents
curl https://<api-gateway-url>/api/billing/plans

# 2. Testar Frontend
curl https://<cloudfront-url>

# 3. Executar validação completa
.\VALIDAR-DEPLOY.ps1
```

**Resultado esperado:**
- ✅ API respondendo
- ✅ Frontend carregando
- ✅ Autenticação funcionando
- ✅ Endpoints retornando dados

---

## 🔐 CONFIGURAR ACESSOS

### 1. Criar Usuário CEO no Cognito

```bash
aws cognito-idp admin-create-user \
  --user-pool-id <user-pool-id> \
  --username jmrhollanda@gmail.com \
  --user-attributes \
    Name=email,Value=jmrhollanda@gmail.com \
    Name=name,Value="José Marcello Rocha Hollanda" \
    Name=phone_number,Value="+5584997084444" \
    Name=custom:role,Value="CEO_ADMIN" \
    Name=custom:tenant_id,Value="00000000-0000-0000-0000-000000000001" \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS

# Confirmar usuário
aws cognito-idp admin-set-user-password \
  --user-pool-id <user-pool-id> \
  --username jmrhollanda@gmail.com \
  --password "<senha-definitiva>" \
  --permanent
```

### 2. Criar Usuário Master no Cognito

```bash
aws cognito-idp admin-create-user \
  --user-pool-id <user-pool-id> \
  --username alquimistafibonacci@gmail.com \
  --user-attributes \
    Name=email,Value=alquimistafibonacci@gmail.com \
    Name=name,Value="AlquimistaAI Master" \
    Name=phone_number,Value="+5584997084444" \
    Name=custom:role,Value="MASTER" \
    Name=custom:tenant_id,Value="00000000-0000-0000-0000-000000000001" \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS

aws cognito-idp admin-set-user-password \
  --user-pool-id <user-pool-id> \
  --username alquimistafibonacci@gmail.com \
  --password "<senha-definitiva>" \
  --permanent
```

---

## 🧪 TESTES PÓS-DEPLOY

### 1. Testar Login

```bash
# Acessar frontend
https://<cloudfront-url>/auth/login

# Fazer login com:
# Email: jmrhollanda@gmail.com
# Senha: <senha-definitiva>
```

### 2. Testar Fluxo de Assinatura

1. Acessar `/billing/plans`
2. Selecionar plano "Profissional"
3. Selecionar 2 SubNúcleos
4. Confirmar seleção
5. Verificar dashboard

### 3. Testar APIs

```bash
# Obter token
TOKEN=$(curl -X POST https://<cognito-domain>/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=<client-id>" | jq -r '.access_token')

# Testar endpoints
curl -H "Authorization: Bearer $TOKEN" \
  https://<api-gateway-url>/api/agents

curl -H "Authorization: Bearer $TOKEN" \
  https://<api-gateway-url>/api/billing/plans

curl -H "Authorization: Bearer $TOKEN" \
  https://<api-gateway-url>/api/billing/subnucleos
```

---

## 📊 MONITORAMENTO

### CloudWatch Dashboards

Acessar AWS Console → CloudWatch → Dashboards:

1. **Fibonacci Core Dashboard**
   - Métricas de performance
   - Taxa de erro
   - Latência

2. **Nigredo Agents Dashboard**
   - Atividade de agentes
   - Leads processados
   - Conversões

3. **Business Metrics Dashboard**
   - Assinaturas ativas
   - Receita
   - Churn

### Alarmes

Verificar alarmes configurados:
- API Error Rate > 5%
- Lambda Duration > 3s
- RDS CPU > 80%
- CloudFront 5xx > 1%

---

## 🔧 TROUBLESHOOTING

### Problema: API não responde

```bash
# Verificar Lambda
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `alquimista`)].FunctionName'

# Ver logs
aws logs tail /aws/lambda/<function-name> --follow

# Testar Lambda diretamente
aws lambda invoke \
  --function-name <function-name> \
  --payload '{}' \
  response.json
```

### Problema: Frontend não carrega

```bash
# Verificar CloudFront
aws cloudfront get-distribution --id <distribution-id>

# Invalidar cache
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"

# Verificar S3
aws s3 ls s3://<bucket-name>/
```

### Problema: Banco de dados não conecta

```bash
# Testar conexão
psql -h <rds-endpoint> -U postgres -d alquimista -c "SELECT 1"

# Verificar security groups
aws ec2 describe-security-groups \
  --group-ids <security-group-id>

# Ver logs RDS
aws rds describe-db-log-files \
  --db-instance-identifier <instance-id>
```

---

## 📞 SUPORTE

### Contatos de Emergência

- **CEO:** José Marcello Rocha Hollanda
  - Email: jmrhollanda@gmail.com
  - WhatsApp: +55 84 99708-4444

- **Master:** AlquimistaAI
  - Email: alquimistafibonacci@gmail.com
  - WhatsApp: +55 84 99708-4444

### Documentação Adicional

- [SISTEMA-PRONTO-DEPLOY.md](./SISTEMA-PRONTO-DEPLOY.md) - Documentação completa
- [docs/deploy/README.md](./docs/deploy/README.md) - Guia de deploy detalhado
- [docs/deploy/TROUBLESHOOTING.md](./docs/deploy/TROUBLESHOOTING.md) - Solução de problemas

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
- [ ] Backup configurado
- [ ] DNS configurado (se aplicável)
- [ ] SSL configurado (se aplicável)

---

## 🎉 DEPLOY CONCLUÍDO!

Parabéns! O sistema AlquimistaAI está em produção.

**Próximos passos:**
1. Monitorar logs e métricas nas primeiras 24h
2. Testar todos os fluxos críticos
3. Treinar equipe
4. Documentar processos operacionais
5. Configurar backup automático
6. Planejar melhorias futuras

---

**Desenvolvido com ❤️ pela equipe AlquimistaAI**  
**Data:** 17 de Janeiro de 2025

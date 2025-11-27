# 🚀 Guia de Deploy em Produção - Alquimista.AI

## ⚠️ IMPORTANTE: Pré-requisitos

Antes de iniciar o deploy, certifique-se de que:

1. **AWS CLI configurado** com credenciais de produção
2. **Node.js 20.x** instalado
3. **Todas as dependências** instaladas (`npm install`)
4. **AWS CDK** bootstrapped na conta de produção
5. **Secrets configurados** no AWS Secrets Manager

## 📋 Checklist Rápido

```bash
# 1. Verificar ambiente
node -v  # Deve ser 20.x
aws --version
aws sts get-caller-identity  # Verificar conta AWS

# 2. Instalar dependências
npm install

# 3. Build do projeto
npm run build

# 4. Executar validação final
npm run validate:final
```

## 🎯 Deploy Passo a Passo

### Opção 1: Deploy Completo Automatizado (Recomendado)

```bash
# Este comando executa:
# - Validação final
# - Deploy de todas as stacks
# - Documentação dos outputs
npm run deploy:prod:complete
```

### Opção 2: Deploy Manual com Controle

```bash
# 1. Validar antes do deploy
npm run validate:final

# 2. Revisar mudanças
npm run diff -- --context env=prod

# 3. Deploy das stacks
npm run deploy:prod

# 4. Documentar outputs
npm run document:outputs:prod
```

### Opção 3: Deploy Individual por Stack

```bash
# Deploy apenas do Fibonacci (core)
cdk deploy FibonacciStack-prod --context env=prod

# Deploy apenas do Nigredo (agentes)
cdk deploy NigredoStack-prod --context env=prod

# Deploy apenas do Alquimista (plataforma)
cdk deploy AlquimistaStack-prod --context env=prod
```

## 🧪 Validação Pós-Deploy

### 1. Health Check da API

```bash
# Verificar se API está respondendo
curl -f https://api.alquimista.ai/health

# Deve retornar: {"ok": true}
```

### 2. Verificar Stacks

```bash
# Listar stacks deployadas
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
  --query 'StackSummaries[?contains(StackName, `prod`)].StackName'
```

### 3. Verificar Lambdas

```bash
# Listar funções Lambda
aws lambda list-functions \
  --query 'Functions[?contains(FunctionName, `prod`)].FunctionName'
```

### 4. Verificar Alarmes

```bash
# Verificar status dos alarmes
npm run alarms:list
```

### 5. Verificar Logs

```bash
# Ver logs da API principal
aws logs tail /aws/lambda/fibonacci-api-handler-prod --follow
```

## 🔄 Rollback (Se Necessário)

### Rollback Automático via Blue-Green

```bash
# Rollback da função principal
npm run blue-green-deploy fibonacci-api-handler-prod
```

### Rollback Manual via Versioning

```bash
# Listar versões disponíveis
npm run stack:version:list FibonacciStack prod

# Fazer rollback para versão anterior
npm run stack:version:rollback FibonacciStack prod <version-id>
```

### Rollback Completo via CloudFormation

```bash
# Rollback da stack inteira
aws cloudformation rollback-stack --stack-name FibonacciStack-prod
```

## 📊 Monitoramento Pós-Deploy

### CloudWatch Dashboards

Acesse os dashboards no console AWS:
- **Fibonacci Core**: Métricas de API, Lambda, EventBridge
- **Nigredo Agents**: Métricas dos agentes de prospecção
- **Business Metrics**: Funil de conversão, ROI, custos

### Alarmes Críticos

Verifique se os seguintes alarmes estão OK:
- `fibonacci-api-errors-prod` - Taxa de erro da API
- `fibonacci-api-latency-prod` - Latência da API
- `fibonacci-dlq-messages-prod` - Mensagens na DLQ
- `fibonacci-aurora-cpu-prod` - CPU do Aurora

### X-Ray Tracing

```bash
# Ver traces no X-Ray
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s)
```

## 🔒 Segurança Pós-Deploy

### Verificar Secrets

```bash
# Listar secrets
aws secretsmanager list-secrets \
  --query 'SecretList[?contains(Name, `fibonacci-prod`)].Name'
```

### Verificar Criptografia

```bash
# Verificar criptografia do Aurora
aws rds describe-db-clusters \
  --query 'DBClusters[?contains(DBClusterIdentifier, `fibonacci-prod`)].StorageEncrypted'
```

### Verificar CloudTrail

```bash
# Verificar se CloudTrail está ativo
aws cloudtrail get-trail-status --name fibonacci-prod-trail
```

## 📝 Documentação Pós-Deploy

### Outputs do CloudFormation

Os outputs importantes são salvos automaticamente em:
- `docs/deploy/outputs-prod.json`

### URLs Importantes

Após o deploy, você terá acesso a:
- **API Gateway**: `https://api.alquimista.ai`
- **CloudFront**: `https://alquimista.ai`
- **CloudWatch Dashboard**: Link nos outputs

### Credenciais

As credenciais estão armazenadas no AWS Secrets Manager:
- `fibonacci-prod-db-credentials` - Credenciais do Aurora
- `fibonacci-prod-whatsapp-api-key` - API key do WhatsApp
- `fibonacci-prod-google-calendar-credentials` - Credenciais do Google Calendar

## 🆘 Troubleshooting

### Erro: "Stack already exists"

```bash
# Atualizar stack existente
cdk deploy FibonacciStack-prod --context env=prod --force
```

### Erro: "Insufficient permissions"

```bash
# Verificar permissões IAM
aws sts get-caller-identity
aws iam get-user
```

### Erro: "Resource limit exceeded"

```bash
# Verificar limites da conta
aws service-quotas list-service-quotas --service-code lambda
```

### Lambda não está respondendo

```bash
# Ver logs de erro
aws logs tail /aws/lambda/<function-name> --follow --filter-pattern "ERROR"

# Verificar configuração
aws lambda get-function --function-name <function-name>
```

### Banco de dados não conecta

```bash
# Verificar status do cluster
aws rds describe-db-clusters \
  --db-cluster-identifier fibonacci-prod-cluster

# Verificar security groups
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=*fibonacci-prod*"
```

## 📞 Suporte

### Contatos de Emergência

- **Tech Lead**: tech-lead@alquimista.ai
- **DevOps**: devops@alquimista.ai
- **On-call**: +55 11 99999-9999

### Canais de Comunicação

- **Slack**: #alquimista-ai-incidents
- **Email**: incidents@alquimista.ai

## ✅ Checklist Final

Após o deploy, confirme:

- [ ] API respondendo ao health check
- [ ] Todas as stacks em estado `CREATE_COMPLETE` ou `UPDATE_COMPLETE`
- [ ] Funções Lambda deployadas e funcionando
- [ ] Banco de dados disponível
- [ ] Alarmes configurados e em estado OK
- [ ] Dashboards acessíveis
- [ ] Logs sendo gerados corretamente
- [ ] Backups configurados
- [ ] Documentação atualizada
- [ ] Equipe notificada

---

## 🎉 Deploy Bem-Sucedido!

Se todos os itens acima estão OK, seu deploy foi bem-sucedido! 

**Próximos passos:**
1. Monitorar métricas nas primeiras 24h
2. Executar smoke tests periódicos
3. Revisar logs para identificar possíveis problemas
4. Documentar qualquer issue encontrado

**Lembre-se:** Mantenha o monitoramento ativo e esteja preparado para rollback se necessário.

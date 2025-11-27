# Guia de Setup - Fibonacci AWS

Este guia vai te ajudar a configurar e fazer o deploy da infraestrutura Fibonacci na AWS.

## Pré-requisitos

- Node.js 18+ instalado
- AWS CLI instalado e configurado
- Conta AWS com permissões adequadas

## 1. Configurar AWS CLI

Suas credenciais já foram configuradas. Verifique se está tudo certo:

```bash
aws sts get-caller-identity
```

Você deve ver:
```json
{
    "UserId": "...",
    "Account": "207933152643",
    "Arn": "arn:aws:iam::207933152643:user/jose-marcello33"
}
```

## 2. Instalar Dependências

```bash
npm install
```

## 3. Bootstrap da Conta AWS (Primeira vez apenas)

O CDK precisa preparar sua conta AWS antes do primeiro deploy:

```bash
npm run bootstrap
```

Isso vai criar:
- Bucket S3 para armazenar templates do CloudFormation
- Roles IAM necessárias para o CDK
- Recursos de staging

## 4. Configurar Secrets (API Keys)

Antes de fazer o deploy, você precisa configurar as API keys no AWS Secrets Manager.

### 4.1 WhatsApp Business API

```bash
aws secretsmanager create-secret \
  --name fibonacci/mcp/whatsapp \
  --description "WhatsApp Business API credentials" \
  --secret-string '{"apiKey":"YOUR_WHATSAPP_API_KEY"}' \
  --region us-east-1
```

### 4.2 Google Places API

```bash
aws secretsmanager create-secret \
  --name fibonacci/mcp/enrichment \
  --description "Data enrichment API credentials" \
  --secret-string '{
    "googlePlacesApiKey": "YOUR_GOOGLE_PLACES_API_KEY",
    "linkedInClientId": "YOUR_LINKEDIN_CLIENT_ID",
    "linkedInClientSecret": "YOUR_LINKEDIN_CLIENT_SECRET",
    "linkedInAccessToken": "YOUR_LINKEDIN_ACCESS_TOKEN"
  }' \
  --region us-east-1
```

### 4.3 Google Calendar API

```bash
aws secretsmanager create-secret \
  --name fibonacci/mcp/calendar \
  --description "Google Calendar API credentials" \
  --secret-string '{
    "clientId": "YOUR_GOOGLE_CLIENT_ID",
    "clientSecret": "YOUR_GOOGLE_CLIENT_SECRET",
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }' \
  --region us-east-1
```

**Nota**: Se você não tiver todas as API keys agora, pode criar os secrets com valores vazios e atualizar depois:

```bash
aws secretsmanager create-secret \
  --name fibonacci/mcp/whatsapp \
  --secret-string '{"apiKey":""}' \
  --region us-east-1
```

## 5. Verificar Configuração

Antes de fazer o deploy, verifique o que será criado:

```bash
npm run synth
```

Isso vai gerar os templates do CloudFormation em `cdk.out/`.

Para ver as diferenças (se já tiver feito deploy antes):

```bash
npm run diff
```

## 6. Deploy em Desenvolvimento

```bash
npm run deploy:dev
```

Isso vai criar:
- **FibonacciStack-dev**: Infraestrutura core (VPC, Aurora, EventBridge)
- **NigredoStack-dev**: Agentes de prospecção
- **AlquimistaStack-dev**: Plataforma SaaS

O deploy pode levar **15-20 minutos** na primeira vez.

## 7. Verificar Deploy

Após o deploy, você verá os outputs no terminal:

```
Outputs:
FibonacciStack-dev.ApiEndpoint = https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
FibonacciStack-dev.DatabaseEndpoint = xxxxx.cluster-xxxxx.us-east-1.rds.amazonaws.com
...
```

Teste o endpoint:

```bash
curl https://YOUR_API_ENDPOINT/health
```

## 8. Configurar Banco de Dados

Após o deploy, execute as migrações:

```bash
npm run db:migrate
npm run db:seed
```

## 9. Monitoramento

Acesse o CloudWatch para ver:
- **Logs**: `/aws/lambda/FibonacciStack-dev-*`
- **Métricas**: Dashboard criado automaticamente
- **Alarmes**: Configurados para erros e latência

## 10. Custos Estimados

### Ambiente de Desenvolvimento (dev)
- **~$77/mês** com uso moderado
- Aurora Serverless: $45
- Lambda: $5
- API Gateway: $3.50
- Outros serviços: $23.50

### Dicas para Reduzir Custos
1. Destrua o ambiente dev quando não estiver usando:
   ```bash
   npm run destroy
   ```

2. Use Aurora Serverless v2 com min capacity 0.5 ACU

3. Configure log retention para 7 dias em dev

## Troubleshooting

### Erro: "Unable to resolve AWS account"

```bash
# Verifique suas credenciais
aws sts get-caller-identity

# Se necessário, reconfigure
aws configure
```

### Erro: "Stack already exists"

```bash
# Liste stacks existentes
aws cloudformation list-stacks --region us-east-1

# Destrua stack antiga se necessário
npm run destroy
```

### Erro: "Insufficient permissions"

Seu usuário precisa das seguintes permissões:
- CloudFormation (criar/atualizar stacks)
- IAM (criar roles)
- Lambda, API Gateway, RDS, VPC, etc.

Recomendação: `AdministratorAccess` para setup inicial.

### Erro: "Resource limit exceeded"

Alguns recursos AWS têm limites por conta:
- VPCs: 5 por região (default)
- Elastic IPs: 5 por região (default)

Solicite aumento via AWS Support se necessário.

## Próximos Passos

1. ✅ Deploy da infraestrutura
2. ⏳ Configurar API keys das integrações
3. ⏳ Testar endpoints da API
4. ⏳ Configurar domínio customizado (opcional)
5. ⏳ Configurar CI/CD (GitHub Actions)
6. ⏳ Deploy em staging/produção

## Comandos Úteis

```bash
# Ver logs em tempo real
aws logs tail /aws/lambda/FibonacciStack-dev-ApiHandler --follow

# Listar secrets
aws secretsmanager list-secrets --region us-east-1

# Atualizar secret
aws secretsmanager update-secret \
  --secret-id fibonacci/mcp/whatsapp \
  --secret-string '{"apiKey":"NEW_KEY"}' \
  --region us-east-1

# Ver custos
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

## Segurança

⚠️ **IMPORTANTE**:

1. **Nunca commite o arquivo `.env`** com credenciais reais
2. **Rotacione suas credenciais AWS** regularmente
3. **Use IAM roles** em produção ao invés de access keys
4. **Habilite MFA** na sua conta AWS
5. **Revise permissões IAM** e aplique princípio de menor privilégio

## Suporte

Se encontrar problemas:
1. Verifique os logs no CloudWatch
2. Consulte a documentação do CDK
3. Revise os requisitos no arquivo `requirements.md`

---

**Conta AWS**: 207933152643  
**Região**: us-east-1  
**Usuário**: jose-marcello33

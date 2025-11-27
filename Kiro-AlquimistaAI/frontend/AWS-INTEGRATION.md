# 🚀 Integração AWS - Alquimista.AI

## ✅ Status da Infraestrutura

### Ambientes Deployados

#### 🔵 DEV (Desenvolvimento)
- **API Gateway**: https://c5loeivg0k.execute-api.us-east-1.amazonaws.com/
- **ARN Rota**: arn:aws:apigateway:us-east-1::/apis/c5loeivg0k/routes/7szli6d
- **Aurora Cluster**: fibonacci-dev-aurora.cluster-csriwuis6v0w.us-east-1.rds.amazonaws.com
- **Secret ARN**: arn:aws:secretsmanager:us-east-1:207933152643:secret:/repo/github/alquimistaai-aws-architecture/fibonacci-dev/db/postgres-...
- **Status**: ✅ Conectado (db_status: "connected")

#### 🟢 PROD (Produção)
- **API Gateway**: https://ogsd1547nd.execute-api.us-east-1.amazonaws.com/
- **ARN Rota**: arn:aws:apigateway:us-east-1::/apis/ogsd1547nd/routes/y8kqcbr
- **Aurora Cluster**: fibonacci-prod-aurora.cluster-csriwuis6v0w.us-east-1.rds.amazonaws.com
- **Secret ARN**: arn:aws:secretsmanager:us-east-1:207933152643:secret:/repo/github/alquimistaai-aws-architecture/fibonacci-prod/db/postgres-N8NXPx
- **Status**: ✅ Conectado (db_status: "connected")

---

## 🏗️ Arquitetura AWS

### Região
- **us-east-1** (N. Virginia)

### VPC
- **VPC ID**: vpc-081703d5feea3c2ab

### Serviços Utilizados
- ✅ **Lambda** - Funções serverless (Fibonacci Orquestrador)
- ✅ **API Gateway** - HTTP APIs
- ✅ **Aurora Serverless v2** - PostgreSQL
- ✅ **Secrets Manager** - Credenciais do banco
- ✅ **S3** - Frontend estático
- ✅ **CloudWatch** - Logs e monitoramento
- ✅ **EventBridge** - Orquestração de eventos

---

## 📱 Frontend Deployado (S3)

### URLs Públicas
- **Home**: http://alquimistaai-fibonacci-frontend-prod.s3-website-us-east-1.amazonaws.com/index.html
- **Catálogo de Agentes**: http://alquimistaai-fibonacci-frontend-prod.s3-website-us-east-1.amazonaws.com/produtos.html
- **Fibonacci**: http://alquimistaai-fibonacci-frontend-prod.s3-website-us-east-1.amazonaws.com/fibonacci.html

---

## 🔧 Configuração Local

### Variáveis de Ambiente

#### Desenvolvimento (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://c5loeivg0k.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_AWS_REGION=us-east-1
```

#### Produção (.env.production)
```bash
NEXT_PUBLIC_API_URL=https://ogsd1547nd.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_AWS_REGION=us-east-1
```

---

## 🧪 Testando a Conexão

### Via cURL (DEV)
```bash
curl https://c5loeivg0k.execute-api.us-east-1.amazonaws.com/
```

**Resposta Esperada:**
```json
{
  "ok": true,
  "service": "Fibonacci Orquestrador",
  "environment": "dev",
  "db_status": "connected"
}
```

### Via cURL (PROD)
```bash
curl https://ogsd1547nd.execute-api.us-east-1.amazonaws.com/
```

**Resposta Esperada:**
```json
{
  "ok": true,
  "service": "Fibonacci Orquestrador",
  "environment": "prod",
  "db_status": "connected"
}
```

---

## 🚀 Deploy do Frontend

### Opção 1: Vercel (Recomendado)
```bash
cd frontend
npm run build
vercel --prod
```

### Opção 2: AWS Amplify
```bash
cd frontend
npm run build
# Conectar repositório GitHub ao Amplify Console
```

### Opção 3: S3 + CloudFront
```bash
cd frontend
npm run build
aws s3 sync out/ s3://alquimista-frontend-prod --delete
aws cloudfront create-invalidation --distribution-id XXXXX --paths "/*"
```

---

## 📊 Monitoramento

### CloudWatch Logs
- **DEV**: `/aws/lambda/fibonacci-dev-*`
- **PROD**: `/aws/lambda/fibonacci-prod-*`

### Métricas Disponíveis
- Latência de API
- Taxa de erro
- Conexões de banco
- Uso de Lambda

---

## 🔐 Segurança

### Secrets Manager
Todas as credenciais sensíveis estão armazenadas no AWS Secrets Manager:
- Credenciais do Aurora
- Chaves de API
- Tokens de integração

### IAM Roles
- Lambda execution roles com least privilege
- API Gateway com autenticação Cognito (quando aplicável)

---

## 📝 Próximos Passos

1. ✅ Backend deployado (DEV + PROD)
2. ✅ Banco de dados conectado
3. ✅ Frontend estático no S3
4. 🔄 Migrar frontend Next.js para Vercel/Amplify
5. 🔄 Configurar domínio customizado
6. 🔄 Adicionar CDN (CloudFront)
7. 🔄 Configurar CI/CD completo

---

## 🆘 Troubleshooting

### Erro de CORS
Se encontrar erros de CORS, verifique as configurações do API Gateway:
```bash
aws apigateway get-rest-api --rest-api-id ogsd1547nd
```

### Erro de Conexão com Banco
Verifique os logs do Lambda:
```bash
aws logs tail /aws/lambda/fibonacci-prod-handler --follow
```

### Frontend não carrega
Verifique as variáveis de ambiente:
```bash
echo $NEXT_PUBLIC_API_URL
```

---

## 📞 Suporte

Para questões sobre a infraestrutura AWS:
- Verificar CloudWatch Logs
- Revisar Terraform state
- Consultar documentação AWS

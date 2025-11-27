# Frontend - Referência Rápida

## 🚀 Comandos Mais Usados

### Deploy Infraestrutura

```powershell
# Dev
cdk deploy FrontendStack-dev --context env=dev

# Prod
cdk deploy FrontendStack-prod --context env=prod
```

### Deploy Arquivos Frontend

```powershell
# Dev
.\scripts\deploy-frontend-dev.ps1

# Prod
.\scripts\deploy-frontend-prod.ps1
```

### Invalidar Cache CloudFront

```powershell
# Obter Distribution ID
$DIST_ID = aws cloudformation describe-stacks `
  --stack-name FrontendStack-dev `
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" `
  --output text

# Invalidar cache
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

### Gerar Configuração de APIs

```powershell
# Dev
.\scripts\generate-api-config.ps1 -Environment dev

# Prod
.\scripts\generate-api-config.ps1 -Environment prod
```

---

## 🔗 URLs Importantes

### Obter URLs

```powershell
# Dev
aws cloudformation describe-stacks `
  --stack-name FrontendStack-dev `
  --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" `
  --output text

# Prod
aws cloudformation describe-stacks `
  --stack-name FrontendStack-prod `
  --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" `
  --output text
```

### Abrir no Navegador

```powershell
# Dev
start "https://$(aws cloudformation describe-stacks --stack-name FrontendStack-dev --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomainName`].OutputValue' --output text)"

# Prod
start "https://$(aws cloudformation describe-stacks --stack-name FrontendStack-prod --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomainName`].OutputValue' --output text)"
```

---

## 📦 Recursos da Stack

### Obter Informações

```powershell
# Listar todos os outputs
aws cloudformation describe-stacks `
  --stack-name FrontendStack-dev `
  --query "Stacks[0].Outputs" `
  --output table
```

**Outputs disponíveis:**
- `FrontendUrl` - URL pública (https://xxxxx.cloudfront.net)
- `BucketName` - Nome do bucket S3
- `DistributionId` - ID da CloudFront Distribution
- `DistributionDomainName` - Domain name da distribution

---

## 🔧 Troubleshooting Rápido

### Página não carrega (403)

```powershell
# Verificar bucket policy
aws s3api get-bucket-policy --bucket <BUCKET_NAME>

# Verificar OAC na distribution
aws cloudfront get-distribution --id <DIST_ID> --query "Distribution.DistributionConfig.Origins[0].S3OriginConfig"
```

### Mudanças não aparecem

```powershell
# Invalidar cache
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"

# Verificar status da invalidação
aws cloudfront list-invalidations --distribution-id <DIST_ID>
```

### WAF bloqueando (Prod)

```powershell
# Ver logs do WAF
aws logs tail /aws/waf/alquimista-prod --follow

# Ver métricas de bloqueio
aws cloudwatch get-metric-statistics `
  --namespace AWS/WAFV2 `
  --metric-name BlockedRequests `
  --dimensions Name=WebACL,Value=AlquimistaAI-WAF-Prod Name=Region,Value=us-east-1 `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") `
  --end-time $(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") `
  --period 300 `
  --statistics Sum
```

---

## 📊 Monitoramento

### Métricas CloudFront

```powershell
# Requisições totais (última hora)
aws cloudwatch get-metric-statistics `
  --namespace AWS/CloudFront `
  --metric-name Requests `
  --dimensions Name=DistributionId,Value=<DIST_ID> `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") `
  --end-time $(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") `
  --period 300 `
  --statistics Sum

# Taxa de erros 4xx
aws cloudwatch get-metric-statistics `
  --namespace AWS/CloudFront `
  --metric-name 4xxErrorRate `
  --dimensions Name=DistributionId,Value=<DIST_ID> `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") `
  --end-time $(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") `
  --period 300 `
  --statistics Average
```

### Verificar Cache Hit Rate

```powershell
aws cloudwatch get-metric-statistics `
  --namespace AWS/CloudFront `
  --metric-name CacheHitRate `
  --dimensions Name=DistributionId,Value=<DIST_ID> `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") `
  --end-time $(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") `
  --period 300 `
  --statistics Average
```

---

## 🔒 Segurança

### Verificar Configuração de Segurança

```powershell
# Verificar que bucket é privado
aws s3api get-public-access-block --bucket <BUCKET_NAME>

# Verificar encryption
aws s3api get-bucket-encryption --bucket <BUCKET_NAME>

# Verificar WAF (prod)
aws cloudfront get-distribution --id <DIST_ID> --query "Distribution.DistributionConfig.WebACLId"
```

### Testar HTTPS

```powershell
# Verificar redirect HTTP → HTTPS
curl -I http://xxxxx.cloudfront.net/

# Verificar headers de segurança
curl -I https://xxxxx.cloudfront.net/
```

---

## 📁 Estrutura de Arquivos

```
frontend/
├── index.html              # Página inicial
├── produtos.html           # Página de produtos
├── fibonacci.html          # Página Fibonacci
├── styles.css              # Estilos globais
├── app.js                  # JavaScript principal
├── config/
│   └── api-config.json     # Configuração de APIs
└── assets/
    ├── images/             # Imagens
    └── fonts/              # Fontes
```

---

## 🔄 Workflow Completo

### 1. Deploy Inicial

```powershell
# 1. Deploy da infraestrutura
cdk deploy FrontendStack-dev --context env=dev

# 2. Gerar configuração de APIs
.\scripts\generate-api-config.ps1 -Environment dev

# 3. Deploy dos arquivos
.\scripts\deploy-frontend-dev.ps1

# 4. Abrir no navegador
start "https://$(aws cloudformation describe-stacks --stack-name FrontendStack-dev --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomainName`].OutputValue' --output text)"
```

### 2. Atualização de Arquivos

```powershell
# 1. Fazer mudanças nos arquivos frontend

# 2. Deploy
.\scripts\deploy-frontend-dev.ps1

# 3. Aguardar invalidação (1-2 minutos)

# 4. Testar no navegador
```

### 3. Atualização de Infraestrutura

```powershell
# 1. Fazer mudanças em lib/frontend-stack.ts

# 2. Build
npm run build

# 3. Synth
cdk synth FrontendStack-dev

# 4. Deploy
cdk deploy FrontendStack-dev --context env=dev

# 5. Verificar mudanças
aws cloudformation describe-stacks --stack-name FrontendStack-dev --query "Stacks[0].Outputs"
```

---

## 📚 Documentação Completa

- [Guia de Deploy Completo](./FRONTEND-DEPLOY-ALQUIMISTAAI.md)
- [Spec Completa](../../.kiro/specs/frontend-s3-cloudfront/README.md)
- [Design Document](../../.kiro/specs/frontend-s3-cloudfront/design.md)
- [Índice de Operações AWS](../INDEX-OPERATIONS-AWS.md)

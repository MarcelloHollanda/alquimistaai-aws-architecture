# Guia de Deploy do Frontend AlquimistaAI

## Visão Geral

Este documento descreve como fazer deploy do frontend estático do AlquimistaAI na infraestrutura AWS (S3 + CloudFront + WAF).

### Arquitetura

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Usuário   │─────▶│  CloudFront  │─────▶│  S3 Bucket  │
│             │      │ Distribution │      │  (Privado)  │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            │ (Prod apenas)
                            ▼
                     ┌──────────────┐
                     │     WAF      │
                     │  (Proteção)  │
                     └──────────────┘
```

**Características:**
- **Buckets S3 privados** (acesso apenas via CloudFront OAC)
- **CloudFront** para distribuição global de conteúdo
- **WAF** integrado em produção para proteção contra ataques
- **HTTPS obrigatório** em todas as requisições
- **Separação completa** entre ambientes dev e prod

---

## Pré-requisitos

### 1. AWS CLI Instalado e Configurado

```powershell
# Verificar instalação
aws --version

# Configurar credenciais (se necessário)
aws configure
```

### 2. Infraestrutura Deployada

Certifique-se de que a `FrontendStack` foi deployada:

```powershell
# Deploy da stack de frontend dev
cdk deploy FrontendStack-dev --context env=dev

# Deploy da stack de frontend prod
cdk deploy FrontendStack-prod --context env=prod
```

### 3. Arquivos Frontend Preparados

Estrutura esperada dos arquivos:

```
frontend/
├── index.html
├── produtos.html
├── fibonacci.html
├── styles.css
├── app.js
├── config/
│   └── api-config.json
└── assets/
    ├── images/
    └── fonts/
```

---

## Descobrir URLs e Recursos

### Obter Informações via CDK Outputs

```powershell
# Listar outputs da stack dev
aws cloudformation describe-stacks `
  --stack-name FrontendStack-dev `
  --query "Stacks[0].Outputs" `
  --output table

# Listar outputs da stack prod
aws cloudformation describe-stacks `
  --stack-name FrontendStack-prod `
  --query "Stacks[0].Outputs" `
  --output table
```

**Outputs disponíveis:**
- `FrontendUrl` - URL pública do frontend (https://xxxxx.cloudfront.net)
- `BucketName` - Nome do bucket S3
- `DistributionId` - ID da CloudFront Distribution
- `DistributionDomainName` - Domain name da distribution

### Obter URL Diretamente

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

---

## Deploy Manual

### 1. Deploy para Dev

```powershell
# Definir variáveis
$BUCKET_NAME = "alquimistaai-frontend-dev-<ACCOUNT_ID>"
$DIST_ID = "<DISTRIBUTION_ID>"

# Fazer upload dos arquivos
aws s3 sync ./frontend s3://$BUCKET_NAME/ --delete --exclude ".git/*" --exclude "node_modules/*"

# Invalidar cache do CloudFront
aws cloudfront create-invalidation `
  --distribution-id $DIST_ID `
  --paths "/*"
```

### 2. Deploy para Prod

```powershell
# Definir variáveis
$BUCKET_NAME = "alquimistaai-frontend-prod-<ACCOUNT_ID>"
$DIST_ID = "<DISTRIBUTION_ID>"

# IMPORTANTE: Confirmar antes de fazer deploy em produção
Write-Host "⚠️  ATENÇÃO: Você está prestes a fazer deploy em PRODUÇÃO!" -ForegroundColor Yellow
$confirm = Read-Host "Digite 'SIM' para confirmar"

if ($confirm -ne "SIM") {
    Write-Host "❌ Deploy cancelado." -ForegroundColor Red
    exit 1
}

# Fazer upload dos arquivos
aws s3 sync ./frontend s3://$BUCKET_NAME/ --delete --exclude ".git/*" --exclude "node_modules/*"

# Invalidar cache do CloudFront
aws cloudfront create-invalidation `
  --distribution-id $DIST_ID `
  --paths "/*"

Write-Host "✅ Deploy em produção concluído!" -ForegroundColor Green
```

### 3. Verificar Status da Invalidação

```powershell
# Listar invalidações recentes
aws cloudfront list-invalidations --distribution-id $DIST_ID

# Verificar status de uma invalidação específica
aws cloudfront get-invalidation `
  --distribution-id $DIST_ID `
  --id <INVALIDATION_ID>
```

---

## Scripts Automatizados

### Script de Deploy Dev

Criar arquivo `scripts/deploy-frontend-dev.ps1`:

```powershell
#!/usr/bin/env pwsh

# Deploy Frontend Dev
Write-Host "🚀 Iniciando deploy do frontend DEV..." -ForegroundColor Cyan

# Obter informações da stack
$BUCKET_NAME = aws cloudformation describe-stacks `
  --stack-name FrontendStack-dev `
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" `
  --output text

$DIST_ID = aws cloudformation describe-stacks `
  --stack-name FrontendStack-dev `
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" `
  --output text

if (-not $BUCKET_NAME -or -not $DIST_ID) {
    Write-Host "❌ Erro: Não foi possível obter informações da stack." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Bucket: $BUCKET_NAME" -ForegroundColor Gray
Write-Host "🌐 Distribution: $DIST_ID" -ForegroundColor Gray

# Upload dos arquivos
Write-Host "📤 Fazendo upload dos arquivos..." -ForegroundColor Cyan
aws s3 sync ./frontend s3://$BUCKET_NAME/ --delete --exclude ".git/*" --exclude "node_modules/*"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no upload dos arquivos." -ForegroundColor Red
    exit 1
}

# Invalidar cache
Write-Host "🔄 Invalidando cache do CloudFront..." -ForegroundColor Cyan
$INVALIDATION_ID = aws cloudfront create-invalidation `
  --distribution-id $DIST_ID `
  --paths "/*" `
  --query "Invalidation.Id" `
  --output text

Write-Host "✅ Deploy concluído!" -ForegroundColor Green
Write-Host "🔗 URL: https://$(aws cloudformation describe-stacks --stack-name FrontendStack-dev --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' --output text)" -ForegroundColor Green
Write-Host "⏳ Invalidação: $INVALIDATION_ID (aguarde 1-2 minutos)" -ForegroundColor Yellow
```

### Script de Deploy Prod

Criar arquivo `scripts/deploy-frontend-prod.ps1`:

```powershell
#!/usr/bin/env pwsh

# Deploy Frontend Prod
Write-Host "🚀 Iniciando deploy do frontend PROD..." -ForegroundColor Cyan

# Confirmação
Write-Host "⚠️  ATENÇÃO: Você está prestes a fazer deploy em PRODUÇÃO!" -ForegroundColor Yellow
$confirm = Read-Host "Digite 'SIM' para confirmar"

if ($confirm -ne "SIM") {
    Write-Host "❌ Deploy cancelado." -ForegroundColor Red
    exit 1
}

# Obter informações da stack
$BUCKET_NAME = aws cloudformation describe-stacks `
  --stack-name FrontendStack-prod `
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" `
  --output text

$DIST_ID = aws cloudformation describe-stacks `
  --stack-name FrontendStack-prod `
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" `
  --output text

if (-not $BUCKET_NAME -or -not $DIST_ID) {
    Write-Host "❌ Erro: Não foi possível obter informações da stack." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Bucket: $BUCKET_NAME" -ForegroundColor Gray
Write-Host "🌐 Distribution: $DIST_ID" -ForegroundColor Gray

# Upload dos arquivos
Write-Host "📤 Fazendo upload dos arquivos..." -ForegroundColor Cyan
aws s3 sync ./frontend s3://$BUCKET_NAME/ --delete --exclude ".git/*" --exclude "node_modules/*"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no upload dos arquivos." -ForegroundColor Red
    exit 1
}

# Invalidar cache
Write-Host "🔄 Invalidando cache do CloudFront..." -ForegroundColor Cyan
$INVALIDATION_ID = aws cloudfront create-invalidation `
  --distribution-id $DIST_ID `
  --paths "/*" `
  --query "Invalidation.Id" `
  --output text

Write-Host "✅ Deploy em PRODUÇÃO concluído!" -ForegroundColor Green
Write-Host "🔗 URL: https://$(aws cloudformation describe-stacks --stack-name FrontendStack-prod --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' --output text)" -ForegroundColor Green
Write-Host "⏳ Invalidação: $INVALIDATION_ID (aguarde 1-2 minutos)" -ForegroundColor Yellow
```

---

## Configuração de APIs Backend

### Gerar Arquivo de Configuração

Criar arquivo `config/api-config.json` no diretório frontend:

```json
{
  "environment": "dev",
  "apis": {
    "fibonacci": {
      "baseUrl": "https://ogsd1547nd.execute-api.us-east-1.amazonaws.com",
      "timeout": 30000
    },
    "nigredo": {
      "baseUrl": "https://dev-nigredo-api.execute-api.us-east-1.amazonaws.com",
      "timeout": 30000
    }
  },
  "features": {
    "trialEnabled": true,
    "checkoutEnabled": true
  }
}
```

### Script para Gerar Configuração Automaticamente

Criar arquivo `scripts/generate-api-config.ps1`:

```powershell
#!/usr/bin/env pwsh

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "prod")]
    [string]$Environment
)

Write-Host "🔧 Gerando configuração de APIs para $Environment..." -ForegroundColor Cyan

# Obter URLs das APIs
$FIBONACCI_URL = aws cloudformation describe-stacks `
  --stack-name FibonacciStack-$Environment `
  --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" `
  --output text

$NIGREDO_URL = aws cloudformation describe-stacks `
  --stack-name NigredoStack-$Environment `
  --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" `
  --output text

if (-not $FIBONACCI_URL -or -not $NIGREDO_URL) {
    Write-Host "❌ Erro: Não foi possível obter URLs das APIs." -ForegroundColor Red
    exit 1
}

# Criar JSON
$config = @{
    environment = $Environment
    apis = @{
        fibonacci = @{
            baseUrl = $FIBONACCI_URL
            timeout = 30000
        }
        nigredo = @{
            baseUrl = $NIGREDO_URL
            timeout = 30000
        }
    }
    features = @{
        trialEnabled = $true
        checkoutEnabled = $true
    }
} | ConvertTo-Json -Depth 10

# Criar diretório se não existir
New-Item -ItemType Directory -Force -Path "./frontend/config" | Out-Null

# Salvar arquivo
$config | Out-File -FilePath "./frontend/config/api-config.json" -Encoding UTF8

Write-Host "✅ Configuração gerada com sucesso!" -ForegroundColor Green
Write-Host "📄 Arquivo: ./frontend/config/api-config.json" -ForegroundColor Gray
Write-Host "🔗 Fibonacci: $FIBONACCI_URL" -ForegroundColor Gray
Write-Host "🔗 Nigredo: $NIGREDO_URL" -ForegroundColor Gray
```

**Uso:**

```powershell
# Gerar config para dev
.\scripts\generate-api-config.ps1 -Environment dev

# Gerar config para prod
.\scripts\generate-api-config.ps1 -Environment prod
```

---

## Testar no Navegador

### 1. Abrir URL do Frontend

```powershell
# Dev
start "https://$(aws cloudformation describe-stacks --stack-name FrontendStack-dev --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomainName`].OutputValue' --output text)"

# Prod
start "https://$(aws cloudformation describe-stacks --stack-name FrontendStack-prod --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomainName`].OutputValue' --output text)"
```

### 2. Verificar Páginas

- `https://xxxxx.cloudfront.net/` - Página inicial
- `https://xxxxx.cloudfront.net/produtos.html` - Página de produtos
- `https://xxxxx.cloudfront.net/fibonacci.html` - Página Fibonacci

### 3. Verificar Headers de Segurança

```powershell
curl -I https://xxxxx.cloudfront.net/
```

**Headers esperados:**
- `x-cache: Hit from cloudfront` (após primeira requisição)
- `strict-transport-security: max-age=31536000`
- `x-content-type-options: nosniff`

---

## Troubleshooting

### Problema: Página não carrega (403 Forbidden)

**Causa:** Bucket policy não configurada corretamente ou OAC não funcionando.

**Solução:**
1. Verificar que o bucket é privado (Block Public Access habilitado)
2. Verificar que a bucket policy permite acesso via CloudFront
3. Aguardar alguns minutos para propagação

### Problema: Mudanças não aparecem

**Causa:** Cache do CloudFront ainda não foi invalidado.

**Solução:**
```powershell
# Invalidar cache manualmente
aws cloudfront create-invalidation `
  --distribution-id <DIST_ID> `
  --paths "/*"

# Aguardar 1-2 minutos
```

### Problema: Erro 404 em rotas do SPA

**Causa:** CloudFront não está redirecionando 404 para index.html.

**Solução:**
- Verificar que a error response está configurada na distribution
- Redeployar a stack se necessário

### Problema: WAF bloqueando requisições legítimas (Prod)

**Causa:** Regras do WAF muito restritivas.

**Solução:**
1. Verificar logs do WAF em CloudWatch
2. Adicionar IP à allowlist se necessário
3. Ajustar regras do WAF na `WAFStack`

---

## Monitoramento

### CloudWatch Metrics

Métricas disponíveis para CloudFront:

- `Requests` - Total de requisições
- `BytesDownloaded` - Volume de dados transferidos
- `4xxErrorRate` - Taxa de erros 4xx
- `5xxErrorRate` - Taxa de erros 5xx

### Visualizar Métricas

```powershell
# Via AWS CLI
aws cloudwatch get-metric-statistics `
  --namespace AWS/CloudFront `
  --metric-name Requests `
  --dimensions Name=DistributionId,Value=<DIST_ID> `
  --start-time 2024-01-01T00:00:00Z `
  --end-time 2024-01-01T23:59:59Z `
  --period 3600 `
  --statistics Sum
```

### Logs de Acesso

Logs do CloudFront podem ser habilitados para análise detalhada:

```typescript
// Em lib/frontend-stack.ts (opcional)
logBucket: logsBucket,
logFilePrefix: `frontend-${env}/`,
logIncludesCookies: false,
```

---

## Segurança

### Boas Práticas

1. **Nunca tornar buckets públicos** - Sempre usar OAC
2. **Sempre usar HTTPS** - HTTP deve redirecionar para HTTPS
3. **Habilitar WAF em produção** - Proteção contra ataques
4. **Monitorar logs** - Detectar atividades suspeitas
5. **Versionar arquivos** - Facilita rollback em caso de problemas

### Verificar Segurança

```powershell
# Verificar que bucket é privado
aws s3api get-public-access-block --bucket <BUCKET_NAME>

# Verificar que WAF está associado (prod)
aws cloudfront get-distribution --id <DIST_ID> --query "Distribution.DistributionConfig.WebACLId"
```

---

## Referências

- [Spec Completa](../../.kiro/specs/frontend-s3-cloudfront/README.md)
- [Design Document](../../.kiro/specs/frontend-s3-cloudfront/design.md)
- [Tasks](../../.kiro/specs/frontend-s3-cloudfront/tasks.md)
- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)

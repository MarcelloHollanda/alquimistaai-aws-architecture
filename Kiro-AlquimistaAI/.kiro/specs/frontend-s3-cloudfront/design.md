# Design Document

## Visão Geral

Este documento detalha a arquitetura técnica para hospedagem do frontend estático do AlquimistaAI na AWS, utilizando S3 para armazenamento, CloudFront para distribuição de conteúdo e WAF para proteção em produção.

## Arquitetura

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                     AMBIENTE DEV                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌─────────────────┐                 │
│  │   Usuário    │─────▶│   CloudFront    │                 │
│  │     Dev      │      │  Distribution   │                 │
│  └──────────────┘      │     (Dev)       │                 │
│                         └────────┬────────┘                 │
│                                  │                           │
│                                  │ OAC                       │
│                                  ▼                           │
│                         ┌─────────────────┐                 │
│                         │   S3 Bucket     │                 │
│                         │  (frontend-dev) │                 │
│                         │   [Private]     │                 │
│                         └─────────────────┘                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     AMBIENTE PROD                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌─────────────────┐                 │
│  │   Usuário    │─────▶│      WAF        │                 │
│  │    Final     │      │  (WebAclProd)   │                 │
│  └──────────────┘      └────────┬────────┘                 │
│                                  │                           │
│                                  ▼                           │
│                         ┌─────────────────┐                 │
│                         │   CloudFront    │                 │
│                         │  Distribution   │                 │
│                         │     (Prod)      │                 │
│                         └────────┬────────┘                 │
│                                  │                           │
│                                  │ OAC                       │
│                                  ▼                           │
│                         ┌─────────────────┐                 │
│                         │   S3 Bucket     │                 │
│                         │ (frontend-prod) │                 │
│                         │   [Private]     │                 │
│                         └─────────────────┘                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Componentes e Interfaces

### 1. FrontendStack (CDK)

**Responsabilidade:** Provisionar toda infraestrutura de frontend para um ambiente específico.

**Localização:** `lib/frontend-stack.ts`

**Props da Stack:**
```typescript
interface FrontendStackProps extends cdk.StackProps {
  env: 'dev' | 'prod';
  wafAclArn?: string; // ARN do WebAcl (obrigatório para prod)
  fibonacciApiUrl: string;
  nigredoApiUrl: string;
}
```

**Recursos Criados:**
- S3 Bucket (privado)
- CloudFront Distribution
- Origin Access Control (OAC)
- Bucket Policy (permitindo acesso via OAC)

**Outputs:**
- `FrontendUrl`: URL pública da CloudFront Distribution
- `BucketName`: Nome do bucket S3
- `DistributionId`: ID da distribution (para invalidação de cache)

### 2. S3 Buckets

**Decisão de Design:** Usar **origem privada com CloudFront OAC** (recomendado pela AWS).

**Justificativa:**
- Maior segurança (buckets não públicos)
- Controle de acesso centralizado no CloudFront
- Melhor alinhamento com boas práticas AWS
- Proteção contra acesso direto ao bucket

**Configuração Dev:**
```typescript
const bucketDev = new s3.Bucket(this, 'FrontendBucketDev', {
  bucketName: `alquimistaai-frontend-dev-${cdk.Aws.ACCOUNT_ID}`,
  versioned: true, // Histórico de versões
  encryption: s3.BucketEncryption.S3_MANAGED,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  removalPolicy: cdk.RemovalPolicy.RETAIN, // Não deletar em destroy
  autoDeleteObjects: false,
});
```

**Configuração Prod:**
```typescript
const bucketProd = new s3.Bucket(this, 'FrontendBucketProd', {
  bucketName: `alquimistaai-frontend-prod-${cdk.Aws.ACCOUNT_ID}`,
  versioned: true,
  encryption: s3.BucketEncryption.S3_MANAGED,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  autoDeleteObjects: false,
  lifecycleRules: [
    {
      // Manter apenas últimas 10 versões
      noncurrentVersionExpiration: cdk.Duration.days(90),
    },
  ],
});
```

**Estrutura de Arquivos no Bucket:**
```
/
├── index.html
├── produtos.html
├── fibonacci.html
├── styles.css
├── app.js
└── config/
    └── api-config.json  # URLs das APIs por ambiente
```

### 3. CloudFront Distributions

**Distribution Dev:**
```typescript
const distributionDev = new cloudfront.Distribution(this, 'FrontendDistributionDev', {
  defaultBehavior: {
    origin: new origins.S3Origin(bucketDev, {
      originAccessControl: oac,
    }),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
    cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
    compress: true,
    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
  },
  defaultRootObject: 'index.html',
  errorResponses: [
    {
      httpStatus: 404,
      responseHttpStatus: 200,
      responsePagePath: '/index.html',
      ttl: cdk.Duration.minutes(5),
    },
  ],
  priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Apenas NA e Europa
  enabled: true,
  comment: 'AlquimistaAI Frontend Dev',
});
```

**Distribution Prod:**
```typescript
const distributionProd = new cloudfront.Distribution(this, 'FrontendDistributionProd', {
  defaultBehavior: {
    origin: new origins.S3Origin(bucketProd, {
      originAccessControl: oac,
    }),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
    cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
    compress: true,
    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
  },
  defaultRootObject: 'index.html',
  errorResponses: [
    {
      httpStatus: 404,
      responseHttpStatus: 200,
      responsePagePath: '/index.html',
      ttl: cdk.Duration.minutes(5),
    },
  ],
  priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL, // Global
  enabled: true,
  comment: 'AlquimistaAI Frontend Prod',
  webAclId: props.wafAclArn, // Integração com WAF
});
```

**Políticas de Cache:**
- HTML: Cache curto (5 minutos) para atualizações rápidas
- CSS/JS: Cache longo (1 ano) com versionamento via query string
- Imagens: Cache longo (1 ano)

### 4. Origin Access Control (OAC)

**Configuração:**
```typescript
const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
  originAccessControlName: `alquimistaai-frontend-${env}-oac`,
  signing: cloudfront.Signing.SIGV4_ALWAYS,
});
```

**Bucket Policy (gerada automaticamente):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::alquimistaai-frontend-prod-*/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT:distribution/DIST_ID"
        }
      }
    }
  ]
}
```

### 5. Integração com WAF

**Referência ao WAFStack:**
```typescript
// Em bin/app.ts
const wafStack = new WAFStack(app, 'WAFStack', {
  env: { account: ACCOUNT, region: 'us-east-1' },
});

const frontendStackProd = new FrontendStack(app, 'FrontendStack-Prod', {
  env: { account: ACCOUNT, region: 'us-east-1' },
  environment: 'prod',
  wafAclArn: wafStack.webAclProdArn, // Output da WAFStack
  fibonacciApiUrl: 'https://ogsd1547nd.execute-api.us-east-1.amazonaws.com',
  nigredoApiUrl: 'https://prod-nigredo-api.execute-api.us-east-1.amazonaws.com',
});

frontendStackProd.addDependency(wafStack);
```

**Regras WAF Aplicadas (já existentes na WAFStack):**
- AWS Managed Rules: Common Rule Set
- AWS Managed Rules: Known Bad Inputs
- AWS Managed Rules: SQL Injection
- Rate Limiting: 1000 req/5min (prod)
- IP Allowlist/Blocklist

### 6. Configuração de APIs Backend

**Arquivo de Configuração:** `config/api-config.json`

**Formato:**
```json
{
  "environment": "prod",
  "apis": {
    "fibonacci": {
      "baseUrl": "https://ogsd1547nd.execute-api.us-east-1.amazonaws.com",
      "timeout": 30000
    },
    "nigredo": {
      "baseUrl": "https://prod-nigredo-api.execute-api.us-east-1.amazonaws.com",
      "timeout": 30000
    }
  },
  "features": {
    "trialEnabled": true,
    "checkoutEnabled": true
  }
}
```

**Geração do Arquivo:**
- Criado manualmente ou via script durante deploy
- Versionado junto com os arquivos estáticos
- Carregado pelo `app.js` na inicialização

**Uso no Frontend:**
```javascript
// app.js
async function loadConfig() {
  const response = await fetch('/config/api-config.json');
  const config = await response.json();
  window.ALQUIMISTA_CONFIG = config;
}

// Uso
const fibonacciUrl = window.ALQUIMISTA_CONFIG.apis.fibonacci.baseUrl;
```

## Modelo de Dados

### Outputs do CDK

```typescript
// FrontendStack outputs
new cdk.CfnOutput(this, 'FrontendUrl', {
  value: distribution.distributionDomainName,
  description: 'URL pública do frontend',
  exportName: `AlquimistaAI-Frontend-${env}-Url`,
});

new cdk.CfnOutput(this, 'BucketName', {
  value: bucket.bucketName,
  description: 'Nome do bucket S3',
  exportName: `AlquimistaAI-Frontend-${env}-Bucket`,
});

new cdk.CfnOutput(this, 'DistributionId', {
  value: distribution.distributionId,
  description: 'ID da CloudFront Distribution',
  exportName: `AlquimistaAI-Frontend-${env}-DistId`,
});
```

## Tratamento de Erros

### Páginas de Erro CloudFront

**404 Not Found:**
- Redirecionar para `index.html` (SPA behavior)
- TTL: 5 minutos
- Status retornado: 200

**403 Forbidden:**
- Página customizada: `error-403.html`
- TTL: 10 minutos
- Status retornado: 403

**500 Internal Server Error:**
- Página customizada: `error-500.html`
- TTL: 1 minuto
- Status retornado: 500

### Monitoramento de Erros

**CloudWatch Metrics:**
- `4xxErrorRate`: Taxa de erros 4xx
- `5xxErrorRate`: Taxa de erros 5xx
- `BytesDownloaded`: Volume de dados transferidos
- `Requests`: Total de requisições

**Alarmes:**
- Alerta se 4xxErrorRate > 5% por 5 minutos
- Alerta se 5xxErrorRate > 1% por 5 minutos

## Estratégia de Testes

### Testes de Infraestrutura

1. **Síntese CDK:**
   ```bash
   npm run build
   cdk synth FrontendStack-dev
   cdk synth FrontendStack-prod
   ```

2. **Validação de Templates:**
   - Verificar que buckets são privados
   - Verificar que OAC está configurado
   - Verificar que WAF está associado (prod)

### Testes Funcionais

1. **Upload de Arquivos:**
   ```powershell
   aws s3 sync ./frontend s3://alquimistaai-frontend-dev-ACCOUNT/ --delete
   ```

2. **Acesso via CloudFront:**
   ```powershell
   curl https://d1234567890.cloudfront.net/
   curl https://d1234567890.cloudfront.net/produtos.html
   ```

3. **Validação de Cache:**
   ```powershell
   # Primeira requisição (MISS)
   curl -I https://d1234567890.cloudfront.net/
   
   # Segunda requisição (HIT)
   curl -I https://d1234567890.cloudfront.net/
   ```

4. **Invalidação de Cache:**
   ```powershell
   aws cloudfront create-invalidation `
     --distribution-id E1234567890ABC `
     --paths "/*"
   ```

### Testes de Segurança

1. **Acesso Direto ao S3 (deve falhar):**
   ```powershell
   curl https://alquimistaai-frontend-prod-ACCOUNT.s3.amazonaws.com/index.html
   # Esperado: 403 Forbidden
   ```

2. **WAF em Produção:**
   ```powershell
   # Simular ataque SQL injection
   curl "https://d1234567890.cloudfront.net/?id=1' OR '1'='1"
   # Esperado: 403 Forbidden (bloqueado pelo WAF)
   ```

3. **Rate Limiting:**
   ```powershell
   # Enviar 1001 requisições em 5 minutos
   for ($i=0; $i -lt 1001; $i++) {
     curl https://d1234567890.cloudfront.net/
   }
   # Esperado: 403 após 1000 requisições
   ```

## Considerações de Performance

### Otimizações CloudFront

1. **Compressão Gzip/Brotli:**
   - Habilitada automaticamente
   - Reduz tamanho de HTML/CSS/JS em ~70%

2. **HTTP/2 e HTTP/3:**
   - Habilitado por padrão
   - Melhora latência e throughput

3. **Edge Locations:**
   - Dev: Price Class 100 (NA + Europa)
   - Prod: Price Class All (Global)

### Otimizações de Cache

1. **Cache-Control Headers:**
   ```
   # HTML
   Cache-Control: public, max-age=300, must-revalidate
   
   # CSS/JS
   Cache-Control: public, max-age=31536000, immutable
   
   # Imagens
   Cache-Control: public, max-age=31536000
   ```

2. **Versionamento de Assets:**
   ```html
   <link rel="stylesheet" href="/styles.css?v=1.2.3">
   <script src="/app.js?v=1.2.3"></script>
   ```

## Considerações de Segurança

### Proteção de Dados

1. **Encryption at Rest:**
   - S3: SSE-S3 (AES-256)
   - CloudFront: Não armazena dados

2. **Encryption in Transit:**
   - HTTPS obrigatório (redirect HTTP → HTTPS)
   - TLS 1.2+ apenas

### Controle de Acesso

1. **S3 Buckets:**
   - Privados (Block Public Access)
   - Acesso apenas via OAC

2. **CloudFront:**
   - Acesso público (protegido por WAF em prod)
   - Logs habilitados

3. **WAF (Prod):**
   - Regras AWS Managed
   - Rate limiting
   - IP allowlist/blocklist

### Auditoria e Compliance

1. **CloudTrail:**
   - Logs de API calls (S3, CloudFront)
   - Integrado com SecurityStack

2. **Access Logs:**
   - S3: Logs de acesso ao bucket
   - CloudFront: Logs de requisições

## Futuras Melhorias

### Fase 2 (Opcional)

1. **Domínio Customizado:**
   - Registrar `app.alquimistaai.com`
   - Certificado ACM
   - Route 53 para DNS

2. **CI/CD Automatizado:**
   - GitHub Actions para deploy automático
   - Build e upload em pipeline

3. **Múltiplos Ambientes:**
   - Staging
   - QA
   - Sandbox

4. **Monitoramento Avançado:**
   - Real User Monitoring (RUM)
   - Synthetic Monitoring
   - Dashboards CloudWatch customizados

# 📋 Sessão: Tentativa de Deploy AlquimistaStack-dev

**Data**: 23/11/2024  
**Objetivo**: Executar deploy da AlquimistaStack-dev para obter URL correta da API da Plataforma

---

## 🎯 Contexto

O frontend está apontando para o API Gateway do **Fibonacci** (que só tem a rota `/`), mas deveria apontar para o API Gateway da **Plataforma AlquimistaAI** (que tem todas as rotas `/api/*`).

**URLs atuais (INCORRETAS)**:
- DEV: `https://c5loeivg0k.execute-api.us-east-1.amazonaws.com` (Fibonacci)
- PROD: `https://ogsd1547nd.execute-api.us-east-1.amazonaws.com` (Fibonacci)

**Resultado**: Erro 404 em todas as rotas `/api/*`

---

## 🚧 Bloqueio Identificado

### Tentativa de Deploy

```powershell
npm run build
```

### Resultado: ❌ FALHOU

**41 erros de compilação TypeScript** impedem o deploy da stack.

---

## 📊 Análise dos Erros

### Categoria 1: Lambda Internal (7 erros)

**Arquivos afetados:**
- `lambda/internal/aggregate-daily-metrics.ts` (5 erros)
- `lambda/internal/get-billing-overview.ts` (1 erro)
- `lambda/internal/get-tenant-agents.ts` (2 erros)
- `lambda/internal/get-tenant-detail.ts` (2 erros)
- `lambda/internal/get-usage-overview.ts` (1 erro)
- `lambda/internal/list-tenants.ts` (1 erro)

**Problema principal:**
```typescript
// Erro: APIGatewayProxyEventV2 não é compatível com APIGatewayProxyEvent
const context = extractAuthContext(event); // event é APIGatewayProxyEventV2
```

**Causa**: A função `extractAuthContext` espera `APIGatewayProxyEvent` (REST API), mas está recebendo `APIGatewayProxyEventV2` (HTTP API).

**Erros específicos em aggregate-daily-metrics.ts:**
- `ExecuteStatementCommand` não encontrado
- `AURORA_CLUSTER_ARN` não definido
- `AURORA_SECRET_ARN` não definido
- `DATABASE_NAME` não definido
- `rdsClient` não definido

---

### Categoria 2: Lambda Platform (9 erros)

**Arquivos afetados:**
- `lambda/platform/create-checkout-session.ts` (2 erros)
- `lambda/platform/get-tenant-me.ts` (1 erro)
- `lambda/platform/upload-logo.ts` (2 erros)
- `lambda/platform/webhook-payment.ts` (6 erros)
- `lambda/shared/stripe-client.ts` (4 erros)

**Problemas:**

1. **Propriedades customizadas em Error:**
```typescript
// Erro: 'requestId' não existe no tipo 'Error'
throw new Error('...', { requestId });
```

2. **Versão da API do Stripe:**
```typescript
// Erro: "2024-11-20.acacia" não é compatível com "2023-10-16"
apiVersion: '2024-11-20.acacia'
```

3. **Módulos S3 não encontrados:**
```typescript
// Erro: Módulo não encontrado
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
```

4. **Tipo de retorno incompatível em get-tenant-me.ts:**
```typescript
// Headers com 'Cache-Control'?: undefined não é compatível
headers: { 'Content-Type': string; 'Cache-Control'?: undefined; }
```

---

### Categoria 3: CloudWatch Alarms (14 erros)

**Arquivo afetado:**
- `lib/dashboards/operational-dashboard-alarms.ts` (14 erros)

**Problema:**
```typescript
// Erro: 'SnsAction' não existe no tipo cloudwatch
errorRateAlarm.addAlarmAction(new cloudwatch.SnsAction(this.alarmTopic));
```

**Causa**: `SnsAction` foi movido para um módulo separado no AWS CDK v2.

**Solução esperada:**
```typescript
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
errorRateAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));
```

**Erro adicional:**
```typescript
// Erro: 'alarmName' não existe em CompositeAlarmProps
{ alarmName, ... }
```

---

## 🔍 Status da Stack

```powershell
aws cloudformation describe-stacks --stack-name AlquimistaStack-dev
```

**Resultado**: Stack **NÃO EXISTE** (nunca foi deployada)

---

## ✅ Próximos Passos

### 1. Corrigir Erros de Compilação

#### 1.1. Lambda Internal - Compatibilidade de Eventos

**Opção A**: Atualizar `extractAuthContext` para suportar ambos os tipos
**Opção B**: Usar o tipo correto (`APIGatewayProxyEventV2`) nas lambdas

#### 1.2. Lambda Internal - aggregate-daily-metrics

Adicionar imports e variáveis de ambiente:
```typescript
import { ExecuteStatementCommand } from '@aws-sdk/client-rds-data';
import { RDSDataClient } from '@aws-sdk/client-rds-data';

const AURORA_CLUSTER_ARN = process.env.AURORA_CLUSTER_ARN!;
const AURORA_SECRET_ARN = process.env.AURORA_SECRET_ARN!;
const DATABASE_NAME = process.env.DATABASE_NAME!;
const rdsClient = new RDSDataClient({ region: process.env.AWS_REGION });
```

#### 1.3. Lambda Platform - Stripe

**Corrigir versão da API:**
```typescript
apiVersion: '2023-10-16' // Usar versão compatível
```

**Instalar dependências S3:**
```powershell
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Corrigir objetos Error:**
```typescript
// Antes
throw new Error('message', { requestId });

// Depois
const error = new Error('message');
(error as any).requestId = requestId;
throw error;
```

#### 1.4. CloudWatch Alarms

**Adicionar import:**
```typescript
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
```

**Substituir todas as ocorrências:**
```typescript
// Antes
new cloudwatch.SnsAction(this.alarmTopic)

// Depois
new cloudwatch_actions.SnsAction(this.alarmTopic)
```

**Corrigir CompositeAlarm:**
```typescript
// Usar 'compositeAlarmName' em vez de 'alarmName'
{ compositeAlarmName: alarmName, ... }
```

---

### 2. Validar Compilação

```powershell
npm run build
```

Deve executar sem erros.

---

### 3. Deploy da Stack

```powershell
cdk deploy AlquimistaStack-dev --context env=dev
```

---

### 4. Obter URL da API

```powershell
cd frontend
.\scripts\get-platform-api-url.ps1 -Environment dev
```

---

### 5. Atualizar Variáveis de Ambiente

Atualizar `frontend/.env.local` e `frontend/.env.production` com a URL correta.

---

## 📝 Observações

1. **Não é possível fazer deploy** sem corrigir os erros de compilação
2. **A stack nunca foi deployada**, então não há URL para obter ainda
3. **Os erros são sistemáticos** e afetam múltiplos arquivos
4. **Correções necessárias** são bem definidas e podem ser automatizadas

---

## 🎯 Recomendação

**Criar uma spec para corrigir os erros de compilação TypeScript** antes de tentar o deploy novamente.

Alternativamente, o usuário pode:
1. Corrigir os erros manualmente
2. Executar `npm run build` para validar
3. Fazer o deploy da stack
4. Obter a URL da API

---

**Relatório gerado em**: 23/11/2024  
**Próxima ação**: Aguardando decisão do usuário

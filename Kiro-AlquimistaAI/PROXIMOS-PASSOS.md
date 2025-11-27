# 🎯 PRÓXIMOS PASSOS - AlquimistaAI

**Data:** 16 de novembro de 2025  
**Status Atual:** FASE 1 85% concluída  
**Próxima Ação:** Finalizar ajustes do frontend

---

## 🚀 AÇÃO IMEDIATA (5 minutos)

### Finalizar Correções do Frontend

Adicionar `export const dynamic = 'force-dynamic';` no topo de 5 arquivos:

#### 1. frontend/src/app/(fibonacci)/health/page.tsx
```typescript
export const dynamic = 'force-dynamic';

export default function FibonacciHealthPage() {
  // ... resto do código
}
```

#### 2. frontend/src/app/(fibonacci)/integracoes/page.tsx
```typescript
export const dynamic = 'force-dynamic';

'use client';
// ... resto do código
```

#### 3. frontend/src/app/(institutional)/nigredo/page.tsx
```typescript
export const dynamic = 'force-dynamic';

'use client';
// ... resto do código
```

#### 4. frontend/src/app/(nigredo)/painel/page.tsx
```typescript
export const dynamic = 'force-dynamic';

'use client';
// ... resto do código
```

#### 5. frontend/src/app/(nigredo)/pipeline/page.tsx
```typescript
export const dynamic = 'force-dynamic';

'use client';
// ... resto do código
```

### Testar Build

```bash
cd frontend
npm run build
```

**Critério de Sucesso:** Build completo sem erros de pre-rendering

---

## 📋 FASE 2: DEPLOY EM PRODUÇÃO (30-40 minutos)

### Passo 1: Preparação (5 min)

```powershell
# Limpar cache CDK
Remove-Item -Recurse -Force cdk.out -ErrorAction SilentlyContinue

# Instalar dependências
npm install

# Compilar TypeScript
npm run build

# Validar sintaxe CDK
npm run synth
```

### Passo 2: Deploy das 3 Stacks (20-25 min)

```powershell
# Deploy completo (ambiente dev)
cdk deploy --all --context env=dev --require-approval never

# OU deploy individual (se preferir controle)
cdk deploy FibonacciStack-dev --context env=dev
cdk deploy NigredoStack-dev --context env=dev
cdk deploy AlquimistaStack-dev --context env=dev
```

**Recursos que serão criados:**
- VPC com 2 AZs (public + private isolated subnets)
- Aurora Serverless v2 PostgreSQL
- EventBridge custom bus
- SQS queues + DLQ
- Cognito User Pool
- S3 + CloudFront + WAF
- API Gateway HTTP API
- 16 Lambda Functions
- CloudWatch Dashboards (3)
- CloudWatch Alarms (5)
- KMS Key
- CloudTrail
- VPC Endpoints

### Passo 3: Capturar Outputs (2 min)

```powershell
# Salvar outputs em arquivo
cdk deploy --all --context env=dev --outputs-file outputs.json
```

**Outputs esperados:**
- API Gateway URLs (3 stacks)
- CloudFront URL
- Database endpoints
- Cognito User Pool ID
- EventBridge bus name

### Passo 4: Executar Migrações do Banco (3-5 min)

```bash
# Executar migrações
node scripts/migrate.js

# Executar seeds
node scripts/seed.js
```

**Migrações:**
1. `001_create_schemas.sql` - Schemas (fibonacci_core, nigredo_leads, alquimista_platform)
2. `002_create_leads_tables.sql` - Tabelas Nigredo
3. `003_create_platform_tables.sql` - Tabelas Alquimista
4. `004_create_core_tables.sql` - Tabelas Fibonacci
5. `005_create_approval_tables.sql` - Sistema de aprovação
6. `006_add_lgpd_consent.sql` - Conformidade LGPD
7. `007_create_nigredo_schema.sql` - Schema Nigredo adicional

### Passo 5: Smoke Tests (5 min)

```powershell
# Obter API URL do output
$API_URL = (Get-Content outputs.json | ConvertFrom-Json).FibonacciStackdev.ApiUrl

# Testar endpoint /health
curl "$API_URL/health"

# Testar criação de evento
curl -X POST "$API_URL/events" `
  -H "Content-Type: application/json" `
  -d '{"type":"test","data":{"message":"Hello from smoke test"}}'

# Testar webhook Nigredo
curl -X POST "$API_URL/public/nigredo-event" `
  -H "Content-Type: application/json" `
  -d '{
    "event_type":"lead.created",
    "timestamp":"2025-11-16T19:00:00Z",
    "lead":{
      "id":"test-123",
      "email":"test@test.com",
      "name":"Test Lead",
      "createdAt":"2025-11-16T19:00:00Z"
    }
  }'
```

### Passo 6: Validar Dashboards e Alarmes (3 min)

**Acessar CloudWatch Console:**

1. **Dashboard Fibonacci Core**
   - URL: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=FibonacciCore-dev

2. **Dashboard Nigredo Agents**
   - URL: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=NigredoAgents-dev

3. **Dashboard Business Metrics**
   - URL: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=BusinessMetrics-dev

**Verificar alarmes:**
- Error rate alarm (>10 erros em 2 min)
- Latency alarm (p95 >3s)
- DLQ alarm (mensagens na DLQ)
- Aurora CPU alarm (>80%)
- Cost alarm (acima do budget)

### Passo 7: Configurar Secrets (5 min)

**AWS Secrets Manager:**

```powershell
# WhatsApp Business API Key
aws secretsmanager create-secret `
  --name whatsapp-api-key `
  --description "WhatsApp Business API Key" `
  --secret-string "YOUR_API_KEY_HERE"

# Google Calendar OAuth Credentials
aws secretsmanager create-secret `
  --name google-calendar-credentials `
  --description "Google Calendar Service Account JSON" `
  --secret-string file://path/to/service-account.json

# Receita Federal API Key (opcional)
aws secretsmanager create-secret `
  --name receita-federal-api-key `
  --description "Receita Federal API Key" `
  --secret-string "YOUR_API_KEY_HERE"
```

### Passo 8: Documentar Deploy (2 min)

Criar arquivo `DEPLOY-OUTPUTS.md` com:
- URLs de produção
- Endpoints de API
- Credenciais (referências, não valores)
- Comandos úteis
- Troubleshooting

---

## 📊 CHECKLIST DE VALIDAÇÃO

### Antes do Deploy
- [ ] Frontend build passando
- [ ] Backend compilado
- [ ] CDK synth validado
- [ ] Variáveis de ambiente configuradas
- [ ] Documentação atualizada

### Durante o Deploy
- [ ] FibonacciStack deployada
- [ ] NigredoStack deployada
- [ ] AlquimistaStack deployada
- [ ] Outputs capturados
- [ ] Sem erros de dependência

### Após o Deploy
- [ ] Migrações executadas
- [ ] Seeds executados
- [ ] Smoke tests passando
- [ ] Dashboards acessíveis
- [ ] Alarmes configurados
- [ ] Secrets configurados
- [ ] Documentação criada

---

## 🎯 CRITÉRIOS DE SUCESSO

### FASE 1 (Correções Rápidas)
- [x] Dependências instaladas ✅
- [x] Conflitos de rotas resolvidos ✅
- [x] Payload padronizado ✅
- [x] Variável de ambiente configurada ✅
- [ ] Build do frontend passando (pendente ajuste final)

### FASE 2 (Deploy em Produção)
- [ ] 3 stacks deployadas com sucesso
- [ ] Todos os recursos AWS criados
- [ ] Migrações e seeds executados
- [ ] Smoke tests passando
- [ ] Dashboards funcionando
- [ ] Alarmes configurados
- [ ] Secrets configurados
- [ ] Sistema operacional

---

## 📞 COMANDOS RÁPIDOS

### Validação
```powershell
# Validar deploy
.\VALIDAR-DEPLOY.ps1

# Limpar stack falhada
.\limpar-stack.ps1

# Deploy limpo
.\deploy-limpo.ps1

# Deploy completo
.\deploy-alquimista.ps1
```

### Troubleshooting
```powershell
# Ver logs do Lambda
aws logs tail /aws/lambda/fibonacci-main-dev --follow

# Ver status da stack
aws cloudformation describe-stacks --stack-name FibonacciStack-dev

# Ver outputs
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query 'Stacks[0].Outputs'
```

---

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES

### Build do Frontend Falha
**Problema:** Erros de pre-rendering  
**Solução:** Adicionar `export const dynamic = 'force-dynamic'` nas páginas

### Deploy CDK Falha
**Problema:** Stack já existe  
**Solução:** `.\limpar-stack.ps1` e tentar novamente

### Migrações Falham
**Problema:** Banco não acessível  
**Solução:** Verificar security groups e VPC endpoints

### Smoke Tests Falham
**Problema:** API não responde  
**Solução:** Verificar logs do Lambda e API Gateway

---

## 📄 DOCUMENTOS DE REFERÊNCIA

- `STATUS-ATUAL-COMPLETO.md` - Status completo do sistema
- `FASE-1-RESUMO.md` - Resumo da FASE 1
- `PLANO-EXECUCAO-COMPLETO.md` - Plano completo de execução
- `AUDITORIA-PRE-DEPLOY-COMPLETA.md` - Auditoria detalhada
- `docs/deploy/TROUBLESHOOTING.md` - Solução de problemas

---

## 🎉 PRÓXIMO MILESTONE

**Objetivo:** Sistema deployado e operacional em ambiente de desenvolvimento

**Tempo Estimado:** 35-45 minutos (5 min frontend + 30-40 min deploy)

**Após Conclusão:** Sistema pronto para testes de integração e início da FASE 3 (System Completion)

---

**Criado por:** Kiro AI Assistant  
**Data:** 16 de novembro de 2025  
**Versão:** 1.0.0

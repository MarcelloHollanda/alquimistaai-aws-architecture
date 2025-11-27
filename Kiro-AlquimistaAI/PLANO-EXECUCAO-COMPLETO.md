# 🚀 PLANO DE EXECUÇÃO COMPLETO - AlquimistaAI

**Data:** 16 de novembro de 2025  
**Status:** EM EXECUÇÃO  
**Objetivo:** Deploy completo do sistema + melhorias incrementais

---

## 📊 VISÃO GERAL

### Status Atual
- ✅ Backend: 100% implementado
- ✅ Frontend: 100% implementado  
- ✅ Infraestrutura: 100% configurada
- ✅ Segurança: 100% implementada
- ✅ Documentação: 100% completa
- ⚠️ Auditoria: Identificou 5 problemas (2 críticos, 2 médios, 1 menor)

### Sequência de Execução
1. **FASE 1:** Correções Rápidas (12 min) - BLOQUEADORES
2. **FASE 2:** Deploy em Produção (30-40 min)
3. **FASE 3:** System Completion (Incremental)

---

## 🔧 FASE 1: CORREÇÕES RÁPIDAS (12 minutos)

### Objetivo
Resolver problemas críticos identificados na auditoria antes do deploy

### Tarefas

#### 1.1 Instalar Dependências Faltando (2 min)
**Status:** 🟡 PENDENTE  
**Prioridade:** 🔴 CRÍTICA

```bash
cd frontend
npm install react-hook-form @hookform/resolvers/zod @tanstack/react-query
```

**Motivo:** Dependências usadas em componentes mas não instaladas

---

#### 1.2 Resolver Conflito de Rotas (5 min)
**Status:** 🟡 PENDENTE  
**Prioridade:** 🔴 CRÍTICA

**Problema:** `/(institutional)/page.tsx` vs `/(nigredo)/page.tsx` - ambos na raiz `/`

**Solução:**
```powershell
# Mover página Nigredo para subpasta
New-Item -ItemType Directory -Path "frontend/src/app/(nigredo)/dashboard" -Force
Move-Item -Path "frontend/src/app/(nigredo)/page.tsx" -Destination "frontend/src/app/(nigredo)/dashboard/page.tsx"
```

**Atualizar link no layout:**
```typescript
// frontend/src/app/(nigredo)/layout.tsx linha ~88
<Link href="/nigredo/dashboard" ...>
  Painel
</Link>
```

---

#### 1.3 Padronizar Payload do Webhook (2 min)
**Status:** 🟡 PENDENTE  
**Prioridade:** 🟡 MÉDIA

**Problema:** Nigredo envia `eventType` (camelCase), Fibonacci espera `event_type` (snake_case)

**Arquivos a modificar:**
- `lambda/nigredo/shared/webhook-sender.ts` (linha ~30 e ~330)

**Mudança:**
```typescript
// Interface
export interface WebhookPayload {
  event_type: 'lead.created' | 'lead.updated';  // ← era eventType
  timestamp: string;
  lead: {...};
}

// Função
export function createLeadCreatedPayload(...): WebhookPayload {
  return {
    event_type: 'lead.created',  // ← era eventType
    timestamp: new Date().toISOString(),
    lead: {...}
  };
}
```

---

#### 1.4 Configurar Variável de Ambiente (1 min)
**Status:** 🟡 PENDENTE  
**Prioridade:** 🟡 MÉDIA

**Arquivo:** `lib/nigredo-stack.ts`

**Adicionar:**
```typescript
// No Lambda handler do create-lead
environment: {
  ...existingEnvVars,
  FIBONACCI_WEBHOOK_URL: `https://${fibonacciStack.httpApi.apiEndpoint}/public/nigredo-event`,
}
```

---

#### 1.5 Testar Build do Frontend (1 min)
**Status:** 🟡 PENDENTE  
**Prioridade:** 🔴 CRÍTICA

```bash
cd frontend
npm run build
```

**Critério de Sucesso:** Build passa sem erros

---

#### 1.6 Remover Imports Não Utilizados (1 min)
**Status:** 🟡 PENDENTE  
**Prioridade:** 🟢 BAIXA

**Arquivos:**
- `frontend/src/app/(fibonacci)/layout.tsx`: remover `Settings`, `GitBranch`
- `lambda/nigredo/create-lead.ts`: remover `tracer`

---

### Checklist FASE 1
- [ ] Dependências instaladas
- [ ] Conflito de rotas resolvido
- [ ] Link do layout atualizado
- [ ] Payload padronizado
- [ ] Variável de ambiente configurada
- [ ] Build passando sem erros
- [ ] Imports limpos

**Tempo Total Estimado:** 12 minutos

---

## 🚀 FASE 2: DEPLOY EM PRODUÇÃO (30-40 minutos)

### Objetivo
Executar deploy completo das 3 stacks e validar funcionamento

### Pré-requisitos
- ✅ FASE 1 completa
- ✅ Build do frontend passando
- ✅ Código compilado sem erros

### Tarefas

#### 2.1 Preparação do Deploy (5 min)
**Status:** 🟡 PENDENTE

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

---

#### 2.2 Deploy das 3 Stacks (20-25 min)
**Status:** 🟡 PENDENTE

```powershell
# Deploy completo (dev environment)
cdk deploy --all --context env=dev --require-approval never

# OU deploy individual
cdk deploy FibonacciStack-dev --context env=dev
cdk deploy NigredoStack-dev --context env=dev
cdk deploy AlquimistaStack-dev --context env=dev
```

**Recursos a serem criados:**
- VPC com 2 AZs
- Aurora Serverless v2
- EventBridge bus
- SQS queues + DLQ
- Cognito User Pool
- S3 + CloudFront + WAF
- API Gateway HTTP
- 16 Lambda Functions
- CloudWatch Dashboards + Alarms
- KMS Key
- CloudTrail
- VPC Endpoints

---

#### 2.3 Capturar Outputs (2 min)
**Status:** 🟡 PENDENTE

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

---

#### 2.4 Executar Migrações do Banco (3-5 min)
**Status:** 🟡 PENDENTE

```bash
# Executar migrações
node scripts/migrate.js

# Executar seeds
node scripts/seed.js
```

**Migrações:**
1. `001_create_schemas.sql`
2. `002_create_leads_tables.sql`
3. `003_create_platform_tables.sql`
4. `004_create_core_tables.sql`
5. `005_create_approval_tables.sql`
6. `006_add_lgpd_consent.sql`
7. `007_create_nigredo_schema.sql`

---

#### 2.5 Smoke Tests (5 min)
**Status:** 🟡 PENDENTE

```powershell
# Testar endpoint /health
curl https://[API-URL]/health

# Testar criação de evento
curl -X POST https://[API-URL]/events -H "Content-Type: application/json" -d '{"type":"test"}'

# Testar webhook Nigredo
curl -X POST https://[API-URL]/public/nigredo-event -H "Content-Type: application/json" -d '{"event_type":"lead.created","lead":{"id":"test","email":"test@test.com","name":"Test"}}'
```

---

#### 2.6 Validar Dashboards e Alarmes (3 min)
**Status:** 🟡 PENDENTE

**Acessar CloudWatch Console:**
1. Dashboard Fibonacci Core
2. Dashboard Nigredo Agents
3. Dashboard Business Metrics

**Verificar alarmes:**
- Error rate alarm
- Latency alarm
- DLQ alarm
- Aurora CPU alarm
- Cost alarm

---

#### 2.7 Configurar Secrets (5 min)
**Status:** 🟡 PENDENTE

**AWS Secrets Manager:**
1. `whatsapp-api-key` - WhatsApp Business API
2. `google-calendar-credentials` - Google Calendar OAuth
3. `receita-federal-api-key` - Receita Federal API (opcional)

---

#### 2.8 Documentar Deploy (2 min)
**Status:** 🟡 PENDENTE

Criar arquivo `DEPLOY-OUTPUTS.md` com:
- URLs de produção
- Endpoints de API
- Credenciais (referências, não valores)
- Comandos úteis

---

### Checklist FASE 2
- [ ] Cache CDK limpo
- [ ] Dependências instaladas
- [ ] TypeScript compilado
- [ ] CDK synth validado
- [ ] Deploy das 3 stacks completo
- [ ] Outputs capturados
- [ ] Migrações executadas
- [ ] Seeds executados
- [ ] Smoke tests passando
- [ ] Dashboards acessíveis
- [ ] Alarmes configurados
- [ ] Secrets configurados
- [ ] Documentação criada

**Tempo Total Estimado:** 30-40 minutos

---

## 🎨 FASE 3: SYSTEM COMPLETION (Incremental)

### Objetivo
Implementar melhorias de frontend e evolution plan de forma incremental

### Estrutura
Esta fase segue a spec `system-completion` com 10 phases:

1. **Backend Completion & Production Deploy** ✅ (coberto na FASE 2)
2. **Frontend - Homepage & Marketing** (5 dias)
3. **Frontend - Accessibility** (3 dias)
4. **Frontend - Security** (3 dias)
5. **Frontend - Internationalization** (3 dias)
6. **Evolution Plan - Phase 5 (Performance)** (5 dias)
7. **Evolution Plan - Phase 6 (Monitoring)** (5 dias)
8. **Integration & Testing** (5 dias)
9. **Documentation & Training** (3 dias)
10. **Production Readiness** (3 dias)

### Abordagem
- Executar após FASE 2 completa
- Implementar de forma incremental
- Priorizar baseado em necessidades do negócio
- Pode ser paralelizado com 2 desenvolvedores

### Próximos Passos
Após FASE 2, revisar prioridades com stakeholders e decidir:
- Quais phases implementar primeiro
- Recursos disponíveis
- Timeline desejado

---

## 📈 MÉTRICAS DE PROGRESSO

### FASE 1: Correções Rápidas
- **Progresso:** 0/6 tarefas (0%)
- **Tempo Estimado:** 12 minutos
- **Status:** 🟡 PENDENTE

### FASE 2: Deploy em Produção
- **Progresso:** 0/8 tarefas (0%)
- **Tempo Estimado:** 30-40 minutos
- **Status:** 🟡 PENDENTE

### FASE 3: System Completion
- **Progresso:** 0/10 phases (0%)
- **Tempo Estimado:** 38 dias (1 dev) ou 25 dias (2 devs)
- **Status:** 🟡 PENDENTE

---

## 🎯 CRITÉRIOS DE SUCESSO

### FASE 1
- ✅ Build do frontend passa sem erros
- ✅ Todas as dependências instaladas
- ✅ Conflitos de rotas resolvidos
- ✅ Payload padronizado

### FASE 2
- ✅ 3 stacks deployadas com sucesso
- ✅ Todos os recursos AWS criados
- ✅ Smoke tests passando
- ✅ Dashboards funcionando
- ✅ Alarmes configurados

### FASE 3
- ✅ Todas as phases implementadas
- ✅ Testes passando
- ✅ Documentação completa
- ✅ Sistema pronto para produção

---

## 📞 SUPORTE E TROUBLESHOOTING

### Documentos de Referência
- `AUDITORIA-PRE-DEPLOY-COMPLETA.md` - Auditoria detalhada
- `CORRECOES-RAPIDAS.md` - Guia de correções
- `PRE-DEPLOY-SUMMARY.md` - Sumário pré-deploy
- `docs/deploy/TROUBLESHOOTING.md` - Solução de problemas

### Scripts Úteis
```powershell
# Limpar stack falhada
.\limpar-stack.ps1

# Deploy limpo
.\deploy-limpo.ps1

# Validar deploy
.\VALIDAR-DEPLOY.ps1

# Deploy completo
.\deploy-alquimista.ps1
```

### Contatos
- **Documentação:** Ver `docs/` folder
- **Issues:** GitHub Issues
- **Suporte:** Kiro AI Assistant

---

**Criado por:** Kiro AI Assistant  
**Data:** 16 de novembro de 2025  
**Versão:** 1.0.0  
**Status:** 🟡 EM EXECUÇÃO

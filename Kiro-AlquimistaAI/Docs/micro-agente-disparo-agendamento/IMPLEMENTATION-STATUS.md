# Status de Implementação · Micro Agente de Disparos & Agendamentos

## Última Atualização: 2024-11-27

---

## 📊 Resumo Executivo

**Progresso Geral**: 35% (Infraestrutura base + Ingestão parcial)

**Status Atual**: Implementação em andamento - Fase de Dry-Run

---

## 1. Comparação: Spec vs Realidade

### 1.1. Estrutura de Código

| Componente | Spec | Realidade | Status |
|------------|------|-----------|--------|
| Estrutura de diretórios | `lambda-src/agente-disparo-agenda/` | ✅ Existe | ✅ OK |
| package.json | Dependências definidas | ✅ Configurado | ✅ OK |
| tsconfig.json | TypeScript configurado | ✅ Existe | ✅ OK |
| Handlers | 7 handlers previstos | 9 handlers existentes | ⚠️ Divergente |

**Handlers Previstos na Spec:**
1. `ingest.ts` - Ingest Handler
2. `ingest-processor.ts` - Ingest Processor
3. `disparo.ts` - Disparo Handler
4. `disparo-executor.ts` - Disparo Executor
5. `agendamento.ts` - Agendamento Handler
6. `leads-query.ts` - Leads Query
7. `job-status.ts` - Job Status

**Handlers Existentes:**
1. ✅ `ingest-contacts.ts` - Equivalente a ingest-processor
2. ✅ `send-messages.ts` - Equivalente a disparo-executor
3. ✅ `schedule-meeting.ts` - Equivalente a agendamento
4. ✅ `confirm-meeting.ts` - Não previsto na spec
5. ✅ `handle-replies.ts` - Não previsto na spec
6. ✅ `send-reminders.ts` - Não previsto na spec
7. ✅ `generate-briefing.ts` - Não previsto na spec
8. ✅ `api-handler.ts` - Handler genérico de API
9. ⚠️ Pasta `ingestao/` separada com handlers específicos

---

### 1.2. Banco de Dados

| Tabela | Spec | Realidade | Status |
|--------|------|-----------|--------|
| `leads` | ✅ Definida | ❌ Não criada | 🔴 Pendente |
| `lead_telefones` | ✅ Definida | ❌ Não criada | 🔴 Pendente |
| `lead_emails` | ✅ Definida | ❌ Não criada | 🔴 Pendente |
| `disparos` | ✅ Definida | ❌ Não criada | 🔴 Pendente |
| `agendamentos` | ✅ Definida | ❌ Não criada | 🔴 Pendente |
| `ingest_jobs` | ✅ Definida | ❌ Não criada | 🔴 Pendente |

**Migrations Necessárias:**
- `001_create_leads_table.sql`
- `002_create_lead_telefones_table.sql`
- `003_create_lead_emails_table.sql`
- `004_create_disparos_table.sql`
- `005_create_agendamentos_table.sql`
- `006_create_ingest_jobs_table.sql`
- `007_create_dry_run_log_table.sql` (novo, para dry-run)

---

### 1.3. Infraestrutura AWS (Terraform)

| Recurso | Spec | Realidade | Status |
|---------|------|-----------|--------|
| Módulo Terraform | `terraform/modules/agente_disparo_agenda/` | ❌ Não encontrado | 🔴 Pendente |
| API Gateway HTTP | ✅ Previsto | ❌ Não configurado | 🔴 Pendente |
| Lambdas | 7 Lambdas | Código existe, infra não | ⚠️ Parcial |
| EventBridge Rules | ✅ Previsto | ❌ Não configurado | 🔴 Pendente |
| S3 Bucket (ingestão) | ✅ Previsto | ❌ Não criado | 🔴 Pendente |
| IAM Roles | ✅ Previsto | ❌ Não configurado | 🔴 Pendente |

---

### 1.4. Secrets Manager

| Secret | Spec | Realidade | Status |
|--------|------|-----------|--------|
| `/alquimista/dev/disparo-agenda/mcp-whatsapp` | ✅ Previsto | ❓ Não verificado | ⚠️ Verificar |
| `/alquimista/dev/disparo-agenda/mcp-email` | ✅ Previsto | ❓ Não verificado | ⚠️ Verificar |
| `/alquimista/dev/disparo-agenda/db-credentials` | ✅ Previsto | ❓ Não verificado | ⚠️ Verificar |

**Nota**: Existe script `create-secrets.ps1` que pode criar esses secrets.

---

### 1.5. Integrações MCP

| Integração | Spec | Realidade | Status |
|------------|------|-----------|--------|
| MCP WhatsApp | ✅ Previsto | ❓ Não testado | ⚠️ Verificar |
| MCP Email | ✅ Previsto | ❓ Não testado | ⚠️ Verificar |
| MCP Calendar | ✅ Previsto (Fase 2) | ❓ Não testado | ⚠️ Futuro |

---

## 2. Lacunas Identificadas

### 2.1. Lacunas Críticas (Bloqueiam Dry-Run)

1. **❌ Tabelas de banco não criadas**
   - Impacto: Impossível persistir leads e disparos
   - Solução: Executar migrations

2. **❌ Infraestrutura Terraform não existe**
   - Impacto: Lambdas não podem ser deployadas
   - Solução: Criar módulo Terraform completo

3. **❌ Ausência de fluxo dry-run**
   - Impacto: Não há como testar sem disparar mensagens reais
   - Solução: Implementar handler dry-run (esta sessão)

### 2.2. Lacunas de Lógica de Negócio

1. **⚠️ Fonte de dados para o Micro Agente não está clara**
   - Spec menciona `Leads_Organizados.xlsx`
   - Realidade: Existe `Leads_Consolidados_Telefones_Emails_DEDUP.xlsx`
   - Solução: Definir fonte oficial e criar view/endpoint

2. **⚠️ Máquina de estados do lead não implementada**
   - Spec define estados: novo, em_disparo, agendado, etc.
   - Realidade: Não há código para transições de estado
   - Solução: Implementar state machine

3. **⚠️ Rate limiting não implementado**
   - Spec define limites por tenant e canal
   - Realidade: Não há controle de taxa
   - Solução: Implementar rate limiter

---

## 3. Implementação do Fluxo Dry-Run (Esta Sessão)

### 3.1. Objetivo

Criar um fluxo mínimo end-to-end que:
1. Lê 1 lead (ou pequeno lote) da fonte `Leads_Consolidados_Telefones_Emails`
2. Decide qual canal usar (WhatsApp / Email / Agenda)
3. **NÃO dispara** mensagens reais quando `MICRO_AGENT_DISPARO_ENABLED != "true"`
4. Registra o "disparo pretendido" em log e tabela de auditoria

### 3.1.1. Status do Fluxo Dry-Run

**Antes desta sessão:**
- ✅ Handler `dry-run.ts` já existia (implementado em sessão anterior)
- ✅ Módulo `canal-decision.ts` já existia
- ✅ Migration `007_create_dry_run_log_table.sql` já existia
- ✅ Documentação `DRY-RUN-IMPLEMENTATION.md` já existia
- ❌ Lambda dry-run não estava configurada no Terraform
- ❌ Variável `MICRO_AGENT_DISPARO_ENABLED` não estava documentada na spec

**Depois desta sessão:**
- ✅ Lambda dry-run adicionada ao Terraform (`lambda_dry_run.tf`)
- ✅ Variável `MICRO_AGENT_DISPARO_ENABLED` configurada
- ✅ Spec atualizada com seção de fluxo dry-run
- ✅ IMPLEMENTATION-STATUS atualizado
- ✅ Pronto para testes locais e deploy

### 3.2. Componentes a Criar

#### 3.2.1. Handler Dry-Run

**Arquivo**: `lambda-src/agente-disparo-agenda/src/handlers/dry-run.ts`

**Responsabilidades**:
- Ler 1 lead de teste da fonte
- Aplicar lógica de decisão de canal
- Registrar disparo pretendido (não executar)
- Logar em CloudWatch
- Persistir em tabela `dry_run_log`

**Variáveis de Ambiente**:
```typescript
{
  MICRO_AGENT_DISPARO_ENABLED: string; // "false" por padrão
  DB_SECRET_ARN: string;
  EVENT_BUS_NAME: string;
}
```

#### 3.2.2. Tabela de Auditoria Dry-Run

**Migration**: `007_create_dry_run_log_table.sql`

```sql
CREATE TABLE dry_run_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lead_id UUID,
  lead_nome VARCHAR(500),
  lead_telefone VARCHAR(50),
  lead_email VARCHAR(255),
  
  canal_decidido VARCHAR(20), -- 'whatsapp' | 'email' | 'calendar'
  motivo_decisao TEXT,
  template_selecionado VARCHAR(100),
  
  disparo_seria_executado BOOLEAN DEFAULT TRUE,
  razao_bloqueio TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dry_run_tenant ON dry_run_log(tenant_id, created_at);
CREATE INDEX idx_dry_run_canal ON dry_run_log(canal_decidido);
```

#### 3.2.3. Lógica de Decisão de Canal

```typescript
interface CanalDecision {
  canal: 'whatsapp' | 'email' | 'calendar' | 'none';
  motivo: string;
  template?: string;
}

function decidirCanal(lead: Lead): CanalDecision {
  // 1. Prioridade: WhatsApp (se houver telefone válido)
  if (lead.telefones && lead.telefones.length > 0) {
    const telefoneValido = lead.telefones.find(t => t.valido_para_disparo);
    if (telefoneValido) {
      return {
        canal: 'whatsapp',
        motivo: 'Lead possui telefone válido para WhatsApp',
        template: 'cobranca_padrao_whatsapp_v1'
      };
    }
  }
  
  // 2. Fallback: Email (se houver email válido)
  if (lead.emails && lead.emails.length > 0) {
    const emailValido = lead.emails.find(e => e.valido_para_disparo);
    if (emailValido) {
      return {
        canal: 'email',
        motivo: 'Lead não possui telefone, mas possui email válido',
        template: 'cobranca_padrao_email_v1'
      };
    }
  }
  
  // 3. Sem canal disponível
  return {
    canal: 'none',
    motivo: 'Lead não possui telefone nem email válidos'
  };
}
```

### 3.3. Fonte de Dados

**Decisão**: Criar view temporária que aponta para `Leads_Consolidados_Telefones_Emails`

**Migration**: `008_create_leads_consolidados_view.sql`

```sql
-- View temporária até termos a tabela leads populada
CREATE OR REPLACE VIEW leads_para_disparo AS
SELECT 
  gen_random_uuid() AS lead_id,
  'consolidados' AS tenant_id,
  'Leads_Consolidados_Telefones_Emails_DEDUP.xlsx:' || ROW_NUMBER() OVER() AS lead_id_externo,
  "Empresa" AS nome,
  "Contato" AS contato_nome,
  "CNPJ/CPF" AS documento,
  "Email" AS email_raw,
  "Telefone" AS telefone_raw,
  'novo' AS status
FROM leads_consolidados_temp
LIMIT 10; -- Apenas para testes
```

**Nota**: Esta view é temporária. Na implementação final, os dados virão da tabela `leads` após ingestão.

---

## 4. Próximos Passos

### 4.1. Imediatos (Esta Sessão)

- [x] Criar documento de status (este arquivo)
- [ ] Criar migration `007_create_dry_run_log_table.sql`
- [ ] Criar handler `dry-run.ts`
- [ ] Criar módulo compartilhado `canal-decision.ts`
- [ ] Atualizar `SPEC-TECNICA.md` com seção de dry-run
- [ ] Documentar variável de ambiente `MICRO_AGENT_DISPARO_ENABLED`

### 4.2. Curto Prazo (Próximas Sessões)

- [ ] Executar todas as migrations de banco
- [ ] Criar módulo Terraform completo
- [ ] Implementar ingestão real de `Leads_Organizados.xlsx`
- [ ] Testar fluxo dry-run end-to-end
- [ ] Implementar rate limiting

### 4.3. Médio Prazo

- [ ] Implementar máquina de estados do lead
- [ ] Integrar com MCP WhatsApp/Email (disparos reais)
- [ ] Implementar retry logic
- [ ] Configurar alarmes CloudWatch
- [ ] Deploy em ambiente dev

---

## 5. Riscos e Dependências

### 5.1. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Fonte de dados não está clara | Alta | Alto | Definir fonte oficial nesta sessão |
| Terraform não existe | Alta | Alto | Criar módulo mínimo |
| MCP Servers não configurados | Média | Médio | Testar em dry-run primeiro |

### 5.2. Dependências Externas

- **Aurora Serverless v2**: Cluster dev deve estar provisionado
- **EventBridge**: Bus `fibonacci-bus-dev` deve existir
- **Secrets Manager**: Secrets MCP devem ser criados
- **MCP Servers**: Devem estar acessíveis para testes

---

## 6. Decisões de Arquitetura

### D-01: Usar View Temporária para Fonte de Dados

**Contexto**: Não está claro se a fonte é `Leads_Organizados.xlsx` ou `Leads_Consolidados_Telefones_Emails_DEDUP.xlsx`

**Decisão**: Criar view temporária apontando para dados consolidados até definir fluxo oficial

**Justificativa**: Permite testar dry-run sem bloquear por definição de fonte

---

### D-02: Feature Flag para Dry-Run

**Contexto**: Precisamos testar sem disparar mensagens reais

**Decisão**: Usar variável de ambiente `MICRO_AGENT_DISPARO_ENABLED` (default: `"false"`)

**Justificativa**: Segurança - evita disparos acidentais em dev

---

### D-03: Tabela Separada para Logs Dry-Run

**Contexto**: Precisamos auditar decisões de canal sem poluir tabela `disparos`

**Decisão**: Criar tabela `dry_run_log` específica

**Justificativa**: Separação de concerns - logs de teste vs disparos reais

---

## 7. Métricas de Progresso

### 7.1. Por Fase

| Fase | Progresso | Status |
|------|-----------|--------|
| Fase 1: Infraestrutura Base | 60% | 🟡 Em Andamento |
| Fase 2: Implementação Lambdas | 30% | 🟡 Em Andamento |
| Fase 3: Terraform | 0% | 🔴 Não Iniciado |
| Fase 4: Testes | 0% | 🔴 Não Iniciado |
| Fase 5: Deploy | 0% | 🔴 Não Iniciado |

### 7.2. Por Componente

| Componente | Progresso | Notas |
|------------|-----------|-------|
| Estrutura de código | 100% | ✅ Completo |
| Handlers | 40% | Existem, mas não seguem spec exatamente |
| Banco de dados | 0% | Migrations não executadas |
| Terraform | 0% | Módulo não existe |
| Dry-Run | 10% | Iniciando nesta sessão |

---

**Mantido por**: Equipe AlquimistaAI  
**Próxima Revisão**: Após implementação do dry-run

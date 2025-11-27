# Micro Agente de Disparos & Agendamentos

Sistema integrado de disparo automático de mensagens e agendamento inteligente de reuniões para o ecossistema Alquimista.AI.

---

## 📋 Documentação

### Documentos Principais

1. **[SPEC-TECNICA.md](./SPEC-TECNICA.md)** - ⭐ Spec técnica completa (COMECE AQUI)
2. **[requirements.md](./requirements.md)** - Requisitos funcionais e não-funcionais
3. **[design.md](./design.md)** - Design técnico e arquitetura
4. **[tasks.md](./tasks.md)** - Tarefas de implementação
5. **[FLUXO-INGESTAO-LEADS.md](./FLUXO-INGESTAO-LEADS.md)** - Fluxo oficial de ingestão de leads
6. **[IMPLEMENTACAO-INGESTAO.md](./IMPLEMENTACAO-INGESTAO.md)** - Implementação técnica da ingestão

### Blueprints de Referência

- **Blueprint Disparo & Agendamento**: Ver `.kiro/steering/blueprint-disparo-agendamento.md`
- **Contexto do Projeto**: Ver `.kiro/steering/contexto-projeto-alquimista.md`

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    MICRO AGENTE                              │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Ingestão   │  │   Disparo    │  │ Agendamento  │     │
│  │   de Leads   │  │  Automático  │  │  Inteligente │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ↓                  ↓                  ↓
    ┌─────────┐        ┌─────────┐       ┌─────────┐
    │ Aurora  │        │   MCP   │       │ Google  │
    │   DB    │        │ Servers │       │Calendar │
    └─────────┘        └─────────┘       └─────────┘
```

---

## 🚀 Quick Start

### 1. Pré-requisitos

- Node.js 20+
- AWS CLI configurado
- Acesso ao Aurora PostgreSQL
- Credenciais AWS com permissões adequadas

### 2. Setup do Banco de Dados

```bash
# Executar schema SQL
psql -h <aurora-endpoint> -U admin -d alquimista -f schema-ingestao.sql
```

### 3. Build da Lambda de Ingestão

```powershell
# Build e deploy
.\build-ingestao-lambda.ps1 -Environment dev

# Apenas build (sem upload)
.\build-ingestao-lambda.ps1 -Environment dev -SkipUpload
```

### 4. Testar Ingestão

```powershell
# Upload de arquivo de teste para S3
aws s3 cp Leads_Organizados.xlsx s3://alquimista-leads-input-dev/test/

# Monitorar logs
aws logs tail /aws/lambda/alquimista-ingestao-leads-dev --follow
```

---

## 📊 Componentes

### 1. Ingestão de Leads

**Função**: Processar planilhas Excel e popular banco de dados

**Trigger**: Upload de arquivo `.xlsx` no S3 bucket `alquimista-leads-input-{env}`

**Entrada**: `Leads_Organizados.xlsx` com aba `Leads`

**Saída**: 
- Tabela `leads` populada
- Tabelas `lead_telefones` e `lead_emails` com contatos explodidos
- Evento publicado no EventBridge

**Código**: `lambda-src/agente-disparo-agenda/ingestao/`

### 2. Disparo Automático

**Função**: Enviar mensagens via WhatsApp/Email respeitando rate limits

**Trigger**: EventBridge Scheduler (cron) ou evento de campanha

**Características**:
- Rate limiting por tenant e canal
- Respeita horários comerciais
- Humanização com variações de tempo
- Retry com backoff exponencial

**Status**: Em desenvolvimento

### 3. Agendamento Inteligente

**Função**: Agendar reuniões via Google Calendar

**Trigger**: Evento de solicitação de agendamento

**Características**:
- Consulta disponibilidade
- Propõe 3 horários
- Gera briefing automático
- Envia lembretes

**Status**: Em desenvolvimento

---

## 🗄️ Schema do Banco de Dados

### Tabelas Principais

#### `leads`
- Armazena informações básicas do lead
- Campos: `lead_id`, `lead_id_externo`, `nome`, `documento`, `email_raw`, `telefone_raw`, `status`, `tags`

#### `lead_telefones`
- Telefones explodidos de cada lead
- Campos: `telefone_id`, `lead_id`, `telefone`, `telefone_principal`, `tipo_origem`, `valido_para_disparo`

#### `lead_emails`
- Emails explodidos de cada lead
- Campos: `email_id`, `lead_id`, `email`, `email_principal`, `valido_para_disparo`

### Views Úteis

- `v_leads_com_contatos` - Leads com contatos principais agregados
- `v_stats_ingestao` - Estatísticas de ingestão por arquivo

### Funções

- `get_leads_para_disparo(limit, status)` - Busca leads prontos para disparo

---

## 🔧 Scripts Disponíveis

### Build e Deploy

```powershell
# Build completo com upload
.\build-ingestao-lambda.ps1 -Environment dev

# Build sem upload
.\build-ingestao-lambda.ps1 -Environment dev -SkipUpload

# Apenas upload (sem rebuild)
.\build-ingestao-lambda.ps1 -Environment dev -SkipBuild
```

### Validação

```powershell
# Validar variáveis Terraform
.\validate-terraform-vars.ps1 -Environment dev

# Criar secrets no AWS Secrets Manager
.\create-secrets.ps1 -Environment dev
```

---

## 📈 Monitoramento

### Logs

```bash
# Lambda de ingestão
aws logs tail /aws/lambda/alquimista-ingestao-leads-dev --follow

# Lambda de disparo
aws logs tail /aws/lambda/alquimista-disparo-dev --follow

# Lambda de agendamento
aws logs tail /aws/lambda/alquimista-agendamento-dev --follow
```

### Métricas CloudWatch

- `IngestaoLeadsProcessados` - Total de leads processados
- `IngestaoErros` - Total de erros na ingestão
- `MessagesSent` - Mensagens enviadas por canal
- `MeetingsScheduled` - Reuniões agendadas

### Queries Úteis

```sql
-- Total de leads por status
SELECT status, COUNT(*) 
FROM leads 
GROUP BY status;

-- Leads com contatos válidos
SELECT COUNT(*) 
FROM leads l
WHERE EXISTS (
    SELECT 1 FROM lead_emails e 
    WHERE e.lead_id = l.lead_id 
    AND e.valido_para_disparo = TRUE
)
OR EXISTS (
    SELECT 1 FROM lead_telefones t 
    WHERE t.lead_id = l.lead_id 
    AND t.valido_para_disparo = TRUE
);

-- Estatísticas de ingestão
SELECT * FROM v_stats_ingestao;
```

---

## 🧪 Testes

### Teste Local

```bash
cd lambda-src/agente-disparo-agenda
npm test
```

### Teste de Integração

```bash
# Fazer upload de arquivo de teste
aws s3 cp test-data/Leads_Organizados.xlsx s3://alquimista-leads-input-dev/test/

# Verificar resultado
aws logs tail /aws/lambda/alquimista-ingestao-leads-dev --follow
```

---

## 🔐 Segurança

### Secrets Manager

Todos os secrets devem estar em:
- `/alquimista/dev/aurora/*` - Credenciais do banco
- `/alquimista/dev/mcp/*` - Credenciais dos MCP servers
- `/alquimista/dev/google-calendar/*` - Credenciais do Google Calendar

### IAM Permissions

A Lambda precisa de:
- `s3:GetObject` no bucket de input
- `secretsmanager:GetSecretValue` nos secrets
- `events:PutEvents` no EventBridge
- Acesso ao Aurora via Security Group

---

## 📝 Próximos Passos

### Fase 1: MVP (Atual)
- [x] Schema do banco de dados
- [x] Lambda de ingestão
- [x] Parser de XLSX
- [x] Validações e transformações
- [ ] Testes unitários
- [ ] Deploy em dev

### Fase 2: Disparo
- [ ] Lambda de disparo
- [ ] Integração com MCP WhatsApp
- [ ] Integração com MCP Email
- [ ] Rate limiting
- [ ] Scheduler EventBridge

### Fase 3: Agendamento
- [ ] Lambda de agendamento
- [ ] Integração com Google Calendar
- [ ] Geração de briefings
- [ ] Sistema de lembretes

---

## 🤝 Contribuindo

Este é um projeto interno da Alquimista.AI. Para contribuir:

1. Siga os padrões definidos nos blueprints
2. Mantenha a documentação atualizada
3. Teste localmente antes de fazer deploy
4. Use os scripts fornecidos para build e deploy

---

## 📞 Suporte

- **Email**: alquimistafibonacci@gmail.com
- **WhatsApp**: +55 84 99708-4444

---

**Última atualização**: 2024-11-26  
**Versão**: 1.0.0  
**Mantido por**: Equipe AlquimistaAI

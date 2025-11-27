# 🗄️ Supabase Migrations - AlquimistaAI

---

## ⚠️ Status Atual (Janeiro 2025)

**IMPORTANTE**: A arquitetura oficial de produção da AlquimistaAI para o Fibonacci Orquestrador é:

✅ **Lambda + API Gateway + Aurora PostgreSQL + DynamoDB (AWS)**

O conteúdo deste diretório sobre Supabase é mantido como:
- 📚 Referência histórica
- 🧪 Laboratório opcional para testes locais
- 📖 Documentação de migração (caso necessário no futuro)

**NÃO faz parte do fluxo oficial de deploy em produção.**

Para o fluxo oficial de banco de dados, consulte:
- `database/RESUMO-AURORA-OFICIAL.md` - Visão geral Aurora
- `database/COMANDOS-RAPIDOS-AURORA.md` - Comandos Windows
- `database/AURORA-MIGRATIONS-AUDIT.md` - Auditoria completa

---

## 📚 Índice de Documentação (Supabase - Legado/Opcional)

### 🚀 Início Rápido
1. **[RESUMO-EXECUTIVO.md](./RESUMO-EXECUTIVO.md)** ⭐ **COMECE AQUI**
   - Visão geral do que foi feito
   - Como aplicar em 3 passos
   - Checklist de segurança

2. **[COMANDOS-RAPIDOS.md](./COMANDOS-RAPIDOS.md)** ⚡ **REFERÊNCIA RÁPIDA**
   - Comandos prontos para copiar/colar
   - Verificação e troubleshooting
   - Monitoramento e debugging

### 📖 Documentação Completa
3. **[MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)** 📘 **GUIA COMPLETO**
   - Instruções detalhadas passo a passo
   - Troubleshooting avançado
   - Configuração de segurança (RLS)

4. **[migrations/README.md](./migrations/README.md)** 🔧 **DOCUMENTAÇÃO TÉCNICA**
   - Estrutura das migrations
   - Dependências entre migrations
   - Detalhes de implementação

### 📦 Arquivos de Migration
5. **[migrations/001_004_consolidated_base_schema.sql](./migrations/001_004_consolidated_base_schema.sql)** 💾 **ARQUIVO PRINCIPAL**
   - Migration consolidada 001-004
   - Pronto para executar no Supabase

6. **[migrations/verify_001_004.sql](./migrations/verify_001_004.sql)** ✅ **VERIFICAÇÃO**
   - Script de verificação automática
   - Valida instalação completa

---

## 🎯 Fluxo Recomendado

```
1. Ler RESUMO-EXECUTIVO.md (5 min)
         ↓
2. Aplicar migration no Supabase (5 min)
         ↓
3. Executar verify_001_004.sql (2 min)
         ↓
4. Configurar RLS usando COMANDOS-RAPIDOS.md (10 min)
         ↓
5. Consultar MIGRATION-GUIDE.md para próximos passos
```

---

## 📊 O Que Está Incluído

### ✅ Migrations 001-004 (Consolidadas)

| Migration | Descrição | Tabelas |
|-----------|-----------|---------|
| **001** | Schemas | 3 schemas |
| **002** | Nigredo Leads | 6 tabelas |
| **003** | Alquimista Platform | 6 tabelas |
| **004** | Fibonacci Core | 3 tabelas |
| **Total** | **Base Completa** | **15 tabelas** |

### 📋 Estrutura Criada

```
fibonacci_core/          (Orquestração)
├── events              ← Histórico de eventos
├── traces              ← Rastreamento distribuído
└── metrics             ← Métricas agregadas

nigredo_leads/          (Prospecção)
├── leads               ← Informações de leads
├── campanhas           ← Campanhas de marketing
├── interacoes          ← Histórico de interações
├── agendamentos        ← Reuniões agendadas
├── metricas_diarias    ← Métricas agregadas
└── blocklist           ← LGPD compliance

alquimista_platform/    (Plataforma SaaS)
├── tenants             ← Empresas clientes
├── users               ← Usuários do sistema
├── agents              ← Catálogo de agentes IA
├── agent_activations   ← Agentes ativos por tenant
├── permissions         ← Controle de acesso
└── audit_logs          ← Trilha de auditoria
```

---

## 🚀 Quick Start (3 Passos)

### 1️⃣ Abrir Supabase
```
https://app.supabase.com → Seu Projeto → SQL Editor
```

### 2️⃣ Executar Migration
```
Copiar: migrations/001_004_consolidated_base_schema.sql
Colar no SQL Editor
Run (Ctrl+Enter)
```

### 3️⃣ Verificar
```sql
SELECT * FROM public.migrations ORDER BY applied_at DESC;
-- Esperado: 4 registros
```

---

## ⚠️ Importante

### ✅ O Que Está Incluído
- 3 schemas completos
- 15 tabelas com relacionamentos
- 50+ indexes otimizados
- 8 triggers automáticos
- 2 functions utilitárias
- Documentação completa

### ❌ O Que NÃO Está Incluído
- Row Level Security (RLS) - **Você deve configurar**
- Migrations 005-010 - **Devem ser adaptadas**
- Seeds/Dados iniciais - **Devem ser inseridos**
- Políticas de acesso - **Configurar conforme necessidade**

---

## 🔐 Segurança

### Checklist Obrigatório

- [ ] **RLS habilitado** em todas as tabelas sensíveis
- [ ] **Políticas RLS** criadas para isolamento de tenants
- [ ] **Backup automático** configurado no Supabase
- [ ] **Logs de auditoria** monitorados
- [ ] **Secrets Manager** configurado para credenciais
- [ ] **Testes de segurança** realizados

### Configuração Rápida de RLS

Ver comandos completos em: [COMANDOS-RAPIDOS.md](./COMANDOS-RAPIDOS.md#-configurar-rls-segurança)

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE alquimista_platform.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE nigredo_leads.leads ENABLE ROW LEVEL SECURITY;
-- ... (ver arquivo completo)

-- Criar políticas de isolamento por tenant
CREATE POLICY tenant_isolation ON alquimista_platform.tenants
    FOR ALL USING (id = (auth.jwt() ->> 'tenant_id')::uuid);
-- ... (ver arquivo completo)
```

---

## 📈 Próximos Passos

### Imediato (Hoje)
1. ✅ Aplicar migration 001-004
2. ⏳ Verificar instalação
3. ⏳ Configurar RLS básico

### Curto Prazo (Esta Semana)
4. ⏳ Adaptar migrations 005-010
5. ⏳ Inserir seeds (dados iniciais)
6. ⏳ Testar conexões backend

### Médio Prazo (Próximas Semanas)
7. ⏳ Conectar APIs backend
8. ⏳ Testes de integração
9. ⏳ Deploy em produção

---

## 🔄 Migrations Pendentes (005-010)

Estas migrations existem no projeto AWS e precisam ser adaptadas:

| Migration | Arquivo | Descrição |
|-----------|---------|-----------|
| **005** | `create_approval_tables.sql` | Fluxos de aprovação |
| **006** | `add_lgpd_consent.sql` | Consentimento LGPD |
| **007** | `create_nigredo_schema.sql` | Schema adicional Nigredo |
| **008** | `create_billing_tables.sql` | Tabelas de billing |
| **009** | `create_subscription_tables.sql` | Sistema de assinaturas |
| **010** | `create_plans_structure.sql` | Estrutura de planos |

**Como adaptar**: Ver instruções em [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md#1-aplicar-migrations-restantes-005-010)

---

## 🆘 Troubleshooting

### Problemas Comuns

| Erro | Solução |
|------|---------|
| "schema already exists" | Ver [COMANDOS-RAPIDOS.md](./COMANDOS-RAPIDOS.md#rollback-reverter-migration) |
| "permission denied" | Usar usuário `postgres` ou role `service_role` |
| "relation already exists" | Dropar tabelas existentes ou comentar criação |
| Migration parcial | Ver [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md#migration-parcialmente-aplicada) |

### Suporte

1. Consultar [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md#-troubleshooting)
2. Verificar [Supabase Docs](https://supabase.com/docs)
3. Contatar equipe de desenvolvimento

---

## 📊 Monitoramento

### Queries Úteis

Ver comandos completos em: [COMANDOS-RAPIDOS.md](./COMANDOS-RAPIDOS.md#-monitoramento)

```sql
-- Ver tamanho das tabelas
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Ver índices não utilizados
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform')
    AND idx_scan = 0;
```

---

## 📚 Recursos Adicionais

### Documentação
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

### Ferramentas
- [Supabase Dashboard](https://app.supabase.com)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [pgAdmin](https://www.pgadmin.org/)

### Projeto Original
- [AWS Migrations](../database/migrations/)
- [AWS Seeds](../database/seeds/)
- [Documentação AWS](../database/README.md)

---

## 🎉 Conclusão

Você tem agora uma estrutura base completa e documentada para o AlquimistaAI no Supabase!

**Status**: ✅ Pronto para aplicar  
**Tempo estimado**: 5-10 minutos  
**Próximo passo**: Ler [RESUMO-EXECUTIVO.md](./RESUMO-EXECUTIVO.md)

---

## 📞 Contato

Para dúvidas ou suporte:
- Documentação: Arquivos neste diretório
- Supabase: https://supabase.com/docs
- Equipe: AlquimistaAI Team

---

**Versão**: 1.0.0  
**Data**: 2025-01-17  
**Autor**: AlquimistaAI Team  
**Status**: ✅ Pronto para uso

---

## 🗺️ Mapa de Navegação

```
supabase/
│
├── README.md (você está aqui) ← Índice principal
│
├── RESUMO-EXECUTIVO.md ⭐ ← Comece aqui
│   └── Visão geral + Quick start
│
├── COMANDOS-RAPIDOS.md ⚡ ← Referência rápida
│   └── Comandos prontos para usar
│
├── MIGRATION-GUIDE.md 📘 ← Guia completo
│   └── Instruções detalhadas
│
└── migrations/
    ├── README.md 🔧 ← Documentação técnica
    ├── 001_004_consolidated_base_schema.sql 💾 ← Arquivo principal
    └── verify_001_004.sql ✅ ← Verificação
```

**Dica**: Salve este README como favorito para acesso rápido!

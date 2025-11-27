# 📑 Índice: Sistema de Assinatura - Database

## 📂 Estrutura de Arquivos

```
database/
├── migrations/
│   ├── 009_create_subscription_tables.sql    # Migration principal
│   └── README-009.md                          # Documentação da migration
├── seeds/
│   ├── 004_subscription_test_data.sql         # Dados de teste
│   └── README-004.md                          # Documentação do seed
├── SUBSCRIPTION-SYSTEM-INDEX.md               # Este arquivo
├── SUBSCRIPTION-SYSTEM-QUICK-START.md         # Guia rápido
├── SUBSCRIPTION-SYSTEM-VISUAL-GUIDE.md        # Guia visual
└── TASK-1-IMPLEMENTATION-SUMMARY.md           # Resumo da implementação

```

## 📋 Documentos por Propósito

### 🚀 Para Começar Rapidamente
- **[SUBSCRIPTION-SYSTEM-QUICK-START.md](./SUBSCRIPTION-SYSTEM-QUICK-START.md)**
  - Comandos de execução
  - Verificação rápida
  - Queries úteis
  - Troubleshooting básico

### 📊 Para Entender a Estrutura
- **[SUBSCRIPTION-SYSTEM-VISUAL-GUIDE.md](./SUBSCRIPTION-SYSTEM-VISUAL-GUIDE.md)**
  - Diagramas de tabelas
  - Relacionamentos
  - Fluxos de dados
  - Exemplos visuais

### 📖 Para Referência Técnica Completa
- **[migrations/README-009.md](./migrations/README-009.md)**
  - Detalhes de todas as tabelas
  - Índices e constraints
  - Funções e triggers
  - Queries avançadas
  - Manutenção

- **[seeds/README-004.md](./seeds/README-004.md)**
  - Lista completa de agentes
  - Lista completa de SubNúcleos
  - Customização de dados
  - Integração com frontend

### ✅ Para Acompanhar Implementação
- **[TASK-1-IMPLEMENTATION-SUMMARY.md](./TASK-1-IMPLEMENTATION-SUMMARY.md)**
  - Resumo do que foi implementado
  - Checklist de verificação
  - Próximos passos

## 🗂️ Tabelas Criadas

### Core do Sistema

| Tabela | Arquivo | Descrição |
|--------|---------|-----------|
| `trials` | 009_create_subscription_tables.sql | Testes gratuitos (24h/5 tokens) |
| `commercial_requests` | 009_create_subscription_tables.sql | Solicitações de contato comercial |
| `payment_events` | 009_create_subscription_tables.sql | Log de eventos de pagamento |

### Dados de Negócio

| Tabela | Arquivo | Descrição |
|--------|---------|-----------|
| `agents` | 004_subscription_test_data.sql | Agentes AlquimistaAI (R$ 29,90/mês) |
| `subnucleos` | 004_subscription_test_data.sql | SubNúcleos Fibonacci (R$ 365,00/mês base) |

## 🔧 Funções e Triggers

| Nome | Tipo | Descrição |
|------|------|-----------|
| `update_updated_at_column()` | Function | Atualiza `updated_at` automaticamente |
| `expire_trials()` | Function | Expira trials que atingiram limites |
| `update_trials_updated_at` | Trigger | Trigger em `trials` |
| `update_commercial_requests_updated_at` | Trigger | Trigger em `commercial_requests` |

## 📊 Dados Inseridos pelo Seed

### Agentes AlquimistaAI (12 total)

| Segmento | Quantidade | Agentes |
|----------|------------|---------|
| Atendimento | 1 | Atendimento AI |
| Vendas | 2 | Vendas AI, Qualificação de Leads AI |
| Marketing | 4 | Social Media AI, E-mail Marketing AI, SEO AI, Criação de Conteúdo AI |
| Suporte | 1 | Suporte Técnico AI |
| Análise | 2 | Análise de Sentimento AI, Relatórios AI |
| Produtividade | 1 | Agendamento AI |
| Financeiro | 1 | Cobrança AI |

**Preço:** R$ 29,90/mês cada

### SubNúcleos Fibonacci (8 total)

1. Saúde
2. Educação
3. Vendas B2B
4. Cobrança
5. Imobiliário
6. Jurídico
7. Varejo
8. Serviços

**Preço:** R$ 365,00/mês base + taxas sob consulta

## 🔗 Relacionamentos

```
tenants (existente)
  ↓ (1:N)
commercial_requests
  ↓ (JSONB)
[selected_agents, selected_subnucleos]

users (existente)
  ↓ (1:N)
trials
  ↓ (target_type + target_id)
agents OU subnucleos

tenants (existente)
  ↓ (1:N)
payment_events
  ↓ (provider_subscription_id)
[Gateway de Pagamento Externo]
```

## 📝 Comandos Rápidos

### Executar Migration
```bash
psql -h localhost -U postgres -d alquimista_dev \
  -f database/migrations/009_create_subscription_tables.sql
```

### Executar Seed
```bash
psql -h localhost -U postgres -d alquimista_dev \
  -f database/seeds/004_subscription_test_data.sql
```

### Verificar Instalação
```sql
-- Verificar tabelas
\dt trials commercial_requests payment_events

-- Verificar dados
SELECT COUNT(*) FROM agents WHERE status = 'active';      -- 12
SELECT COUNT(*) FROM subnucleos WHERE status = 'active';  -- 8
```

### Expirar Trials
```sql
SELECT expire_trials();
```

## 🎯 Casos de Uso

### 1. Usuário Inicia Trial
```sql
INSERT INTO trials (user_id, target_type, target_id, expires_at)
VALUES (
  '<user-id>',
  'agent',
  '<agent-id>',
  NOW() + INTERVAL '24 hours'
);
```

### 2. Usuário Usa Token de Trial
```sql
UPDATE trials
SET usage_count = usage_count + 1
WHERE user_id = '<user-id>'
  AND target_type = 'agent'
  AND target_id = '<agent-id>'
  AND usage_count < max_usage
  AND expires_at > NOW()
RETURNING *;
```

### 3. Cliente Solicita Contato Comercial
```sql
INSERT INTO commercial_requests (
  company_name, contact_name, email, whatsapp,
  selected_agents, selected_subnucleos, message
)
VALUES (
  'Empresa XYZ',
  'João Silva',
  'joao@empresa.com',
  '+5584999999999',
  '["agent-id-1", "agent-id-2"]'::jsonb,
  '["subnucleo-id-1"]'::jsonb,
  'Gostaria de uma proposta personalizada'
);
```

### 4. Registrar Evento de Pagamento
```sql
INSERT INTO payment_events (
  tenant_id, event_type, provider_subscription_id,
  amount, status, metadata
)
VALUES (
  '<tenant-id>',
  'checkout.session.completed',
  'sub_1234567890',
  89.70,
  'succeeded',
  '{"agents": ["agent-1", "agent-2", "agent-3"]}'::jsonb
);
```

## 🔍 Queries de Monitoramento

### Trials Ativos por Tipo
```sql
SELECT 
  target_type,
  COUNT(*) as total,
  AVG(usage_count) as avg_tokens_used
FROM trials
WHERE status = 'active'
GROUP BY target_type;
```

### Taxa de Conversão de Trials
```sql
SELECT 
  COUNT(DISTINCT t.user_id) as users_with_trials,
  COUNT(DISTINCT pe.tenant_id) as users_with_subscription,
  ROUND(
    COUNT(DISTINCT pe.tenant_id)::numeric / 
    NULLIF(COUNT(DISTINCT t.user_id), 0) * 100, 
    2
  ) as conversion_rate_pct
FROM trials t
LEFT JOIN payment_events pe ON pe.tenant_id::text = t.user_id::text;
```

### Solicitações Comerciais por Status
```sql
SELECT 
  status,
  COUNT(*) as total,
  AVG(jsonb_array_length(selected_subnucleos)) as avg_subnucleos
FROM commercial_requests
GROUP BY status
ORDER BY total DESC;
```

## 🚨 Alertas e Monitoramento

### Trials Próximos de Expirar
```sql
SELECT 
  user_id,
  target_type,
  target_id,
  expires_at,
  EXTRACT(EPOCH FROM (expires_at - NOW())) / 3600 as hours_left
FROM trials
WHERE status = 'active'
  AND expires_at < NOW() + INTERVAL '2 hours'
ORDER BY expires_at;
```

### Solicitações Comerciais Sem Resposta
```sql
SELECT 
  id,
  company_name,
  contact_name,
  email,
  created_at,
  NOW() - created_at as time_waiting
FROM commercial_requests
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '24 hours'
ORDER BY created_at;
```

## 📚 Referências Externas

### Specs do Projeto
- [Requirements](../.kiro/specs/alquimista-subscription-system/requirements.md)
- [Design](../.kiro/specs/alquimista-subscription-system/design.md)
- [Tasks](../.kiro/specs/alquimista-subscription-system/tasks.md)

### Documentação de Negócio
- [Catálogo de Agentes](../docs/ecosystem/CATALOGO-COMPLETO-AGENTES.md)
- [Modelo de Negócio](../docs/ecosystem/BUSINESS-MODEL.md)
- [Blueprint Comercial](../.kiro/steering/blueprint-comercial-assinaturas.md)

### Implementação
- [Lambda Handlers](../lambda/platform/)
- [Frontend Components](../frontend/src/components/billing/)
- [API Clients](../frontend/src/lib/)

## 🆘 Suporte

Para dúvidas ou problemas:

1. Consulte o [Quick Start](./SUBSCRIPTION-SYSTEM-QUICK-START.md)
2. Veja o [Guia Visual](./SUBSCRIPTION-SYSTEM-VISUAL-GUIDE.md)
3. Leia a documentação técnica completa
4. Verifique os logs de erro
5. Entre em contato com a equipe de desenvolvimento

## 📅 Histórico

- **2025-01-17**: Criação inicial (Migration 009 + Seed 004)
- **Próximo**: Implementação das APIs backend

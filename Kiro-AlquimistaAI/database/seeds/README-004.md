# Seed 004: Dados de Teste do Sistema de Assinatura

## Visão Geral

Este seed popula o banco de dados com agentes AlquimistaAI e SubNúcleos Fibonacci para testes do sistema de assinatura.

## Dados Inseridos

### Agentes AlquimistaAI (12 agentes)

Cada agente custa **R$ 29,90/mês**.

#### Por Segmento:

**Atendimento (1)**
- Atendimento AI

**Vendas (2)**
- Vendas AI
- Qualificação de Leads AI

**Marketing (4)**
- Social Media AI
- E-mail Marketing AI
- SEO AI
- Criação de Conteúdo AI

**Suporte (1)**
- Suporte Técnico AI

**Análise (2)**
- Análise de Sentimento AI
- Relatórios AI

**Produtividade (1)**
- Agendamento AI

**Financeiro (1)**
- Cobrança AI

### SubNúcleos Fibonacci (8 SubNúcleos)

Cada SubNúcleo tem preço base de **R$ 365,00/mês** + taxas de implementação e suporte (sob consulta).

**SubNúcleos disponíveis:**
1. **Saúde** - Clínicas, hospitais, consultórios
2. **Educação** - Instituições de ensino
3. **Vendas B2B** - Vendas corporativas
4. **Cobrança** - Recuperação de crédito
5. **Imobiliário** - Imobiliárias e construtoras
6. **Jurídico** - Escritórios de advocacia
7. **Varejo** - Lojas físicas e e-commerce
8. **Serviços** - Empresas de serviços

## Estrutura dos Dados

### Agentes

```sql
{
  id: UUID,
  name: string,
  segment: string,
  description: string,
  tags: JSON array,
  price_monthly: 29.90,
  status: 'active',
  created_at: timestamp
}
```

### SubNúcleos

```sql
{
  id: UUID,
  name: string,
  description: string,
  scope: string,
  base_price_monthly: 365.00,
  status: 'active',
  created_at: timestamp
}
```

## Como Executar

### Pré-requisitos

1. Migration 009 deve estar executada
2. Tabelas `agents` e `subnucleos` devem existir

### Desenvolvimento Local

```bash
psql -h localhost -U postgres -d alquimista_dev -f database/seeds/004_subscription_test_data.sql
```

### AWS RDS

```bash
psql -h <rds-endpoint> -U <username> -d alquimista -f database/seeds/004_subscription_test_data.sql
```

## Verificação

### Verificar agentes inseridos

```sql
SELECT 
  name,
  segment,
  price_monthly,
  array_length(tags::text[], 1) as num_tags
FROM agents
WHERE status = 'active'
ORDER BY segment, name;
```

Resultado esperado: **12 agentes**

### Verificar SubNúcleos inseridos

```sql
SELECT 
  name,
  base_price_monthly,
  LENGTH(scope) as scope_length
FROM subnucleos
WHERE status = 'active'
ORDER BY name;
```

Resultado esperado: **8 SubNúcleos**

### Verificar preços

```sql
-- Total se contratar todos os agentes
SELECT 
  COUNT(*) as total_agents,
  SUM(price_monthly) as total_monthly
FROM agents
WHERE status = 'active';
-- Resultado: 12 agentes × R$ 29,90 = R$ 358,80/mês

-- Total base se contratar todos os SubNúcleos
SELECT 
  COUNT(*) as total_subnucleos,
  SUM(base_price_monthly) as total_base_monthly
FROM subnucleos
WHERE status = 'active';
-- Resultado: 8 SubNúcleos × R$ 365,00 = R$ 2.920,00/mês (base)
```

## Dados de Teste para Trials

O seed inclui exemplos comentados de trials para testes. Para habilitar:

1. Descomentar seção de trials no arquivo
2. Ajustar `user_id` para um usuário válido
3. Executar novamente

```sql
-- Exemplo de trial ativo
INSERT INTO trials (user_id, target_type, target_id, started_at, usage_count, expires_at, status)
VALUES
  (
    '<user-id-valido>',
    'agent',
    (SELECT id FROM agents WHERE name = 'Atendimento AI' LIMIT 1),
    NOW() - INTERVAL '2 hours',
    3,
    NOW() + INTERVAL '22 hours',
    'active'
  );
```

## Customização

### Adicionar mais agentes

```sql
INSERT INTO agents (id, name, segment, description, tags, price_monthly, status, created_at)
VALUES
  (
    gen_random_uuid(),
    'Novo Agente AI',
    'Categoria',
    'Descrição do agente',
    '["tag1", "tag2", "tag3"]',
    29.90,
    'active',
    NOW()
  );
```

### Adicionar mais SubNúcleos

```sql
INSERT INTO subnucleos (id, name, description, scope, base_price_monthly, status, created_at)
VALUES
  (
    gen_random_uuid(),
    'Novo SubNúcleo',
    'Descrição do SubNúcleo',
    'Escopo detalhado das funcionalidades',
    365.00,
    'active',
    NOW()
  );
```

### Ajustar preços

```sql
-- Atualizar preço de um agente específico
UPDATE agents
SET price_monthly = 39.90
WHERE name = 'Atendimento AI';

-- Atualizar preço base de um SubNúcleo
UPDATE subnucleos
SET base_price_monthly = 450.00
WHERE name = 'Saúde';
```

## Limpeza

Para remover todos os dados de teste:

```sql
-- Remover agentes de teste
DELETE FROM agents WHERE created_at > NOW() - INTERVAL '1 hour';

-- Remover SubNúcleos de teste
DELETE FROM subnucleos WHERE created_at > NOW() - INTERVAL '1 hour';

-- Ou remover todos (cuidado em produção!)
TRUNCATE agents CASCADE;
TRUNCATE subnucleos CASCADE;
```

## Integração com Frontend

Os dados inseridos serão consumidos pelo frontend via API:

```typescript
// GET /api/agents
{
  agents: [
    {
      id: "uuid",
      name: "Atendimento AI",
      segment: "Atendimento",
      description: "...",
      tags: ["atendimento", "suporte", "chat", "24/7"],
      priceMonthly: 29.90
    },
    // ...
  ]
}

// GET /api/subnucleos (futuro)
{
  subnucleos: [
    {
      id: "uuid",
      name: "Saúde",
      description: "...",
      scope: "...",
      basePriceMonthly: 365.00
    },
    // ...
  ]
}
```

## Próximos Passos

Após executar este seed:

1. ✅ Verificar dados inseridos
2. ⏭️ Implementar API GET /api/agents
3. ⏭️ Implementar API GET /api/subnucleos
4. ⏭️ Testar frontend com dados reais
5. ⏭️ Ajustar descrições e tags conforme feedback

## Notas Importantes

- **Não executar em produção** sem revisar dados
- Ajustar descrições e tags para refletir funcionalidades reais
- Considerar tradução para múltiplos idiomas se necessário
- Manter consistência de preços com modelo de negócio

## Suporte

Para dúvidas sobre os dados de teste:
- Design doc: `.kiro/specs/alquimista-subscription-system/design.md`
- Catálogo de agentes: `docs/ecosystem/CATALOGO-COMPLETO-AGENTES.md`

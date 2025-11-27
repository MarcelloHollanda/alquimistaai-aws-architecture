# Resumo: Ajuste do Sistema para 32 Agentes + Planos

## 🎯 O Que Foi Ajustado

O sistema de assinaturas foi **completamente reestruturado** para trabalhar com:

1. **32 Agentes AlquimistaAI** (ao invés de venda individual)
2. **7 SubNúcleos Fibonacci** (pacotes temáticos de agentes)
3. **4 Planos de Assinatura** (Starter, Profissional, Expert, Enterprise)
4. **Modelo baseado em planos** (não venda avulsa de agentes)

## 📋 Mudanças Principais

### Antes (Sistema Antigo)

```
❌ Agentes vendidos individualmente por R$ 29,90/mês
❌ SubNúcleos vendidos por R$ 365,00/mês + taxas
❌ Cliente escolhe agentes avulsos
❌ Sem estrutura de planos
```

### Depois (Sistema Novo)

```
✅ 4 Planos de assinatura (R$ 297 a R$ 2.997/mês)
✅ Planos incluem SubNúcleos (1 a 7)
✅ SubNúcleos agrupam agentes (3 a 8 por SubNúcleo)
✅ Total de 32 agentes organizados
✅ Cliente escolhe plano → seleciona SubNúcleos → customiza agentes
```

## 🗄️ Arquivos Criados/Modificados

### 1. Migration 010 - Estrutura de Planos

**Arquivo**: `database/migrations/010_create_plans_structure.sql`

**Tabelas criadas:**
- `subscription_plans` - 4 planos disponíveis
- `subnucleos` - 7 SubNúcleos Fibonacci
- `subnucleo_agents` - Relacionamento N:N
- `tenant_subscriptions` - Assinatura do tenant
- `tenant_subnucleos` - SubNúcleos ativos
- `tenant_agents` - Agentes ativos

**View criada:**
- `v_tenant_subscription_summary` - Resumo de uso

### 2. Seed 005 (Parte 1) - Primeiros 7 Agentes

**Arquivo**: `database/seeds/005_agents_32_part1.sql`

Agentes criados:
1. Telemedicina
2. Clínica Médica
3. Clínica Odontológica
4. Saúde e Bem-Estar
5. Consultas Educacionais
6. Alunos de Curso Digital
7. Educação e EAD

### 3. Documentação Completa

**Arquivo**: `docs/billing/32-AGENTES-ESTRUTURA-COMPLETA.md`

Contém:
- Lista completa dos 32 agentes
- 7 SubNúcleos com agentes inclusos
- 4 Planos com preços e limites
- Fluxos de assinatura
- Queries úteis

## 📊 Estrutura dos 32 Agentes

### Distribuição por Categoria

| Categoria | Quantidade | SubNúcleo Principal |
|-----------|------------|---------------------|
| Saúde & Clínicas | 4 | Saúde & Telemedicina |
| Educação & Cursos | 3 | Educação & EAD |
| Eventos & Relacionamento | 8 | Eventos & Relacionamento |
| Vendas & SDR | 3 | Vendas & SDR |
| Cobrança & Financeiro | 3 | Cobrança & Financeiro |
| Suporte & Operações | 3 | Organizações & Jurídico |
| Serviços & Nichos | 8 | Serviços & Field Service |
| **TOTAL** | **32** | **7 SubNúcleos** |

## 💳 4 Planos de Assinatura

### Comparativo Rápido

| Plano | Preço/Mês | SubNúcleos | Agentes | Usuários | Fibonacci |
|-------|-----------|------------|---------|----------|-----------|
| **Starter** | R$ 297 | 1 | 8 | 3 | ❌ |
| **Profissional** | R$ 697 | 2 | 16 | 10 | ✅ |
| **Expert** | R$ 1.497 | 4 | 24 | 25 | ✅ |
| **Enterprise** | R$ 2.997 | 7 (todos) | 32 (todos) | Ilimitado | ✅ |

**Desconto anual**: 17% (pague 10 meses, ganhe 2)

## 🔄 Novo Fluxo de Assinatura

### Passo 1: Escolha do Plano
```
/app/billing/plans
```
Cliente vê os 4 planos e escolhe um baseado em:
- Número de SubNúcleos necessários
- Quantidade de agentes
- Número de usuários
- Necessidade do Fibonacci Orquestrador

### Passo 2: Seleção de SubNúcleos
```
/app/billing/subnucleos
```
Cliente seleciona quais SubNúcleos ativar (dentro do limite do plano):
- ☑ SubNúcleo Vendas & SDR (3 agentes)
- ☑ SubNúcleo Eventos & Relacionamento (8 agentes)
- ☐ SubNúcleo Saúde & Telemedicina (4 agentes)

### Passo 3: Customização (Opcional)
Dentro de cada SubNúcleo, pode desmarcar agentes opcionais:
- ☑ Agendamento de Reuniões (obrigatório)
- ☑ Retenção de Clientes
- ☐ Assistência a Clientes VIPs (opcional)

### Passo 4: Checkout
Confirma e vai para pagamento.

## 🎨 Componentes Frontend Necessários

### Páginas

1. **`/app/billing/plans`** - Escolha de plano
   - Cards dos 4 planos
   - Toggle mensal/anual
   - Comparativo de features

2. **`/app/billing/subnucleos`** - Seleção de SubNúcleos
   - Lista de SubNúcleos disponíveis
   - Checkboxes para seleção
   - Validação de limites do plano
   - Lista de agentes por SubNúcleo

3. **`/app/billing/checkout`** - Finalização
   - Resumo da seleção
   - Valores
   - Integração com gateway

### Componentes

- `PlanCard` - Card de plano individual
- `PlanComparison` - Tabela comparativa
- `SubnucleoCard` - Card de SubNúcleo
- `AgentCheckbox` - Checkbox de agente
- `PlanSummary` - Resumo da seleção
- `BillingCycleToggle` - Toggle mensal/anual

## 🔌 APIs Backend Necessárias

### 1. Planos
```typescript
GET /api/billing/plans
Response: {
  plans: Array<{
    id: string;
    name: string;
    displayName: string;
    priceMonthly: number;
    priceYearly: number;
    maxSubnucleos: number;
    maxAgents: number;
    maxUsers: number;
    includesFibonacci: boolean;
    features: string[];
  }>
}
```

### 2. SubNúcleos
```typescript
GET /api/billing/subnucleos
Response: {
  subnucleos: Array<{
    id: string;
    name: string;
    displayName: string;
    description: string;
    category: string;
    agents: Array<{
      id: string;
      name: string;
      isRequired: boolean;
    }>;
  }>
}
```

### 3. Assinatura do Tenant
```typescript
GET /api/billing/subscription
Response: {
  subscription: {
    planId: string;
    planName: string;
    billingCycle: 'monthly' | 'yearly';
    status: string;
    activeSubnucleos: string[];
    activeAgents: string[];
    limits: {
      maxSubnucleos: number;
      maxAgents: number;
      maxUsers: number;
    };
    usage: {
      subnucleos: number;
      agents: number;
      users: number;
    };
  }
}

POST /api/billing/subscription
Request: {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  selectedSubnucleos: string[];
  selectedAgents: string[];
}
Response: {
  success: boolean;
  subscriptionId: string;
  checkoutUrl?: string; // Se precisar pagamento
}
```

## ✅ Próximos Passos

### Fase 1: Completar Seeds (Prioridade Alta)

1. ⏭️ Criar `005_agents_32_part2.sql` - Agentes 8-16
2. ⏭️ Criar `005_agents_32_part3.sql` - Agentes 17-24
3. ⏭️ Criar `005_agents_32_part4.sql` - Agentes 25-32
4. ⏭️ Criar `006_subnucleos_relationships.sql` - 7 SubNúcleos + relacionamentos
5. ⏭️ Criar `007_subscription_plans.sql` - 4 planos

### Fase 2: Backend APIs (Prioridade Alta)

6. ⏭️ `lambda/platform/list-plans.ts` - GET /api/billing/plans
7. ⏭️ `lambda/platform/list-subnucleos.ts` - GET /api/billing/subnucleos
8. ⏭️ `lambda/platform/get-tenant-subscription.ts` - GET /api/billing/subscription
9. ⏭️ `lambda/platform/update-tenant-subscription.ts` - POST /api/billing/subscription

### Fase 3: Frontend (Prioridade Média)

10. ⏭️ Página `/app/billing/plans`
11. ⏭️ Página `/app/billing/subnucleos`
12. ⏭️ Componentes de UI
13. ⏭️ Store Zustand para gerenciar seleção
14. ⏭️ Integração com APIs

### Fase 4: Testes e Ajustes (Prioridade Baixa)

15. ⏭️ Testes de fluxo completo
16. ⏭️ Validações de limites
17. ⏭️ Mensagens de erro
18. ⏭️ Loading states

## 📝 Comandos para Executar

### 1. Executar Migration 010

```bash
psql -h localhost -U postgres -d alquimista_dev \
  -f database/migrations/010_create_plans_structure.sql
```

### 2. Executar Seeds (quando prontos)

```bash
# Agentes (partes 1-4)
psql -h localhost -U postgres -d alquimista_dev \
  -f database/seeds/005_agents_32_part1.sql

# SubNúcleos e relacionamentos
psql -h localhost -U postgres -d alquimista_dev \
  -f database/seeds/006_subnucleos_relationships.sql

# Planos
psql -h localhost -U postgres -d alquimista_dev \
  -f database/seeds/007_subscription_plans.sql
```

### 3. Verificar Instalação

```sql
-- Contar agentes (esperado: 32)
SELECT COUNT(*) FROM alquimista_platform.agents;

-- Contar SubNúcleos (esperado: 7)
SELECT COUNT(*) FROM subnucleos;

-- Contar planos (esperado: 4)
SELECT COUNT(*) FROM subscription_plans;

-- Ver relacionamentos
SELECT s.display_name, COUNT(sa.agent_id) as agent_count
FROM subnucleos s
LEFT JOIN subnucleo_agents sa ON s.id = sa.subnucleo_id
GROUP BY s.id, s.display_name;
```

## 🎓 Diferenças Importantes

### Modelo Antigo vs Novo

| Aspecto | Antigo | Novo |
|---------|--------|------|
| **Venda** | Agentes individuais | Planos com SubNúcleos |
| **Preço** | R$ 29,90/agente | R$ 297 a R$ 2.997/plano |
| **Seleção** | Escolhe agentes | Escolhe plano → SubNúcleos → agentes |
| **Fibonacci** | Sob consulta | Incluído em 3 planos |
| **Limites** | Sem limite | Por plano (SubNúcleos, agentes, usuários) |
| **Checkout** | Direto | Baseado no plano |

## 🔐 Regras de Negócio

1. **Agentes NÃO são vendidos individualmente**
2. **Planos definem limites** de SubNúcleos e agentes
3. **SubNúcleos agrupam agentes** relacionados
4. **Tenant escolhe plano primeiro**, depois SubNúcleos
5. **Apenas MASTER** pode alterar plano/SubNúcleos
6. **Validação de limites** no frontend e backend
7. **Fibonacci incluído** em Profissional, Expert e Enterprise

## 📚 Documentação de Referência

- **Estrutura Completa**: `docs/billing/32-AGENTES-ESTRUTURA-COMPLETA.md`
- **Migration 010**: `database/migrations/010_create_plans_structure.sql`
- **Seed Parte 1**: `database/seeds/005_agents_32_part1.sql`
- **Este Resumo**: `docs/billing/RESUMO-AJUSTE-32-AGENTES.md`

---

**Status**: ✅ Estrutura base criada  
**Próximo**: Completar seeds dos 32 agentes  
**Data**: 2025-01-17  
**Versão**: 2.0.0

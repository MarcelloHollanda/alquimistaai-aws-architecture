# Guia de Implementação Rápida - Sistema de Planos

## 🚀 Como Implementar o Novo Sistema

Este guia mostra os passos práticos para implementar o sistema de 32 agentes + planos.

## 📋 Checklist de Implementação

### ✅ Fase 1: Banco de Dados (CONCLUÍDO)

- [x] Migration 010 criada
- [x] Seed 005 parte 1 criada (7 agentes)
- [x] Documentação completa

### ⏭️ Fase 2: Completar Seeds (PRÓXIMO PASSO)

- [ ] Criar seeds dos 25 agentes restantes
- [ ] Criar seed dos 7 SubNúcleos
- [ ] Criar seed dos 4 planos
- [ ] Executar todas as migrations e seeds

### ⏭️ Fase 3: Backend APIs

- [ ] API de listagem de planos
- [ ] API de listagem de SubNúcleos
- [ ] API de assinatura do tenant
- [ ] API de atualização de assinatura

### ⏭️ Fase 4: Frontend

- [ ] Página de escolha de planos
- [ ] Página de seleção de SubNúcleos
- [ ] Componentes de UI
- [ ] Integração com backend

## 🎯 Passo a Passo Detalhado

### Passo 1: Executar Migration 010

```bash
# Conectar ao banco
psql -h localhost -U postgres -d alquimista_dev

# Executar migration
\i database/migrations/010_create_plans_structure.sql

# Verificar tabelas criadas
\dt

# Deve mostrar:
# - subscription_plans
# - subnucleos
# - subnucleo_agents
# - tenant_subscriptions
# - tenant_subnucleos
# - tenant_agents
```

### Passo 2: Criar Seeds Restantes

Você precisa criar 3 arquivos adicionais para completar os 32 agentes:

#### A. `005_agents_32_part2.sql` (Agentes 8-16)

Eventos & Relacionamento:
- Agente de Agendamento de Reuniões (#8)
- Agente de Agendamento – Consultas, Reuniões e Mentorias (#9)
- Agente de Convites e Divulgação de Eventos (#10)
- Agente de Organização de Eventos (#11)
- Agente de Retenção de Clientes (#12)
- Agente de Pesquisa de Satisfação (#13)
- Agente de Assistência a Clientes VIPs (#14)
- Agente Profissional de Follow-up (#15)
- Agente SDR — Qualificador de Leads com SPIN Selling (#16)

#### B. `005_agents_32_part3.sql` (Agentes 17-24)

Vendas, Cobrança & Suporte:
- Agente Profissional de Vendas Ativas (#17)
- Agente de Vendas Cruzadas (#18)
- Agente de Cobrança e Recuperação de Crédito (#19)
- Agente Consultor Financeiro e de Investimento (#20)
- Agente de Gestão de Seguros (#21)
- Agente de Suporte Técnico (#22)
- Agente de Recursos Humanos e Recrutamento (#23)
- Agente de Manutenção Predial e Residencial (#24)

#### C. `005_agents_32_part4.sql` (Agentes 25-32)

Serviços & Nichos:
- Agente de Delivery e Serviços de Comida (#25)
- Agente Imobiliário Virtual (#26)
- Agente de Turismo e Viagens (#27)
- Agente de Serviço de Segurança Eletrônica (#28)
- Agente para Associações e ONGs (#29)
- Agente de Consultoria Jurídica e Advocacia (#30)
- Agente de Atendimento – Salão de Beleza (#31)
- Agente de Gestão de Condomínios (#32)

### Passo 3: Criar Seed dos SubNúcleos

#### `006_subnucleos_relationships.sql`

```sql
-- Criar 7 SubNúcleos
INSERT INTO subnucleos (id, name, display_name, description, category) VALUES
  ('40000000-0000-0000-0000-000000000001', 'saude-telemedicina', 'Saúde & Telemedicina', '...', 'saude'),
  ('40000000-0000-0000-0000-000000000002', 'educacao-ead', 'Educação & EAD', '...', 'educacao'),
  -- ... outros 5 SubNúcleos

-- Relacionar agentes com SubNúcleos
INSERT INTO subnucleo_agents (subnucleo_id, agent_id, is_required) VALUES
  -- SubNúcleo Saúde
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', true),
  -- ... outros relacionamentos
```

### Passo 4: Criar Seed dos Planos

#### `007_subscription_plans.sql`

```sql
-- Criar 4 planos
INSERT INTO subscription_plans (
  id, name, display_name, price_monthly, price_yearly,
  max_subnucleos, max_agents, max_users, includes_fibonacci
) VALUES
  -- Starter
  ('50000000-0000-0000-0000-000000000001', 'starter', 'Starter', 
   297.00, 2970.00, 1, 8, 3, false),
  
  -- Profissional
  ('50000000-0000-0000-0000-000000000002', 'profissional', 'Profissional',
   697.00, 6970.00, 2, 16, 10, true),
  
  -- Expert
  ('50000000-0000-0000-0000-000000000003', 'expert', 'Expert',
   1497.00, 14970.00, 4, 24, 25, true),
  
  -- Enterprise
  ('50000000-0000-0000-0000-000000000004', 'enterprise', 'Enterprise',
   2997.00, 29970.00, 7, 32, 999999, true);
```

### Passo 5: Executar Todos os Seeds

```bash
# Agentes (4 partes)
psql -h localhost -U postgres -d alquimista_dev -f database/seeds/005_agents_32_part1.sql
psql -h localhost -U postgres -d alquimista_dev -f database/seeds/005_agents_32_part2.sql
psql -h localhost -U postgres -d alquimista_dev -f database/seeds/005_agents_32_part3.sql
psql -h localhost -U postgres -d alquimista_dev -f database/seeds/005_agents_32_part4.sql

# SubNúcleos
psql -h localhost -U postgres -d alquimista_dev -f database/seeds/006_subnucleos_relationships.sql

# Planos
psql -h localhost -U postgres -d alquimista_dev -f database/seeds/007_subscription_plans.sql
```

### Passo 6: Verificar Dados

```sql
-- Contar agentes (esperado: 32)
SELECT COUNT(*) FROM alquimista_platform.agents;

-- Contar SubNúcleos (esperado: 7)
SELECT COUNT(*) FROM subnucleos;

-- Contar planos (esperado: 4)
SELECT COUNT(*) FROM subscription_plans;

-- Ver agentes por SubNúcleo
SELECT 
  s.display_name,
  COUNT(sa.agent_id) as agent_count
FROM subnucleos s
LEFT JOIN subnucleo_agents sa ON s.id = sa.subnucleo_id
GROUP BY s.id, s.display_name
ORDER BY s.display_name;

-- Ver planos
SELECT 
  display_name,
  price_monthly,
  max_subnucleos,
  max_agents,
  includes_fibonacci
FROM subscription_plans
ORDER BY price_monthly;
```

## 🔌 Implementação Backend

### API 1: Listar Planos

**Arquivo**: `lambda/platform/list-plans.ts`

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { query } from '../shared/database';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        display_name as "displayName",
        description,
        price_monthly as "priceMonthly",
        price_yearly as "priceYearly",
        max_subnucleos as "maxSubnucleos",
        max_agents as "maxAgents",
        max_users as "maxUsers",
        includes_fibonacci as "includesFibonacci",
        features
      FROM subscription_plans
      WHERE is_active = true
      ORDER BY sort_order, price_monthly
    `);

    return {
      statusCode: 200,
      body: JSON.stringify({
        plans: result.rows
      })
    };
  } catch (error) {
    console.error('Error listing plans:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
```

### API 2: Listar SubNúcleos

**Arquivo**: `lambda/platform/list-subnucleos.ts`

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { query } from '../shared/database';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Buscar SubNúcleos
    const subnucleosResult = await query(`
      SELECT 
        id,
        name,
        display_name as "displayName",
        description,
        category,
        icon
      FROM subnucleos
      WHERE is_active = true
      ORDER BY sort_order, display_name
    `);

    // Buscar agentes de cada SubNúcleo
    const agentsResult = await query(`
      SELECT 
        sa.subnucleo_id as "subnucleoId",
        a.id,
        a.name,
        a.display_name as "displayName",
        a.description,
        sa.is_required as "isRequired"
      FROM subnucleo_agents sa
      JOIN alquimista_platform.agents a ON sa.agent_id = a.id
      WHERE a.status = 'active'
      ORDER BY sa.sort_order, a.display_name
    `);

    // Agrupar agentes por SubNúcleo
    const subnucleos = subnucleosResult.rows.map(sub => ({
      ...sub,
      agents: agentsResult.rows.filter(a => a.subnucleoId === sub.id)
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        subnucleos
      })
    };
  } catch (error) {
    console.error('Error listing subnucleos:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
```

### API 3: Obter Assinatura do Tenant

**Arquivo**: `lambda/platform/get-tenant-subscription.ts`

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { query } from '../shared/database';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const tenantId = event.requestContext.authorizer?.claims?.['custom:tenant_id'];
    
    if (!tenantId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // Buscar assinatura
    const result = await query(`
      SELECT * FROM v_tenant_subscription_summary
      WHERE tenant_id = $1
    `, [tenantId]);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Subscription not found' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        subscription: result.rows[0]
      })
    };
  } catch (error) {
    console.error('Error getting subscription:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
```

## 🎨 Implementação Frontend

### Página: Escolha de Planos

**Arquivo**: `frontend/src/app/(dashboard)/billing/plans/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Plan {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
  priceYearly: number;
  maxSubnucleos: number;
  maxAgents: number;
  maxUsers: number;
  includesFibonacci: boolean;
}

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/billing/plans');
      const data = await response.json();
      setPlans(data.plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectPlan = (planId: string) => {
    // Salvar plano selecionado e ir para seleção de SubNúcleos
    localStorage.setItem('selectedPlanId', planId);
    localStorage.setItem('billingCycle', billingCycle);
    router.push('/billing/subnucleos');
  };

  if (loading) return <div>Carregando planos...</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Escolha seu Plano</h1>
      
      {/* Toggle Mensal/Anual */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-lg border p-1">
          <button
            className={`px-4 py-2 rounded ${billingCycle === 'monthly' ? 'bg-primary text-white' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Mensal
          </button>
          <button
            className={`px-4 py-2 rounded ${billingCycle === 'yearly' ? 'bg-primary text-white' : ''}`}
            onClick={() => setBillingCycle('yearly')}
          >
            Anual (17% off)
          </button>
        </div>
      </div>

      {/* Grid de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="border rounded-lg p-6 hover:shadow-lg transition">
            <h3 className="text-xl font-bold mb-2">{plan.displayName}</h3>
            <div className="text-3xl font-bold mb-4">
              R$ {billingCycle === 'monthly' ? plan.priceMonthly : (plan.priceYearly / 12).toFixed(2)}
              <span className="text-sm font-normal">/mês</span>
            </div>
            
            <ul className="space-y-2 mb-6">
              <li>✓ {plan.maxSubnucleos} SubNúcleo{plan.maxSubnucleos > 1 ? 's' : ''}</li>
              <li>✓ Até {plan.maxAgents} agentes</li>
              <li>✓ {plan.maxUsers === 999999 ? 'Usuários ilimitados' : `${plan.maxUsers} usuários`}</li>
              <li>{plan.includesFibonacci ? '✓' : '✗'} Fibonacci Orquestrador</li>
            </ul>

            <Button 
              onClick={() => selectPlan(plan.id)}
              className="w-full"
            >
              Escolher Plano
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 📝 Resumo dos Próximos Passos

1. **Completar seeds** dos 32 agentes (criar parts 2, 3, 4)
2. **Criar seed** dos 7 SubNúcleos com relacionamentos
3. **Criar seed** dos 4 planos
4. **Executar** todas as migrations e seeds
5. **Implementar** as 3 APIs backend
6. **Criar** as 2 páginas frontend
7. **Testar** o fluxo completo

## 🆘 Precisa de Ajuda?

Consulte a documentação completa em:
- `docs/billing/32-AGENTES-ESTRUTURA-COMPLETA.md`
- `docs/billing/RESUMO-AJUSTE-32-AGENTES.md`

---

**Versão**: 1.0.0  
**Data**: 2025-01-17  
**Autor**: AlquimistaAI Team

# Estrutura Completa: 32 Agentes + SubNúcleos + Planos

## 📋 Visão Geral

Sistema de assinatura baseado em **PLANOS** que incluem **SubNúcleos Fibonacci**, que por sua vez agrupam **32 Agentes AlquimistaAI**.

## 🎯 Modelo de Negócio

### Hierarquia

```
PLANOS (Starter, Profissional, Expert, Enterprise)
    ↓
SubNúcleos Fibonacci (7 pacotes temáticos)
    ↓
32 Agentes AlquimistaAI (distribuídos nos SubNúcleos)
```

### Regras Importantes

1. **Agentes NÃO são vendidos individualmente** - apenas através de planos
2. **Planos incluem SubNúcleos** - que por sua vez incluem agentes
3. **Tenant escolhe o plano** - depois seleciona quais SubNúcleos ativar (dentro do limite)
4. **Dentro de cada SubNúcleo** - tenant pode ativar/desativar agentes específicos

## 📊 32 Agentes AlquimistaAI

### Categoria: Saúde & Clínicas (4 agentes)

1. **Agente de Telemedicina**
   - Atendimento médico remoto, triagem de sintomas
   
2. **Agente de Atendimento – Clínica Médica**
   - Confirmação de consultas e lembretes
   
3. **Agente de Atendimento – Clínica Odontológica**
   - Agendamento e follow-up pós-procedimento
   
4. **Agente de Saúde e Bem-Estar**
   - Orientações sobre saúde preventiva

### Categoria: Educação & Cursos (3 agentes)

5. **Agente de Consultas Educacionais e Lembretes**
   - Dúvidas sobre cursos e lembretes de aulas
   
6. **Agente de Atendimento – Alunos de Curso Digital**
   - Suporte técnico e pedagógico
   
7. **Agente de Educação e EAD**
   - Gestão completa de plataformas EAD

### Categoria: Eventos & Relacionamento (8 agentes)

8. **Agente de Agendamento de Reuniões**
   - Marcação automática de reuniões
   
9. **Agente de Agendamento – Consultas, Reuniões e Mentorias**
   - Agendamento multi-propósito
   
10. **Agente de Convites e Divulgação de Eventos**
    - Envio de convites e confirmações
    
11. **Agente de Organização de Eventos**
    - Gestão completa de eventos
    
12. **Agente de Retenção de Clientes**
    - Estratégias de retenção e fidelização
    
13. **Agente de Pesquisa de Satisfação**
    - NPS, CSAT e feedback de clientes
    
14. **Agente de Assistência a Clientes VIPs**
    - Atendimento premium personalizado
    
15. **Agente Profissional de Follow-up**
    - Follow-up estratégico e nutrição de leads

### Categoria: Vendas & SDR (3 agentes)

16. **Agente SDR — Qualificador de Leads com SPIN Selling**
    - Qualificação usando metodologia SPIN
    
17. **Agente Profissional de Vendas Ativas**
    - Prospecção ativa e fechamento
    
18. **Agente de Vendas Cruzadas (Cross-selling e Upselling)**
    - Identificação de oportunidades de upsell

### Categoria: Cobrança & Financeiro (3 agentes)

19. **Agente de Cobrança e Recuperação de Crédito**
    - Lembretes e negociação de pagamentos
    
20. **Agente Consultor Financeiro e de Investimento**
    - Orientações financeiras e investimentos
    
21. **Agente de Gestão de Seguros**
    - Gestão de apólices e renovações

### Categoria: Suporte & Operações (3 agentes)

22. **Agente de Suporte Técnico**
    - Atendimento técnico com base de conhecimento
    
23. **Agente de Recursos Humanos e Recrutamento**
    - Triagem de candidatos e agendamento de entrevistas
    
24. **Agente de Manutenção Predial e Residencial**
    - Agendamento de manutenções e ordens de serviço

### Categoria: Serviços & Nichos (8 agentes)

25. **Agente de Delivery e Serviços de Comida**
    - Pedidos, rastreamento e suporte
    
26. **Agente Imobiliário Virtual**
    - Qualificação de interessados e agendamento de visitas
    
27. **Agente de Turismo e Viagens**
    - Reservas, roteiros e suporte ao viajante
    
28. **Agente de Serviço de Segurança Eletrônica**
    - Monitoramento e suporte técnico
    
29. **Agente para Associações e Organizações sem Fins Lucrativos**
    - Gestão de membros e comunicação
    
30. **Agente de Consultoria Jurídica e Advocacia**
    - Triagem de casos e agendamento de consultas
    
31. **Agente de Atendimento – Salão de Beleza**
    - Agendamento e confirmação de serviços
    
32. **Agente de Gestão de Condomínios**
    - Comunicação com condôminos e gestão de ocorrências

## 🏢 7 SubNúcleos Fibonacci

### 1. SubNúcleo Saúde & Telemedicina

**Agentes inclusos:**
- Telemedicina (#1)
- Atendimento Clínica Médica (#2)
- Clínica Odontológica (#3)
- Saúde e Bem-Estar (#4)

**Total: 4 agentes**

### 2. SubNúcleo Educação & EAD

**Agentes inclusos:**
- Consultas Educacionais e Lembretes (#5)
- Atendimento Alunos de Curso Digital (#6)
- Educação e EAD (#7)

**Total: 3 agentes**

### 3. SubNúcleo Eventos & Relacionamento

**Agentes inclusos:**
- Agendamento de Reuniões (#8)
- Agendamento Consultas/Reuniões/Mentorias (#9)
- Convites e Divulgação de Eventos (#10)
- Organização de Eventos (#11)
- Retenção de Clientes (#12)
- Pesquisa de Satisfação (#13)
- Assistência a Clientes VIPs (#14)
- Follow-up Profissional (#15)

**Total: 8 agentes**

### 4. SubNúcleo Vendas & SDR

**Agentes inclusos:**
- SDR SPIN Selling (#16)
- Vendas Ativas (#17)
- Vendas Cruzadas / Upsell (#18)

**Total: 3 agentes**

### 5. SubNúcleo Cobrança & Financeiro

**Agentes inclusos:**
- Cobrança e Recuperação de Crédito (#19)
- Consultor Financeiro e Investimentos (#20)
- Gestão de Seguros (#21)

**Total: 3 agentes**

### 6. SubNúcleo Serviços & Field Service

**Agentes inclusos:**
- Delivery e Serviços de Comida (#25)
- Manutenção Predial/Residencial (#24)
- Imobiliário Virtual (#26)
- Turismo e Viagens (#27)
- Segurança Eletrônica (#28)
- Atendimento Salão de Beleza (#31)
- Gestão de Condomínios (#32)

**Total: 7 agentes**

### 7. SubNúcleo Organizações & Jurídico

**Agentes inclusos:**
- Associações/ONGs (#29)
- RH & Recrutamento (#23)
- Consultoria Jurídica e Advocacia (#30)
- Suporte Técnico (#22)

**Total: 4 agentes**

## 💳 4 Planos de Assinatura

### Plano Starter

**Preço:**
- Mensal: R$ 297,00
- Anual: R$ 2.970,00 (R$ 247,50/mês - 17% desconto)

**Inclui:**
- 1 SubNúcleo
- Até 8 agentes
- 3 usuários
- Fibonacci Orquestrador: ❌

**Ideal para:** Pequenas empresas iniciando automação

### Plano Profissional

**Preço:**
- Mensal: R$ 697,00
- Anual: R$ 6.970,00 (R$ 580,83/mês - 17% desconto)

**Inclui:**
- 2 SubNúcleos
- Até 16 agentes
- 10 usuários
- Fibonacci Orquestrador: ✅

**Ideal para:** Empresas em crescimento

### Plano Expert

**Preço:**
- Mensal: R$ 1.497,00
- Anual: R$ 14.970,00 (R$ 1.247,50/mês - 17% desconto)

**Inclui:**
- 4 SubNúcleos
- Até 24 agentes
- 25 usuários
- Fibonacci Orquestrador: ✅

**Ideal para:** Empresas estabelecidas com múltiplos departamentos

### Plano Enterprise

**Preço:**
- Mensal: R$ 2.997,00
- Anual: R$ 29.970,00 (R$ 2.497,50/mês - 17% desconto)

**Inclui:**
- 7 SubNúcleos (todos)
- 32 agentes (todos)
- Usuários ilimitados
- Fibonacci Orquestrador: ✅
- Suporte prioritário
- Customizações

**Ideal para:** Grandes empresas e corporações

## 🔄 Fluxo de Assinatura

### 1. Escolha do Plano

Usuário acessa `/app/billing/plans` e vê:

```
┌─────────────────────────────────────────────────────────┐
│  STARTER      PROFISSIONAL    EXPERT      ENTERPRISE    │
│  R$ 297/mês   R$ 697/mês      R$ 1.497/mês R$ 2.997/mês │
│                                                          │
│  1 SubNúcleo  2 SubNúcleos    4 SubNúcleos 7 SubNúcleos │
│  8 agentes    16 agentes      24 agentes   32 agentes   │
│  3 usuários   10 usuários     25 usuários  Ilimitado    │
│  Sem Fibonacci Com Fibonacci  Com Fibonacci Com Fibonacci│
└─────────────────────────────────────────────────────────┘
```

### 2. Seleção de SubNúcleos

Após escolher o plano, vai para `/app/billing/subnucleos`:

```
Seu plano: PROFISSIONAL (2 SubNúcleos, 16 agentes)

┌─────────────────────────────────────────────────────────┐
│ ☐ SubNúcleo Saúde & Telemedicina (4 agentes)           │
│ ☑ SubNúcleo Vendas & SDR (3 agentes)                   │
│ ☑ SubNúcleo Eventos & Relacionamento (8 agentes)       │
│ ☐ SubNúcleo Educação & EAD (3 agentes)                 │
└─────────────────────────────────────────────────────────┘

Selecionados: 2/2 SubNúcleos | 11/16 agentes
```

### 3. Customização de Agentes (Opcional)

Dentro de cada SubNúcleo selecionado, pode desmarcar agentes opcionais:

```
SubNúcleo: Eventos & Relacionamento

☑ Agendamento de Reuniões (obrigatório)
☑ Retenção de Clientes
☐ Assistência a Clientes VIPs (opcional)
☑ Pesquisa de Satisfação
```

### 4. Checkout

Confirma seleção e vai para pagamento.

## 🗄️ Estrutura de Banco de Dados

### Tabelas Principais

1. **subscription_plans** - 4 planos
2. **subnucleos** - 7 SubNúcleos
3. **agents** - 32 agentes
4. **subnucleo_agents** - Relacionamento N:N
5. **tenant_subscriptions** - Assinatura do tenant
6. **tenant_subnucleos** - SubNúcleos ativos do tenant
7. **tenant_agents** - Agentes ativos do tenant

### Queries Importantes

```sql
-- Ver plano atual do tenant
SELECT * FROM v_tenant_subscription_summary 
WHERE tenant_id = '<tenant-id>';

-- Ver SubNúcleos disponíveis
SELECT s.*, COUNT(sa.agent_id) as agent_count
FROM subnucleos s
LEFT JOIN subnucleo_agents sa ON s.id = sa.subnucleo_id
GROUP BY s.id;

-- Ver agentes de um SubNúcleo
SELECT a.* 
FROM agents a
JOIN subnucleo_agents sa ON a.id = sa.agent_id
WHERE sa.subnucleo_id = '<subnucleo-id>';
```

## 📝 Próximos Passos de Implementação

1. ✅ Migration 010 - Estrutura de planos
2. ⏭️ Seed 005 - 32 agentes completos
3. ⏭️ Seed 006 - 7 SubNúcleos e relacionamentos
4. ⏭️ Seed 007 - 4 planos de assinatura
5. ⏭️ API `/api/billing/plans` - Listar planos
6. ⏭️ API `/api/billing/subnucleos` - Listar SubNúcleos
7. ⏭️ API `/api/billing/subscription` - Gerenciar assinatura
8. ⏭️ Frontend `/app/billing/plans` - Escolha de plano
9. ⏭️ Frontend `/app/billing/subnucleos` - Seleção de SubNúcleos

---

**Versão**: 2.0.0  
**Data**: 2025-01-17  
**Autor**: AlquimistaAI Team

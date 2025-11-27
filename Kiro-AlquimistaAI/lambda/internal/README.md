# 🏢 Internal Operations Dashboard

Dashboard interno da AlquimistaAI para gerenciar operações usando os próprios agentes.

## 🎯 Conceito

A AlquimistaAI usa sua própria plataforma para todas as operações internas, demonstrando o poder dos 32 agentes em ambiente real de produção.

## 📊 Endpoints

### GET /internal/dashboard

Retorna dashboard completo com métricas de todos os subnúcleos.

**Headers**:
```
Authorization: Bearer <INTERNAL_ACCESS_TOKEN>
```

**Response**:
```json
{
  "account_id": "alquimista-internal-001",
  "timestamp": "2024-01-15T10:30:00Z",
  "subnucleos": {
    "nigredo": {
      "name": "nigredo",
      "agents": [
        {
          "agent_id": "nigredo-qualificacao",
          "agent_name": "Agente de Qualificação",
          "is_active": true,
          "execution_count": 1250,
          "success_rate": 94.5,
          "last_execution": "2024-01-15T10:25:00Z"
        }
      ],
      "metrics": [
        {
          "metric_name": "leads_qualificados_dia",
          "metric_value": 45,
          "metric_unit": "leads",
          "target_value": 50,
          "achievement_rate": 90
        }
      ],
      "summary": {
        "total_agents": 10,
        "active_agents": 10,
        "total_executions": 12500,
        "avg_success_rate": 92.3
      }
    },
    "hermes": { ... },
    "sophia": { ... },
    "atlas": { ... },
    "oracle": { ... }
  },
  "platform": {
    "total_subnucleos": 5,
    "total_agents": 32,
    "active_agents": 32,
    "total_executions": 50000,
    "avg_success_rate": 93.5
  }
}
```

### POST /internal/metrics

Atualiza métricas internas.

**Headers**:
```
Authorization: Bearer <INTERNAL_ACCESS_TOKEN>
Content-Type: application/json
```

**Body (Single Metric)**:
```json
{
  "type": "metric",
  "data": {
    "subnucleo": "nigredo",
    "metric_name": "leads_qualificados_dia",
    "metric_value": 52,
    "metric_unit": "leads",
    "metadata": {
      "source": "website",
      "quality_score": 85
    }
  }
}
```

**Body (Agent Execution)**:
```json
{
  "type": "agent_execution",
  "agent_id": "nigredo-qualificacao",
  "success": true
}
```

**Body (Batch Update)**:
```json
{
  "type": "batch",
  "data": [
    {
      "subnucleo": "hermes",
      "metric_name": "trafego_organico",
      "metric_value": 52000,
      "metric_unit": "visits"
    },
    {
      "subnucleo": "hermes",
      "metric_name": "leads_gerados",
      "metric_value": 1050,
      "metric_unit": "leads"
    }
  ]
}
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Token de acesso interno
INTERNAL_ACCESS_TOKEN=your_secure_token_here

# Database
DATABASE_URL=postgresql://...
```

### Deploy

```bash
# Deploy das funções internas
cdk deploy --all

# Ou apenas o stack interno
cdk deploy InternalStack
```

## 📈 Métricas por Subnúcleo

### Nigredo (Vendas)
- `leads_qualificados_dia`: Leads qualificados por dia (target: 50)
- `taxa_conversao_trial_paid`: % de conversão trial→paid (target: 25%)
- `tempo_medio_fechamento`: Dias para fechar venda (target: 14)
- `pipeline_value`: Valor do pipeline (target: R$ 500K)

### Hermes (Marketing)
- `trafego_organico`: Visitas orgânicas/mês (target: 50K)
- `leads_gerados`: Leads gerados/mês (target: 1K)
- `cac`: Custo de aquisição (target: R$ 300)
- `roas`: Return on ad spend (target: 3:1)

### Sophia (Atendimento)
- `tempo_primeira_resposta`: Horas para primeira resposta (target: 2h)
- `taxa_resolucao`: % de casos resolvidos (target: 90%)
- `csat`: Customer satisfaction score (target: 4.5/5)
- `nps`: Net Promoter Score (target: 50)

### Atlas (Operações)
- `processos_automatizados`: % de processos automatizados (target: 80%)
- `tempo_onboarding`: Dias para onboarding (target: 2)
- `compliance_score`: Score de compliance (target: 100%)
- `eficiencia_operacional`: Melhoria em eficiência (target: 30%)

### Oracle (Inteligência)
- `acuracia_previsoes`: % de acurácia (target: 85%)
- `relatorios_automatizados`: % automatizados (target: 100%)
- `insights_semana`: Insights acionáveis/semana (target: 10)
- `decisoes_data_driven`: % decisões baseadas em dados (target: 90%)

## 🚀 Casos de Uso

### 1. Monitoramento em Tempo Real

```typescript
// Buscar dashboard a cada 5 minutos
setInterval(async () => {
  const response = await fetch('https://api.alquimista.ai/internal/dashboard', {
    headers: {
      'Authorization': `Bearer ${INTERNAL_ACCESS_TOKEN}`
    }
  });
  
  const dashboard = await response.json();
  console.log('Dashboard atualizado:', dashboard);
}, 5 * 60 * 1000);
```

### 2. Atualização Automática de Métricas

```typescript
// Após qualificar um lead
await fetch('https://api.alquimista.ai/internal/metrics', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${INTERNAL_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'metric',
    data: {
      subnucleo: 'nigredo',
      metric_name: 'leads_qualificados_dia',
      metric_value: currentCount + 1,
      metric_unit: 'leads'
    }
  })
});
```

### 3. Tracking de Execução de Agentes

```typescript
// Após executar um agente
const success = await executeAgent('nigredo-qualificacao', leadData);

await fetch('https://api.alquimista.ai/internal/metrics', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${INTERNAL_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'agent_execution',
    agent_id: 'nigredo-qualificacao',
    success: success
  })
});
```

## 📊 Visualização

### Dashboard Web

Acesse: `https://internal.alquimista.ai/dashboard`

Features:
- Visão geral de todos os subnúcleos
- Drill-down por agente
- Gráficos de tendência
- Alertas de performance
- Comparação com targets

### Slack Integration

Receba atualizações automáticas no Slack:

```bash
# Configurar webhook
export SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# Alertas automáticos quando métricas ficam abaixo do target
```

## 🔐 Segurança

- ✅ Acesso restrito via token interno
- ✅ Logs de todas as operações
- ✅ Dados criptografados em repouso
- ✅ Auditoria completa de acessos

## 📝 Logs

Todos os acessos e atualizações são logados:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "action": "dashboard_access",
  "user": "internal_system",
  "ip": "10.0.1.50",
  "success": true
}
```

## 🎯 Roadmap

- [ ] Dashboard web interativo
- [ ] Alertas automáticos via Slack
- [ ] Integração com CloudWatch
- [ ] Relatórios semanais automatizados
- [ ] Previsões com ML
- [ ] Mobile app

---

*Internal Operations v1.0 - Janeiro 2024*

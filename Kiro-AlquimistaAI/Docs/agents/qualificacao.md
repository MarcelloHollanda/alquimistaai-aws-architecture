# Agente de Qualificação

## Visão Geral

O Agente de Qualificação utiliza algoritmos avançados de machine learning para avaliar e pontuar leads com base em múltiplos critérios, determinando a probabilidade de conversão e priorizando o esforço comercial.

## Funcionalidades

### 1. Scoring Multidimensional
- **Dados Demográficos**: Setor, porte, localização, faturamento
- **Comportamentais**: Engajamento, tempo de resposta, interesse
- **Firmográficos**: Maturidade digital, tecnologias utilizadas
- **Temporais**: Timing de compra, sazonalidade

### 2. Modelos de IA
- **Regressão Logística**: Para probabilidade de conversão
- **Random Forest**: Para classificação de perfil
- **Neural Networks**: Para padrões complexos
- **Clustering**: Para segmentação automática

### 3. Qualificação BANT+
- **Budget**: Orçamento disponível
- **Authority**: Poder de decisão
- **Need**: Necessidade identificada
- **Timeline**: Prazo para decisão
- **Fit**: Alinhamento com ICP (Ideal Customer Profile)

## Configuração

### Variáveis de Ambiente
```bash
EVENT_BUS_NAME=fibonacci-bus-dev
DB_SECRET_ARN=arn:aws:secretsmanager:...
ML_MODEL_ENDPOINT=https://...
SCORING_THRESHOLD_HOT=80
SCORING_THRESHOLD_WARM=60
SCORING_THRESHOLD_COLD=40
```

### Triggers
- **EventBridge Rule**: `nigredo.recebimento.completed`
- **Timeout**: 45 segundos
- **Memory**: 1024MB

## Input/Output

### Input (EventBridge Event)
```json
{
  "source": "nigredo.recebimento",
  "detail-type": "Leads Processed",
  "detail": {
    "batchId": "batch-456",
    "leads": [
      {
        "leadId": "lead-123",
        "empresa": "TechCorp",
        "setor": "Tecnologia",
        "porte": "Médio",
        "faturamento": 50000000,
        "funcionarios": 150,
        "website": "techcorp.com",
        "telefone": "+5511999999999",
        "email": "contato@techcorp.com"
      }
    ]
  }
}
```

### Output (EventBridge Event)
```json
{
  "source": "nigredo.qualificacao",
  "detail-type": "Leads Qualified",
  "detail": {
    "batchId": "batch-456",
    "qualifiedLeads": [
      {
        "leadId": "lead-123",
        "score": 85,
        "classification": "HOT",
        "probability": 0.78,
        "bant": {
          "budget": 8,
          "authority": 7,
          "need": 9,
          "timeline": 6,
          "fit": 9
        },
        "reasons": [
          "Setor de alta conversão",
          "Porte ideal para solução",
          "Website indica maturidade digital"
        ],
        "nextActions": [
          "Contato imediato",
          "Proposta personalizada",
          "Demo técnica"
        ]
      }
    ]
  }
}
```

## Algoritmos de Scoring

### 1. Score Base (0-100)
```python
def calculate_base_score(lead):
    score = 0
    
    # Setor (0-25 pontos)
    sector_scores = {
        'Tecnologia': 25,
        'Serviços': 20,
        'Indústria': 18,
        'Varejo': 15,
        'Outros': 10
    }
    score += sector_scores.get(lead.setor, 10)
    
    # Porte (0-25 pontos)
    if lead.funcionarios >= 100:
        score += 25
    elif lead.funcionarios >= 50:
        score += 20
    elif lead.funcionarios >= 20:
        score += 15
    else:
        score += 10
    
    # Faturamento (0-25 pontos)
    if lead.faturamento >= 100000000:  # 100M+
        score += 25
    elif lead.faturamento >= 50000000:  # 50M+
        score += 20
    elif lead.faturamento >= 10000000:  # 10M+
        score += 15
    else:
        score += 10
    
    # Maturidade Digital (0-25 pontos)
    digital_indicators = [
        lead.website_exists,
        lead.social_media_active,
        lead.email_domain_professional,
        lead.tech_stack_modern
    ]
    score += sum(digital_indicators) * 6.25
    
    return min(score, 100)
```

### 2. Ajustes Comportamentais
- **Resposta Rápida**: +10 pontos
- **Múltiplas Interações**: +5 pontos por interação
- **Perguntas Técnicas**: +15 pontos
- **Solicitação de Proposta**: +20 pontos
- **Descadastro/Negativo**: -50 pontos

### 3. Fatores Temporais
- **Timing de Mercado**: Análise de sazonalidade
- **Ciclo de Compra**: Posição no funil
- **Urgência Declarada**: Peso adicional

## Classificações

### Por Score
- **HOT (80-100)**: Prioridade máxima, contato imediato
- **WARM (60-79)**: Boa oportunidade, nutrição acelerada
- **COLD (40-59)**: Potencial futuro, nutrição longa
- **UNQUALIFIED (<40)**: Descarte ou requalificação

### Por Perfil ICP
- **PERFECT FIT**: 95-100% match com ICP
- **GOOD FIT**: 80-94% match com ICP
- **PARTIAL FIT**: 60-79% match com ICP
- **POOR FIT**: <60% match com ICP

## Machine Learning Pipeline

### 1. Treinamento do Modelo
```python
# Features utilizadas
features = [
    'setor_encoded',
    'porte_funcionarios',
    'faturamento_log',
    'maturidade_digital',
    'engagement_score',
    'response_time',
    'interaction_count',
    'website_quality'
]

# Target: conversão em 90 dias
target = 'converted_90d'

# Modelo ensemble
model = VotingClassifier([
    ('lr', LogisticRegression()),
    ('rf', RandomForestClassifier()),
    ('xgb', XGBClassifier())
])
```

### 2. Retreinamento Automático
- **Frequência**: Semanal
- **Dados**: Últimos 6 meses de conversões
- **Validação**: Cross-validation 5-fold
- **Deploy**: Automático se accuracy > 85%

## Integrações

### CRMs Suportados
- **Salesforce**: Sync de scores via API
- **HubSpot**: Atualização de propriedades
- **Pipedrive**: Custom fields
- **RD Station**: Lead scoring nativo

### Webhooks
```bash
# Notificação de lead HOT
POST https://client-webhook.com/hot-lead
{
  "leadId": "lead-123",
  "score": 85,
  "classification": "HOT",
  "urgency": "immediate"
}
```

## Métricas

### Performance do Modelo
- **Accuracy**: Target >85%
- **Precision**: Target >80%
- **Recall**: Target >75%
- **F1-Score**: Target >77%

### Métricas de Negócio
- **Leads qualificados/dia**: Target 500+
- **Taxa de conversão HOT**: Target >25%
- **Taxa de conversão WARM**: Target >15%
- **Tempo de qualificação**: Target <30s

## Alertas e Notificações

### Leads HOT
- **Slack**: Notificação imediata
- **Email**: Para equipe comercial
- **SMS**: Para gerente de vendas (opcional)
- **CRM**: Atualização automática

### Anomalias
- **Score Drift**: Mudança significativa na distribuição
- **Model Performance**: Queda na accuracy
- **Data Quality**: Campos faltantes ou inconsistentes

## Casos de Uso

### 1. Priorização Comercial
```
Lead A: Score 85 (HOT) → Contato em 1h
Lead B: Score 65 (WARM) → Contato em 24h
Lead C: Score 45 (COLD) → Nutrição por 30 dias
```

### 2. Segmentação de Campanhas
- **HOT**: Proposta direta + demo
- **WARM**: Caso de sucesso + trial
- **COLD**: Conteúdo educativo + webinar

### 3. Alocação de Recursos
- **SDRs Sênior**: Leads HOT
- **SDRs Pleno**: Leads WARM
- **Marketing**: Leads COLD

## Roadmap

### Próximas Funcionalidades
- **Intent Data**: Sinais de intenção de compra
- **Lookalike Modeling**: Encontrar leads similares
- **Churn Prediction**: Identificar riscos de perda
- **Dynamic Pricing**: Ajuste de preços por score
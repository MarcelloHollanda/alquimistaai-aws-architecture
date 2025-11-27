# Agente de Ads (Anúncios Pagos)

## Visão Geral

O Agente de Ads gerencia campanhas de anúncios pagos em múltiplas plataformas, otimizando automaticamente para maximizar ROI.

## Funcionalidades

### 1. Gestão Multi-Plataforma
- **Google Ads**: Search, Display, YouTube
- **Meta Ads**: Facebook, Instagram
- **LinkedIn Ads**: Sponsored content, InMail
- **TikTok Ads**: In-feed, TopView
- **Twitter Ads**: Promoted tweets
- **Pinterest Ads**: Promoted pins

### 2. Criação de Campanhas
- **Pesquisa de palavras-chave**: Volume e CPC
- **Criação de anúncios**: Múltiplas variações
- **Segmentação**: Audiências personalizadas
- **Lances**: Estratégia automática
- **Budget**: Distribuição inteligente

### 3. Otimização Automática
- **Bid management**: Ajuste de lances em tempo real
- **Budget allocation**: Distribui verba para melhor ROI
- **Ad rotation**: Prioriza anúncios vencedores
- **Negative keywords**: Adiciona automaticamente
- **Audience expansion**: Testa novos públicos

### 4. Criação de Criativos
- **Copy**: Variações de texto persuasivo
- **Imagens**: Geração via IA
- **Vídeos**: Edição automática de clipes
- **Formatos**: Adapta para cada plataforma
- **A/B Testing**: Testa múltiplas versões

### 5. Analytics e Relatórios
- **Performance**: Impressões, cliques, conversões
- **ROI**: Retorno por campanha e canal
- **Attribution**: Jornada completa do cliente
- **Benchmarks**: Comparação com mercado
- **Recomendações**: Sugestões de otimização

## Configuração

### Variáveis de Ambiente
```bash
# APIs das Plataformas
GOOGLE_ADS_CLIENT_ID=...
GOOGLE_ADS_DEVELOPER_TOKEN=...
META_ACCESS_TOKEN=...
LINKEDIN_API_KEY=...
TIKTOK_API_KEY=...

# Configurações
DAILY_BUDGET=500
MAX_CPC=5.00
MIN_ROAS=3.0
AUTO_OPTIMIZATION=true
```

## Input/Output

### Input (Criar Campanha)
```json
{
  "name": "Campanha Produto X - Q1",
  "objective": "conversions",
  "platforms": ["google", "meta"],
  "budget": {
    "total": 15000,
    "daily": 500,
    "distribution": "auto"
  },
  "targeting": {
    "locations": ["BR"],
    "age": "25-54",
    "interests": ["tecnologia", "empreendedorismo"],
    "customAudience": "leads-qualificados"
  },
  "creative": {
    "headlines": [
      "Transforme Seu Negócio",
      "Solução Completa para Empresas"
    ],
    "descriptions": [
      "Aumente suas vendas em 300%",
      "Teste grátis por 14 dias"
    ],
    "images": ["url1", "url2"],
    "cta": "Começar Agora"
  },
  "bidding": {
    "strategy": "target_roas",
    "targetRoas": 4.0
  }
}
```

### Output (Campanha Criada)
```json
{
  "campaignId": "camp-ads-123",
  "status": "active",
  "platforms": {
    "google": {
      "campaignId": "google-456",
      "adGroups": 3,
      "ads": 9,
      "keywords": 45
    },
    "meta": {
      "campaignId": "meta-789",
      "adSets": 2,
      "ads": 6
    }
  },
  "budget": {
    "allocated": 15000,
    "spent": 0,
    "remaining": 15000
  },
  "forecast": {
    "impressions": "150.000-200.000",
    "clicks": "3.000-4.500",
    "conversions": "120-180",
    "estimatedRoas": "3.5-4.5"
  }
}
```

### Output (Relatório Diário)
```json
{
  "date": "2024-01-15",
  "campaignId": "camp-ads-123",
  "performance": {
    "impressions": 12450,
    "clicks": 387,
    "ctr": "3.11%",
    "conversions": 23,
    "conversionRate": "5.94%",
    "cost": 487.50,
    "revenue": 2875.00,
    "roas": "5.9x",
    "cpa": 21.20
  },
  "byPlatform": {
    "google": {
      "cost": 312.00,
      "conversions": 15,
      "roas": "6.2x"
    },
    "meta": {
      "cost": 175.50,
      "conversions": 8,
      "roas": "5.4x"
    }
  },
  "optimizations": [
    "Aumentado lance em 15% para palavra-chave 'solução empresarial'",
    "Pausado anúncio com CTR <1%",
    "Expandido audiência similar com performance >4x ROAS"
  ]
}
```

## Estratégias de Lance

### 1. Maximize Conversions
- Foco: Volume de conversões
- Ideal para: Geração de leads
- Budget: Flexível

### 2. Target ROAS
- Foco: Retorno sobre investimento
- Ideal para: E-commerce
- Budget: Médio-alto

### 3. Target CPA
- Foco: Custo por aquisição
- Ideal para: Controle de custos
- Budget: Qualquer

### 4. Maximize Clicks
- Foco: Tráfego
- Ideal para: Awareness
- Budget: Baixo-médio

## Métricas

- **ROAS médio**: Target >4:1
- **CTR**: Target >2%
- **Conversion Rate**: Target >3%
- **CPA**: Abaixo do LTV/3
- **Quality Score**: >7/10

## Preço Standalone
**R$ 497/mês** + 10% do budget gerenciado (mín. R$ 2.000/mês em ads)
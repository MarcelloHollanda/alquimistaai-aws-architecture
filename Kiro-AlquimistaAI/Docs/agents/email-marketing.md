# Agente de Email Marketing

## Visão Geral

O Agente de Email Marketing automatiza campanhas de email, desde criação de conteúdo até análise de performance e otimização de conversões.

## Funcionalidades

### 1. Criação de Campanhas
- **Templates responsivos**: Design automático
- **Personalização**: Nome, empresa, histórico
- **A/B Testing**: Testa assuntos e conteúdos
- **Segmentação**: Por perfil, comportamento, estágio
- **Automação**: Sequências baseadas em triggers

### 2. Gestão de Listas
- **Segmentação inteligente**: Grupos dinâmicos
- **Limpeza automática**: Remove inativos e bounces
- **Opt-in/Opt-out**: Gestão de consentimento LGPD
- **Importação**: De CRM, planilhas, formulários
- **Enriquecimento**: Dados complementares

### 3. Automações
- **Welcome Series**: Sequência de boas-vindas
- **Nutrição**: Conteúdo educativo progressivo
- **Carrinho abandonado**: Recuperação de vendas
- **Re-engajamento**: Reativação de inativos
- **Pós-venda**: Follow-up e upsell

### 4. Otimização de Entrega
- **Melhor horário**: Por perfil de destinatário
- **Warm-up**: Aquecimento de domínio
- **SPF/DKIM/DMARC**: Configuração automática
- **Reputação**: Monitoramento de sender score
- **Deliverability**: Taxa de entrega >95%

### 5. Analytics Avançado
- **Open rate**: Taxa de abertura
- **Click rate**: Taxa de cliques
- **Conversões**: Vendas geradas
- **Heatmaps**: Onde clicam no email
- **ROI**: Retorno por campanha

## Configuração

### Variáveis de Ambiente
```bash
# SMTP/Provider
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=...
FROM_EMAIL=contato@empresa.com
FROM_NAME=Empresa

# Integrações
CRM_API_KEY=...
ANALYTICS_ID=...

# Configurações
DAILY_LIMIT=10000
HOURLY_LIMIT=1000
UNSUBSCRIBE_LINK=true
TRACK_OPENS=true
TRACK_CLICKS=true
```

## Input/Output

### Input (Criar Campanha)
```json
{
  "name": "Lançamento Q1 2024",
  "subject": "Novidade exclusiva para você",
  "segment": "leads-qualificados",
  "template": "product-launch",
  "variables": {
    "productName": "Produto X",
    "discount": "20%",
    "deadline": "2024-01-31"
  },
  "schedule": "2024-01-15T09:00:00Z",
  "abTest": {
    "enabled": true,
    "variants": 2,
    "testDuration": "2h"
  }
}
```

### Output (Campanha Criada)
```json
{
  "campaignId": "camp-456",
  "status": "scheduled",
  "recipients": 5420,
  "estimatedSend": "2024-01-15T09:00:00Z",
  "abTest": {
    "variantA": "Novidade exclusiva para você",
    "variantB": "Você não pode perder isso",
    "sampleSize": 1000
  }
}
```

### Output (Relatório de Campanha)
```json
{
  "campaignId": "camp-456",
  "sent": 5420,
  "delivered": 5180,
  "opened": 1295,
  "clicked": 389,
  "converted": 47,
  "metrics": {
    "deliveryRate": "95.6%",
    "openRate": "25.0%",
    "clickRate": "7.5%",
    "conversionRate": "0.9%"
  },
  "revenue": "R$ 23.500,00",
  "roi": "4.7x"
}
```

## Automações Pré-Configuradas

### 1. Welcome Series (5 emails)
- Email 1: Boas-vindas + Benefícios
- Email 2: Caso de sucesso
- Email 3: Conteúdo educativo
- Email 4: Demonstração/Trial
- Email 5: Oferta especial

### 2. Nutrição de Leads (8 emails)
- Semana 1-2: Educação sobre problema
- Semana 3-4: Apresentação de solução
- Semana 5-6: Comparativos e diferenciais
- Semana 7-8: Oferta e urgência

### 3. Carrinho Abandonado (3 emails)
- 1h depois: Lembrete suave
- 24h depois: Benefícios + Social proof
- 48h depois: Desconto urgente

## Métricas

- **Emails enviados/mês**: Target 50.000+
- **Taxa de entrega**: Target >95%
- **Open rate**: Target >20%
- **Click rate**: Target >3%
- **Conversão**: Target >1%
- **ROI**: Target 4:1

## Preço Standalone
**R$ 197/mês** - Até 10.000 contatos e 50.000 emails/mês
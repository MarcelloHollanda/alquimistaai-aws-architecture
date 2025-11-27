# Agente de Follow-up

## Visão Geral

O Agente de Follow-up gerencia sequências automatizadas de nutrição de leads, mantendo engajamento contínuo através de múltiplos canais e touchpoints personalizados baseados no comportamento e perfil do lead.

## Funcionalidades

### 1. Sequências Inteligentes
- **Cadências Personalizadas**: Baseadas no perfil e comportamento
- **Multi-canal**: Email, WhatsApp, SMS, LinkedIn
- **Timing Otimizado**: Horários ideais por lead
- **Conteúdo Dinâmico**: Mensagens adaptadas ao contexto

### 2. Triggers Comportamentais
- **Email Aberto**: Sequência de engajamento
- **Link Clicado**: Conteúdo relacionado
- **Resposta Recebida**: Escalação para humano
- **Sem Resposta**: Mudança de canal/abordagem

### 3. Nutrição por Funil
- **Topo**: Conteúdo educativo e awareness
- **Meio**: Casos de uso e comparações
- **Fundo**: Propostas e demos
- **Pós-venda**: Onboarding e upsell

## Configuração

### Variáveis de Ambiente
```bash
EVENT_BUS_NAME=fibonacci-bus-dev
DB_SECRET_ARN=arn:aws:secretsmanager:...
MCP_EMAIL_ENDPOINT=https://...
MCP_WHATSAPP_ENDPOINT=https://...
SEQUENCE_MAX_TOUCHES=12
SEQUENCE_MAX_DAYS=90
```

### Triggers
- **EventBridge Scheduler**: Execução a cada 15 minutos
- **EventBridge Rules**: Eventos de comportamento
- **Timeout**: 60 segundos
- **Memory**: 512MB

## Input/Output

### Input (Scheduled Event)
```json
{
  "source": "aws.scheduler",
  "detail-type": "Follow-up Check",
  "detail": {
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

### Input (Behavioral Event)
```json
{
  "source": "nigredo.atendimento",
  "detail-type": "Lead Interaction",
  "detail": {
    "leadId": "lead-456",
    "action": "email_opened",
    "campaignId": "camp-123",
    "timestamp": "2024-01-15T10:30:00Z",
    "metadata": {
      "subject": "Como aumentar suas vendas em 30%",
      "openCount": 2
    }
  }
}
```

### Output (EventBridge Event)
```json
{
  "source": "nigredo.followup",
  "detail-type": "Follow-up Sent",
  "detail": {
    "leadId": "lead-456",
    "sequenceId": "seq-789",
    "touchNumber": 3,
    "channel": "whatsapp",
    "message": "Olá João! Vi que você abriu nosso email sobre vendas...",
    "nextFollowup": "2024-01-17T14:00:00Z",
    "sequenceStatus": "active"
  }
}
```

## Tipos de Sequências

### 1. Sequência de Boas-Vindas (7 touches, 14 dias)
```
Dia 0: Email - Boas-vindas + Guia inicial
Dia 1: WhatsApp - Dúvidas sobre o guia?
Dia 3: Email - Caso de sucesso similar
Dia 7: LinkedIn - Conexão + conteúdo
Dia 10: Email - Webinar exclusivo
Dia 12: WhatsApp - Última chance webinar
Dia 14: Email - Proposta personalizada
```

### 2. Sequência de Reengajamento (5 touches, 21 dias)
```
Dia 0: Email - "Sentimos sua falta"
Dia 3: WhatsApp - Oferta especial
Dia 7: Email - Novo case study
Dia 14: LinkedIn - Conteúdo premium
Dia 21: Email - "Última tentativa"
```

### 3. Sequência Pós-Demo (6 touches, 30 dias)
```
Dia 0: Email - Obrigado pela demo + resumo
Dia 1: WhatsApp - Dúvidas sobre a demo?
Dia 3: Email - Proposta comercial
Dia 7: WhatsApp - Follow-up da proposta
Dia 14: Email - Desconto por tempo limitado
Dia 30: LinkedIn - Conexão + case similar
```

## Personalização de Conteúdo

### 1. Variáveis Dinâmicas
```
{{nome}} - Nome do lead
{{empresa}} - Nome da empresa
{{setor}} - Setor de atuação
{{cargo}} - Cargo do lead
{{cidade}} - Cidade da empresa
{{pain_point}} - Dor identificada
{{solution}} - Solução recomendada
{{case_study}} - Case similar
```

### 2. Conteúdo por Persona
```json
{
  "CEO": {
    "tom": "executivo",
    "foco": "ROI e resultados",
    "conteudo": "cases de crescimento"
  },
  "CTO": {
    "tom": "técnico",
    "foco": "tecnologia e integração",
    "conteudo": "documentação técnica"
  },
  "CMO": {
    "tom": "estratégico",
    "foco": "marketing e conversão",
    "conteudo": "métricas de marketing"
  }
}
```

### 3. Adaptação por Comportamento
- **Alta Engajamento**: Acelerar sequência
- **Baixo Engajamento**: Mudar canal/abordagem
- **Sem Resposta**: Pausar por 7 dias
- **Resposta Negativa**: Mover para nurturing longo

## Regras de Negócio

### 1. Frequência de Contato
```python
def calculate_next_touch(lead_score, engagement_level):
    base_interval = 3  # dias
    
    if lead_score >= 80:  # HOT
        return base_interval * 0.5  # Mais frequente
    elif lead_score >= 60:  # WARM
        return base_interval * 1.0  # Normal
    else:  # COLD
        return base_interval * 2.0  # Menos frequente
```

### 2. Seleção de Canal
```python
def select_channel(touch_number, previous_responses):
    if touch_number == 1:
        return "email"  # Sempre começar com email
    
    if previous_responses.get("email", 0) > 0:
        return "email"  # Continuar no canal que responde
    elif previous_responses.get("whatsapp", 0) > 0:
        return "whatsapp"
    else:
        # Alternar canais se não há resposta
        return "whatsapp" if touch_number % 2 == 0 else "email"
```

### 3. Condições de Parada
- **Resposta Positiva**: Transferir para vendas
- **Descadastro**: Parar imediatamente
- **Limite de Touches**: Pausar por 30 dias
- **Lead Convertido**: Mover para pós-venda

## Templates de Mensagens

### Email Templates
```html
<!-- Template: Boas-vindas -->
<h2>Bem-vindo, {{nome}}! 👋</h2>
<p>Obrigado por se interessar pela nossa solução para {{setor}}.</p>
<p>Preparei um guia especial sobre {{pain_point}} que pode ajudar a {{empresa}}:</p>
<a href="{{guia_link}}">📖 Baixar Guia Gratuito</a>

<!-- Template: Follow-up -->
<h2>{{nome}}, como está indo com o guia?</h2>
<p>Vi que você baixou nosso material sobre {{pain_point}}.</p>
<p>Empresas como {{case_study}} conseguiram {{resultado}} em apenas {{tempo}}.</p>
<a href="{{demo_link}}">🎯 Agendar Demo Personalizada</a>
```

### WhatsApp Templates
```
🎯 Olá {{nome}}!

Vi que você se interessou por nossa solução para {{setor}}.

Empresas como a {{empresa}} geralmente enfrentam desafios com {{pain_point}}.

Que tal uma conversa rápida de 15 min para mostrar como podemos ajudar?

👉 {{agendamento_link}}
```

## Métricas e Analytics

### 1. Métricas por Sequência
- **Taxa de Abertura**: Por canal e touch
- **Taxa de Clique**: Por CTA e conteúdo
- **Taxa de Resposta**: Por mensagem
- **Taxa de Conversão**: Por sequência completa

### 2. Métricas por Canal
```json
{
  "email": {
    "open_rate": 0.35,
    "click_rate": 0.08,
    "response_rate": 0.03
  },
  "whatsapp": {
    "delivery_rate": 0.98,
    "read_rate": 0.85,
    "response_rate": 0.12
  },
  "linkedin": {
    "connection_rate": 0.45,
    "message_rate": 0.25,
    "response_rate": 0.08
  }
}
```

### 3. Otimização Contínua
- **A/B Testing**: Subject lines, horários, conteúdo
- **Machine Learning**: Predição de melhor canal
- **Behavioral Analysis**: Padrões de engajamento

## Integrações

### 1. Plataformas de Email
- **SendGrid**: Envio e tracking
- **Mailgun**: Deliverability
- **Amazon SES**: Custo-efetivo

### 2. WhatsApp Business
- **Meta API**: Mensagens oficiais
- **Twilio**: Backup e SMS
- **Zenvia**: Integração nacional

### 3. LinkedIn Sales Navigator
- **Conexões Automáticas**: Com aprovação
- **InMail**: Para prospects premium
- **Content Sharing**: Posts relevantes

## Compliance e LGPD

### 1. Consentimento
- **Opt-in Explícito**: Para cada canal
- **Preference Center**: Controle pelo lead
- **Unsubscribe**: Um clique em todos os canais

### 2. Frequência
- **Limites Diários**: Máximo 1 mensagem/dia
- **Limites Semanais**: Máximo 3 mensagens/semana
- **Pausas Obrigatórias**: 24h entre canais diferentes

### 3. Auditoria
- **Log Completo**: Todas as mensagens enviadas
- **Consent Tracking**: Histórico de permissões
- **Opt-out Tracking**: Descadastros por canal

## Casos de Uso Avançados

### 1. Sequência Baseada em Score
```python
if lead_score >= 80:
    sequence = "hot_lead_sequence"  # 5 touches, 7 dias
elif lead_score >= 60:
    sequence = "warm_lead_sequence"  # 7 touches, 14 dias
else:
    sequence = "cold_lead_sequence"  # 12 touches, 90 dias
```

### 2. Reativação de Leads Frios
```python
def reactivate_cold_leads():
    cold_leads = get_leads_no_activity(days=60)
    for lead in cold_leads:
        start_sequence(lead, "reactivation_sequence")
```

### 3. Sequência Sazonal
```python
def seasonal_sequence(lead, season):
    if season == "black_friday":
        return "discount_sequence"
    elif season == "new_year":
        return "planning_sequence"
    else:
        return "default_sequence"
```

## Roadmap

### Próximas Funcionalidades
- **Video Personalizados**: Mensagens em vídeo
- **Voice Messages**: WhatsApp com áudio
- **Chatbot Integration**: Conversas automatizadas
- **Predictive Send Time**: ML para timing ótimo
# Agente de Análise de Sentimento

## Visão Geral

O Agente de Análise de Sentimento processa mensagens de leads para classificar emoções e detectar palavras-chave de descadastro (LGPD).

## Funcionalidades

### 1. Pré-processamento
- **Normalização**: Remove acentos e caracteres especiais
- **Tokenização**: Divide texto em tokens
- **Limpeza**: Remove stop words e ruído

### 2. Análise de Sentimento
- **AWS Comprehend**: Análise nativa
- **Classificação**: Positivo, neutro, negativo, misto
- **Intensidade**: Score 0-100
- **Confiança**: Nível de certeza da análise

### 3. Detecção LGPD
- **Palavras-chave**: "descadastro", "remover", "parar"
- **Contexto**: Analisa intenção real
- **Ação**: Trigger automático de descadastro

## Configuração

### Variáveis de Ambiente
```bash
AWS_REGION=us-east-1
COMPREHEND_LANGUAGE_CODE=pt
LGPD_KEYWORDS=descadastro,remover,parar,cancelar
MIN_CONFIDENCE=0.7
```

### Triggers
- **Invocação síncrona**: Outros agentes
- **Timeout**: 10 segundos
- **Memory**: 512MB

## Input/Output

### Input (Direct Invocation)
```json
{
  "text": "Não tenho interesse, por favor me remova da lista",
  "leadId": "lead-456",
  "context": {
    "channel": "whatsapp",
    "previousSentiment": "neutral"
  }
}
```

### Output (Response)
```json
{
  "sentiment": "negative",
  "score": 85,
  "confidence": 0.92,
  "emotions": {
    "frustration": 0.7,
    "rejection": 0.8
  },
  "lgpdTrigger": true,
  "keywords": ["remova"],
  "recommendation": "immediate_unsubscribe"
}
```

## Classificações

### Sentimentos
- **Positive** (0.6-1.0): Interesse, satisfação
- **Neutral** (0.4-0.6): Neutro, informativo
- **Negative** (0.0-0.4): Desinteresse, frustração
- **Mixed**: Sentimentos conflitantes

### Emoções Específicas
- **Excitement**: Entusiasmo pelo produto
- **Curiosity**: Interesse em saber mais
- **Skepticism**: Dúvidas ou resistência
- **Frustration**: Irritação com abordagem
- **Urgency**: Necessidade imediata

## LGPD Keywords

### Descadastro Direto
- "descadastro", "descadastrar"
- "remover", "remova"
- "parar", "pare"
- "cancelar", "cancele"

### Descadastro Contextual
- "não quero mais"
- "não tenho interesse"
- "me tire da lista"
- "não me procurem"

## Métricas

- **Análises/segundo**: Target 100+
- **Precisão sentimento**: Target 90%+
- **Detecção LGPD**: Target 99%+
- **Latência**: Target <500ms
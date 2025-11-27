# Agente de Objeções

## Visão Geral

O Agente de Objeções identifica, categoriza e responde automaticamente às principais resistências e objeções dos leads, utilizando técnicas de vendas consultivas e uma base de conhecimento continuamente atualizada.

## Funcionalidades

### 1. Detecção de Objeções
- **NLP Avançado**: Identificação de padrões de resistência
- **Análise de Sentimento**: Contexto emocional da objeção
- **Classificação Automática**: Categorização por tipo
- **Urgência**: Priorização por impacto na venda

### 2. Base de Conhecimento
- **Objeções Comuns**: Biblioteca pré-construída
- **Respostas Testadas**: Scripts validados pela equipe
- **Casos de Sucesso**: Exemplos de superação
- **Atualizações Contínuas**: Learning from interactions

### 3. Técnicas de Resposta
- **Feel, Felt, Found**: Empatia e validação
- **Boomerang**: Transformar objeção em vantagem
- **Isolamento**: Confirmar se é a única preocupação
- **Prova Social**: Cases e depoimentos

## Configuração

### Variáveis de Ambiente
```bash
EVENT_BUS_NAME=fibonacci-bus-dev
DB_SECRET_ARN=arn:aws:secretsmanager:...
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet
OBJECTION_CONFIDENCE_THRESHOLD=0.75
ESCALATION_THRESHOLD=3
```

### Triggers
- **EventBridge Rule**: `nigredo.atendimento.objection_detected`
- **Timeout**: 30 segundos
- **Memory**: 1024MB

## Input/Output

### Input (EventBridge Event)
```json
{
  "source": "nigredo.atendimento",
  "detail-type": "Objection Detected",
  "detail": {
    "leadId": "lead-456",
    "conversationId": "conv-789",
    "message": "Está muito caro, não temos orçamento para isso agora",
    "context": {
      "previousMessages": 5,
      "leadScore": 75,
      "empresa": "TechCorp",
      "setor": "Tecnologia",
      "porte": "Médio"
    }
  }
}
```

### Output (EventBridge Event)
```json
{
  "source": "nigredo.objecoes",
  "detail-type": "Objection Handled",
  "detail": {
    "leadId": "lead-456",
    "objectionType": "price",
    "objectionSubtype": "budget_constraint",
    "confidence": 0.89,
    "response": "Entendo sua preocupação com o investimento, João. Muitos CEOs de empresas de tecnologia como você inicialmente pensaram o mesmo. Porém, descobriram que o ROI em 6 meses mais que compensou o investimento inicial. Que tal mostrarmos exatamente como isso funcionaria na TechCorp?",
    "technique": "feel_felt_found",
    "nextAction": "schedule_roi_demo",
    "escalationNeeded": false
  }
}
```

## Tipos de Objeções

### 1. Objeções de Preço (40% dos casos)
```json
{
  "price": {
    "patterns": [
      "muito caro", "não temos orçamento", "preço alto",
      "não vale o investimento", "muito dinheiro"
    ],
    "subtypes": {
      "budget_constraint": "Limitação orçamentária real",
      "value_perception": "Não vê valor suficiente",
      "comparison": "Comparando com concorrentes",
      "timing": "Orçamento para próximo período"
    }
  }
}
```

### 2. Objeções de Autoridade (25% dos casos)
```json
{
  "authority": {
    "patterns": [
      "preciso consultar", "não sou eu quem decide",
      "vou falar com o chefe", "equipe precisa aprovar"
    ],
    "subtypes": {
      "not_decision_maker": "Não é o decisor final",
      "committee_decision": "Decisão em comitê",
      "budget_approval": "Precisa aprovação orçamentária",
      "technical_approval": "Precisa aprovação técnica"
    }
  }
}
```

### 3. Objeções de Necessidade (20% dos casos)
```json
{
  "need": {
    "patterns": [
      "não precisamos", "já temos solução",
      "não é prioridade", "funciona bem assim"
    ],
    "subtypes": {
      "no_pain": "Não reconhece a dor",
      "existing_solution": "Já tem solução",
      "low_priority": "Não é prioridade",
      "status_quo": "Resistência à mudança"
    }
  }
}
```

### 4. Objeções de Timing (15% dos casos)
```json
{
  "timing": {
    "patterns": [
      "não é o momento", "talvez no futuro",
      "muito ocupado", "final do ano"
    ],
    "subtypes": {
      "busy_period": "Período muito ocupado",
      "seasonal": "Questões sazonais",
      "project_timing": "Timing de outros projetos",
      "budget_cycle": "Ciclo orçamentário"
    }
  }
}
```

## Técnicas de Resposta

### 1. Feel, Felt, Found
```python
def feel_felt_found_response(objection, lead_context):
    template = """
    Entendo como você se sente, {nome}. 
    
    Muitos {cargo}s de empresas {setor} como a {empresa} 
    inicialmente sentiram a mesma preocupação sobre {objection_topic}.
    
    Porém, descobriram que {benefit} mais que compensou {concern}.
    
    {case_study_example}
    
    Que tal mostrarmos exatamente como isso funcionaria na {empresa}?
    """
    
    return template.format(
        nome=lead_context['nome'],
        cargo=lead_context['cargo'],
        setor=lead_context['setor'],
        empresa=lead_context['empresa'],
        objection_topic=objection['topic'],
        benefit=objection['counter_benefit'],
        concern=objection['concern'],
        case_study_example=get_relevant_case_study(lead_context)
    )
```

### 2. Isolamento da Objeção
```python
def isolation_technique(objection):
    return f"""
    {objection_response}
    
    Se conseguirmos resolver essa questão sobre {objection_topic}, 
    existe alguma outra preocupação que impediria você de seguir em frente?
    
    Ou seria apenas isso mesmo?
    """
```

### 3. Boomerang
```python
def boomerang_technique(objection, lead_context):
    if objection['type'] == 'price':
        return """
        Exatamente por isso que nossa solução faz tanto sentido para vocês!
        
        Se o orçamento está apertado, é ainda mais importante garantir 
        que cada real investido gere o máximo retorno possível.
        
        Nossa solução foi desenhada especificamente para empresas que 
        precisam maximizar resultados com recursos limitados.
        """
```

## Base de Conhecimento

### 1. Respostas por Setor
```json
{
  "tecnologia": {
    "price_objections": {
      "response": "Empresas de tecnologia como a {empresa} geralmente veem ROI de 300-500% em 6 meses...",
      "case_studies": ["TechCorp reduziu custos em 40%", "StartupXYZ aumentou receita em 200%"]
    }
  },
  "varejo": {
    "price_objections": {
      "response": "No varejo, cada real economizado vai direto para o resultado...",
      "case_studies": ["Loja ABC aumentou margem em 15%", "Rede XYZ otimizou estoque"]
    }
  }
}
```

### 2. Scripts Validados
```json
{
  "price_too_high": {
    "script": "Entendo sua preocupação com o investimento. Posso perguntar: qual seria um investimento que faria sentido para vocês?",
    "follow_up": "Baseado nisso, deixe-me mostrar como podemos estruturar uma proposta que caiba no seu orçamento...",
    "success_rate": 0.73
  }
}
```

### 3. Casos de Sucesso
```json
{
  "budget_constraint_overcome": {
    "client": "Empresa Similar Ltda",
    "objection": "Orçamento limitado",
    "solution": "Parcelamento em 12x + ROI garantido",
    "result": "Pagou-se em 4 meses",
    "quote": "Melhor investimento que fizemos nos últimos anos"
  }
}
```

## Algoritmo de Detecção

### 1. Processamento de Texto
```python
def detect_objection(message, context):
    # Pré-processamento
    cleaned_message = preprocess_text(message)
    
    # Análise de sentimento
    sentiment = analyze_sentiment(cleaned_message)
    
    # Detecção de padrões
    objection_patterns = load_objection_patterns()
    matches = []
    
    for pattern in objection_patterns:
        confidence = calculate_similarity(cleaned_message, pattern)
        if confidence > OBJECTION_CONFIDENCE_THRESHOLD:
            matches.append({
                'type': pattern['type'],
                'subtype': pattern['subtype'],
                'confidence': confidence
            })
    
    # Classificação final
    if matches:
        best_match = max(matches, key=lambda x: x['confidence'])
        return {
            'objection_detected': True,
            'type': best_match['type'],
            'subtype': best_match['subtype'],
            'confidence': best_match['confidence'],
            'sentiment': sentiment
        }
    
    return {'objection_detected': False}
```

### 2. Contextualização
```python
def contextualize_objection(objection, lead_context):
    # Histórico de objeções
    previous_objections = get_lead_objections(lead_context['leadId'])
    
    # Perfil do lead
    lead_profile = {
        'setor': lead_context['setor'],
        'porte': lead_context['porte'],
        'score': lead_context['score']
    }
    
    # Timing da objeção
    conversation_stage = determine_conversation_stage(lead_context)
    
    return {
        'objection': objection,
        'context': {
            'is_repeat': objection['type'] in previous_objections,
            'conversation_stage': conversation_stage,
            'lead_profile': lead_profile
        }
    }
```

## Escalação Inteligente

### 1. Critérios de Escalação
```python
def should_escalate(objection_history, lead_context):
    # Múltiplas objeções do mesmo tipo
    if count_objection_type(objection_history, objection['type']) >= 3:
        return True
    
    # Lead de alto valor
    if lead_context['score'] >= 90:
        return True
    
    # Objeção complexa
    if objection['confidence'] < 0.6:
        return True
    
    # Solicitação explícita
    if 'falar com humano' in objection['message'].lower():
        return True
    
    return False
```

### 2. Handoff para Humano
```json
{
  "escalation": {
    "reason": "multiple_price_objections",
    "lead_summary": "Lead qualificado com 3 objeções de preço",
    "conversation_history": "...",
    "recommended_approach": "Demonstrar ROI com números específicos",
    "urgency": "high"
  }
}
```

## Métricas e Analytics

### 1. Taxa de Resolução
```json
{
  "objection_resolution_rate": {
    "price": 0.68,
    "authority": 0.45,
    "need": 0.72,
    "timing": 0.58,
    "overall": 0.61
  }
}
```

### 2. Eficácia por Técnica
```json
{
  "technique_effectiveness": {
    "feel_felt_found": 0.73,
    "isolation": 0.65,
    "boomerang": 0.58,
    "social_proof": 0.71
  }
}
```

### 3. Padrões de Objeções
- **Por Setor**: Tecnologia tem mais objeções de preço
- **Por Porte**: PMEs focam em ROI, grandes em features
- **Por Timing**: Q4 tem mais objeções orçamentárias

## Integração com CRM

### 1. Registro de Objeções
```python
def log_objection_to_crm(lead_id, objection_data):
    crm_data = {
        'lead_id': lead_id,
        'objection_type': objection_data['type'],
        'objection_text': objection_data['original_message'],
        'response_used': objection_data['response'],
        'resolution_status': objection_data['resolved'],
        'timestamp': datetime.now()
    }
    
    crm_client.create_activity(crm_data)
```

### 2. Alertas para Vendedores
```json
{
  "alert": {
    "type": "repeated_objection",
    "lead_id": "lead-456",
    "message": "Lead apresentou 3ª objeção de preço. Considere demonstração de ROI personalizada.",
    "priority": "high"
  }
}
```

## Treinamento Contínuo

### 1. Feedback Loop
- **Respostas Bem-sucedidas**: Adicionadas à base
- **Falhas**: Analisadas e melhoradas
- **Novos Padrões**: Identificados automaticamente

### 2. A/B Testing
- **Diferentes Respostas**: Para mesma objeção
- **Técnicas Variadas**: Comparação de eficácia
- **Personalização**: Por perfil de lead

### 3. Machine Learning
- **Predição**: Probabilidade de objeção por lead
- **Otimização**: Melhor resposta por contexto
- **Timing**: Momento ideal para abordar objeções

## Roadmap

### Próximas Funcionalidades
- **Voice Analysis**: Detecção em chamadas de voz
- **Emotion AI**: Análise emocional avançada
- **Predictive Objections**: Antecipar resistências
- **Dynamic Pricing**: Ajuste baseado em objeções
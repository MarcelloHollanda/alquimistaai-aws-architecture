# Agente de Atendimento - Nigredo

## Visão Geral

O Agente de Atendimento é responsável por responder automaticamente às mensagens dos leads usando Inteligência Artificial, análise de sentimento e geração de respostas contextualizadas.

## Funcionalidades Principais

### 1. Recebimento de Webhooks
- Recebe webhooks do WhatsApp/Email via API Gateway
- Valida payload usando Zod schema
- Suporta múltiplos canais (WhatsApp, Email)

### 2. Identificação de Lead
- Busca lead no banco de dados por telefone ou email
- Retorna 404 se lead não for encontrado
- Consulta histórico completo de interações

### 3. Análise de Sentimento
- Invoca Agente de Análise de Sentimento (Lambda síncrona)
- Classifica emoção: positivo, neutro, negativo, irritado
- Detecta palavras-chave de descadastro (LGPD)
- Score de confiança 0-100

### 4. Geração de Resposta com LLM
- Usa AWS Bedrock (Claude 3 Haiku) para gerar respostas
- Ajusta tom baseado no sentimento detectado
- Aplica prompt template com contexto do lead
- Inclui histórico de conversas (últimas 5 interações)
- Fallback para respostas template se LLM falhar

### 5. Validação de Políticas de Marca
- Remove menções a AI/bot/robô
- Limita uso de emojis (máximo 2)
- Trunca mensagens longas (máximo 1000 caracteres)
- Garante linguagem natural e profissional

### 6. Envio de Resposta
- Envia via MCP WhatsApp ou Email
- Usa idempotency key para evitar duplicatas
- Registra interação no banco de dados

### 7. Decisão de Próximo Passo
- **Agendamento**: Lead demonstra interesse, sugere reunião
- **Nutrição**: Lead neutro, continua relacionamento
- **Descarte**: Lead negativo após múltiplas tentativas
- **Escalate Human**: Lead irritado, requer intervenção humana

### 8. Conformidade LGPD
- Detecta solicitações de descadastro
- Marca lead como descadastrado
- Cancela agendamentos futuros
- Adiciona à blocklist
- Envia confirmação automática

## Fluxo de Processamento

```
Webhook → Validação → Identificar Lead → Consultar Histórico
    ↓
Registrar Mensagem Recebida → Analisar Sentimento
    ↓
Descadastro? → Sim → Processar LGPD → Fim
    ↓ Não
Gerar Resposta (LLM) → Validar Políticas → Enviar Resposta
    ↓
Registrar Interação → Atualizar Status → Publicar Evento
```

## Configuração

### Variáveis de Ambiente
- `EVENT_BUS_NAME`: Nome do EventBridge bus
- `DB_SECRET_ARN`: ARN do secret com credenciais do banco
- `SENTIMENT_LAMBDA_ARN`: ARN do Lambda de análise de sentimento
- `AWS_REGION`: Região AWS para Bedrock
- `POWERTOOLS_SERVICE_NAME`: Nome do serviço para logs
- `LOG_LEVEL`: Nível de log (DEBUG, INFO, WARN, ERROR)

### Permissões IAM Necessárias
- EventBridge: PutEvents
- Secrets Manager: GetSecretValue (DB + MCP)
- Aurora: Acesso via VPC Security Group
- Lambda: InvokeFunction (Sentiment Agent)
- Bedrock: InvokeModel (Claude 3 Haiku)
- SQS: SendMessage (DLQ)

### Recursos AWS
- **Memória**: 1024 MB
- **Timeout**: 30 segundos
- **Runtime**: Node.js 20.x
- **VPC**: Private Isolated Subnet
- **Tracing**: X-Ray habilitado

## Integração com Outros Agentes

### Agente de Análise de Sentimento
- Invocação síncrona via Lambda
- Recebe classificação emocional
- Usa resultado para ajustar tom da resposta

### Agente de Agendamento
- Publica evento `atendimento.schedule_requested`
- Acionado quando lead demonstra interesse

### Agente de Relatórios
- Todas as interações são registradas
- Métricas de sentimento disponíveis para análise

## Eventos Publicados

### `nigredo.atendimento.completed`
- Lead respondido com sucesso
- Próximo passo: nutrição

### `nigredo.atendimento.schedule_requested`
- Lead demonstrou interesse
- Próximo passo: agendamento

### `nigredo.atendimento.escalate_human`
- Lead irritado
- Requer intervenção humana

### `nigredo.atendimento.disqualified`
- Lead descartado
- Múltiplas tentativas sem sucesso

### `nigredo.atendimento.descadastro`
- Lead solicitou descadastro
- Conformidade LGPD

## Prompt Template

O prompt enviado ao LLM inclui:
- Contexto do lead (empresa, contato, segmento)
- Histórico de conversas (últimas 5 interações)
- Última mensagem do lead
- Tom desejado baseado no sentimento
- Políticas da marca
- Instruções específicas

## Políticas de Marca

1. **Respeito ao tempo do lead**
2. **Não ser insistente ou agressivo**
3. **Foco em resolver problemas, não em vender**
4. **Uso moderado de emojis (máximo 2)**
5. **Nunca mencionar que é AI/bot**
6. **Linguagem natural e brasileira**
7. **Postura profissional e consultiva**

## Tratamento de Erros

### Erro na Análise de Sentimento
- Retorna sentimento neutro (score 50)
- Continua processamento normalmente

### Erro no LLM (Bedrock)
- Usa resposta template baseada no sentimento
- Registra erro nos logs
- Não bloqueia o fluxo

### Erro no Envio
- Lança exceção
- Mensagem vai para DLQ
- Retry automático pelo SQS

## Monitoramento

### Métricas CloudWatch
- Invocações por minuto
- Duração média
- Taxa de erro
- Sentimento médio dos leads
- Taxa de descadastro

### Logs Estruturados
- Todos os logs incluem `trace_id`
- Formato JSON para fácil análise
- Níveis: DEBUG, INFO, WARN, ERROR

### X-Ray Tracing
- Rastreamento distribuído habilitado
- Visualização de latência por componente
- Identificação de gargalos

## Exemplos de Uso

### Webhook WhatsApp
```json
{
  "from": "+5511987654321",
  "message": "Olá, tenho interesse em conhecer mais sobre a solução",
  "channel": "whatsapp",
  "messageId": "msg_123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Resposta Gerada
```
Que ótimo! 😊

Fico feliz em saber do seu interesse. Nossa solução ajuda empresas como a sua a otimizar processos e reduzir custos operacionais.

Podemos agendar uma conversa de 30 minutos para eu entender melhor suas necessidades e mostrar como podemos ajudar?

Tenho disponibilidade esta semana. Qual dia e horário funcionam melhor para você?
```

## Próximos Passos

Após implementação completa:
1. Integrar com API Gateway da FibonacciStack
2. Configurar webhook do WhatsApp Business
3. Testar fluxo end-to-end
4. Ajustar prompts baseado em feedback
5. Monitorar métricas de conversão

## Referências

- Requirements: 11.6, 11.7
- Design: Seção 5.4 (Agente de Atendimento)
- Tasks: 15.1 - 15.5

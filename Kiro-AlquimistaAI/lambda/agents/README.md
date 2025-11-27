# Agentes Nigredo - Prospecção B2B

Este diretório contém os agentes fractais do núcleo Nigredo, responsáveis pela prospecção inteligente de leads B2B.

## Agentes Implementados

### 1. Agente de Recebimento (`recebimento.ts`)

**Status**: ✅ Implementado

**Responsabilidades**:
- Receber planilhas Excel ou JSON com leads
- Validar campos obrigatórios (empresa, contato, telefone/email)
- Diferenciar PF de PJ usando validação de CNPJ
- Formatar telefones para padrão internacional (+55...)
- Formatar emails para lowercase
- Remover duplicatas usando hash de email+telefone
- Enriquecer dados via MCP (Receita Federal, Google Places)
- Segmentar leads por setor, porte e atividade
- Calcular score de prioridade (0-100)
- Criar lotes homogêneos por atividade
- Persistir leads no banco de dados
- Publicar evento `nigredo.recebimento.completed`

**Configuração Lambda**:
- Memory: 1024 MB
- Timeout: 60 segundos
- Trigger: SQS RecebimentoQueue
- VPC: Private Isolated Subnet
- Tracing: X-Ray Active

**Variáveis de Ambiente**:
- `POWERTOOLS_SERVICE_NAME`: nigredo-recebimento
- `LOG_LEVEL`: INFO (prod) / DEBUG (dev)
- `EVENT_BUS_NAME`: Nome do EventBridge bus
- `DB_SECRET_ARN`: ARN do secret com credenciais do Aurora
- `DLQ_URL`: URL da Dead Letter Queue

**Permissões IAM**:
- EventBridge: PutEvents
- Secrets Manager: GetSecretValue (DB + MCP)
- Aurora: Conexão via VPC
- SQS: SendMessage (DLQ)

**Input (SQS Message)**:
```json
{
  "detail": {
    "tenantId": "uuid",
    "leads": [
      {
        "empresa": "Empresa Exemplo LTDA",
        "contato": "João Silva",
        "telefone": "(11) 98765-4321",
        "email": "joao@exemplo.com.br",
        "cnpj": "00.000.000/0001-91",
        "setor": "Tecnologia",
        "porte": "ME"
      }
    ]
  }
}
```

**Output (EventBridge Event)**:
```json
{
  "source": "nigredo.recebimento",
  "detail-type": "recebimento.completed",
  "detail": {
    "tenantId": "uuid",
    "leadIds": ["uuid1", "uuid2"],
    "count": 2,
    "batches": [
      {
        "segmento": "Tecnologia - ME",
        "atividade": "Desenvolvimento de software",
        "leadIds": ["uuid1", "uuid2"],
        "count": 2,
        "prioridadeMedia": 75
      }
    ],
    "batchCount": 1,
    "prioridadeMedia": 75,
    "traceId": "uuid",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

**Métricas**:
- Total de leads recebidos
- Leads válidos vs inválidos
- Duplicatas removidas
- Leads enriquecidos
- Falhas de enriquecimento
- Inconformidades por campo

**Requirements**: 11.3

---

## Agentes Pendentes

### 2. Agente de Estratégia (`estrategia.ts`)
**Status**: ⏳ Pendente

### 3. Agente de Disparo (`disparo.ts`)
**Status**: ⏳ Pendente

### 4. Agente de Atendimento (`atendimento.ts`)
**Status**: ⏳ Pendente

### 5. Agente de Análise de Sentimento (`sentimento.ts`)
**Status**: ⏳ Pendente

### 6. Agente de Agendamento (`agendamento.ts`)
**Status**: ⏳ Pendente

### 7. Agente de Relatórios (`relatorios.ts`)
**Status**: ⏳ Pendente

---

## Arquitetura Fractal

Todos os agentes seguem o padrão fractal:

1. **Autônomos**: Cada agente opera independentemente
2. **Reentrantes**: Podem ser invocados múltiplas vezes sem efeitos colaterais
3. **Reusáveis**: Lógica compartilhada via `lambda/shared/`
4. **Conversacionais**: Comunicam-se via EventBridge usando protocolo padronizado

## Protocolo de Comunicação

Todos os eventos seguem o protocolo fractal:

```typescript
interface FractalEvent {
  leadId: string;
  context: {
    source: 'whatsapp' | 'email' | 'web';
    lastMessage: string;
    history: Interacao[];
    metadata: {
      tenantId: string;
      campaignId?: string;
    };
  };
  classification: {
    intent: 'question' | 'interest' | 'objection' | 'refusal';
    priority: number; // 0-100
    authenticNeed: boolean;
  };
  proposedAction: 'forward_to_scheduler' | 'nurture' | 'disqualify';
  logs: Array<{
    timestamp: string;
    agent: string;
    decision: string;
    traceId: string;
  }>;
}
```

## Desenvolvimento

### Adicionar Novo Agente

1. Criar arquivo `lambda/agents/nome-agente.ts`
2. Implementar handler usando `withSimpleErrorHandling`
3. Adicionar Lambda à `NigredoStack`
4. Configurar trigger (SQS, EventBridge, API Gateway)
5. Conceder permissões IAM necessárias
6. Atualizar este README

### Testes

```bash
# Testes unitários
npm run test lambda/agents/recebimento.test.ts

# Testes de integração
npm run test:integration tests/integration/nigredo-flow.test.ts
```

### Deploy

```bash
# Deploy em dev
npm run deploy:dev

# Deploy em staging
npm run deploy:staging

# Deploy em produção (requer aprovação)
npm run deploy:prod
```

## Monitoramento

### CloudWatch Logs
- `/aws/lambda/nigredo-recebimento-{env}`

### CloudWatch Metrics
- Invocations
- Errors
- Duration
- Throttles

### X-Ray Traces
- Trace ID incluído em todos os logs
- Subsegments para operações críticas (DB, MCP, EventBridge)

### Alarmes
- Taxa de erro > 5%
- Latência p95 > 30s
- DLQ não vazia

## Troubleshooting

### Lead não foi processado
1. Verificar logs do CloudWatch
2. Verificar mensagens na DLQ
3. Verificar trace no X-Ray usando trace_id

### Enriquecimento falhou
1. Verificar credenciais MCP no Secrets Manager
2. Verificar rate limits das APIs externas
3. Verificar conectividade de rede (VPC endpoints)

### Duplicatas não foram removidas
1. Verificar se email e telefone estão sendo formatados corretamente
2. Verificar cálculo do hash
3. Verificar constraint UNIQUE no banco de dados

## Referências

- [Design Document](../../Docs/Arquitetura%20Nigredo/)
- [Requirements](../../.kiro/specs/fibonacci-aws-setup/requirements.md)
- [Tasks](../../.kiro/specs/fibonacci-aws-setup/tasks.md)

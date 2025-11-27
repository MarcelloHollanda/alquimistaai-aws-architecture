# Lambdas - Micro Agente Disparo & Agendamento

Código-fonte TypeScript das Lambdas do Micro Agente de Disparo Automático & Agendamento.

---

## 🚀 Quick Start

### Instalar Dependências

```bash
npm install
```

### Compilar TypeScript

```bash
npm run build
```

### Executar Testes (quando implementados)

```bash
npm test
```

---

## 📁 Estrutura

```
src/
├── types/
│   └── common.ts              # Tipos e interfaces TypeScript
├── utils/
│   ├── aws-clients.ts         # Clientes AWS configurados
│   └── logger.ts              # Logger estruturado
├── ingest-contacts.ts         # Lambda 1: Ingestão de contatos
├── enrich-contacts.ts         # Lambda 2: Enriquecimento de dados
├── plan-campaigns.ts          # Lambda 3: Planejamento de campanhas
├── send-messages.ts           # Lambda 4: Envio de mensagens
├── handle-replies.ts          # Lambda 5: Processamento de respostas
├── schedule-meeting.ts        # Lambda 6: Agendamento de reuniões
└── analytics-reporting.ts     # Lambda 7: Relatórios e métricas
```

---

## 🏗️ Padrão de Implementação

### Template de Lambda

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createLogger } from './utils/logger';
import { docClient, config } from './utils/aws-clients';

const logger = createLogger({ function: 'nome-lambda' });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Iniciando processamento', { event });
  
  try {
    // Implementação aqui
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    logger.error('Erro no processamento', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal error' 
      }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
```

### Uso do Logger

```typescript
// Logger com contexto
const logger = createLogger({ 
  function: 'send-messages',
  contactId: 'CONTACT#123'
});

// Logs estruturados
logger.info('Mensagem enviada', { channel: 'whatsapp' });
logger.warn('Rate limit próximo', { current: 95, max: 100 });
logger.error('Falha ao enviar', new Error('Connection timeout'));
logger.debug('Payload completo', { payload });
```

### Uso dos Clientes AWS

```typescript
import { docClient, config } from './utils/aws-clients';
import { PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Salvar item
await docClient.send(new PutCommand({
  TableName: config.tables.contacts,
  Item: contact,
}));

// Buscar item
const result = await docClient.send(new GetCommand({
  TableName: config.tables.contacts,
  Key: { pk: contactId },
}));

// Atualizar item
await docClient.send(new UpdateCommand({
  TableName: config.tables.messages,
  Key: { pk: messageId },
  UpdateExpression: 'SET #status = :status',
  ExpressionAttributeNames: { '#status': 'status' },
  ExpressionAttributeValues: { ':status': 'sent' },
}));
```

---

## 🧪 Testes

### Estrutura de Testes (quando implementados)

```
tests/
├── unit/
│   ├── ingest-contacts.test.ts
│   ├── send-messages.test.ts
│   └── ...
├── integration/
│   ├── disparo-flow.test.ts
│   └── agendamento-flow.test.ts
└── e2e/
    └── complete-flow.test.ts
```

### Executar Testes

```bash
# Todos os testes
npm test

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Com cobertura
npm run test:coverage
```

---

## 📦 Build e Deploy

### ✅ Status: PRONTO PARA DEPLOY

**Alinhamento completo realizado em 24/11/2024**

### Deploy Rápido (4 comandos)

```powershell
# 1. Criar secrets
cd .kiro\specs\micro-agente-disparo-agendamento
.\create-secrets.ps1

# 2. Build e upload
.\build-and-upload-lambdas.ps1

# 3. Validar recursos
.\validate-terraform-vars.ps1

# 4. Deploy Terraform
cd ..\..\..\..\terraform\envs\dev
terraform apply
```

### Build Local

```bash
# Compilar TypeScript
npm run build

# Gerar ZIPs para deploy
npm run package
```

### Deploy via Terraform

```bash
# Deploy dev
cd ../../terraform/envs/dev
terraform apply

# Deploy prod
cd ../../terraform/envs/prod
terraform apply
```

### 📚 Documentação Completa de Deploy

Acesse: `../../.kiro/specs/micro-agente-disparo-agendamento/`

**Documentos Principais:**
- `QUICK-START-DEPLOY.md` - Deploy em 4 comandos
- `INDEX-DEPLOY.md` - Índice completo
- `COMANDOS-DEPLOY-DEV.md` - Guia detalhado
- `ALINHAMENTO-COMPLETO-RESUMO.md` - Resumo do alinhamento

---

## 🔧 Desenvolvimento

### Watch Mode

```bash
# Compilar automaticamente ao salvar
npm run build -- --watch
```

### Lint

```bash
# Verificar código
npm run lint

# Corrigir automaticamente
npm run lint -- --fix
```

### Variáveis de Ambiente

As Lambdas recebem as seguintes variáveis via Terraform:

```typescript
// Tabelas DynamoDB
CONTACTS_TABLE
CAMPAIGNS_TABLE
MESSAGES_TABLE
INTERACTIONS_TABLE
SCHEDULES_TABLE

// Filas SQS
MESSAGE_QUEUE_URL
DLQ_URL

// Segredos
WHATSAPP_SECRET_ARN
EMAIL_SECRET_ARN
CALENDAR_SECRET_ARN

// Configuração
ENVIRONMENT (dev | prod)
AWS_REGION (us-east-1)
```

---

## 📝 Convenções de Código

### Nomenclatura

- **Arquivos**: kebab-case (`send-messages.ts`)
- **Funções**: camelCase (`sendWhatsAppMessage`)
- **Tipos**: PascalCase (`Contact`, `Message`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_RETRIES`)

### Imports

```typescript
// AWS SDK
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// Tipos
import { Contact, Message } from './types/common';

// Utils
import { createLogger } from './utils/logger';
import { docClient, config } from './utils/aws-clients';
```

### Error Handling

```typescript
try {
  // Operação
} catch (error) {
  logger.error('Descrição do erro', error);
  
  // Re-throw se necessário
  throw error;
  
  // Ou retornar erro estruturado
  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'Message' }),
  };
}
```

---

## 🐛 Troubleshooting

### Erro de Compilação

```bash
# Limpar e recompilar
rm -rf dist/
npm run build
```

### Erro de Dependências

```bash
# Reinstalar dependências
rm -rf node_modules/
npm install
```

### Erro de Tipos

```bash
# Verificar tipos
npx tsc --noEmit
```

---

## 📚 Documentação Relacionada

- **Spec Completa**: `../../.kiro/specs/micro-agente-disparo-agendamento/`
- **Requirements**: `../../.kiro/specs/micro-agente-disparo-agendamento/requirements.md`
- **Design**: `../../.kiro/specs/micro-agente-disparo-agendamento/design.md`
- **Quick Start**: `../../.kiro/specs/micro-agente-disparo-agendamento/QUICK-START.md`

---

## 📞 Contato

**Equipe**: AlquimistaAI  
**Email**: alquimistafibonacci@gmail.com  
**WhatsApp**: +55 84 99708-4444

---

**Última Atualização**: 24/11/2024 - Alinhamento completo para deploy

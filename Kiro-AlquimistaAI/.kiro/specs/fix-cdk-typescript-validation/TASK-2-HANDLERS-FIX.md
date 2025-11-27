# Tarefa 2 - Correção de Imports nos Handlers Lambda

## Data: 17/11/2025

Esta tarefa corrigiu os imports e uso incorreto das funções compartilhadas nos handlers TypeScript da Lambda do sistema AlquimistaAI.

---

## Resumo das Correções

### Arquivos Corrigidos

1. **lambda/platform/commercial-contact.ts**
2. **lambda/platform/get-agents.ts**
3. **lambda/platform/trial-invoke.ts**
4. **lambda/platform/trial-start.ts**

---

## Detalhamento das Correções

### 1. lambda/platform/commercial-contact.ts

#### Imports Corrigidos:
```typescript
// ANTES
import { getDatabase } from '../shared/database';
import { handleError } from '../shared/error-handler';

// DEPOIS
import { query } from '../shared/database';
import { classifyError } from '../shared/error-handler';
```

#### Uso de Database:
```typescript
// ANTES
const db = await getDatabase();
const result = await db.query(`...`, [...]);

// DEPOIS
const result = await query(`...`, [...]);
```

#### Tratamento de Erro:
```typescript
// ANTES
logger.error('Erro ao processar solicitação comercial', { error });
return handleError(error);

// DEPOIS
logger.error('Erro ao processar solicitação comercial', error as Error);

const classification = classifyError(error as Error);
return {
  statusCode: classification.type === 'transient' ? 503 : 500,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify({
    error: 'Erro ao processar solicitação comercial',
    message: classification.message,
    shouldRetry: classification.shouldRetry
  }),
};
```

---

### 2. lambda/platform/get-agents.ts

#### Imports Corrigidos:
```typescript
// ANTES
import { getDatabase } from '../shared/database';
import { handleError } from '../shared/error-handler';

// DEPOIS
import { query } from '../shared/database';
import { classifyError } from '../shared/error-handler';
```

#### Uso de Database:
```typescript
// ANTES
const db = await getDatabase();
const result = await db.query<Agent>(`...`);

// DEPOIS
const result = await query<Agent>(`...`);
```

#### Tratamento de Erro:
```typescript
// ANTES
logger.error('Erro ao listar agentes', { error });
return handleError(error);

// DEPOIS
logger.error('Erro ao listar agentes', error as Error);

const classification = classifyError(error as Error);
return {
  statusCode: classification.type === 'transient' ? 503 : 500,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify({
    error: 'Erro ao listar agentes',
    message: classification.message,
    shouldRetry: classification.shouldRetry
  }),
};
```

---

### 3. lambda/platform/trial-invoke.ts

#### Imports Corrigidos:
```typescript
// ANTES
import { getDatabase } from '../shared/database';
import { handleError } from '../shared/error-handler';

// DEPOIS
import { query, transaction } from '../shared/database';
import { classifyError } from '../shared/error-handler';
```

#### Uso de Database:
```typescript
// ANTES
const db = await getDatabase();
const result = await db.query<Trial>(`...`, [...]);
await db.query(`UPDATE ...`, [...]);

// DEPOIS
const result = await query<Trial>(`...`, [...]);
await query(`UPDATE ...`, [...]);
```

#### Tratamento de Erro:
```typescript
// ANTES
logger.error('Erro ao processar invocação de trial', { error });
return handleError(error);

// DEPOIS
logger.error('Erro ao processar invocação de trial', error as Error);

const classification = classifyError(error as Error);
return {
  statusCode: classification.type === 'transient' ? 503 : 500,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify({
    error: 'Erro ao processar invocação de trial',
    message: classification.message,
    shouldRetry: classification.shouldRetry
  }),
};
```

---

### 4. lambda/platform/trial-start.ts

#### Imports Corrigidos:
```typescript
// ANTES
import { getDatabase } from '../shared/database';
import { handleError } from '../shared/error-handler';

// DEPOIS
import { query } from '../shared/database';
import { classifyError } from '../shared/error-handler';
```

#### Uso de Database:
```typescript
// ANTES
const db = await getDatabase();
const existingTrial = await db.query<Trial>(`...`, [...]);
await db.query(`UPDATE ...`, [...]);
const newTrial = await db.query<Trial>(`INSERT ...`, [...]);

// DEPOIS
const existingTrial = await query<Trial>(`...`, [...]);
await query(`UPDATE ...`, [...]);
const newTrial = await query<Trial>(`INSERT ...`, [...]);
```

#### Tratamento de Erro:
```typescript
// ANTES
logger.error('Erro ao iniciar trial', { error });
return handleError(error);

// DEPOIS
logger.error('Erro ao iniciar trial', error as Error);

const classification = classifyError(error as Error);
return {
  statusCode: classification.type === 'transient' ? 503 : 500,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify({
    error: 'Erro ao iniciar trial',
    message: classification.message,
    shouldRetry: classification.shouldRetry
  }),
};
```

---

## Padrões Aplicados

### 1. Import de Database
- ✅ Usar `query` para queries simples
- ✅ Usar `transaction` quando necessário (não usado nestes handlers)
- ❌ Nunca usar `getDatabase` (não existe)

### 2. Import de Error Handler
- ✅ Usar `classifyError` para classificar erros
- ✅ Implementar tratamento manual com resposta HTTP apropriada
- ❌ Nunca usar `handleError` (não existe)

### 3. Sintaxe do Logger
- ✅ Usar `logger.error('mensagem', error as Error)` para erros
- ✅ Passar Error como segundo parâmetro
- ❌ Nunca usar `logger.error('mensagem', { error })` (causa erro TypeScript)

---

## Validação

### Checklist de Correções

- [x] Todos os imports de `getDatabase` foram substituídos por `query`
- [x] Todos os imports de `handleError` foram substituídos por `classifyError`
- [x] Todas as chamadas `logger.error('msg', { error })` foram corrigidas
- [x] Tratamento de erro implementado com classificação apropriada
- [x] Respostas HTTP com status code correto (503 para transient, 500 para outros)
- [x] Headers CORS mantidos em todas as respostas de erro
- [x] Removida propriedade `message` inexistente de `ErrorClassification`
- [x] Corrigida sintaxe do logger em handlers adicionais (get-tenant-subscription, list-plans, update-tenant-subscription)

### Resultado da Compilação

**Antes da Tarefa 2**: 11 erros em 9 arquivos  
**Depois da Tarefa 2**: 4 erros em 2 arquivos (apenas relacionados ao Stripe)

#### Erros Resolvidos:
- ✅ `commercial-contact.ts` - 0 erros
- ✅ `get-agents.ts` - 0 erros
- ✅ `trial-invoke.ts` - 0 erros
- ✅ `trial-start.ts` - 0 erros
- ✅ `get-tenant-subscription.ts` - 0 erros
- ✅ `list-plans.ts` - 0 erros
- ✅ `update-tenant-subscription.ts` - 0 erros

#### Erros Restantes (Tarefa 3):
- ⏳ `create-checkout-session.ts` - Falta módulo Stripe
- ⏳ `webhook-payment.ts` - Falta módulo Stripe + tipagem do reduce

### Próximos Passos

1. ✅ Executar `npm run build` para validar compilação TypeScript - **CONCLUÍDO**
2. ⏳ Instalar dependência Stripe (Tarefa 3)
3. ⏳ Corrigir handlers relacionados ao Stripe (Tarefa 3)
4. ⏳ Validação final completa (Tarefa 5)

---

## Observações

- **NÃO** foram alteradas migrations ou arquivos SQL
- **NÃO** foram alterados scripts Aurora
- **NÃO** foi alterada documentação de banco de dados
- Apenas correções de código TypeScript nos handlers Lambda

---

**Tarefa concluída em**: 17/11/2025  
**Status**: ✅ Completa  
**Próxima tarefa**: Validação de compilação TypeScript (Tarefa 5)

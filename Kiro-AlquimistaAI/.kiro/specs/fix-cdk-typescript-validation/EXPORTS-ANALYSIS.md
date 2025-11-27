# Análise de Exports dos Módulos Compartilhados

## Data: 17/11/2025

Esta análise documenta os exports reais dos módulos compartilhados para corrigir os imports incorretos nos handlers Lambda.

---

## 1. lambda/shared/database.ts

### ❌ Funções que NÃO existem (causando erros)
- `getDatabase` - **NÃO EXISTE**

### ✅ Funções exportadas disponíveis

#### Funções principais:
```typescript
export async function query<T>(text: string, params?: any[], maxRetries?: number): Promise<QueryResult<T>>
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>
export async function getPool(): Promise<Pool>
export async function getClient(): Promise<PoolClient>
export async function closePool(): Promise<void>
export async function healthCheck(): Promise<boolean>
```

### 📝 Correção necessária nos handlers

**ANTES (incorreto)**:
```typescript
import { getDatabase } from '../shared/database';
```

**DEPOIS (correto)**:
```typescript
import { query, transaction, getPool } from '../shared/database';
```

**Uso típico**:
```typescript
// Para queries simples
const result = await query('SELECT * FROM users WHERE id = $1', [userId]);

// Para transações
await transaction(async (client) => {
  await client.query('INSERT INTO ...');
  await client.query('UPDATE ...');
});

// Para acesso direto ao pool (LGPD, etc)
const pool = await getPool();
```

---

## 2. lambda/shared/error-handler.ts

### ❌ Funções que NÃO existem (causando erros)
- `handleError` - **NÃO EXISTE**

### ✅ Funções exportadas disponíveis

#### Enums:
```typescript
export enum ErrorType {
  TRANSIENT = 'transient',
  PERMANENT = 'permanent',
  CRITICAL = 'critical'
}
```

#### Funções principais:
```typescript
export function classifyError(error: Error): ErrorClassification
export function withErrorHandling<TEvent, TResult>(handler: Function): Handler<TEvent, TResult>
export function withSimpleErrorHandling<TEvent, TResult>(handler: Function): Handler<TEvent, TResult>
export function isTransientError(error: Error): boolean
export function isCriticalError(error: Error): boolean
```

### 📝 Correção necessária nos handlers

**ANTES (incorreto)**:
```typescript
import { handleError } from '../shared/error-handler';
```

**DEPOIS (correto - opção 1: usar wrapper)**:
```typescript
import { withErrorHandling } from '../shared/error-handler';

export const handler = withErrorHandling(async (event, context, logger) => {
  // Seu código aqui
  // Erros são tratados automaticamente
});
```

**DEPOIS (correto - opção 2: tratamento manual)**:
```typescript
import { classifyError, isTransientError } from '../shared/error-handler';

try {
  // Seu código
} catch (error) {
  const classification = classifyError(error as Error);
  logger.error('Erro ao processar', {
    error: (error as Error).message,
    errorType: classification.type,
    shouldRetry: classification.shouldRetry
  });
  throw error;
}
```

---

## 3. lambda/shared/logger.ts

### ✅ Exports disponíveis

#### Classes:
```typescript
export class Logger {
  constructor(serviceName?: string, context?: LogContext)
  info(message: string, metadata?: Record<string, any>): void
  warn(message: string, metadata?: Record<string, any>): void
  error(message: string, error?: Error, metadata?: Record<string, any>): void
  debug(message: string, metadata?: Record<string, any>): void
  // ... outros métodos
}
```

#### Funções:
```typescript
export function createLogger(serviceName?: string, context?: LogContext): Logger
export function createAgentLogger(agentName: string, context?: Partial<LogContext>): Logger
```

#### Instância padrão:
```typescript
export const logger: Logger
```

### 📝 Sintaxe correta do logger

**❌ INCORRETO** (causa erro TypeScript):
```typescript
logger.error('Mensagem', { error });
// Erro: 'error' does not exist in type 'Error'
```

**✅ CORRETO**:
```typescript
// Opção 1: Passar Error como segundo parâmetro
logger.error('Mensagem', error as Error, { 
  additionalInfo: 'valor' 
});

// Opção 2: Extrair propriedades do erro
logger.error('Mensagem', {
  error: error.message,
  errorName: error.name,
  stack: error.stack
});

// Opção 3: Usar método error com Error object
logger.error('Mensagem', error instanceof Error ? error : new Error(String(error)));
```

---

## 4. Resumo de Correções por Arquivo

### Arquivos com imports incorretos de database:

1. **lambda/platform/commercial-contact.ts**
   - Linha 5: `import { getDatabase }` → `import { query, transaction }`

2. **lambda/platform/get-agents.ts**
   - Linha 5: `import { getDatabase }` → `import { query }`

3. **lambda/platform/trial-invoke.ts**
   - Linha 5: `import { getDatabase }` → `import { query, transaction }`

4. **lambda/platform/trial-start.ts**
   - Linha 5: `import { getDatabase }` → `import { query, transaction }`

### Arquivos com imports incorretos de error-handler:

1. **lambda/platform/commercial-contact.ts**
   - Linha 7: `import { handleError }` → `import { classifyError }` ou usar `withErrorHandling`

2. **lambda/platform/get-agents.ts**
   - Linha 7: `import { handleError }` → `import { classifyError }` ou usar `withErrorHandling`

3. **lambda/platform/trial-invoke.ts**
   - Linha 7: `import { handleError }` → `import { classifyError }` ou usar `withErrorHandling`

4. **lambda/platform/trial-start.ts**
   - Linha 7: `import { handleError }` → `import { classifyError }` ou usar `withErrorHandling`

### Arquivos com sintaxe incorreta do logger:

1. **lambda/platform/commercial-contact.ts** (linha 89)
2. **lambda/platform/get-agents.ts** (linha 55)
3. **lambda/platform/trial-invoke.ts** (linha 142)
4. **lambda/platform/trial-start.ts** (linha 147)
5. **lambda/platform/get-tenant-subscription.ts** (linha 110)
6. **lambda/platform/list-plans.ts** (linha 51)
7. **lambda/platform/update-tenant-subscription.ts** (linha 203)

**Padrão de correção**:
```typescript
// ANTES
logger.error('Mensagem', { error });

// DEPOIS
logger.error('Mensagem', error as Error, { 
  /* metadata adicional se necessário */
});
```

---

## 5. Padrões Recomendados

### Para queries de banco:
```typescript
import { query, transaction } from '../shared/database';

// Query simples
const users = await query('SELECT * FROM users WHERE tenant_id = $1', [tenantId]);

// Transação
await transaction(async (client) => {
  await client.query('INSERT INTO logs ...');
  await client.query('UPDATE counters ...');
});
```

### Para tratamento de erros:
```typescript
import { Logger } from '../shared/logger';

const logger = new Logger('service-name');

try {
  // código
} catch (error) {
  logger.error('Operação falhou', error as Error, {
    operation: 'nome-operacao',
    additionalContext: 'valor'
  });
  throw error;
}
```

### Para handlers Lambda:
```typescript
import { withErrorHandling } from '../shared/error-handler';
import { Logger } from '../shared/logger';

export const handler = withErrorHandling(async (event, context, logger) => {
  logger.info('Processando evento', { eventType: event.type });
  
  // Seu código aqui
  // Erros são tratados automaticamente pelo wrapper
  
  return { statusCode: 200, body: 'OK' };
});
```

---

## 6. Checklist de Validação

Após corrigir os imports, verificar:

- [ ] Todos os imports de `getDatabase` foram substituídos por `query`, `transaction` ou `getPool`
- [ ] Todos os imports de `handleError` foram substituídos por `classifyError` ou `withErrorHandling`
- [ ] Todas as chamadas `logger.error('msg', { error })` foram corrigidas para `logger.error('msg', error as Error)`
- [ ] Nenhum erro de compilação TypeScript relacionado a imports
- [ ] `npm run build` executa sem erros

---

**Análise completa em**: 17/11/2025  
**Próximo passo**: Aplicar correções nos handlers (Tarefa 2)

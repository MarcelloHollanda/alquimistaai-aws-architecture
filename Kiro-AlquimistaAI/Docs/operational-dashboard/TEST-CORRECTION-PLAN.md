# Plano de Correção de Testes - Análise Detalhada

## Problema Identificado

Os testes estão falhando porque há uma **incompatibilidade entre os mocks e a implementação real** dos handlers.

### Situação Atual

**Testes mockam**: `lambda/shared/database.ts` com função `query()`

**Handlers usam**: `@aws-sdk/client-rds-data` com `RDSDataClient` e `ExecuteStatementCommand`

## Análise por Handler

### 1. get-tenant-me.ts
**Implementação Real**:
```typescript
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';
const rdsClient = new RDSDataClient({ region: process.env.AWS_REGION || 'us-east-1' });
```

**Mock nos Testes**:
```typescript
vi.mock('../../../lambda/shared/database', () => ({
  query: mockQuery,
}));
```

**Problema**: O handler não usa `database.query()`, usa RDS Data API diretamente.

### 2. list-tenants.ts
Provavelmente tem o mesmo problema - usa RDS Data API diretamente.

### 3. aggregate-daily-metrics.ts
Provavelmente tem o mesmo problema - usa RDS Data API diretamente.

## Soluções Possíveis

### Opção 1: Refatorar Handlers (Recomendado)
**Vantagens**:
- Código mais testável
- Melhor separação de responsabilidades
- Reutilização do módulo database

**Desvantagens**:
- Requer mudanças nos handlers
- Pode afetar outros testes

**Implementação**:
```typescript
// Antes
const result = await rdsClient.send(new ExecuteStatementCommand({...}));

// Depois
import { query } from '../shared/database';
const result = await query(sql, params);
```

### Opção 2: Mockar RDS Data API nos Testes
**Vantagens**:
- Não requer mudanças nos handlers
- Testes refletem implementação real

**Desvantagens**:
- Mocks mais complexos
- Duplicação de lógica de mock

**Implementação**:
```typescript
vi.mock('@aws-sdk/client-rds-data', () => ({
  RDSDataClient: vi.fn(() => ({
    send: mockSend,
  })),
  ExecuteStatementCommand: vi.fn(),
}));
```

### Opção 3: Criar Wrapper para RDS Data API
**Vantagens**:
- Melhor abstração
- Facilita testes futuros
- Mantém handlers limpos

**Desvantagens**:
- Requer criar novo módulo
- Mudanças em múltiplos arquivos

## Recomendação

**Opção 1 - Refatorar Handlers** é a melhor escolha porque:

1. O módulo `database.ts` já existe e está pronto
2. Simplifica os testes
3. Melhora a manutenibilidade do código
4. Reduz duplicação de código

## Plano de Ação

### Fase 1: Refatorar get-tenant-me.ts
1. Substituir RDS Data API por `database.query()`
2. Ajustar queries para usar placeholders padrão
3. Executar testes

### Fase 2: Refatorar list-tenants.ts
1. Aplicar mesma refatoração
2. Executar testes

### Fase 3: Refatorar aggregate-daily-metrics.ts
1. Aplicar mesma refatoração
2. Executar testes

### Fase 4: Validação Final
1. Executar todos os testes
2. Verificar cobertura
3. Documentar mudanças

## Impacto Estimado

- **Tempo**: 30-45 minutos
- **Arquivos Afetados**: 3 handlers
- **Risco**: Baixo (mudança isolada)
- **Benefício**: Alto (código mais testável e manutenível)

## Próximos Passos Imediatos

1. ✅ Documentar problema
2. ⏳ Refatorar get-tenant-me.ts
3. ⏳ Refatorar list-tenants.ts
4. ⏳ Refatorar aggregate-daily-metrics.ts
5. ⏳ Executar testes completos
6. ⏳ Atualizar documentação
